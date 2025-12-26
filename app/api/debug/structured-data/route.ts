import { NextResponse } from "next/server";
import {
  generateProductSchema,
  generateBreadcrumbSchema,
  generateOrganizationSchema,
  generateWebSiteSchema,
} from "@/lib/structured-data";
import type { ProductWithCategories } from "@/types/product";

/**
 * Debug endpoint to preview structured data output
 * GET /api/debug/structured-data?isLoggedIn=true
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isLoggedIn = searchParams.get("isLoggedIn") === "true";

  // Mock product data for testing - matches ProductWithCategories type
  const mockProduct: ProductWithCategories = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    userId: "system-user-id",
    name: "Tech Blog Example",
    slug: "tech-blog-example",
    tagline: "High DR technology blog accepting guest posts",
    description: "We accept quality guest posts on technology topics.",
    logoUrl: null,
    appImages: null,
    url: "https://example.com",
    niche: "Technology",
    da: 65,
    dr: 75,
    traffic: "100K-1M",
    linkType: "dofollow",
    priceRange: "$150-$250",
    turnaroundTime: "3-5 days",
    contactEmail: "contact@example.com",
    spamScore: 3,
    googleNews: true,
    maxLinks: 2,
    requiredContentSize: 800,
    sampleUrls: ["https://example.com/sample1", "https://example.com/sample2"],
    similarwebData: null,
    enrichmentStatus: "enriched",
    enrichedAt: "2024-01-01T00:00:00Z",
    monthlyVisits: 500000,
    globalRank: 15000,
    countryRank: null,
    bounceRate: "45.5",
    pagesPerVisit: "2.5",
    avgVisitDuration: 180,
    trafficSources: null,
    screenshotFullUrl: null,
    screenshotThumbnailUrl: null,
    screenshotCapturedAt: null,
    screenshotR2Key: null,
    screenshotNextCaptureAt: null,
    screenshotStatus: "pending",
    screenshotError: null,
    seoTitle: null,
    seoMetaDescription: null,
    seoOgTitle: null,
    seoOgDescription: null,
    seoOgImage: null,
    seoTwitterCard: null,
    seoTwitterTitle: null,
    seoTwitterDescription: null,
    seoTwitterImage: null,
    seoFaviconUrl: null,
    seoCanonicalUrl: null,
    seoH1: null,
    status: "live",
    isFeatured: false,
    isVerified: true,
    submitType: "free",
    linkRel: "nofollow",
    submittedAt: "2024-01-01T00:00:00Z",
    lastRenewedAt: null,
    updatedAt: "2024-01-01T00:00:00Z",
    createdAt: "2024-01-01T00:00:00Z",
    categories: [
      {
        id: "cat1",
        name: "Technology",
        slug: "technology",
      },
    ],
  };

  const productSchema = generateProductSchema({
    product: mockProduct,
    isLoggedIn,
  });

  const breadcrumbSchema = generateBreadcrumbSchema(mockProduct);
  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebSiteSchema();

  return NextResponse.json({
    isLoggedIn,
    schemas: {
      product: productSchema,
      breadcrumb: breadcrumbSchema,
      organization: organizationSchema,
      website: websiteSchema,
    },
  });
}
