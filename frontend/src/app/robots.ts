import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/blog', '/learn', '/changelog', '/privacy'],
        disallow: ['/auth', '/dashboard', '/profile', '/tools/'],
      },
    ],
    sitemap: 'https://gittool.dev/sitemap.xml',
  };
}
