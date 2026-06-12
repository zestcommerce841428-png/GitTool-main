import PrivacyPage from '@/views/Privacy';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | GitTool',
  description: 'Read the GitTool privacy policy covering GitHub auth, repository access, and data handling.',
  alternates: { canonical: 'https://gittool.dev/privacy' },
  openGraph: {
    type: 'website',
    url: 'https://gittool.dev/privacy',
    title: 'Privacy Policy | GitTool',
    description: 'GitTool privacy policy covering GitHub auth, repository access, and data handling.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'GitTool Privacy Policy' }],
  },
};

export default function PrivacyRoute() {
  return <PrivacyPage />;
}