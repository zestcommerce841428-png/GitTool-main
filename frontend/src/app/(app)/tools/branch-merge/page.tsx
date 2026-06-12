import type { Metadata } from 'next';
import BranchMergeUI from '@/views/tools/BranchMergeUI';

export const metadata: Metadata = {
  title: 'Branch Merge Assistant',
  description: 'AI-powered branch merge assistance to resolve conflicts and safely merge code.',
  robots: { index: false, follow: false },
};

export default function BranchMergePage() {
  return <BranchMergeUI />;
}
