import AuthPage from '@/views/Auth';

export const metadata = {
  title: 'Sign In – Login to GitTool',
  description:
    'Sign in to GitTool with GitHub to access all AI-powered developer tools: README generator, branch compare, secrets scanner and more.',
  alternates: { canonical: 'https://gittool.dev/auth' },
  robots: { index: false, follow: true },
};

export default function AuthRoute() {
  return <AuthPage />;
}