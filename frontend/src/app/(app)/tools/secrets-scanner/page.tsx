import type { Metadata } from 'next';
import SecretsScanner from '@/views/tools/SecretsScanner';

export const metadata: Metadata = {
  title: 'Secrets Scanner',
  description: 'Scan your GitHub repository for accidentally committed secrets, API keys, and credentials.',
  robots: { index: false, follow: false },
};

export default function SecretsScannerPage() {
  return <SecretsScanner />;
}
