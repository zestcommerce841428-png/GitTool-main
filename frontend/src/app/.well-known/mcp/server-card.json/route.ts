import { NextResponse } from 'next/server';

const BASE = 'https://gittool.dev';

/**
 * MCP Server Card for AI agent / tool discoverability.
 * Served at /.well-known/mcp/server-card.json
 */
export async function GET() {
  const serverCard = {
    name: 'GitTool MCP',
    description:
      'AI-powered developer tools for GitHub: README generator, API docs generator, branch pruner, gitignore generator, and more.',
    version: '1.0.0',
    homepage: BASE,
    contact: 'support@gittool.dev',
    transports: [
      {
        type: 'http',
        url: `${BASE}/api/mcp`,
        authentication: {
          type: 'bearer',
          description: 'GitHub OAuth token via GitTool auth flow',
          authorizationUrl: `${BASE}/auth`,
        },
      },
    ],
    tools: [
      {
        name: 'generate_readme',
        description:
          'Generate a professional README.md for a GitHub repository using AI. Supports professional, minimal, creative, and detailed templates.',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'GitHub repository owner' },
            repo: { type: 'string', description: 'GitHub repository name' },
            template: {
              type: 'string',
              enum: ['professional', 'minimal', 'creative', 'detailed'],
              description: 'README template style',
            },
            sections: {
              type: 'array',
              items: { type: 'string' },
              description: 'Sections to include in the README',
            },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'generate_api_docs',
        description:
          'Automatically scan and generate API documentation for a GitHub repository.',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'GitHub repository owner' },
            repo: { type: 'string', description: 'GitHub repository name' },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'prune_branches',
        description:
          'Identify stale or already-merged branches in a GitHub repository.',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'GitHub repository owner' },
            repo: { type: 'string', description: 'GitHub repository name' },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'generate_gitignore',
        description:
          'Generate a .gitignore file tailored to a given tech stack or framework.',
        inputSchema: {
          type: 'object',
          properties: {
            stack: {
              type: 'string',
              description: 'Technology stack or framework (e.g. "Node.js", "Python Django")',
            },
          },
          required: ['stack'],
        },
      },
    ],
  };

  return NextResponse.json(serverCard, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
