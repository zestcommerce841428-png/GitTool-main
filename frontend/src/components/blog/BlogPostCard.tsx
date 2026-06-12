'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, Calendar, ArrowRight } from 'lucide-react';

export default function BlogPostCard({ post }: any) {
  return (
    <article className="group flex gap-5 rounded-xl border border-border bg-card px-5 py-4 transition-all duration-200 hover:border-white/15 hover:bg-card/80">
      {/* Color accent bar */}
      <div
        className={`hidden w-1 shrink-0 self-stretch rounded-full bg-linear-to-b ${post.gradient || 'from-violet-500 to-indigo-600'} sm:block`}
      />

      <div className="flex flex-1 flex-col gap-1.5">
        {/* Categories */}
        <div className="flex flex-wrap gap-1.5">
          {(post.categories || []).map((cat: any) => (
            <Link
              key={cat}
              href={`/blog/category/${cat}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              #{cat}
            </Link>
          ))}
        </div>

        {/* Title */}
        <h2 className="text-base font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h2>

        {/* Excerpt */}
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {post.excerpt}
        </p>

        {/* Meta + CTA */}
        <div className="mt-1 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar size={12} />
              {post.publishedAt}
            </span>
            {post.readingTime && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock size={12} />
                {post.readingTime}
              </span>
            )}
          </div>
          <Link
            href={`/blog/${post.slug}`}
            className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100"
          >
            Read <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </article>
  );
}

