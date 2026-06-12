'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CategorySelect({ categories, currentCategory }) {
  const router = useRouter();

  const handleChange = (e) => {
    const val = e.target.value;
    if (val === '') router.push('/blog');
    else router.push(`/blog/category/${val}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 py-4">
      <Link
        href="/blog"
        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
          !currentCategory
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
        }`}
      >
        All
      </Link>

      {categories.map((cat) => (
        <Link
          key={cat}
          href={`/blog/category/${cat}`}
          className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors ${
            currentCategory === cat
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
          }`}
        >
          {cat}
        </Link>
      ))}
    </div>
  );
}

