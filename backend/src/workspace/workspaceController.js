import { fetchDecryptedToken } from "../users/githubTokenController.js";
import { createOctokitInstance } from "../repo/octokit.js";
import { callOpenAI } from "../shared/openaiService.js";
import { deductToken } from "../token/tokenController.js";

export const generateContributing = async (req, res, next) => {
    try {
        const { owner, repo } = req.params;
        const userId = req.user.id;

        const githubToken = await fetchDecryptedToken(userId);
        const octokit = createOctokitInstance(githubToken);

        const { data: repoData } = await octokit.repos.get({ owner, repo });
        const { data: languages } = await octokit.repos.listLanguages({ owner, repo });

        const prompt = `
        You are an expert open source maintainer. Generate a comprehensive CONTRIBUTING.md file for the following repository:
        Name: ${repoData.name}
        Description: ${repoData.description || 'No description'}
        Languages: ${Object.keys(languages).join(", ")}
        
        Include:
        - How to fork and clone
        - Setup instructions based on the languages
        - Code style guidelines
        - Pull request rules
        Format as beautiful markdown. No explanations, just the raw markdown.
        `;

        const content = await callOpenAI(prompt);
        
        await deductToken(userId, 5, "generate", `Generated CONTRIBUTING.md for ${owner}/${repo}`);
        
        res.json({ content });
    } catch (err) {
        next(err);
    }
};

export const generateLicense = async (req, res, next) => {
    try {
        const { owner, repo } = req.params;
        const { licenseType, holderName, year } = req.body;
        
        // Quick local generation to save OpenAI costs for standard licenses
        let content = "";
        if (licenseType === "MIT") {
            content = `MIT License

Copyright (c) ${year} ${holderName}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;
        } else if (licenseType === "Apache") {
            content = `Apache License 2.0\n\nCopyright ${year} ${holderName}\n... [Standard Apache License Text]`;
        } else {
            content = `GNU GPL v3 License\n\nCopyright ${year} ${holderName}`;
        }
        
        res.json({ content });
    } catch (err) {
        next(err);
    }
};

export const generateChangelog = async (req, res, next) => {
    try {
        const { owner, repo } = req.params;
        const userId = req.user.id;

        const githubToken = await fetchDecryptedToken(userId);
        const octokit = createOctokitInstance(githubToken);

        const { data: commits } = await octokit.repos.listCommits({ owner, repo, per_page: 30 });
        
        const commitMsgs = commits.map(c => `- ${c.commit.message}`).join("\n");

        const prompt = `
        You are a technical writer. Organize these raw commit messages into a clean, structured CHANGELOG.md file in Markdown.
        Group them logically (e.g., Features, Fixes, Chores).
        Commits:
        ${commitMsgs}
        
        Format as strict markdown.
        `;

        const content = await callOpenAI(prompt);
        
        await deductToken(userId, 10, "generate", `Generated CHANGELOG.md for ${owner}/${repo}`);

        res.json({ content });
    } catch (err) {
        next(err);
    }
};

export const generateResumeBullets = async (req, res, next) => {
    try {
        const { owner, repo } = req.params;
        const userId = req.user.id;

        const githubToken = await fetchDecryptedToken(userId);
        const octokit = createOctokitInstance(githubToken);

        const { data: repoData } = await octokit.repos.get({ owner, repo });
        const { data: languages } = await octokit.repos.listLanguages({ owner, repo });

        const prompt = `
        You are an expert tech recruiter and resume writer.
        Based on this GitHub repository, write 3-5 high-impact, quantifiable resume bullet points using the XYZ formula (Accomplished [X] as measured by [Y], by doing [Z]).
        
        Repo: ${repoData.name}
        Description: ${repoData.description || 'No description'}
        Languages: ${Object.keys(languages).join(", ")}
        Stars: ${repoData.stargazers_count}
        
        Return ONLY a markdown list of the bullet points.
        `;

        const content = await callOpenAI(prompt);

        await deductToken(userId, 5, "generate", `Generated Resume Bullets for ${owner}/${repo}`);

        res.json({ content });
    } catch (err) {
        next(err);
    }
};

export const generateGithubActions = async (req, res, next) => {
    try {
        const { owner, repo } = req.params;
        const { stackType } = req.body;
        
        let content = "";
        if (stackType === "Node CI") {
            content = `name: Node.js CI

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    steps:
    - uses: actions/checkout@v4
    - name: Use Node.js \x24{{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: \x24{{ matrix.node-version }}
        cache: 'npm'
    - run: npm ci
    - run: npm run build --if-present
    - run: npm test`;
        } else {
            content = "# Workflow template coming soon...";
        }

        res.json({ content, filename: '.github/workflows/ci.yml' });
    } catch (err) {
        next(err);
    }
};
