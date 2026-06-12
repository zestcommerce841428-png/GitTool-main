import type { Metadata } from 'next';
import CollaborationHub from '@/views/tools/CollaborationHub';

export const metadata: Metadata = {
  title: 'Collaboration Hub',
  description: 'Manage team collaboration, code reviews, and contributor insights for your GitHub repositories.',
  robots: { index: false, follow: false },
};

export default function CollaborationPage() {
  return <CollaborationHub />;
}
