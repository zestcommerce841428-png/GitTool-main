import type { Metadata } from 'next';
import TodoToIssue from '@/views/tools/TodoToIssue';

export const metadata: Metadata = {
  title: 'TODO to Issue Converter',
  description: 'Convert TODO comments in your codebase into actionable GitHub issues automatically.',
  robots: { index: false, follow: false },
};

export default function TodoConverterPage() {
  return <TodoToIssue />;
}
