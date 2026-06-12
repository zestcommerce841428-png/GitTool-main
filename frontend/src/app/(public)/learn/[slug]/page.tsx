import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { learnGuides } from '@/data/learnGuides';

type LearnArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return learnGuides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: LearnArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = learnGuides.find((entry) => entry.slug === slug);

  if (!guide) {
    return { title: 'Not Found | GitTool' };
  }

  return {
    title: `${guide.title} | GitTool`,
    description: guide.excerpt,
    alternates: { canonical: `https://gittool.dev/learn/${guide.slug}` },
    openGraph: {
      type: 'article',
      url: `https://gittool.dev/learn/${guide.slug}`,
      title: guide.title,
      description: guide.excerpt,
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: guide.title }],
      modifiedTime: guide.updatedAt,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: guide.title,
      description: guide.excerpt,
      images: ['/og-image.png'],
    },
  };
}

export default async function LearnArticlePage({ params }: LearnArticlePageProps) {
  const { slug } = await params;
  const guide = learnGuides.find((entry) => entry.slug === slug);

  if (!guide) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.excerpt,
    dateModified: guide.updatedAt,
    mainEntityOfPage: `https://gittool.dev/learn/${guide.slug}`,
    author: { '@type': 'Organization', name: 'GitTool' },
    publisher: { '@type': 'Organization', name: 'GitTool' },
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-16 text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link href="/learn" className="text-sm text-primary hover:underline">
        Back to Learn
      </Link>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">{guide.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Updated {guide.updatedAt}</p>
      <p className="mt-8 leading-8 text-muted-foreground">
        This guide route is publicly crawlable and included in the sitemap for indexing.
        Replace this placeholder section with complete tutorial content and examples to rank for the target query.
      </p>
    </main>
  );
}
