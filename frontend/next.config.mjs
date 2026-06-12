import path from 'path';
import createMDX from '@next/mdx';

const withMDX = createMDX({
  extension: /\.mdx?$/,
});

const DISCOVERY_LINK_HEADER = [
  '</.well-known/api-catalog>; rel="api-catalog"',
  '</.well-known/agent-skills/index.json>; rel="service-desc"',
  '</.well-known/mcp/server-card.json>; rel="mcp-server-card"',
  '</sitemap.xml>; rel="sitemap"',
].join(', ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  async headers() {
    return [
      {
        // Add agent/AI discoverability Link headers to public pages
        source: '/(|blog|learn|changelog|privacy)',
        headers: [
          { key: 'Link', value: DISCOVERY_LINK_HEADER },
        ],
      },
      {
        // CORS for well-known discovery endpoints
        source: '/.well-known/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-router-dom': path.resolve(process.cwd(), 'src/lib/router-compat.jsx'),
    };
    return config;
  },
};

export default withMDX(nextConfig);