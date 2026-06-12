import type { Metadata } from 'next';
import ApiDocsGenerator from '@/views/tools/ApiDocsGenerator';

export const metadata: Metadata = {
  title: 'API Docs Generator',
  description: 'Automatically generate API documentation from your GitHub repository.',
  robots: { index: false, follow: false },
};

export default function ApiDocsPage() {
  return <ApiDocsGenerator />;
}
