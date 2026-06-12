import type { Metadata } from 'next';
import DependencyAuditor from '@/views/tools/DependencyAuditor';

export const metadata: Metadata = {
  title: 'Dependency Auditor',
  description: 'Audit and analyze your project dependencies for vulnerabilities and outdated packages.',
  robots: { index: false, follow: false },
};

export default function DependencyAuditorPage() {
  return <DependencyAuditor />;
}
