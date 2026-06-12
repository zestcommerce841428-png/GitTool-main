import type { Metadata } from 'next';
import SecurityDashboard from '@/views/tools/SecurityDashboard';

export const metadata: Metadata = {
  title: 'Security Dashboard',
  description: 'Security overview for your GitHub repositories — vulnerabilities, alerts, and remediation.',
  robots: { index: false, follow: false },
};

export default function SecurityPage() {
  return <SecurityDashboard />;
}
