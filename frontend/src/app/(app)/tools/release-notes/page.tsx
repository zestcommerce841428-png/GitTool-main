import type { Metadata } from 'next';
import ReleaseNotesGenerator from '@/views/tools/ReleaseNotesGenerator';

export const metadata: Metadata = {
  title: 'Release Notes Generator',
  description: 'Automatically generate release notes and changelogs from your GitHub commits and PRs.',
  robots: { index: false, follow: false },
};

export default function ReleaseNotesPage() {
  return <ReleaseNotesGenerator />;
}
