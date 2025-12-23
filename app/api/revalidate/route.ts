import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

/**
 * On-demand revalidation API
 *
 * Usage:
 * POST /api/revalidate
 * Headers: { "Authorization": "Bearer YOUR_REVALIDATE_SECRET" }
 * Body: { "path": "/sites/example-com" } or { "tag": "products" }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify the secret token
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token || token !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { path, tag } = body;

    if (!path && !tag) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either "path" or "tag" must be provided',
        },
        { status: 400 },
      );
    }

    // Revalidate by path
    if (path) {
      revalidatePath(path);
      return NextResponse.json({
        success: true,
        message: `Revalidated path: ${path}`,
        revalidated: true,
        now: Date.now(),
      });
    }

    // Revalidate by tag
    if (tag) {
      revalidateTag(tag, "force");
      return NextResponse.json({
        success: true,
        message: `Revalidated tag: ${tag}`,
        revalidated: true,
        now: Date.now(),
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 },
    );
  } catch (error) {
    console.error("[Revalidate API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
