'use client';

import React from 'react';
import BlogPostCard from './BlogPostCard';

export default function BlogPostList({ posts }: any) {
  if (!posts || posts.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No posts found in this category.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {posts.map((post: any) => (
        <BlogPostCard key={post.slug} post={post} />
      ))}
    </div>
  );
}

