import { NextResponse, type NextRequest } from 'next/server';

const ROBOTS_TXT = `User-agent: *
Allow: /
Allow: /blog
Allow: /blog/
Allow: /learn
Allow: /learn/
Allow: /privacy
Allow: /changelog
Disallow: /auth
Disallow: /dashboard
Disallow: /profile
Disallow: /tools/

# AI search & assistant crawlers — allowed to index public content
User-agent: GPTBot
User-agent: ChatGPT-User
User-agent: Google-Extended
User-agent: PerplexityBot
User-agent: Applebot-Extended
User-agent: CCBot
User-agent: cohere-ai
Allow: /blog
Allow: /learn
Allow: /changelog
Allow: /privacy
Disallow: /

# Content usage signals
Content-Signal: ai-train=no, search=yes, ai-input=yes

Sitemap: https://gittool.dev/sitemap.xml
`;

const API_CATALOG_LINK = [
  '</.well-known/api-catalog>; rel="api-catalog"',
  '</.well-known/agent-skills/index.json>; rel="service-desc"',
  '</.well-known/mcp/server-card.json>; rel="mcp-server-card"',
  '</sitemap.xml>; rel="sitemap"',
].join(', ');

/** Markdown representations of public pages for Accept: text/markdown negotiation */
const MARKDOWN_PAGES: Record<string, string> = {
  '/': `# GitTool — AI-Powered Developer Tools for GitHub

GitTool is a suite of AI-powered tools that help developers work faster with GitHub repositories.

## Tools

- **README Generator** — Generate professional README files in seconds using AI. Choose from professional, minimal, creative, or detailed templates.
- **API Docs Generator** — Automatically scan your codebase and produce structured API documentation.
- **Branch Pruner** — Identify and clean up stale or already-merged branches.
- **Gitignore Generator** — Generate a .gitignore tailored to your exact tech stack.

## Get Started

1. Sign in with your GitHub account at <https://gittool.dev/auth>
2. Select a repository from your dashboard
3. Pick a tool and generate in seconds

## Links

- Homepage: <https://gittool.dev>
- Blog: <https://gittool.dev/blog>
- Documentation: <https://gittool.dev/learn>
- Changelog: <https://gittool.dev/changelog>
`,
  '/blog': `# GitTool Blog

Developer tips, product updates, and guides on getting the most out of AI-powered GitHub tooling.

Visit the full blog at <https://gittool.dev/blog>
`,
  '/learn': `# GitTool Documentation & Guides

Learn how to use every GitTool feature with step-by-step guides.

Visit the full docs at <https://gittool.dev/learn>
`,
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accept = request.headers.get('accept') ?? '';

  // Serve enhanced robots.txt with Content-Signal and AI bot rules
  if (pathname === '/robots.txt') {
    return new NextResponse(ROBOTS_TXT, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  // Markdown content negotiation — respond with .md when Accept: text/markdown
  if (accept.includes('text/markdown') && MARKDOWN_PAGES[pathname]) {
    return new NextResponse(MARKDOWN_PAGES[pathname], {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'Vary': 'Accept',
      },
    });
  }

  const response = NextResponse.next();

  // Vary header so caches know content differs by Accept
  if (MARKDOWN_PAGES[pathname]) {
    response.headers.set('Vary', 'Accept');
  }

  // Add Link discovery headers to public pages
  if (pathname === '/' || pathname === '/blog' || pathname === '/learn') {
    response.headers.set('Link', API_CATALOG_LINK);
  }

  return response;
}

export const config = {
  matcher: ['/robots.txt', '/', '/blog', '/learn'],
};
