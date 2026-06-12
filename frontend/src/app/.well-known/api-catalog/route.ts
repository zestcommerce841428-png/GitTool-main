import { NextResponse } from 'next/server';

const BASE = 'https://gittool.dev';

/**
 * API Catalog per RFC 9727 / Cloudflare AI Agent discoverability.
 * Served as application/linkset+json at /.well-known/api-catalog
 */
export async function GET() {
  const catalog = {
    linkset: [
      {
        anchor: BASE,
        'service-doc': [
          { href: `${BASE}/learn`, type: 'text/html', title: 'GitTool Documentation & Guides' },
        ],
        'service-desc': [
          { href: `${BASE}/.well-known/agent-skills/index.json`, type: 'application/json', title: 'Agent Skills Index' },
        ],
        status: [
          { href: `${BASE}/api/health` },
        ],
        describedby: [
          { href: `${BASE}/learn`, type: 'text/html' },
        ],
      },
      {
        anchor: `${BASE}/api`,
        'service-doc': [
          { href: `${BASE}/learn/api`, type: 'text/html', title: 'API Reference' },
        ],
        type: [
          { value: 'REST' },
        ],
      },
    ],
  };

  return NextResponse.json(catalog, {
    status: 200,
    headers: {
      'Content-Type': 'application/linkset+json',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
