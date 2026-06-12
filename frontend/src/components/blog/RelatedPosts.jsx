'use client';

import React from 'react';
import Link from 'next/link';

export default function RelatedPosts({ posts }) {
  if (!posts || posts.length === 0) return null;

  return (
    <section>
      {/* Header */}
      <div className="mb-10 text-center">
        <span className="inline-flex items-center rounded-full border border-border bg-muted/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
          Similar Posts
        </span>
        <h2 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-foreground md:text-3xl">
          Here are some other articles
          <br />
          you might find interesting.
        </h2>
      </div>

      {/* Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:-translate-y-1 hover:border-white/15 hover:shadow-lg"
          >
            {/* Gradient thumbnail */}
            <div
              className={`h-44 w-full shrink-0 bg-linear-to-br ${post.gradient || 'from-violet-600 to-indigo-700'}`}
            />

            {/* Text */}
            <div className="flex flex-1 flex-col gap-2 p-5">
              <h3 className="text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                {post.title}
              </h3>
              <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                {post.excerpt}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

