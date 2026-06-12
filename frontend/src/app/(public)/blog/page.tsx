import type { Metadata } from 'next';
import FeaturedBlogCard from '@/components/blog/FeaturedBlogCard';
import BlogPostList from '@/components/blog/BlogPostList';
import CategorySelect from '@/components/blog/CategorySelect';
import NewsletterSignup from '@/components/blog/NewsletterSignup';
import { getAllCategories, getAllPosts } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Git Blog: Best Practices, Tips, and Workflow Guides | GitTool',
  description:
    'Read GitTool blog guides on git best practices, workflow strategies, commit messages, CI/CD, and developer productivity.',
  keywords: [
    'git best practices',
    'git tips and tricks',
    'common git mistakes to avoid',
    'git workflow for teams best practices',
    'how to write better git commit messages',
    'gitflow vs trunk based development',
    'git hooks tutorial and use cases',
    'monorepo vs multirepo git strategy',
    'protecting main branch in github',
  ],
  alternates: { canonical: 'https://gittool.dev/blog' },
  openGraph: {
    type: 'website',
    siteName: 'GitTool',
    title: 'Git Blog | GitTool',
    description:
      'Practical guides for teams and solo developers working with Git and GitHub.',
    images: [{ url: 'https://gittool.dev/og-image.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Git Blog | GitTool',
    description:
      'Practical guides for teams and solo developers working with Git and GitHub.',
    images: ['https://gittool.dev/og-image.png'],
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();
  const categories = getAllCategories(posts);
  const featuredPosts = posts.slice(0, 3);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16 text-foreground">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">Git Blog</h1>
        <p className="mt-3 text-base text-muted-foreground">
          Practical guides for teams and solo developers working with Git and GitHub.
        </p>
      </div>

      <section className="mt-12">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Featured</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredPosts.map((post) => (
            <FeaturedBlogCard key={post.slug} post={post} />
          ))}
        </div>
      </section>

      <section className="mt-14">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">All Articles</h2>
          <span className="text-xs text-muted-foreground">{posts.length} posts</span>
        </div>
        <CategorySelect categories={categories} currentCategory="" />
        <BlogPostList posts={posts} />
      </section>

      <section className="mt-16">
        <NewsletterSignup
          title="Stay updated on Git workflows"
          description="New articles, Git tips, and workflow guides delivered to your inbox. No spam, unsubscribe any time."
        />
      </section>
    </main>
  );
}
