import { NextRequest } from "next/server";
import { postActionSchema } from "@/app/(protected)/dashboard/(admin)/blog/schema";
import { verifyHMACSignature, extractHMACSignature } from "@/lib/security/hmac-auth";
import { env } from "@/lib/env";
import { db } from "@/lib/db";
import {
  posts as postsSchema,
  postTags as postTagsSchema,
  user as usersSchema,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  withApiHandler,
  apiSuccessResponse,
  unauthorized,
  badRequest,
  notFound,
  ConflictError,
  DatabaseError,
} from "@/lib/api-wrapper";
import { logger } from "@/lib/logger";
import { reportMessage } from "@/lib/error-handler";

export const maxDuration = 60; // 60 seconds timeout
export const dynamic = "force-dynamic";

/**
 * Blog Post API - Create new blog posts via API
 *
 * Security: Uses HMAC-SHA256 authentication with replay attack protection
 * This endpoint bypasses the admin authentication requirement since it's secured by HMAC
 *
 * Usage:
 * POST /api/blogs
 * Headers:
 *   - Authorization: HMAC <signature>
 *   - X-Timestamp: <unix_timestamp_ms>
 *   - Content-Type: application/json
 *
 * Body: PostActionInput (see schema.ts)
 */
export const POST = withApiHandler(
  {
    requireAuth: false, // Using HMAC auth instead
    log: true,
  },
  async (request, { requestId }) => {
    // 1. Verify HMAC signature
    const authHeader = request.headers.get("authorization");
    const timestampHeader = request.headers.get("x-timestamp");
    const secret = env.CRON_SECRET;

    // Extract signature from Authorization header
    const signature = extractHMACSignature(authHeader);
    if (!signature) {
      reportMessage("[/api/blogs] Missing or invalid Authorization header", "warning", {
        requestId,
      });
      throw unauthorized(
        'Missing or invalid Authorization header. Expected: "HMAC <signature>"',
        "HMAC_REQUIRED",
      );
    }

    // Parse timestamp
    const timestamp = timestampHeader ? parseInt(timestampHeader, 10) : null;
    if (!timestamp || isNaN(timestamp)) {
      reportMessage("[/api/blogs] Missing or invalid X-Timestamp header", "warning", { requestId });
      throw unauthorized("Missing or invalid X-Timestamp header", "TIMESTAMP_REQUIRED");
    }

    // Read body for HMAC verification
    let bodyText = "";
    try {
      bodyText = await request.text();
    } catch (error) {
      logger.error("[/api/blogs] Failed to read request body", { requestId }, error as Error);
      throw badRequest("Failed to read request body", "BODY_READ_FAILED");
    }

    // Verify HMAC signature
    const { pathname } = new URL(request.url);
    const verification = verifyHMACSignature(
      signature,
      {
        method: "POST",
        path: pathname,
        timestamp,
        body: bodyText,
      },
      secret,
      { maxAgeSeconds: 300 }, // 5 minutes replay protection
    );

    if (!verification.valid) {
      reportMessage(`[/api/blogs] HMAC verification failed: ${verification.error}`, "warning", {
        requestId,
        timestamp,
        path: pathname,
      });
      throw unauthorized(`Authentication failed: ${verification.error}`, "HMAC_INVALID");
    }

    logger.info("[/api/blogs] Request authenticated via HMAC signature", { requestId });

    // 2. Parse and validate request body
    let requestData;
    try {
      requestData = JSON.parse(bodyText);
    } catch (error) {
      logger.warn("[/api/blogs] Invalid JSON in request body", { requestId });
      throw badRequest("Invalid JSON in request body", "JSON_PARSE_FAILED");
    }

    const validatedFields = postActionSchema.safeParse(requestData);
    if (!validatedFields.success) {
      reportMessage("[/api/blogs] Validation error", "warning", {
        requestId,
        errors: validatedFields.error.flatten().fieldErrors,
      });
      throw badRequest("Invalid input data", "VALIDATION_FAILED");
    }

    // 3. Get or create system user as author
    let systemUser;
    const existingSystemUsers = await db
      .select()
      .from(usersSchema)
      .where(eq(usersSchema.email, "system@dobacklinks.com"))
      .limit(1);

    if (existingSystemUsers.length > 0) {
      systemUser = existingSystemUsers[0];
    } else {
      // Create system user if it doesn't exist
      const newUsers = await db
        .insert(usersSchema)
        .values({
          email: "system@dobacklinks.com",
          name: "System",
          role: "admin",
          emailVerified: true,
        })
        .returning();

      if (!newUsers || newUsers.length === 0) {
        throw new DatabaseError("Failed to create system user", "create user");
      }
      systemUser = newUsers[0];
      logger.info("[/api/blogs] Created system user", { requestId });
    }

    const authorId = systemUser.id;

    // 4. Create post
    const { tags: inputTags, ...postData } = validatedFields.data;
    const finalFeaturedImageUrl =
      postData.featuredImageUrl === "" ? null : postData.featuredImageUrl;

    try {
      const newPost = await db
        .insert(postsSchema)
        .values({
          ...postData,
          authorId: authorId,
          featuredImageUrl: finalFeaturedImageUrl,
          content: postData.content || null,
          description: postData.description || null,
          isPinned: postData.isPinned || false,
        })
        .returning({ id: postsSchema.id, slug: postsSchema.slug });

      if (!newPost || newPost.length === 0 || !newPost[0].id) {
        throw new DatabaseError("Failed to create post: No ID returned", "insert post");
      }

      const postId = newPost[0].id;
      const postSlug = newPost[0].slug;

      // 5. Associate tags if provided
      if (inputTags && inputTags.length > 0) {
        const tagAssociations = inputTags.map((tag) => ({
          postId: postId,
          tagId: tag.id,
        }));
        await db.insert(postTagsSchema).values(tagAssociations);
        logger.info("[/api/blogs] Associated tags with post", {
          requestId,
          postId,
          tagCount: inputTags.length,
        });
      }

      // 6. Revalidate paths if published
      if (postData.status === "published") {
        revalidatePath(`/blog`);
        revalidatePath(`/blog/${postSlug}`);
      }

      logger.info("[/api/blogs] Post created successfully", {
        requestId,
        postId,
        slug: postSlug,
        status: postData.status,
      });

      return apiSuccessResponse(
        {
          postId: postId,
          slug: postSlug,
        },
        201,
      );
    } catch (error) {
      // Handle duplicate slug error
      if ((error as any)?.cause?.code === "23505") {
        throw new ConflictError(`Slug '${validatedFields.data.slug}' already exists`);
      }

      // Re-throw if already a known error type
      if (error instanceof ConflictError || error instanceof DatabaseError) {
        throw error;
      }

      // Wrap unknown errors
      throw new DatabaseError(
        "Failed to create post",
        "insert post",
        error instanceof Error ? error : undefined,
      );
    }
  },
);
