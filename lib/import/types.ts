export interface ScrapedSiteData {
  spamScore: string;
  googleNews: string;
  approvedDate: string;
  maxLinks: string;
  performerName: string | null;
  sampleUrls: string[];
  contentPlacementPrice: string;
  writingPlacementPrice: string;
  specialTopicPrice: string;
  ahrefsOrganicTraffic: string;
  similarwebTraffic: string;
  semrushTotalTraffic: string;
  referralDomains: string;
  mozDA: string;
  semrushAS: string;
  ahrefsDR: string;
  completionRate: string;
  avgLifetimeOfLinks: string;
  tat: string;
  language: string;
  linkAttributionType: string;
  requiredContentSize: string;
  description?: string;
  // New fields from incremental scraper
  country?: string;
  semrushTopCountry?: string | null;
  topCountryTraffic?: string | null;
  tasksWithInitialDomainPrice?: string;
}

export interface ScrapedSite {
  domain: string;
  siteId: string;
  success: boolean;
  data: ScrapedSiteData;
  error: string | null;
  timestamp: string;
}

export interface QualityScore {
  score: number; // 0-100
  tier: "premium" | "high" | "medium" | "low";
  reasons: string[];
}

export interface ScoredSite {
  site: ScrapedSite;
  quality: QualityScore;
  status: "live" | "pending_review";
  rank: number;
}
