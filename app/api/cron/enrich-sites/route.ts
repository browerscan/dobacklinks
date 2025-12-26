import { NextRequest, NextResponse } from "next/server";
import { getEnrichmentService } from "@/lib/services/enrichment-service";
import { verifyHMACSignature, extractHMACSignature } from "@/lib/security/hmac-auth";
import { env } from "@/lib/env";

export const maxDuration = 60; // 60 seconds timeout
export const dynamic = "force-dynamic";

/**
 * Manual enrichment endpoint (formerly cron-based)
 *
 * DEPRECATED: Automatic cron scheduling has been removed.
 * This endpoint is now for manual triggers only.
 * Use /dashboard/enrichment for UI-based management.
 *
 * Security: Uses HMAC-SHA256 authentication with replay attack protection
 */
export async function GET(request: NextRequest) {
  // Verify HMAC signature
  const authHeader = request.headers.get("authorization");
  const timestampHeader = request.headers.get("x-timestamp");
  const cronSecret = env.CRON_SECRET;

  // Extract signature from Authorization header
  const signature = extractHMACSignature(authHeader);
  if (!signature) {
    console.warn("⚠️ Missing or invalid Authorization header");
    return NextResponse.json(
      {
        error: 'Missing or invalid Authorization header. Expected: "HMAC <signature>"',
      },
      { status: 401 },
    );
  }

  // Parse timestamp
  const timestamp = timestampHeader ? parseInt(timestampHeader, 10) : null;
  if (!timestamp || isNaN(timestamp)) {
    console.warn("⚠️ Missing or invalid X-Timestamp header");
    return NextResponse.json({ error: "Missing or invalid X-Timestamp header" }, { status: 401 });
  }

  // Verify HMAC signature
  const { pathname } = new URL(request.url);
  const verification = verifyHMACSignature(
    signature,
    {
      method: "GET",
      path: pathname,
      timestamp,
    },
    cronSecret,
    { maxAgeSeconds: 300 }, // 5 minutes replay protection
  );

  if (!verification.valid) {
    console.warn(`⚠️ HMAC verification failed: ${verification.error}`);
    return NextResponse.json(
      { error: `Authentication failed: ${verification.error}` },
      { status: 401 },
    );
  }

  console.log("🔄 Starting manual enrichment (API trigger)...");
  console.log(`📝 Request authenticated via HMAC signature`);

  try {
    const service = getEnrichmentService();
    const result = await service.enrichProducts("pending", undefined, 100);

    if (result.success) {
      console.log("✅ Manual enrichment complete");
      return NextResponse.json({
        success: true,
        enriched: result.stats.enriched,
        failed: result.stats.failed,
        total: result.stats.total,
        duration: result.stats.duration,
        notice:
          "This endpoint is for manual triggers only. Use /dashboard/enrichment for UI-based management.",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Enrichment failed",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("❌ Enrichment failed:", error);
    return NextResponse.json(
      {
        error: "Enrichment failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Also support POST for manual trigger (uses same HMAC auth as GET)
export async function POST(request: NextRequest) {
  // POST requests might have a body, so we need to handle HMAC verification differently
  const authHeader = request.headers.get("authorization");
  const timestampHeader = request.headers.get("x-timestamp");
  const cronSecret = env.CRON_SECRET;

  const signature = extractHMACSignature(authHeader);
  if (!signature) {
    console.warn("⚠️ Missing or invalid Authorization header");
    return NextResponse.json(
      {
        error: 'Missing or invalid Authorization header. Expected: "HMAC <signature>"',
      },
      { status: 401 },
    );
  }

  const timestamp = timestampHeader ? parseInt(timestampHeader, 10) : null;
  if (!timestamp || isNaN(timestamp)) {
    console.warn("⚠️ Missing or invalid X-Timestamp header");
    return NextResponse.json({ error: "Missing or invalid X-Timestamp header" }, { status: 401 });
  }

  // Read body if present
  let body = "";
  try {
    const text = await request.text();
    if (text) {
      body = text;
    }
  } catch (error) {
    // No body or read error, continue with empty body
  }

  // Verify HMAC signature
  const { pathname } = new URL(request.url);
  const verification = verifyHMACSignature(
    signature,
    {
      method: "POST",
      path: pathname,
      timestamp,
      body,
    },
    cronSecret,
    { maxAgeSeconds: 300 },
  );

  if (!verification.valid) {
    console.warn(`⚠️ HMAC verification failed: ${verification.error}`);
    return NextResponse.json(
      { error: `Authentication failed: ${verification.error}` },
      { status: 401 },
    );
  }

  console.log("🔄 Starting manual enrichment (POST trigger)...");
  console.log(`📝 Request authenticated via HMAC signature`);

  try {
    const service = getEnrichmentService();
    const result = await service.enrichProducts("pending", undefined, 100);

    if (result.success) {
      console.log("✅ Manual enrichment complete");
      return NextResponse.json({
        success: true,
        enriched: result.stats.enriched,
        failed: result.stats.failed,
        total: result.stats.total,
        duration: result.stats.duration,
        notice:
          "This endpoint is for manual triggers only. Use /dashboard/enrichment for UI-based management.",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Enrichment failed",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("❌ Enrichment failed:", error);
    return NextResponse.json(
      {
        error: "Enrichment failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
