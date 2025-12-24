import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  verifyHMACSignature,
  extractHMACSignature,
} from "@/lib/security/hmac-auth";
import { env } from "@/lib/env";

/**
 * On-demand revalidation API with HMAC authentication
 *
 * Usage:
 * POST /api/revalidate
 * Headers: {
 *   "Authorization": "HMAC <signature>",
 *   "X-Timestamp": "<unix_timestamp_ms>"
 * }
 * Body: { "path": "/sites/example-com" } or { "tag": "products" }
 *
 * Signature generation:
 * canonicalString = "POST|/api/revalidate|<timestamp>|<body_json>"
 * signature = HMAC-SHA256(canonicalString, CRON_SECRET)
 */
export async function POST(request: NextRequest) {
  try {
    // Extract signature and timestamp from headers
    const authHeader = request.headers.get("authorization");
    const signature = extractHMACSignature(authHeader);
    const timestampHeader = request.headers.get("x-timestamp");
    const timestamp = timestampHeader ? parseInt(timestampHeader, 10) : NaN;

    // Verify HMAC signature
    if (!signature || isNaN(timestamp)) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing authentication headers",
        },
        { status: 401 },
      );
    }

    // Read body for signature verification
    const body = await request.json();
    const bodyString = JSON.stringify(body);

    // Verify signature using CRON_SECRET
    const { valid, error } = verifyHMACSignature(
      signature,
      {
        method: "POST",
        path: "/api/revalidate",
        timestamp,
        body: bodyString,
      },
      env.CRON_SECRET,
      { maxAgeSeconds: 300 }, // 5 minutes
    );

    if (!valid) {
      console.error("[Revalidate API] HMAC verification failed:", error);
      return NextResponse.json(
        { success: false, error: "Unauthorized", details: error },
        { status: 401 },
      );
    }

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
