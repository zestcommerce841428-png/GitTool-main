import type { Metadata } from 'next';
import PipelineFailureExplainer from '@/views/tools/PipelineFailureExplainer';

export const metadata: Metadata = {
  title: 'Pipeline Failure Explainer',
  description: 'Understand and debug CI/CD pipeline failures with AI-powered explanations.',
  robots: { index: false, follow: false },
};

export default function FailureExplainerPage() {
  return <PipelineFailureExplainer />;
}
