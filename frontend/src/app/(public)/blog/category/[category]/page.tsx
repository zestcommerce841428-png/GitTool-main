import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import BlogPostList from '@/components/blog/BlogPostList';
import CategorySelect from '@/components/blog/CategorySelect';
import NewsletterSignup from '@/components/blog/NewsletterSignup';
import { getAllCategories, getAllPosts } from '@/lib/content';

type CategoryPageProps = {
  params: Promise<{ category: string }>;
};

export function generateStaticParams() {
  return getAllCategories().map((category) => ({ category }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const normalizedCategory = decodeURIComponent(category).toLowerCase();

  return {
    title: `${normalizedCategory} Articles — Git Blog | GitTool`,
    description: `Browse all GitTool blog articles about ${normalizedCategory}. Practical guides, tips, and best practices.`,
    alternates: { canonical: `https://gittool.dev/blog/category/${normalizedCategory}` },
    openGraph: {
      type: 'website',
      url: `https://gittool.dev/blog/category/${normalizedCategory}`,
      title: `${normalizedCategory} Articles | GitTool Blog`,
      description: `Browse all GitTool blog articles about ${normalizedCategory}. Practical guides, tips, and best practices.`,
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'GitTool Blog' }],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: `${normalizedCategory} Articles | GitTool Blog`,
      description: `Browse GitTool blog articles about ${normalizedCategory}.`,
      images: ['/og-image.png'],
    },
  };
}

export default async function BlogCategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const normalizedCategory = decodeURIComponent(category).toLowerCase();
  const posts = getAllPosts();
  const categories = getAllCategories(posts);
  const filteredPosts = posts.filter((post) =>
    (post.categories || []).some((entry) => entry.toLowerCase() === normalizedCategory),
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16 text-foreground">
      <Link href="/blog" className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> All Articles
      </Link>

      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-semibold capitalize tracking-tight text-foreground md:text-4xl">
          Articles about <span className="text-primary">{normalizedCategory}</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {filteredPosts.length} {filteredPosts.length === 1 ? 'article' : 'articles'} found
        </p>
      </div>

      <div className="mt-8">
        <CategorySelect categories={categories} currentCategory={normalizedCategory} />
      </div>

      <div className="mt-4">
        <BlogPostList posts={filteredPosts} />
      </div>

      <section className="mt-16">
        <NewsletterSignup
          title={`Stay updated on ${normalizedCategory} articles`}
          description="New articles, Git tips, and workflow guides delivered to your inbox."
        />
      </section>
    </main>
  );
}
