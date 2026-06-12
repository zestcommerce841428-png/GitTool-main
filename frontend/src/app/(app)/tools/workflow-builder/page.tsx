import type { Metadata } from 'next';
import WorkflowBuilder from '@/views/tools/WorkflowBuilder';

export const metadata: Metadata = {
  title: 'Workflow Builder',
  description: 'Build and customize GitHub Actions workflows with an AI-powered visual editor.',
  robots: { index: false, follow: false },
};

export default function WorkflowBuilderPage() {
  return <WorkflowBuilder />;
}
