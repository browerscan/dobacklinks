import { NextRequest, NextResponse } from "next/server";
import { postActionSchema } from "@/app/(protected)/dashboard/(admin)/blog/schema";
import {
  verifyHMACSignature,
  extractHMACSignature,
} from "@/lib/security/hmac-auth";
import { env } from "@/lib/env";
import { db } from "@/lib/db";
import {
  posts as postsSchema,
  postTags as postTagsSchema,
  user as usersSchema,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getErrorMessage } from "@/lib/error-utils";

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
export async function POST(request: NextRequest) {
  // 1. Verify HMAC signature
  const authHeader = request.headers.get("authorization");
  const timestampHeader = request.headers.get("x-timestamp");
  const secret = env.CRON_SECRET;

  // Extract signature from Authorization header
  const signature = extractHMACSignature(authHeader);
  if (!signature) {
    console.warn("⚠️ [/api/blogs] Missing or invalid Authorization header");
    return NextResponse.json(
      {
        success: false,
        error:
          'Missing or invalid Authorization header. Expected: "HMAC <signature>"',
      },
      { status: 401 },
    );
  }

  // Parse timestamp
  const timestamp = timestampHeader ? parseInt(timestampHeader, 10) : null;
  if (!timestamp || isNaN(timestamp)) {
    console.warn("⚠️ [/api/blogs] Missing or invalid X-Timestamp header");
    return NextResponse.json(
      {
        success: false,
        error: "Missing or invalid X-Timestamp header",
      },
      { status: 401 },
    );
  }

  // Read body for HMAC verification
  let bodyText = "";
  try {
    bodyText = await request.text();
  } catch (error) {
    console.error("⚠️ [/api/blogs] Failed to read request body:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to read request body",
      },
      { status: 400 },
    );
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
    console.warn(
      `⚠️ [/api/blogs] HMAC verification failed: ${verification.error}`,
    );
    return NextResponse.json(
      {
        success: false,
        error: `Authentication failed: ${verification.error}`,
      },
      { status: 401 },
    );
  }

  console.log("📝 [/api/blogs] Request authenticated via HMAC signature");

  // 2. Parse and validate request body
  let requestData;
  try {
    requestData = JSON.parse(bodyText);
  } catch (error) {
    console.error("⚠️ [/api/blogs] Invalid JSON in request body:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Invalid JSON in request body",
      },
      { status: 400 },
    );
  }

  const validatedFields = postActionSchema.safeParse(requestData);
  if (!validatedFields.success) {
    console.error(
      "⚠️ [/api/blogs] Validation error:",
      validatedFields.error.flatten().fieldErrors,
    );
    return NextResponse.json(
      {
        success: false,
        error: "Invalid input data",
        details: validatedFields.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  // 3. Get or create system user as author
  try {
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
        throw new Error("Failed to create system user");
      }
      systemUser = newUsers[0];
      console.log("✅ [/api/blogs] Created system user");
    }

    const authorId = systemUser.id;

    // 4. Create post
    const { tags: inputTags, ...postData } = validatedFields.data;
    const finalFeaturedImageUrl =
      postData.featuredImageUrl === "" ? null : postData.featuredImageUrl;

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
      throw new Error("Failed to create post: No ID returned");
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
      console.log(`✅ [/api/blogs] Associated ${inputTags.length} tags`);
    }

    // 6. Revalidate paths if published
    if (postData.status === "published") {
      revalidatePath(`/blog`);
      revalidatePath(`/blog/${postSlug}`);
      console.log(`✅ [/api/blog] Revalidated paths for published post`);
    }

    console.log(
      `✅ [/api/blogs] Post created successfully: ${postId} (${postSlug})`,
    );

    return NextResponse.json({
      success: true,
      data: {
        postId: postId,
        slug: postSlug,
      },
    });
  } catch (error) {
    console.error("❌ [/api/blogs] Create post failed:", error);
    const errorMessage = getErrorMessage(error);

    // Handle duplicate slug error
    if ((error as any)?.cause?.code === "23505") {
      return NextResponse.json(
        {
          success: false,
          error: `Slug '${validatedFields.data.slug}' already exists`,
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create post",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
