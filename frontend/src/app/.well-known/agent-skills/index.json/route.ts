import { NextResponse } from 'next/server';

const BASE = 'https://gittool.dev';

/**
 * Agent Skills index for AI agent discoverability.
 * Served at /.well-known/agent-skills/index.json
 */
export async function GET() {
  const skills = {
    $schema: 'https://agentskills.io/schema/v0.2.0/skills-index.schema.json',
    name: 'GitTool',
    description: 'AI-powered developer tools for GitHub repositories',
    homepage: BASE,
    version: '1.0.0',
    skills: [
      {
        name: 'readme-generator',
        type: 'action',
        description:
          'Generate a professional README.md for any GitHub repository using AI. ' +
          'Supports multiple templates (professional, minimal, creative, detailed) and custom sections.',
        url: `${BASE}/tools/readme-generator`,
        input: {
          repo: 'GitHub repository in owner/name format',
          template: 'Template style: professional | minimal | creative | detailed',
          sections: 'Array of section names to include',
        },
      },
      {
        name: 'api-docs-generator',
        type: 'action',
        description:
          'Automatically generate API documentation for any GitHub repository. ' +
          'Scans code and produces structured markdown API docs.',
        url: `${BASE}/tools/api-docs-generator`,
        input: {
          repo: 'GitHub repository in owner/name format',
        },
      },
      {
        name: 'branch-pruner',
        type: 'action',
        description:
          'Identify and clean up stale or merged branches in a GitHub repository.',
        url: `${BASE}/tools/branch-pruner`,
        input: {
          repo: 'GitHub repository in owner/name format',
        },
      },
      {
        name: 'gitignore-generator',
        type: 'action',
        description:
          'Generate a .gitignore file tailored to any tech stack or framework.',
        url: `${BASE}/tools/gitignore`,
        input: {
          stack: 'Technology stack or framework name',
        },
      },
    ],
  };

  return NextResponse.json(skills, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
