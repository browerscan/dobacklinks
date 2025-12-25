import { db } from "@/lib/db";
import { products, productCategories, categories } from "@/lib/db/schema";
import { and, desc, eq, ilike, or, sql, asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIPFromRequest } from "@/lib/upstash";

export const dynamic = "force-dynamic";

// Rate limit: 60 requests per minute per IP
const RATE_LIMIT_CONFIG = {
  prefix: "search-api",
  maxRequests: 60,
  window: "1 m",
};

interface SearchParams {
  q?: string;
  niche?: string;
  linkType?: "dofollow" | "nofollow";
  minDr?: number;
  maxDr?: number;
  minDa?: number;
  maxDa?: number;
  minTraffic?: number;
  maxTraffic?: number;
  maxSpamScore?: number;
  googleNews?: boolean;
  isFeatured?: boolean;
  isVerified?: boolean;
  sortBy?: "dr" | "da" | "traffic" | "relevance";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

function parseOptionalInt(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseBooleanFlag(value: string | null): boolean | undefined {
  if (!value) return undefined;
  if (value === "1" || value.toLowerCase() === "true") return true;
  if (value === "0" || value.toLowerCase() === "false") return false;
  return undefined;
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIP = getClientIPFromRequest(request);
    const isAllowed = await checkRateLimit(clientIP, RATE_LIMIT_CONFIG);

    if (!isAllowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded. Please try again later.",
        },
        { status: 429 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const linkTypeParam = searchParams.get("linkType");

    const googleNewsFlag = parseBooleanFlag(searchParams.get("googleNews"));
    const featuredFlag = parseBooleanFlag(searchParams.get("featured"));
    const verifiedFlag = parseBooleanFlag(searchParams.get("verified"));

    const params: SearchParams = {
      q: searchParams.get("q") || undefined,
      niche: searchParams.get("niche") || undefined,
      linkType:
        linkTypeParam === "dofollow" || linkTypeParam === "nofollow"
          ? linkTypeParam
          : undefined,
      minDr: parseOptionalInt(searchParams.get("minDr")),
      maxDr: parseOptionalInt(searchParams.get("maxDr")),
      minDa: parseOptionalInt(searchParams.get("minDa")),
      maxDa: parseOptionalInt(searchParams.get("maxDa")),
      minTraffic: parseOptionalInt(searchParams.get("minTraffic")),
      maxTraffic: parseOptionalInt(searchParams.get("maxTraffic")),
      maxSpamScore: parseOptionalInt(searchParams.get("maxSpamScore")),
      googleNews: googleNewsFlag === true ? true : undefined,
      isFeatured: featuredFlag === true ? true : undefined,
      isVerified: verifiedFlag === true ? true : undefined,
      sortBy:
        (searchParams.get("sortBy") as SearchParams["sortBy"]) || "relevance",
      sortOrder:
        (searchParams.get("sortOrder") as SearchParams["sortOrder"]) || "desc",
      page: Math.max(parseOptionalInt(searchParams.get("page")) || 1, 1),
      limit: Math.min(Math.max(parseOptionalInt(searchParams.get("limit")) || 20, 1), 50),
    };

    // Build WHERE conditions
    const conditions = [eq(products.status, "live")];

    // Text search on name, tagline, description, url, niche
    if (params.q && params.q.trim()) {
      const searchTerm = `%${params.q.trim()}%`;
      conditions.push(
        or(
          ilike(products.name, searchTerm),
          ilike(products.tagline, searchTerm),
          ilike(products.description, searchTerm),
          ilike(products.url, searchTerm),
          ilike(products.niche, searchTerm),
        )!,
      );
    }

    // Niche filter
    if (params.niche) {
      conditions.push(ilike(products.niche, `%${params.niche}%`));
    }

    // Link type filter
    if (params.linkType) {
      conditions.push(eq(products.linkType, params.linkType));
    }

    // Verified / Featured / Google News filters (logged-in UX)
    if (params.googleNews) {
      conditions.push(eq(products.googleNews, true));
    }
    if (params.isFeatured) {
      conditions.push(eq(products.isFeatured, true));
    }
    if (params.isVerified) {
      conditions.push(eq(products.isVerified, true));
    }

    // DR range filter
    if (params.minDr !== undefined) {
      conditions.push(sql`${products.dr} >= ${params.minDr}`);
    }
    if (params.maxDr !== undefined) {
      conditions.push(sql`${products.dr} <= ${params.maxDr}`);
    }

    // DA range filter
    if (params.minDa !== undefined) {
      conditions.push(sql`${products.da} >= ${params.minDa}`);
    }
    if (params.maxDa !== undefined) {
      conditions.push(sql`${products.da} <= ${params.maxDa}`);
    }

    // Monthly visits range filter
    if (params.minTraffic !== undefined) {
      conditions.push(sql`${products.monthlyVisits} >= ${params.minTraffic}`);
    }
    if (params.maxTraffic !== undefined) {
      conditions.push(sql`${products.monthlyVisits} <= ${params.maxTraffic}`);
    }

    // Spam score filter (include NULL as "unknown")
    if (params.maxSpamScore !== undefined) {
      conditions.push(
        or(
          sql`${products.spamScore} <= ${params.maxSpamScore}`,
          sql`${products.spamScore} is null`,
        )!,
      );
    }

    const whereClause = and(...conditions);

    // Build ORDER BY
    let orderBy;
    const direction = params.sortOrder === "asc" ? asc : desc;
    switch (params.sortBy) {
      case "dr":
        orderBy = [direction(products.dr), desc(products.monthlyVisits)];
        break;
      case "da":
        orderBy = [direction(products.da), desc(products.monthlyVisits)];
        break;
      case "traffic":
        orderBy = [direction(products.monthlyVisits), desc(products.dr)];
        break;
      default:
        // Relevance: prioritize featured, then by DR
        orderBy = [
          desc(products.isFeatured),
          desc(products.dr),
          desc(products.monthlyVisits),
        ];
    }

    // Count total results
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(whereClause);

    const total = Number(countResult?.count || 0);

    // Get paginated results
    const offset = (params.page! - 1) * params.limit!;

    const results = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        tagline: products.tagline,
        url: products.url,
        logoUrl: products.logoUrl,
        niche: products.niche,
        dr: products.dr,
        da: products.da,
        monthlyVisits: products.monthlyVisits,
        linkType: products.linkType,
        googleNews: products.googleNews,
        isFeatured: products.isFeatured,
        isVerified: products.isVerified,
      })
      .from(products)
      .where(whereClause)
      .orderBy(...orderBy)
      .limit(params.limit!)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: {
        results,
        pagination: {
          total,
          page: params.page,
          limit: params.limit,
          totalPages: Math.ceil(total / params.limit!),
        },
        query: params.q || "",
        filters: {
          niche: params.niche,
          linkType: params.linkType,
          minDr: params.minDr,
          maxDr: params.maxDr,
          minDa: params.minDa,
          maxDa: params.maxDa,
          minTraffic: params.minTraffic,
          maxTraffic: params.maxTraffic,
          maxSpamScore: params.maxSpamScore,
          googleNews: params.googleNews,
          featured: params.isFeatured,
          verified: params.isVerified,
        },
      },
    });
  } catch (error) {
    console.error("[Search API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Search failed" },
      { status: 500 },
    );
  }
}
