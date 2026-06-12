import type { Metadata } from 'next';
import BranchCompare from '@/views/tools/BranchCompare';

export const metadata: Metadata = {
  title: 'Compare Branches',
  description: 'Compare branches and commits in your GitHub repository.',
  robots: { index: false, follow: false },
};

export default function ComparePage() {
  return <BranchCompare />;
}
