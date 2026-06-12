import type { MetadataRoute } from 'next';
import { getAllPosts, getAllCategories } from '@/lib/content';
import { learnGuides } from '@/data/learnGuides';

const BASE_URL = 'https://gittool.dev';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/learn`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/changelog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  const blogPosts = getAllPosts().map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt ?? post.publishedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const blogCategories = getAllCategories().map((category) => ({
    url: `${BASE_URL}/blog/category/${encodeURIComponent(category.toLowerCase())}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  const learnPages = learnGuides.map((guide) => ({
    url: `${BASE_URL}/learn/${guide.slug}`,
    lastModified: guide.updatedAt ?? now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [...staticPages, ...blogPosts, ...blogCategories, ...learnPages];
}
