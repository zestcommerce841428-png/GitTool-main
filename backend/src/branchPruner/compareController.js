import { fetchDecryptedToken } from "../users/githubTokenController.js";
import { createOctokitInstance } from "../repo/octokit.js";
import { callOpenAI } from "../shared/openaiService.js";
import { deductToken } from "../token/tokenController.js";

/* ─── Get Single Commit ───────────────────────────────── */

export const getCommit = async (req, res, next) => {
    try {
        const { owner, repo, ref } = req.params;
        const userId = req.user.id;

        const token = await fetchDecryptedToken(userId);
        const octokit = createOctokitInstance(token);

        const { data } = await octokit.repos.getCommit({
            owner, repo, ref
        });

        const files = (data.files || []).map(f => ({
            filename: f.filename,
            status: f.status,
            additions: f.additions,
            deletions: f.deletions,
            changes: f.changes,
            patch: f.patch || null,
            previousFilename: f.previous_filename || null,
        }));

        res.json({
            sha: data.sha,
            shortSha: data.sha.slice(0, 7),
            message: data.commit.message,
            files,
            totalFiles: files.length,
            totalAdditions: files.reduce((s, f) => s + f.additions, 0),
            totalDeletions: files.reduce((s, f) => s + f.deletions, 0)
        });
    } catch (error) {
        console.error("getCommit ERROR:", error.message);
        if (error.status === 404) return res.status(404).json({ error: "Commit not found" });
        next(error);
    }
};

/* ─── Compare two branches ────────────────────────────── */

export const compareBranches = async (req, res, next) => {
    try {
        const { owner, repo, base, head } = req.params;
        const userId = req.user.id;

        const token = await fetchDecryptedToken(userId);
        const octokit = createOctokitInstance(token);

        const { data } = await octokit.repos.compareCommits({
            owner, repo, base, head
        });

        // Shape the response
        const commits = (data.commits || []).map(c => ({
            sha: c.sha,
            shortSha: c.sha.slice(0, 7),
            message: c.commit.message.split('\n')[0],
            fullMessage: c.commit.message,
            author: c.commit.author?.name || c.author?.login || '—',
            authorAvatar: c.author?.avatar_url || null,
            date: c.commit.committer?.date || c.commit.author?.date,
        }));

        const files = (data.files || []).map(f => ({
            filename: f.filename,
            status: f.status,           // added | modified | removed | renamed
            additions: f.additions,
            deletions: f.deletions,
            changes: f.changes,
            patch: f.patch || null,      // unified diff (may be null for binary)
            previousFilename: f.previous_filename || null,
        }));

        const totalAdditions = files.reduce((s, f) => s + f.additions, 0);
        const totalDeletions = files.reduce((s, f) => s + f.deletions, 0);

        const pulls = await octokit.pulls.list({
            owner, repo,
            head: `${owner}:${head}`,
            base: base,
            state: 'open'
        });

        let prMergeable = null;
        let prMergeState = null;
        let source = 'compare';

        if (pulls.data.length > 0) {
            source = 'pull_request';
            const prNumber = pulls.data[0].number;
            
            // Fetch PR details to get mergeable status
            // GitHub computes this async, so if it's null, we might need a quick retry
            let prDetails = await octokit.pulls.get({ owner, repo, pull_number: prNumber });
            
            let retries = 3;
            while (prDetails.data.mergeable === null && retries > 0) {
                // Wait 1 second and retry
                await new Promise(r => setTimeout(r, 1000));
                prDetails = await octokit.pulls.get({ owner, repo, pull_number: prNumber });
                retries--;
            }

            prMergeable = prDetails.data.mergeable;
            prMergeState = prDetails.data.mergeable_state;
        }

        let mergeStatusLabel = '';
        let isMergeable = false;

        if (source === 'pull_request') {
            isMergeable = prMergeable === true;
            if (prMergeState === 'clean') mergeStatusLabel = 'Clean — safe to merge';
            else if (prMergeState === 'dirty') mergeStatusLabel = 'Conflicts must be resolved before merging';
            else if (prMergeState === 'behind') mergeStatusLabel = 'Behind — needs rebase';
            else if (prMergeState === 'blocked') mergeStatusLabel = 'Blocked — waiting on checks/reviews';
            else mergeStatusLabel = `Status: ${prMergeState || 'Unknown'}`;
        } else {
            isMergeable = data.status === 'ahead' || data.status === 'identical';
            mergeStatusLabel = data.status === 'ahead' ? 'Clean — safe to merge'
                : data.status === 'identical' ? 'Identical — already merged'
                : data.status === 'behind' ? 'Behind — needs rebase'
                : 'Diverged — manual merge may be required';
        }

        res.json({
            status: data.status,              // identical | ahead | behind | diverged
            aheadBy: data.ahead_by,
            behindBy: data.behind_by,
            totalCommits: data.total_commits,
            mergeBaseCommit: data.merge_base_commit?.sha?.slice(0, 7) || null,
            commits,
            files,
            totalFiles: files.length,
            totalAdditions,
            totalDeletions,
            // Enhanced merge readiness
            mergeable: isMergeable,
            mergeState: prMergeState || data.status,
            mergeStatus: mergeStatusLabel,
            source
        });
    } catch (error) {
        console.error("compareBranches ERROR:", error.message);
        if (error.status === 404) {
            return res.status(404).json({ error: "Branch not found or comparison not available" });
        }
        next(error);
    }
};

/* ─── Create Pull Request ─────────────────────────────── */

export const createPullRequest = async (req, res, next) => {
    try {
        const { owner, repo } = req.params;
        const { title, body, head, base, draft, reviewers, labels } = req.body;
        const userId = req.user.id;

        if (!title || !head || !base) {
            return res.status(400).json({ error: "title, head, and base are required" });
        }

        const token = await fetchDecryptedToken(userId);
        const octokit = createOctokitInstance(token);

        const { data } = await octokit.pulls.create({
            owner, repo, title,
            body: body || '',
            head, base,
            draft: !!draft
        });

        // Add reviewers if specified
        if (reviewers && reviewers.length > 0) {
            try {
                await octokit.pulls.requestReviewers({
                    owner, repo, pull_number: data.number,
                    reviewers
                });
            } catch (rErr) {
                console.warn(`Failed to add reviewers: ${rErr.message}`);
            }
        }

        // Add labels if specified
        if (labels && labels.length > 0) {
            try {
                await octokit.issues.addLabels({
                    owner, repo, issue_number: data.number,
                    labels
                });
            } catch (lErr) {
                console.warn(`Failed to add labels: ${lErr.message}`);
            }
        }

        res.json({
            number: data.number,
            title: data.title,
            url: data.html_url,
            state: data.state,
            createdAt: data.created_at,
        });
    } catch (error) {
        console.error("createPullRequest ERROR:", error.message);
        if (error.status === 422) {
            const msg = error.response?.data?.errors?.[0]?.message || "A pull request already exists for this branch";
            return res.status(422).json({ error: msg });
        }
        next(error);
    }
};

/* ─── AI Generate PR Summary ──────────────────────────── */

export const generatePRSummary = async (req, res, next) => {
    try {
        const { owner, repo } = req.params;
        const { base, head } = req.body;
        const userId = req.user.id;

        if (!base || !head) {
            return res.status(400).json({ error: "base and head are required" });
        }

        const token = await fetchDecryptedToken(userId);
        const octokit = createOctokitInstance(token);

        // Fetch the branch comparison to get the commits
        const { data } = await octokit.repos.compareCommits({
            owner, repo, base, head
        });

        const commitMsgs = (data.commits || []).map(c => `- ${c.commit.message.split('\n')[0]}`).join('\n');
        
        const prompt = `
        You are an expert lead software engineer reviewing a branch before merging.
        Write a concise, high-quality GitHub Pull Request summary based on the following commit messages.
        
        Repository: ${owner}/${repo}
        Branches: ${head} into ${base}
        
        Commits:
        ${commitMsgs}
        
        Output Requirements:
        1. The FIRST line MUST be an H1 (#) containing a short, descriptive Pull Request title.
        2. From the second line onwards, provide the PR description.
        3. Use Markdown headers starting with H2 (##) such as "## Summary" and "## Key Changes" for the description body.
        4. Keep it professional, concise, and scannable.
        5. Do not include a conversational intro like "Here is the summary".
        6. Focus heavily on formatting: use bullet points and backticks where appropriate for code or module references.
        7. Return ONLY the raw markdown of the PR description itself, nothing else.
        `;

        const content = await callOpenAI(prompt, "gpt-4o-mini");
        
        await deductToken(userId, 10, "generate", `Generated PR summary for ${head} into ${base}`);

        res.json({ content });
    } catch (error) {
        console.error("generatePRSummary ERROR:", error.message);
        next(error);
    }
};
