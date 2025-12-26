/**
 * Edge-compatible blog post fetching
 *
 * Strategy:
 * - Remove all fs/path imports (not available in Workers)
 * - Fetch from database only
 * - Maintain backward compatibility with BlogPost type
 */

import {
  listPublishedPostsAction,
  getPublishedPostBySlugAction,
  PublicPost,
  PublicPostWithContent,
} from "@/actions/blogs/posts";
import { BlogPost } from "@/types/blog";
import dayjs from "dayjs";

// ============================================================================
// Helper: Map server post to BlogPost type
// ============================================================================
function mapServerPostToBlogPost(serverPost: PublicPostWithContent): BlogPost;
function mapServerPostToBlogPost(serverPost: PublicPost): BlogPost;
function mapServerPostToBlogPost(serverPost: PublicPostWithContent | PublicPost): BlogPost {
  return {
    title: serverPost.title,
    description: serverPost.description ?? "",
    featuredImageUrl: serverPost.featuredImageUrl ?? "",
    slug: serverPost.slug,
    tags: serverPost.tags ?? "",
    publishedAt:
      (serverPost.publishedAt && dayjs(serverPost.publishedAt).toDate()) ||
      new Date(serverPost.createdAt),
    status: serverPost.status ?? "published",
    isPinned: serverPost.isPinned ?? false,
    content: "content" in serverPost ? (serverPost.content ?? "") : "",
    visibility: serverPost.visibility,
  };
}

// ============================================================================
// Get all published posts
// ============================================================================
export async function getPosts(): Promise<{ posts: BlogPost[] }> {
  try {
    // Fetch from database
    const result = await listPublishedPostsAction({
      pageIndex: 0,
      pageSize: 1000, // Get all posts
    });

    if (!result.success || !result.data?.posts) {
      console.warn("Failed to fetch posts from database:", result.error);
      return { posts: [] };
    }

    // Map server posts to BlogPost type
    const posts = result.data.posts.map(mapServerPostToBlogPost);

    // Sort by isPinned and publishedAt (same logic as original)
    posts.sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0);
      }
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    return { posts };
  } catch (error) {
    console.error("Error fetching posts:", error);
    return { posts: [] };
  }
}

// ============================================================================
// Get single post by slug
// ============================================================================
export async function getPostBySlug(
  slug: string,
): Promise<{ post: BlogPost | null; error?: string; errorCode?: string }> {
  try {
    // Normalize slug
    const normalizedSlug = slug.replace(/^\//, "").replace(/\/$/, "");

    // Fetch from database
    const serverResult = await getPublishedPostBySlugAction({
      slug: normalizedSlug,
    });

    if (serverResult.success && serverResult.data?.post) {
      return {
        post: mapServerPostToBlogPost(serverResult.data.post),
        error: undefined,
        errorCode: serverResult.customCode,
      };
    } else if (!serverResult.success) {
      return {
        post: null,
        error: serverResult.error,
        errorCode: serverResult.customCode,
      };
    } else {
      return {
        post: null,
        error: "Post not found",
        errorCode: "POST_NOT_FOUND",
      };
    }
  } catch (error) {
    console.error("Error fetching post by slug:", error);
    return {
      post: null,
      error: error instanceof Error ? error.message : "Unknown error",
      errorCode: "UNKNOWN_ERROR",
    };
  }
}

// ============================================================================
// Export for backward compatibility
// ============================================================================
export { mapServerPostToBlogPost };
