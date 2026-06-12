import type { Metadata } from 'next';
import IssueTriageAssistant from '@/views/tools/IssueTriageAssistant';

export const metadata: Metadata = {
  title: 'Issue Triage Assistant',
  description: 'AI-powered triage for GitHub issues — categorize, prioritize, and assign automatically.',
  robots: { index: false, follow: false },
};

export default function IssueTriagePage() {
  return <IssueTriageAssistant />;
}
