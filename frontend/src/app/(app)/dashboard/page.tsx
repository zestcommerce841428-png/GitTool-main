import DashboardPage from '@/views/Dashboard';

export const metadata = {
  title: 'Dashboard | GitTool',
  description: 'Manage your GitHub repositories and run AI-powered developer tools from the GitTool dashboard.',
  robots: { index: false, follow: false },
};

export default function DashboardRoute() {
  return <DashboardPage />;
}