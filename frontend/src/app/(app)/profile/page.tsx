import ProfilePage from '@/views/Profile';

export const metadata = {
  title: 'Profile | GitTool',
  description: 'Manage your GitTool account profile, credits, connected services, and preferences.',
  robots: { index: false, follow: false },
};

export default function ProfileRoute() {
  return <ProfilePage />;
}