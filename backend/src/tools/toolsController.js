import { fetchDecryptedToken } from "../users/githubTokenController.js";
import { createOctokitInstance } from "../repo/octokit.js";
import { callOpenAI } from "../shared/openaiService.js";
import { deductToken } from "../token/tokenController.js";

/**
 * Create a GitHub issue from a TODO comment.
 * POST /api/tools/:owner/:repo/create-issue
 */
export const createIssue = async (req, res, next) => {
    try {
        const { owner, repo } = req.params;
        const { title, body, labels } = req.body;
        const userId = req.user.id;

        if (!title?.trim()) return res.status(400).json({ error: 'Issue title is required' });

        const token = await fetchDecryptedToken(userId);
        const octokit = createOctokitInstance(token);

        const { data: issue } = await octokit.issues.create({
            owner, repo,
            title: title.trim(),
            body: body || '',
            labels: labels || [],
        });

        res.json({ number: issue.number, url: issue.html_url, title: issue.title });
    } catch (error) {
        next(error);
    }
};

/**
 * Scan TODO/FIXME/HACK comments from repo source.
 * POST /api/tools/:owner/:repo/todo-scan
 */
export const scanTodos = async (req, res, next) => {
    try {
        const { owner, repo } = req.params;
        const userId = req.user.id;

        const token = await fetchDecryptedToken(userId);
        const octokit = createOctokitInstance(token);

        // Get full tree
        const { data: repoData } = await octokit.repos.get({ owner, repo });
        const { data: tree } = await octokit.git.getTree({
            owner, repo,
            tree_sha: repoData.default_branch,
            recursive: 'true',
        });

        const codeFiles = tree.tree
            .filter(t => t.type === 'blob' && /\.(js|jsx|ts|tsx|py|go|rs|rb|java|c|cpp|cs|php|swift)$/i.test(t.path))
            .filter(t => !/node_modules|dist\/|build\/|\.min\./i.test(t.path))
            .slice(0, 200);

        const todos = [];
        for (const file of codeFiles) {
            try {
                const { data } = await octokit.git.getBlob({ owner, repo, file_sha: file.sha });
                const content = Buffer.from(data.content, 'base64').toString('utf-8');
                const lines = content.split('\n');
                lines.forEach((line, idx) => {
                    const match = line.match(/(TODO|FIXME|HACK|XXX|BUG)[\s:]+(.+)/i);
                    if (match) {
                        todos.push({
                            file: file.path,
                            line: idx + 1,
                            type: match[1].toUpperCase(),
                            text: match[2].trim(),
                        });
                    }
                });
            } catch { /* skip unreadable files */ }
        }

        await deductToken(userId, 3, "scan", `TODO scan for ${owner}/${repo}`);
        res.json({ todos, scannedFiles: codeFiles.length, totalFiles: tree.tree.filter(t => t.type === 'blob').length });
    } catch (error) {
        next(error);
    }
};

/**
 * Analyze dependencies from package.json.
 * GET /api/tools/:owner/:repo/dependencies
 */
export const analyzeDependencies = async (req, res, next) => {
    try {
        const { owner, repo } = req.params;
        const userId = req.user.id;

        const token = await fetchDecryptedToken(userId);
        const octokit = createOctokitInstance(token);

        let pkgJson;
        try {
            const { data } = await octokit.repos.getContent({ owner, repo, path: 'package.json' });
            pkgJson = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));
        } catch {
            return res.json({ dependencies: [], devDependencies: [], message: 'No package.json found' });
        }

        const allEntries = [
            ...Object.entries(pkgJson.dependencies || {}).map(([name, version]) => ({ name, version, type: 'production' })),
            ...Object.entries(pkgJson.devDependencies || {}).map(([name, version]) => ({ name, version, type: 'development' })),
        ];

        // Check npm registry for latest versions (batched, max 60 packages)
        const toCheck = allEntries.slice(0, 60);
        const latestVersions = await Promise.all(
            toCheck.map(async ({ name }) => {
                try {
                    const r = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}/latest`, { signal: AbortSignal.timeout(4000) });
                    if (!r.ok) return { name, latest: null };
                    const d = await r.json();
                    return { name, latest: d.version || null };
                } catch {
                    return { name, latest: null };
                }
            })
        );

        const latestMap = Object.fromEntries(latestVersions.map(({ name, latest }) => [name, latest]));

        function parseVersion(v) { return v ? v.replace(/[^0-9.]/g, '').split('.').map(Number) : []; }
        function isOutdated(current, latest) {
            if (!latest || !current) return false;
            const c = parseVersion(current), l = parseVersion(latest);
            for (let i = 0; i < Math.max(c.length, l.length); i++) {
                const cv = c[i] || 0, lv = l[i] || 0;
                if (lv > cv) return true;
                if (lv < cv) return false;
            }
            return false;
        }

        const mapEntry = ({ name, version, type }) => {
            const current = version.replace(/[^0-9.]/g, '');
            const latest = latestMap[name] || null;
            return { name, currentVersion: current, latestVersion: latest, outdated: isOutdated(current, latest), type };
        };

        const deps    = allEntries.filter(e => e.type === 'production').map(mapEntry);
        const devDeps = allEntries.filter(e => e.type === 'development').map(mapEntry);

        res.json({
            dependencies: deps,
            devDependencies: devDeps,
            total: deps.length + devDeps.length,
            outdatedCount: [...deps, ...devDeps].filter(d => d.outdated).length,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * AI-powered issue triage: fetch open issues and suggest labels.
 * POST /api/tools/:owner/:repo/triage-issues
 */
export const triageIssues = async (req, res, next) => {
    try {
        const { owner, repo } = req.params;
        const userId = req.user.id;

        const token = await fetchDecryptedToken(userId);
        const octokit = createOctokitInstance(token);

        const { data: issues } = await octokit.issues.listForRepo({
            owner, repo, state: 'open', per_page: 15,
        });

        // Filter out PRs
        const realIssues = issues.filter(i => !i.pull_request).slice(0, 10);

        if (realIssues.length === 0) {
            return res.json({ issues: [], message: 'No open issues found.' });
        }

        const issueList = realIssues.map(i => `#${i.number}: "${i.title}"`).join('\n');

        const prompt = `You are a project manager triaging GitHub issues. For each issue below, suggest 1-2 labels from: [bug, feature, enhancement, documentation, question, good first issue, help wanted, priority:high, priority:medium, priority:low].

Issues:
${issueList}

Return a JSON array with objects: { "number": <issue-number>, "labels": ["label1", "label2"], "reason": "brief explanation" }
Return ONLY valid JSON, no markdown.`;

        const raw = await callOpenAI(prompt);
        let suggestions;
        try {
            suggestions = JSON.parse(raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
        } catch {
            suggestions = [];
        }

        // Merge with issue data
        const result = realIssues.map(issue => {
            const suggestion = suggestions.find(s => s.number === issue.number) || {};
            return {
                number: issue.number,
                title: issue.title,
                author: issue.user?.login,
                created_at: issue.created_at,
                currentLabels: issue.labels.map(l => l.name),
                suggestedLabels: suggestion.labels || [],
                reason: suggestion.reason || '',
            };
        });

        await deductToken(userId, 5, "triage", `Issue triage for ${owner}/${repo}`);
        res.json({ issues: result });
    } catch (error) {
        next(error);
    }
};

/**
 * Scan for potential secrets/credentials in source code.
 * POST /api/tools/:owner/:repo/scan-secrets
 */
export const scanSecrets = async (req, res, next) => {
    try {
        const { owner, repo } = req.params;
        const userId = req.user.id;

        const token = await fetchDecryptedToken(userId);
        const octokit = createOctokitInstance(token);

        const { data: repoData } = await octokit.repos.get({ owner, repo });
        const { data: tree } = await octokit.git.getTree({
            owner, repo,
            tree_sha: repoData.default_branch,
            recursive: 'true',
        });

        const scannable = tree.tree
            .filter(t => t.type === 'blob' && !/node_modules|\.min\.|dist\/|build\//i.test(t.path))
            .filter(t => /\.(js|jsx|ts|tsx|py|env|yml|yaml|json|cfg|ini|conf|rb|go|toml)$/i.test(t.path))
            .slice(0, 200);

        const patterns = [
            { name: 'API Key', regex: /(?:api[_-]?key|apikey)\s*[:=]\s*['"]?([a-zA-Z0-9_\-]{20,})['"]?/gi },
            { name: 'Secret', regex: /(?:secret|password|passwd|pwd)\s*[:=]\s*['"]?([^\s'"]{8,})['"]?/gi },
            { name: 'Token', regex: /(?:token|bearer)\s*[:=]\s*['"]?([a-zA-Z0-9_\-]{20,})['"]?/gi },
            { name: 'AWS Key', regex: /AKIA[0-9A-Z]{16}/g },
            { name: 'Private Key', regex: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/g },
        ];

        const findings = [];
        for (const file of scannable) {
            try {
                const { data } = await octokit.git.getBlob({ owner, repo, file_sha: file.sha });
                const content = Buffer.from(data.content, 'base64').toString('utf-8');
                for (const pattern of patterns) {
                    const matches = content.matchAll(pattern.regex);
                    for (const match of matches) {
                        findings.push({
                            file: file.path,
                            type: pattern.name,
                            line: content.substring(0, match.index).split('\n').length,
                            preview: match[0].substring(0, 30) + '…',
                        });
                    }
                }
            } catch { /* skip */ }
        }

        await deductToken(userId, 3, "scan", `Secrets scan for ${owner}/${repo}`);
        res.json({ findings, scannedFiles: scannable.length });
    } catch (error) {
        next(error);
    }
};

/**
 * AI dead code analysis — analyzes file tree for likely dead/unused files.
 * POST /api/tools/:owner/:repo/dead-code
 */
export const analyzeDeadCode = async (req, res, next) => {
    try {
        const { owner, repo } = req.params;
        const userId = req.user.id;

        const token = await fetchDecryptedToken(userId);
        const octokit = createOctokitInstance(token);

        const { data: repoData } = await octokit.repos.get({ owner, repo });
        const { data: tree } = await octokit.git.getTree({
            owner, repo, tree_sha: repoData.default_branch, recursive: 'true',
        });

        const codeFiles = tree.tree
            .filter(t => t.type === 'blob' && /\.(js|jsx|ts|tsx|py|go|rs|rb|java|c|cpp|cs|php)$/i.test(t.path))
            .filter(t => !/node_modules|dist\/|build\/|\.min\./i.test(t.path))
            .map(t => t.path);

        const fileList = codeFiles.slice(0, 500).join('\n');

        const prompt = `You are a senior code reviewer. Analyze this file tree and identify files that are likely dead code, unused utilities, or orphaned test files.

File tree:
${fileList}

Return a JSON array of objects: { "file": "path", "reason": "why it might be dead code", "confidence": "high"|"medium"|"low" }
Return ONLY valid JSON, no markdown.`;

        const raw = await callOpenAI(prompt);
        let results;
        try {
            results = JSON.parse(raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
        } catch { results = []; }

        await deductToken(userId, 5, "analyze", `Dead code analysis for ${owner}/${repo}`);
        res.json({ results, totalFiles: codeFiles.length });
    } catch (error) { next(error); }
};

/**
 * AI pipeline failure explainer — takes a log and explains the failure.
 * POST /api/tools/:owner/:repo/explain-failure
 */
export const explainFailure = async (req, res, next) => {
    try {
        const { owner, repo } = req.params;
        const { log } = req.body;
        const userId = req.user.id;

        if (!log || !log.trim()) return res.status(400).json({ error: "No log content provided" });

        const truncated = log.slice(0, 8000);

        const prompt = `You are a DevOps expert analyzing a CI/CD pipeline failure log. Explain what went wrong, identify the root cause, and suggest a fix.

Log:
\`\`\`
${truncated}
\`\`\`

Return JSON: { "summary": "one-line summary", "rootCause": "detailed root cause", "suggestion": "how to fix it", "errorType": "build|test|deploy|config|dependency|unknown" }
Return ONLY valid JSON.`;

        const raw = await callOpenAI(prompt);
        let result;
        try {
            result = JSON.parse(raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
        } catch { result = { summary: raw, rootCause: '', suggestion: '', errorType: 'unknown' }; }

        await deductToken(userId, 5, "analyze", `Pipeline failure analysis for ${owner}/${repo}`);
        res.json(result);
    } catch (error) { next(error); }
};

/**
 * Get repo file tree for architecture diagram.
 * GET /api/tools/:owner/:repo/architecture
 */
export const getArchitecture = async (req, res, next) => {
    try {
        const { owner, repo } = req.params;
        const userId = req.user.id;

        const token = await fetchDecryptedToken(userId);
        const octokit = createOctokitInstance(token);

        const { data: repoData } = await octokit.repos.get({ owner, repo });
        const { data: tree } = await octokit.git.getTree({
            owner, repo, tree_sha: repoData.default_branch, recursive: 'true',
        });
        const { data: languages } = await octokit.repos.listLanguages({ owner, repo });

        const dirs = tree.tree
            .filter(t => t.type === 'tree' && t.path.split('/').length <= 2 && !/node_modules|\.git|dist|build/i.test(t.path))
            .map(t => t.path);

        const files = tree.tree
            .filter(t => t.type === 'blob' && t.path.split('/').length === 1)
            .map(t => ({ path: t.path, size: t.size }));

        res.json({
            name: repoData.name,
            description: repoData.description,
            defaultBranch: repoData.default_branch,
            languages: Object.keys(languages),
            directories: dirs,
            rootFiles: files,
            totalFiles: tree.tree.filter(t => t.type === 'blob').length,
            totalDirs: dirs.length,
        });
    } catch (error) { next(error); }
};

/**
 * Get contributors and recent activity for collaboration hub.
 * GET /api/tools/:owner/:repo/collaboration
 */
export const getCollaboration = async (req, res, next) => {
    try {
        const { owner, repo } = req.params;
        const userId = req.user.id;

        const token = await fetchDecryptedToken(userId);
        const octokit = createOctokitInstance(token);

        const [contribRes, prRes, issueRes] = await Promise.all([
            octokit.repos.listContributors({ owner, repo, per_page: 20 }).catch(() => ({ data: [] })),
            octokit.pulls.list({ owner, repo, state: 'all', per_page: 10, sort: 'updated' }).catch(() => ({ data: [] })),
            octokit.issues.listForRepo({ owner, repo, state: 'all', per_page: 10, sort: 'updated' }).catch(() => ({ data: [] })),
        ]);

        res.json({
            contributors: (contribRes.data || []).map(c => ({
                login: c.login, avatar: c.avatar_url, contributions: c.contributions, url: c.html_url,
            })),
            pullRequests: (prRes.data || []).map(pr => ({
                number: pr.number, title: pr.title, state: pr.state, author: pr.user?.login,
                created_at: pr.created_at, merged_at: pr.merged_at,
            })),
            issues: (issueRes.data || []).filter(i => !i.pull_request).map(i => ({
                number: i.number, title: i.title, state: i.state, author: i.user?.login,
                created_at: i.created_at, labels: i.labels.map(l => l.name),
            })),
        });
    } catch (error) { next(error); }
};

/**
 * AI semantic version suggestion based on recent commits.
 * POST /api/tools/:owner/:repo/version-suggest
 */
export const suggestVersion = async (req, res, next) => {
    try {
        const { owner, repo } = req.params;
        const userId = req.user.id;

        const token = await fetchDecryptedToken(userId);
        const octokit = createOctokitInstance(token);

        const { data: commits } = await octokit.repos.listCommits({ owner, repo, per_page: 20 });
        const { data: tags } = await octokit.repos.listTags({ owner, repo, per_page: 1 });

        const currentTag = tags.length > 0 ? tags[0].name : 'v0.0.0';
        const commitMsgs = commits.map(c => `- ${c.commit.message.split('\n')[0]}`).join('\n');

        const prompt = `You are a release manager. Based on these recent commits and the current version tag, suggest the next semantic version.

Current version: ${currentTag}
Recent commits:
${commitMsgs}

Analyze: does it contain breaking changes (MAJOR bump), new features (MINOR bump), or only fixes (PATCH bump)?

Return JSON: { "currentVersion": "${currentTag}", "suggestedVersion": "vX.Y.Z", "bumpType": "major|minor|patch", "reason": "explanation", "commits": [{ "message": "commit msg", "type": "feat|fix|chore|etc" }] }
Return ONLY valid JSON.`;

        const raw = await callOpenAI(prompt);
        let result;
        try {
            result = JSON.parse(raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
        } catch { result = { currentVersion: currentTag, suggestedVersion: currentTag, bumpType: 'patch', reason: raw, commits: [] }; }

        await deductToken(userId, 5, "analyze", `Version suggestion for ${owner}/${repo}`);
        res.json(result);
    } catch (error) { next(error); }
};

/**
 * List recent commits for cherry-pick orchestrator.
 * GET /api/tools/:owner/:repo/commits
 */
export const listCommits = async (req, res, next) => {
    try {
        const { owner, repo } = req.params;
        const branch = req.query.branch || undefined;
        const userId = req.user.id;

        const token = await fetchDecryptedToken(userId);
        const octokit = createOctokitInstance(token);

        const params = { owner, repo, per_page: 30 };
        if (branch) params.sha = branch;

        const { data: commits } = await octokit.repos.listCommits(params);

        res.json({
            commits: commits.map(c => ({
                sha: c.sha.slice(0, 7),
                fullSha: c.sha,
                message: c.commit.message.split('\n')[0],
                author: c.commit.author?.name || c.author?.login,
                date: c.commit.author?.date,
            })),
        });
    } catch (error) { next(error); }
};

/**
 * AI API docs generator — analyzes route files.
 * POST /api/tools/:owner/:repo/generate-api-docs
 */
export const generateApiDocs = async (req, res, next) => {
    try {
        const { owner, repo } = req.params;
        const userId = req.user.id;

        const token = await fetchDecryptedToken(userId);
        const octokit = createOctokitInstance(token);

        const { data: repoData } = await octokit.repos.get({ owner, repo });
        const { data: tree } = await octokit.git.getTree({
            owner, repo, tree_sha: repoData.default_branch, recursive: 'true',
        });

        // Find route/controller files
        const routeFiles = tree.tree
            .filter(t => t.type === 'blob' && /route|controller|endpoint|api/i.test(t.path))
            .filter(t => /\.(js|ts|py|go|rb)$/i.test(t.path))
            .slice(0, 20);

        let codeSnippets = '';
        for (const file of routeFiles) {
            try {
                const { data } = await octokit.git.getBlob({ owner, repo, file_sha: file.sha });
                const content = Buffer.from(data.content, 'base64').toString('utf-8').slice(0, 2000);
                codeSnippets += `\n--- ${file.path} ---\n${content}\n`;
            } catch { /* skip */ }
        }

        if (!codeSnippets) {
            return res.json({ content: "No route or controller files found in the repository." });
        }

        const prompt = `You are a technical writer. Analyze these route/controller files and generate beautiful API documentation in Markdown.

Include for each endpoint: HTTP method, path, description, parameters, example request/response.

Source files:
${codeSnippets.slice(0, 10000)}

Generate complete, production-quality API documentation in Markdown.`;

        const content = await callOpenAI(prompt);
        await deductToken(userId, 10, "generate", `API docs for ${owner}/${repo}`);
        res.json({ content });
    } catch (error) { next(error); }
};

// ==========================================
// 12. Dependabot Alerts (CVE Dashboard)
// ==========================================
export const getDependabotAlerts = async (req, res, next) => {
    try {
        const { owner, repo } = req.params;
        const octokit = createOctokitInstance(await fetchDecryptedToken(req.user.id));
        
        try {
            const { data } = await octokit.request('GET /repos/{owner}/{repo}/dependabot/alerts', { owner, repo, state: 'open' });
            res.json({ alerts: data });
        } catch (err) {
            // 403 or 404 means Dependabot is disabled or repo isn't supported
            if (err.status === 403 || err.status === 404 || err.message.includes('Dependabot')) {
                return res.json({ alerts: [], error: 'Dependabot alerts are disabled or not supported for this repository.' });
            }
            throw err;
        }
    } catch (error) { next(error); }
};

// ==========================================
// 13. Code Scanning Alerts (Security Dashboard)
// ==========================================
export const getCodeScanningAlerts = async (req, res, next) => {
    try {
        const { owner, repo } = req.params;
        const octokit = createOctokitInstance(await fetchDecryptedToken(req.user.id));
        
        try {
            const { data } = await octokit.request('GET /repos/{owner}/{repo}/code-scanning/alerts', { owner, repo, state: 'open' });
            res.json({ alerts: data });
        } catch (err) {
            if (err.status === 403 || err.status === 404 || (err.message && err.message.includes('code scanning'))) {
                return res.json({ alerts: [], error: 'Code scanning is not configured or not supported for this repository.' });
            }
            throw err;
        }
    } catch (error) { next(error); }
};

// ==========================================
// 14. Commit Graph (Dynamic Branch Visualization)
// ==========================================
export const getCommitGraph = async (req, res, next) => {
    try {
        const { owner, repo } = req.params;
        const userId = req.user.id;

        const token = await fetchDecryptedToken(userId);
        const octokit = createOctokitInstance(token);

        // 1. Get branches (limit to 6 to keep API calls reasonable)
        const { data: branches } = await octokit.repos.listBranches({
            owner, repo, per_page: 10,
        });
        const branchList = branches.slice(0, 6);

        // 2. Fetch recent commits from each branch (with parents)
        const commitMap = new Map(); // sha → commit object (dedup)
        const branchHeads = {};      // branch name → head SHA

        await Promise.all(branchList.map(async (branch) => {
            try {
                const { data: commits } = await octokit.repos.listCommits({
                    owner, repo, sha: branch.name, per_page: 15,
                });

                branchHeads[branch.name] = commits[0]?.sha;

                commits.forEach(c => {
                    if (!commitMap.has(c.sha)) {
                        commitMap.set(c.sha, {
                            hash: c.sha,
                            shortHash: c.sha.slice(0, 7),
                            message: c.commit.message.split('\n')[0],
                            parents: (c.parents || []).map(p => p.sha),
                            author: c.commit.author?.name || c.author?.login || 'Unknown',
                            avatarUrl: c.author?.avatar_url || null,
                            timestamp: new Date(c.commit.author?.date || c.commit.committer?.date).getTime(),
                            branches: [],
                        });
                    }
                    // Tag this commit with the branch name
                    const existing = commitMap.get(c.sha);
                    if (!existing.branches.includes(branch.name)) {
                        existing.branches.push(branch.name);
                    }
                });
            } catch { /* skip branches we can't read */ }
        }));

        // 3. Convert map to sorted array (newest first)
        const commits = Array.from(commitMap.values())
            .sort((a, b) => b.timestamp - a.timestamp);

        res.json({
            commits,
            branches: branchList.map(b => b.name),
            branchHeads,
        });
    } catch (error) { next(error); }
};

