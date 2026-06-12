import { fetchDecryptedToken } from "../users/githubTokenController.js";
import { createOctokitInstance } from "../repo/octokit.js";

/* ─── Helpers ─────────────────────────────────────────── */

function computeHealth(branch, defaultBranch) {
    if (branch.isDefault) return 100;
    let score = 100;

    // Behind penalty
    if (branch.behind > 20) score -= 30;
    else if (branch.behind > 5) score -= 15;

    // Age penalty
    const ageDays = branch.ageDays || 0;
    if (ageDays > 30) score -= 20;
    else if (ageDays > 14) score -= 10;

    // Unmerged + old penalty
    if (!branch.merged && ageDays > 14) score -= 15;

    // Protected bonus
    if (branch.protected) score += 10;

    return Math.max(0, Math.min(100, score));
}

function branchStatus(branch) {
    if (branch.protected || branch.isDefault) return 'protected';
    if (branch.merged) return 'merged';
    const ageDays = branch.ageDays || 0;
    if (ageDays > 30) return 'stale';
    return 'active';
}

/* ─── List ALL Branches (enriched) ────────────────────── */

export const listAllBranches = async (req, res, next) => {
    try {
        const { owner, repo } = req.params;
        const userId = req.user.id;

        const token = await fetchDecryptedToken(userId);
        const octokit = createOctokitInstance(token);

        // Get repo info
        const { data: repoData } = await octokit.repos.get({ owner, repo });
        const defaultBranch = repoData.default_branch;

        // Fetch all branches with pagination
        let allBranches = [];
        let page = 1;
        while (true) {
            const { data } = await octokit.repos.listBranches({
                owner, repo, per_page: 100, page
            });
            allBranches = allBranches.concat(data);
            if (data.length < 100) break;
            page++;
        }

        // Analyze each branch (parallel with concurrency limit)
        const now = new Date();
        const BATCH = 10;
        const analyzed = [];

        for (let i = 0; i < allBranches.length; i += BATCH) {
            const batch = allBranches.slice(i, i + BATCH);
            const results = await Promise.all(batch.map(async (branch) => {
                const isDefault = branch.name === defaultBranch;
                try {
                    // Get last commit details
                    const { data: commit } = await octokit.repos.getCommit({
                        owner, repo, ref: branch.commit.sha
                    });
                    const lastCommitDate = commit.commit.committer?.date || commit.commit.author?.date;
                    const lastCommitMessage = (commit.commit.message || '').split('\n')[0];
                    const lastCommitAuthor = commit.commit.author?.name || commit.author?.login || '—';
                    const ageDays = Math.floor((now - new Date(lastCommitDate)) / (1000 * 60 * 60 * 24));

                    // Compare with default branch (ahead/behind)
                    let ahead = 0, behind = 0, merged = false;
                    if (!isDefault) {
                        try {
                            const { data: cmp } = await octokit.repos.compareCommits({
                                owner, repo,
                                base: defaultBranch,
                                head: branch.name
                            });
                            ahead = cmp.ahead_by || 0;
                            behind = cmp.behind_by || 0;
                            merged = cmp.status === 'identical' || cmp.status === 'behind';
                        } catch {
                            // comparison may fail for diverged branches
                        }
                    }

                    const entry = {
                        name: branch.name,
                        isDefault,
                        protected: branch.protected || isDefault,
                        lastCommitDate,
                        lastCommitMessage,
                        lastCommitAuthor,
                        lastCommitSha: branch.commit.sha,
                        ageDays,
                        ahead,
                        behind,
                        merged,
                    };
                    entry.health = computeHealth(entry, defaultBranch);
                    entry.status = branchStatus(entry);
                    return entry;
                } catch (err) {
                    return {
                        name: branch.name,
                        isDefault,
                        protected: branch.protected || isDefault,
                        lastCommitDate: null,
                        lastCommitMessage: '',
                        lastCommitAuthor: '—',
                        lastCommitSha: branch.commit.sha,
                        ageDays: 0,
                        ahead: 0,
                        behind: 0,
                        merged: false,
                        health: 50,
                        status: 'active',
                        error: err.message,
                    };
                }
            }));
            analyzed.push(...results);
        }

        // Sort: default first, then by health (lowest first = needs attention)
        analyzed.sort((a, b) => {
            if (a.isDefault) return -1;
            if (b.isDefault) return 1;
            return a.health - b.health;
        });

        // Compute counts
        const counts = {
            total: analyzed.length,
            active: analyzed.filter(b => b.status === 'active').length,
            stale: analyzed.filter(b => b.status === 'stale').length,
            merged: analyzed.filter(b => b.status === 'merged').length,
            protected: analyzed.filter(b => b.status === 'protected').length,
        };

        // Smart suggestions
        const suggestions = [];
        for (const b of analyzed) {
            if (b.isDefault) continue;
            if (b.behind > 10 && !b.merged) {
                suggestions.push({ branch: b.name, type: 'behind', message: `${b.name} is ${b.behind} commits behind ${defaultBranch}`, action: 'Rebase or merge main' });
            }
            if (b.ageDays > 30 && !b.merged && !b.protected) {
                suggestions.push({ branch: b.name, type: 'stale', message: `${b.name} is ${b.ageDays} days old and unmerged`, action: 'Delete or create PR' });
            }
            if (b.merged && !b.protected) {
                suggestions.push({ branch: b.name, type: 'cleanup', message: `${b.name} is fully merged`, action: 'Safe to delete' });
            }
        }

        res.json({
            defaultBranch,
            counts,
            branches: analyzed,
            suggestions,
            repoUrl: repoData.html_url,
        });
    } catch (error) {
        console.error("listAllBranches ERROR:", error.message);
        next(error);
    }
};

/* ─── List Stale Branches (kept for backward compat) ──── */

export const listStaleBranches = async (req, res, next) => {
    try {
        const { owner, repo } = req.params;
        const threshold = parseInt(req.query.threshold) || 30;
        const userId = req.user.id;

        const token = await fetchDecryptedToken(userId);
        const octokit = createOctokitInstance(token);

        const { data: repoData } = await octokit.repos.get({ owner, repo });
        const defaultBranch = repoData.default_branch;

        let allBranches = [];
        let page = 1;
        while (true) {
            const { data } = await octokit.repos.listBranches({
                owner, repo, per_page: 100, page
            });
            allBranches = allBranches.concat(data);
            if (data.length < 100) break;
            page++;
        }

        const featureBranches = allBranches.filter(b => b.name !== defaultBranch);
        const now = new Date();
        const thresholdMs = threshold * 24 * 60 * 60 * 1000;

        const analyzed = await Promise.all(featureBranches.map(async (branch) => {
            try {
                const { data: commit } = await octokit.repos.getCommit({
                    owner, repo, ref: branch.commit.sha
                });
                const lastCommitDate = commit.commit.committer?.date || commit.commit.author?.date;
                const lastCommitMessage = commit.commit.message;
                const age = now - new Date(lastCommitDate);
                const isStale = age > thresholdMs;

                let merged = false;
                try {
                    const { status } = await octokit.repos.compareCommits({
                        owner, repo, base: defaultBranch, head: branch.name
                    });
                    merged = status === 'identical' || status === 'behind';
                } catch {
                    merged = false;
                }

                return {
                    name: branch.name,
                    lastCommitDate,
                    lastCommitMessage: lastCommitMessage?.split('\n')[0] || '',
                    lastCommitSha: branch.commit.sha,
                    isStale, merged,
                    safe: merged && isStale,
                    protected: branch.protected
                };
            } catch (err) {
                return {
                    name: branch.name, lastCommitDate: null, lastCommitMessage: '',
                    lastCommitSha: branch.commit.sha, isStale: false, merged: false,
                    safe: false, protected: branch.protected, error: err.message
                };
            }
        }));

        const staleBranches = analyzed
            .filter(b => b.isStale && !b.protected)
            .sort((a, b) => new Date(a.lastCommitDate) - new Date(b.lastCommitDate));

        res.json({
            defaultBranch,
            totalBranches: allBranches.length,
            staleBranches: staleBranches.length,
            branches: staleBranches
        });
    } catch (error) {
        console.error("listStaleBranches ERROR:", error.message);
        next(error);
    }
};

/* ─── Prune Branches ──────────────────────────────────── */

export const pruneBranches = async (req, res, next) => {
    try {
        const { owner, repo } = req.params;
        const { branches } = req.body;
        const userId = req.user.id;

        if (!branches || !Array.isArray(branches) || branches.length === 0) {
            return res.status(400).json({ error: "No branches specified" });
        }

        const token = await fetchDecryptedToken(userId);
        const octokit = createOctokitInstance(token);

        const results = [];
        for (const branchName of branches) {
            try {
                await octokit.git.deleteRef({ owner, repo, ref: `heads/${branchName}` });
                results.push({ name: branchName, status: 'deleted' });
            } catch (err) {
                results.push({ name: branchName, status: 'failed', error: err.message });
            }
        }

        const deleted = results.filter(r => r.status === 'deleted').length;
        const failed = results.filter(r => r.status === 'failed').length;

        res.json({
            message: `Deleted ${deleted} branch(es), ${failed} failed`,
            results, deleted, failed
        });
    } catch (error) {
        console.error("pruneBranches ERROR:", error.message);
        next(error);
    }
};
