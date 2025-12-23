import { db } from "@/lib/db";
import { products, productCategories, categories } from "@/lib/db/schema";
import { and, desc, eq, ilike, or, sql, asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface SearchParams {
  q?: string;
  niche?: string;
  minDr?: number;
  maxDr?: number;
  minDa?: number;
  maxDa?: number;
  sortBy?: "dr" | "da" | "traffic" | "relevance";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const params: SearchParams = {
      q: searchParams.get("q") || undefined,
      niche: searchParams.get("niche") || undefined,
      minDr: searchParams.get("minDr")
        ? parseInt(searchParams.get("minDr")!)
        : undefined,
      maxDr: searchParams.get("maxDr")
        ? parseInt(searchParams.get("maxDr")!)
        : undefined,
      minDa: searchParams.get("minDa")
        ? parseInt(searchParams.get("minDa")!)
        : undefined,
      maxDa: searchParams.get("maxDa")
        ? parseInt(searchParams.get("maxDa")!)
        : undefined,
      sortBy:
        (searchParams.get("sortBy") as SearchParams["sortBy"]) || "relevance",
      sortOrder:
        (searchParams.get("sortOrder") as SearchParams["sortOrder"]) || "desc",
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1,
      limit: searchParams.get("limit")
        ? Math.min(parseInt(searchParams.get("limit")!), 50)
        : 20,
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
          minDr: params.minDr,
          maxDr: params.maxDr,
          minDa: params.minDa,
          maxDa: params.maxDa,
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
