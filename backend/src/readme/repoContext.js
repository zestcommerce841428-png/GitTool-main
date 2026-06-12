/**
 * Fetches rich context about a GitHub repo for AI consumption.
 * Includes: metadata, file tree, recent commits, package.json, and key config files.
 */
export async function fetchRepoContext(octokit, owner, repo, repoData = null) {
  const context = {
    fileTree: [],
    recentCommits: [],
    packageJson: null,
    keyFiles: {},
  };

  // 1. File tree (recursive, limited to 150 entries to save tokens)
  try {
    // Resolve default branch to get actual tree SHA
    // (git.getTree doesn't accept 'HEAD' — needs a real SHA)
    if (!repoData) {
      const { data } = await octokit.repos.get({ owner, repo });
      repoData = data;
    }
    const defaultBranch = repoData.default_branch || 'main';
    const { data: refData } = await octokit.git.getRef({
      owner, repo,
      ref: `heads/${defaultBranch}`,
    });
    const commitSha = refData.object.sha;
    const { data: commitData } = await octokit.git.getCommit({
      owner, repo,
      commit_sha: commitSha,
    });
    const treeSha = commitData.tree.sha;

    const { data: tree } = await octokit.git.getTree({
      owner, repo,
      tree_sha: treeSha,
      recursive: 'true',
    });
    context.fileTree = tree.tree
      .filter(item => item.type === 'blob')
      .map(item => item.path)
      .slice(0, 500);
    console.log(`[repoContext] Fetched ${context.fileTree.length} files for ${owner}/${repo}`);
  } catch (e) {
    console.warn("Could not fetch file tree:", e.message);
  }

  // 2. Recent commits (last 15)
  try {
    const { data: commits } = await octokit.repos.listCommits({
      owner, repo, per_page: 15,
    });
    context.recentCommits = commits.map(c => ({
      sha: c.sha.substring(0, 7),
      message: c.commit.message.split('\n')[0],
      author: c.commit.author?.name || 'unknown',
      date: c.commit.author?.date,
    }));
  } catch (e) {
    console.warn("Could not fetch commits:", e.message);
  }

  // 3. Key config files
  const keyFileNames = [
    'package.json', 'requirements.txt', 'Cargo.toml', 'go.mod', 'pyproject.toml',
    'Dockerfile', 'docker-compose.yml', '.env.example', 'tsconfig.json',
    'vite.config.js', 'vite.config.ts', 'next.config.js', 'next.config.mjs',
    'vercel.json', 'netlify.toml', 'fly.toml', 'render.yaml',
  ];

  for (const filename of keyFileNames) {
    if (!context.fileTree.includes(filename)) continue;
    try {
      const { data } = await octokit.repos.getContent({ owner, repo, path: filename });
      if (data.encoding === 'base64' && data.size < 15000) {
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        context.keyFiles[filename] = content;
        if (filename === 'package.json') {
          context.packageJson = JSON.parse(content);
        }
      }
    } catch (e) {
      // File doesn't exist or can't be read — skip silently
    }
  }

  return context;
}

/**
 * Formats the repo context into a string for the AI prompt.
 */
export function formatRepoContext(repoData, repoContext) {
  let ctx = '';

  ctx += `## Repository Info\n`;
  ctx += `- Name: ${repoData.name}\n`;
  ctx += `- Description: ${repoData.description || 'No description'}\n`;
  ctx += `- URL: ${repoData.html_url}\n`;
  ctx += `- Stars: ${repoData.stargazers_count} | Forks: ${repoData.forks_count}\n`;
  ctx += `- Default Branch: ${repoData.default_branch}\n`;
  if (repoData.license?.spdx_id) ctx += `- License: ${repoData.license.spdx_id}\n`;
  if (repoData.topics?.length) ctx += `- Topics: ${repoData.topics.join(', ')}\n`;

  if (repoContext.fileTree.length > 0) {
    ctx += `\n## File Structure (${repoContext.fileTree.length} files)\n`;
    ctx += repoContext.fileTree.join('\n') + '\n';
  }

  if (repoContext.recentCommits.length > 0) {
    ctx += `\n## Recent Commits\n`;
    repoContext.recentCommits.forEach(c => {
      ctx += `- ${c.sha} ${c.message} (${c.author})\n`;
    });
  }

  if (repoContext.packageJson) {
    const pkg = repoContext.packageJson;
    ctx += `\n## package.json Summary\n`;
    if (pkg.scripts) ctx += `- Scripts: ${Object.keys(pkg.scripts).join(', ')}\n`;
    if (pkg.dependencies) ctx += `- Dependencies: ${Object.keys(pkg.dependencies).join(', ')}\n`;
    if (pkg.devDependencies) ctx += `- DevDependencies: ${Object.keys(pkg.devDependencies).join(', ')}\n`;
  }

  const otherKeys = Object.keys(repoContext.keyFiles).filter(k => k !== 'package.json');
  if (otherKeys.length > 0) {
    ctx += `\n## Key Config Files\n`;
    otherKeys.forEach(filename => {
      const content = repoContext.keyFiles[filename];
      const truncated = content.length > 2000 ? content.substring(0, 2000) + '\n...(truncated)' : content;
      ctx += `\n### ${filename}\n\`\`\`\n${truncated}\n\`\`\`\n`;
    });
  }

  return ctx;
}
