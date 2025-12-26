import { listPublishedPostsAction } from "@/actions/blogs/posts";
import { getActiveCategories } from "@/actions/categories/user";
import { siteConfig } from "@/config/site";
import { getPosts } from "@/lib/getBlogs";
import { MetadataRoute } from "next";

const siteUrl = siteConfig.url;

type ChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never"
  | undefined;

/**
 * Main sitemap for dobacklinks.com
 * Includes: static pages, blog posts, and category pages
 *
 * Product pages (9700+ items) are in a separate sitemap at /sitemap-products.xml
 * This keeps the main sitemap lightweight and within size limits
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages with priorities
  const staticPages = [
    { path: "", priority: 1.0, changeFrequency: "daily" as ChangeFrequency },
    {
      path: "/services",
      priority: 0.9,
      changeFrequency: "weekly" as ChangeFrequency,
    },
    {
      path: "/categories",
      priority: 0.9,
      changeFrequency: "daily" as ChangeFrequency,
    },
    {
      path: "/about",
      priority: 0.7,
      changeFrequency: "monthly" as ChangeFrequency,
    },
    {
      path: "/submit",
      priority: 0.8,
      changeFrequency: "weekly" as ChangeFrequency,
    },
    {
      path: "/blog",
      priority: 0.8,
      changeFrequency: "daily" as ChangeFrequency,
    },
    {
      path: "/privacy-policy",
      priority: 0.3,
      changeFrequency: "yearly" as ChangeFrequency,
    },
    {
      path: "/terms-of-service",
      priority: 0.3,
      changeFrequency: "yearly" as ChangeFrequency,
    },
  ];

  const pages = staticPages.map((page) => ({
    url: `${siteUrl}${page.path}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  const allBlogSitemapEntries: MetadataRoute.Sitemap = [];

  const { posts: localPosts } = await getPosts();
  localPosts
    .filter((post) => post.slug && post.status !== "draft")
    .forEach((post) => {
      const slugPart = post.slug.replace(/^\//, "").replace(/^blog\//, "");
      if (slugPart) {
        allBlogSitemapEntries.push({
          url: `${siteUrl}/blog/${slugPart}`,
          lastModified: post.metadata?.updatedAt || post.publishedAt || new Date(),
          changeFrequency: "weekly" as ChangeFrequency,
          priority: 0.7,
        });
      }
    });

  const serverResult = await listPublishedPostsAction({
    pageSize: 1000,
    visibility: "public",
  });
  if (serverResult.success && serverResult.data?.posts) {
    serverResult.data.posts.forEach((post) => {
      const slugPart = post.slug?.replace(/^\//, "").replace(/^blog\//, "");
      if (slugPart) {
        allBlogSitemapEntries.push({
          url: `${siteUrl}/blog/${slugPart}`,
          lastModified: post.publishedAt || new Date(),
          changeFrequency: "weekly" as ChangeFrequency,
          priority: 0.7,
        });
      }
    });
  }

  const uniqueBlogPostEntries = Array.from(
    new Map(allBlogSitemapEntries.map((entry) => [entry.url, entry])).values(),
  );

  // Category pages
  const categoryEntries: MetadataRoute.Sitemap = [];
  const categoriesResult = await getActiveCategories();
  if (categoriesResult.success && categoriesResult.data) {
    categoriesResult.data.forEach((category) => {
      if (category.slug) {
        categoryEntries.push({
          url: `${siteUrl}/categories/${category.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as ChangeFrequency,
          priority: 0.8,
        });
      }
    });
  }

  // Note: Product pages (9700+ items) are served from /sitemap-products.xml
  // This keeps the main sitemap file small and fast-loading

  return [...pages, ...uniqueBlogPostEntries, ...categoryEntries];
}
