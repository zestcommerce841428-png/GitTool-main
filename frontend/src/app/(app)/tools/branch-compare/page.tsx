import type { Metadata } from 'next';
import BranchCompare from '@/views/tools/BranchCompare';

export const metadata: Metadata = {
  title: 'Branch Compare',
  description: 'Compare branches in your GitHub repository and visualize differences.',
  robots: { index: false, follow: false },
};

export default function BranchCompareAliasPage() {
  return <BranchCompare />;
}