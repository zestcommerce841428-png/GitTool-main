import type { Metadata } from 'next';
import ReadmeGenerator from '@/views/tools/ReadmeGenerator';

export const metadata: Metadata = {
  title: 'README Generator',
  description: 'Generate a professional README.md for any GitHub repository using AI.',
  robots: { index: false, follow: false },
};

export default function ReadmeGeneratorPage() {
  return <ReadmeGenerator />;
}
