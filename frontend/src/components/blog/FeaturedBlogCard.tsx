'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, Calendar } from 'lucide-react';

export default function FeaturedBlogCard({ post, className = '' }: any) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:shadow-2xl ${className}`}
    >
      {/* Gradient banner */}
      <div
        className={`relative h-44 w-full bg-linear-to-br ${post.gradient || 'from-violet-600 to-indigo-700'} overflow-hidden`}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        {/* Category pills */}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
          {(post.categories || []).slice(0, 2).map((cat: any) => (
            <span
              key={cat}
              className="inline-flex items-center rounded-full border border-white/30 bg-black/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white backdrop-blur-sm"
            >
              #{cat}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-sm font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
          {post.title}
        </h3>
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {post.excerpt}
        </p>
        <div className="mt-auto flex items-center gap-4 pt-3">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Calendar size={11} />
            {post.publishedAt}
          </span>
          {post.readingTime && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock size={11} />
              {post.readingTime}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

