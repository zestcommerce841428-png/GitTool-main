import type { Metadata } from 'next';
import Link from 'next/link';
import { learnGuides } from '@/data/learnGuides';

export const metadata: Metadata = {
  title: 'Learn Git Online Free: Tutorials for Beginners | GitTool',
  description:
    'Learn Git with beginner-friendly tutorials on commands, branching, merge conflicts, stash, and workflow fundamentals.',
  keywords: [
    'learn git',
    'git tutorial for beginners',
    'git commands guide',
    'git branching tutorial',
    'how to use git',
    'git merge conflicts',
    'git stash tutorial',
  ],
  alternates: { canonical: 'https://gittool.dev/learn' },
  openGraph: {
    type: 'website',
    url: 'https://gittool.dev/learn',
    title: 'Learn Git Online Free: Tutorials for Beginners | GitTool',
    description:
      'Step-by-step Git tutorials for beginners and intermediate developers — commands, branching, conflicts, and workflows.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'GitTool Learn Hub' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Learn Git Online Free | GitTool',
    description: 'Step-by-step Git tutorials for beginners and intermediate developers.',
    images: ['/og-image.png'],
  },
};

export default function LearnPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16 text-foreground">
      <h1 className="text-4xl font-semibold tracking-tight">Learn Git</h1>
      <p className="mt-3 max-w-3xl text-muted-foreground">
        Step-by-step Git learning paths for beginners and intermediate developers.
      </p>

      <section className="mt-10 grid gap-4">
        {learnGuides.map((guide) => (
          <article key={guide.slug} className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Updated {guide.updatedAt}</p>
            <h2 className="mt-2 text-xl font-semibold">
              <Link href={`/learn/${guide.slug}`} className="hover:text-primary">
                {guide.title}
              </Link>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{guide.excerpt}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
