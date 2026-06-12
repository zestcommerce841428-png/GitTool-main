import type { Metadata } from 'next';
import Home from '@/views/home';

export const metadata: Metadata = {
  title: 'Free Online Git Tools for Developers | Best Git Toolkit 2026',
  description:
    'GitTool is a free online git toolkit for developers with AI-powered README generation, security scanning, branch comparison, dependency auditing, and more.',
  keywords: [
    'git tools online',
    'free git tools',
    'AI git toolkit',
    'README generator',
    'git branch compare',
    'secrets scanner git',
    'dependency auditor',
    'git workflow builder',
    'GitHub developer tools',
  ],
  alternates: { canonical: 'https://gittool.dev/' },
  openGraph: {
    type: 'website',
    url: 'https://gittool.dev/',
    title: 'Free Online Git Tools for Developers | GitTool',
    description:
      'AI-powered toolkit for developers — README generation, security scanning, branch comparison, changelogs, and more. Free to use.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'GitTool – AI-Powered Git Tools' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Online Git Tools for Developers | GitTool',
    description:
      'AI-powered toolkit for developers — README generation, security scanning, branch comparison, changelogs, and more.',
    images: ['/og-image.png'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://gittool.dev/#website',
      url: 'https://gittool.dev/',
      name: 'GitTool',
      description: 'AI-powered Git tools for developers',
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: 'https://gittool.dev/blog?q={search_term_string}' },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': 'https://gittool.dev/#organization',
      name: 'GitTool',
      url: 'https://gittool.dev/',
      logo: { '@type': 'ImageObject', url: 'https://gittool.dev/og-image.png' },
      sameAs: ['https://github.com/gittool', 'https://twitter.com/gittool'],
    },
    {
      '@type': 'SoftwareApplication',
      name: 'GitTool',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web',
      url: 'https://gittool.dev/',
      description:
        'AI-powered git toolkit for developers: README generation, security scanning, branch analysis, changelogs, and workflow automation.',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Home />
    </>
  );
}