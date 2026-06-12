import { fetchDecryptedToken } from "../users/githubTokenController.js";
import { createOctokitInstance } from "../repo/octokit.js";
import axios from "axios";
import { scanForCredentials } from "../shared/credentialScanner.js";

/**
 * Generate a .gitignore from a list of technologies.
 * Aggregates templates from GitHub's gitignore repository.
 */
export const generateGitignore = async (req, res, next) => {
    try {
        const { technologies } = req.body;

        if (!technologies || !Array.isArray(technologies) || technologies.length === 0) {
            return res.status(400).json({ error: "No technologies specified" });
        }

        // Fetch templates from GitHub's gitignore repo
        const sections = [];
        for (const tech of technologies) {
            try {
                const url = `https://raw.githubusercontent.com/github/gitignore/main/${tech}.gitignore`;
                const { data } = await axios.get(url);
                sections.push(`# ── ${tech} ────────────────────────────\n${data}`);
            } catch (err) {
                // Try community templates
                try {
                    const url = `https://raw.githubusercontent.com/github/gitignore/main/community/${tech}.gitignore`;
                    const { data } = await axios.get(url);
                    sections.push(`# ── ${tech} (community) ──────────────\n${data}`);
                } catch {
                    // Template not found, skip silently
                    sections.push(`# ── ${tech} ────────────────────────────\n# No template found for "${tech}"\n`);
                }
            }
        }

        // Append universal credential protection rules
        sections.push(`# ── Security: Credential Protection ──────────
# Environment variables
.env
.env.local
.env.*.local
.env.production
.env.staging

# Private keys & certificates
*.pem
*.key
*.p12
*.pfx
*.crt
*.cer

# IDE & editor secrets
.idea/
.vscode/settings.json

# OS artifacts
.DS_Store
Thumbs.db
desktop.ini

# Dependency directories
node_modules/
vendor/
__pycache__/
*.pyc
`);

        // Deduplicate lines
        const allLines = sections.join('\n\n').split('\n');
        const seen = new Set();
        const deduped = allLines.filter(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return true; // Keep comments and blanks
            if (seen.has(trimmed)) return false;
            seen.add(trimmed);
            return true;
        });

        const content = deduped.join('\n').trim() + '\n';

        res.json({ content });
    } catch (error) {
        console.error("generateGitignore ERROR:", error.message);
        next(error);
    }
};

/**
 * Deploy a .gitignore file directly to a repository.
 * Uses GitHub Contents API with Base64 encoding and SHA handling.
 */
export const deployGitignore = async (req, res, next) => {
    try {
        const { owner, repo } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        if (!content) {
            return res.status(400).json({ error: "No content provided" });
        }

        // Scan for credentials before deploying
        const secrets = scanForCredentials(content);
        if (secrets.length > 0) {
            return res.status(400).json({
                error: "Potential credentials detected in content",
                secrets: secrets.map(s => ({ line: s.line, type: s.type }))
            });
        }

        const token = await fetchDecryptedToken(userId);
        const octokit = createOctokitInstance(token);

        // Check if .gitignore already exists (need SHA for update)
        let existingSha = null;
        try {
            const { data: existing } = await octokit.repos.getContent({
                owner, repo, path: '.gitignore'
            });
            existingSha = existing.sha;
        } catch (err) {
            // File doesn't exist, will create new
        }

        // Base64 encode the content
        const encodedContent = Buffer.from(content, 'utf-8').toString('base64');

        // Create or update the file
        const params = {
            owner, repo,
            path: '.gitignore',
            message: '🙈 chore: update .gitignore via GitTool',
            content: encodedContent,
        };
        if (existingSha) {
            params.sha = existingSha;
        }

        const { data } = await octokit.repos.createOrUpdateFileContents(params);

        res.json({
            success: true,
            message: existingSha ? '.gitignore updated' : '.gitignore created',
            commitSha: data.commit.sha,
            commitUrl: data.commit.html_url
        });
    } catch (error) {
        console.error("deployGitignore ERROR:", error.message);
        next(error);
    }
};
