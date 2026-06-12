import type { Metadata } from 'next';
import CommandBuilderPage from '@/views/tools/command-builder/CommandBuilderPage';

export const metadata: Metadata = {
  title: 'Git Command Builder',
  description: 'Build and customize git commands with an interactive visual interface.',
  robots: { index: false, follow: false },
};

export default function CommandBuilderRoute() {
  return <CommandBuilderPage />;
}
