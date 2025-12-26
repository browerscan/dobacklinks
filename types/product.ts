export const LinkTypeEnum = ["dofollow", "nofollow"] as const;
export const ProductStatusEnum = ["live", "pending_review"] as const;
export const ProductSubmissionTypeEnum = [
  "free",
  "one_time",
  "monthly_promotion",
  "featured",
  "sponsor",
] as const;

export type LinkType = (typeof LinkTypeEnum)[number];
export type ProductStatus = (typeof ProductStatusEnum)[number];
export type ProductSubmissionType = (typeof ProductSubmissionTypeEnum)[number];

/**
 * Traffic sources breakdown from SimilarWeb
 */
export interface TrafficSources {
  direct?: number;
  referral?: number;
  search?: number;
  social?: number;
  mail?: number;
  display?: number;
}

/**
 * Raw SimilarWeb API response data
 * Allows for additional fields from API with index signature
 */
export interface SimilarWebRawData {
  domain?: string;
  monthly_visits?: number | string | null;
  global_rank?: number | null;
  country_rank?: number | null;
  bounce_rate?: number | string | null;
  pages_per_visit?: number | string | null;
  avg_visit_duration?: number | string | null;
  traffic_sources?: TrafficSources | null;
  [key: string]: unknown;
}

export type Product = {
  id: string;
  userId: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  logoUrl: string | null;
  appImages: string[] | null;
  url: string;
  niche: string | null;
  da: number | null;
  dr: number | null;
  traffic: string | null;
  linkType: LinkType | null;
  priceRange: string | null;
  turnaroundTime: string | null;
  contactEmail: string | null;
  spamScore: number | null;
  googleNews: boolean | null;
  maxLinks: number | null;
  requiredContentSize: number | null;
  sampleUrls: string[] | null;
  // SimilarWeb enrichment fields
  similarwebData: SimilarWebRawData | null;
  enrichmentStatus: "pending" | "enriched" | "failed" | null;
  enrichedAt: string | null;
  monthlyVisits: number | null;
  globalRank: number | null;
  countryRank: number | null;
  bounceRate: string | null;
  pagesPerVisit: string | null;
  avgVisitDuration: number | null;
  trafficSources: TrafficSources | null;
  // Screenshot & SEO metadata fields
  screenshotFullUrl: string | null;
  screenshotThumbnailUrl: string | null;
  screenshotCapturedAt: string | null;
  screenshotR2Key: string | null;
  screenshotNextCaptureAt: string | null;
  screenshotStatus: "pending" | "captured" | "failed" | null;
  screenshotError: string | null;
  seoTitle: string | null;
  seoMetaDescription: string | null;
  seoOgTitle: string | null;
  seoOgDescription: string | null;
  seoOgImage: string | null;
  seoTwitterCard: string | null;
  seoTwitterTitle: string | null;
  seoTwitterDescription: string | null;
  seoTwitterImage: string | null;
  seoFaviconUrl: string | null;
  seoCanonicalUrl: string | null;
  seoH1: string | null;
  status: ProductStatus;
  isFeatured: boolean;
  isVerified: boolean;
  submitType: ProductSubmissionType | null;
  linkRel: string | null;
  submittedAt: string;
  lastRenewedAt: string | null;
  updatedAt: string | null;
  createdAt: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon?: string;
};

export type ProductWithCategories = Product & {
  categories: {
    id: string;
    name: string;
    slug: string;
  }[];
};

export interface ProductFilters {
  name?: string; // For search
  userId?: string;
  categoryId?: string;
  niche?: string;
  drGte?: number;
  daGte?: number;
  linkType?: LinkType;
  priceRange?: string;
  status?: ProductStatus | ProductStatus[];
  isFeatured?: boolean;
  isVerified?: boolean;
  submitType?: ProductSubmissionType;
}

export interface AdminProductFilters extends ProductFilters {
  isFeatured?: boolean;
}

export interface ProductQueryParams extends AdminProductFilters {
  pageIndex?: number;
  pageSize?: number;
  name?: string;
}

export interface UserProductFilters extends ProductFilters {
  pageIndex?: number;
  pageSize?: number;
}
