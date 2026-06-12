import type { Metadata } from 'next';
import SemanticVersionSuggester from '@/views/tools/SemanticVersionSuggester';

export const metadata: Metadata = {
  title: 'Version Suggester',
  description: 'Get AI-powered semantic version suggestions based on your commits and changes.',
  robots: { index: false, follow: false },
};

export default function VersionSuggesterPage() {
  return <SemanticVersionSuggester />;
}
