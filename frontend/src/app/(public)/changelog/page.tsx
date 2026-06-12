import ChangelogPage from '@/views/Changelog';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Changelog – New Features & Updates | GitTool',
  description:
    'See the latest GitTool updates, new AI developer tools, bug fixes, and improvements.',
  alternates: { canonical: 'https://gittool.dev/changelog' },
  openGraph: {
    type: 'website',
    url: 'https://gittool.dev/changelog',
    title: 'Changelog | GitTool',
    description: 'Latest updates, new tools, and improvements to the GitTool AI developer toolkit.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'GitTool Changelog' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Changelog | GitTool',
    description: 'Latest updates and new features for GitTool.',
    images: ['/og-image.png'],
  },
};

export default function ChangelogRoute() {
  return <ChangelogPage />;
}