import type { Metadata } from 'next';
import DeadCodeDetector from '@/views/tools/DeadCodeDetector';

export const metadata: Metadata = {
  title: 'Dead Code Detector',
  description: 'Detect and identify unused code in your GitHub repository with AI analysis.',
  robots: { index: false, follow: false },
};

export default function DeadCodePage() {
  return <DeadCodeDetector />;
}
