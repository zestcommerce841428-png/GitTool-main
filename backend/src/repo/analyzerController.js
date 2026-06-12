import { createOctokitInstance } from "./octokit.js";
import { fetchDecryptedToken } from "../users/githubTokenController.js";

/**
 * Analyze repository size using Git Trees API.
 * Returns file sizes, directory aggregates, and large file warnings.
 */
export const analyzeRepoSize = async (req, res, next) => {
    const { owner, repo } = req.params;
    const userId = req.user.id;

    try {
        const token = await fetchDecryptedToken(userId);
        const octokit = createOctokitInstance(token);

        // Get default branch
        const { data: repoData } = await octokit.repos.get({ owner, repo });
        const defaultBranch = repoData.default_branch;

        // Get the full tree recursively
        const { data: tree } = await octokit.git.getTree({
            owner, repo,
            tree_sha: defaultBranch,
            recursive: 'true'
        });

        // Parse tree entries
        const files = tree.tree.filter(t => t.type === 'blob');
        const dirs = tree.tree.filter(t => t.type === 'tree');

        // Total size
        const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);

        // Large files (>50MB warning, >100MB blocked)
        const largeFiles = files
            .filter(f => (f.size || 0) > 50 * 1024 * 1024)
            .sort((a, b) => (b.size || 0) - (a.size || 0))
            .map(f => ({ path: f.path, size: f.size }));

        // Directory size aggregates
        const dirSizes = {};
        files.forEach(f => {
            const parts = f.path.split('/');
            const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : '/';
            if (!dirSizes[dir]) dirSizes[dir] = { size: 0, fileCount: 0 };
            dirSizes[dir].size += (f.size || 0);
            dirSizes[dir].fileCount += 1;
        });

        const directories = Object.entries(dirSizes)
            .map(([path, data]) => ({ path, size: data.size, fileCount: data.fileCount }))
            .sort((a, b) => b.size - a.size);

        // Top largest files
        const topFiles = files
            .sort((a, b) => (b.size || 0) - (a.size || 0))
            .slice(0, 25)
            .map(f => ({ path: f.path, size: f.size }));

        res.json({
            totalSize,
            totalFiles: files.length,
            totalDirs: dirs.length,
            repoSizeKb: repoData.size,
            largeFiles,
            directories: directories.slice(0, 30),
            topFiles,
            truncated: tree.truncated || false
        });
    } catch (error) {
        console.error("analyzeRepoSize ERROR:", error.message);
        res.status(500).json({ error: error.message || "Failed to analyze repository size" });
    }
};

export const analyzeRepo = async (req, res, next) => {
  const { owner, repo } = req.params;
  const userId = req.user.id;

  try {
    const token = await fetchDecryptedToken(userId);
    const octokit = createOctokitInstance(token);

    // Fetch the root directory
    let rootFiles = [];
    try {
      const { data } = await octokit.repos.getContent({ owner, repo, path: '' });
      if (Array.isArray(data)) {
        rootFiles = data.map(f => f.name.toLowerCase());
      }
    } catch (err) {
      // If repo is completely empty, it throws a 404 for getContent
      if (err.status !== 404) throw err;
    }

    let hasReadme = false;
    let hasLicense = rootFiles.some(f => f.startsWith('license'));
    let hasContributing = rootFiles.some(f => f.startsWith('contributing'));
    let hasCodeOfConduct = rootFiles.some(f => f.startsWith('code_of_conduct'));

    let score = 0;
    let warnings = [];
    let recommendations = [];

    // Analyze existing README if available
    try {
      const readmeData = await octokit.repos.getReadme({ owner, repo });
      hasReadme = true;
      const content = Buffer.from(readmeData.data.content, "base64").toString("utf-8");
      
      if (content.length > 1000) {
        score += 40;
      } else if (content.length > 200) {
        score += 20;
        warnings.push("README is quite short and may lack detail.");
      } else {
        score += 5;
        warnings.push("README is practically empty.");
      }

      const hasTitle = /^#\s/m.test(content);
      const hasInstall = /install/i.test(content) || /setup/i.test(content) || /getting started/i.test(content);
      const hasUsage = /usage/i.test(content) || /example/i.test(content);
      const hasConfig = /config/i.test(content) || /env/i.test(content);

      if (hasTitle) score += 10; else warnings.push("Missing a main H1 title ('# Title').");
      if (hasInstall) score += 10; else warnings.push("Missing clear 'Installation' or 'Setup' instructions.");
      if (hasUsage) score += 10; else warnings.push("Missing 'Usage' snippets or examples.");
      if (hasConfig) score += 10; else recommendations.push("Consider adding a 'Configuration' section.");

    } catch (e) {
      hasReadme = false;
      warnings.push("No README.md found in the root directory.");
    }

    // Adjust scores around supplementary files
    if (hasLicense) {
        score += 10;
    } else {
        warnings.push("Missing a LICENSE file. Your repository is legally not open source without one.");
    }

    if (hasContributing) {
        score += 5;
    } else {
        recommendations.push("Consider adding a CONTRIBUTING directory or file.");
    }

    if (hasCodeOfConduct) {
        score += 5;
    } else {
        recommendations.push("Consider adding a CODE_OF_CONDUCT file for community guidelines.");
    }

    // Ensure score bounded
    score = Math.min(Math.max(score, 0), 100);

    res.json({
      score,
      hasReadme,
      hasLicense,
      hasContributing,
      hasCodeOfConduct,
      warnings,
      recommendations
    });
  } catch (error) {
    console.error("calculateRepoHealth ERROR:", error.message);
    res.status(500).json({ error: error.message || "Failed to analyze repository health" });
  }
};
