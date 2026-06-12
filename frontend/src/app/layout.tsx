import type { Metadata } from 'next';
import Script from 'next/script';
import '@fontsource-variable/geist';
import './globals.css';
import { Providers } from './providers';

const GA_ID = 'G-9BCPHHW5JP';

export const metadata: Metadata = {
  metadataBase: new URL('https://gittool.dev'),
  title: {
    default: 'GitTool – AI-Powered Git Tools for Developers',
    template: '%s | GitTool',
  },
  description:
    'GitTool is an AI-powered git toolkit for developers with README generation, security scanning, branch analysis, changelogs, and workflow automation.',
  keywords: [
    'git tools',
    'AI git',
    'GitHub tools',
    'README generator',
    'branch analysis',
    'secrets scanner',
    'git workflow',
    'developer tools',
  ],
  authors: [{ name: 'GitTool', url: 'https://gittool.dev' }],
  creator: 'GitTool',
  openGraph: {
    type: 'website',
    siteName: 'GitTool',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'GitTool – AI-Powered Git Tools for Developers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@gittool',
    creator: '@gittool',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
  verification: {
    // Replace with the value from Google Search Console → Settings → Ownership
    // verification → "HTML tag" (the content="..." value only), then redeploy.
    google: 'REPLACE_WITH_GOOGLE_SEARCH_CONSOLE_VERIFICATION_CODE',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
      </body>
    </html>
  );
}
