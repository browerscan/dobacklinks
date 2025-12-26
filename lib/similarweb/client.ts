import { createLogger } from "@/lib/logger";

const log = createLogger({ module: "SimilarWebClient" });

/**
 * Traffic sources breakdown from SimilarWeb
 */
export interface TrafficSources {
  direct: number;
  referral: number;
  search: number;
  social: number;
  mail: number;
  display: number;
}

/**
 * Raw SimilarWeb API response data
 * Contains all fields that may be returned by the SimilarWeb API
 */
export interface SimilarWebRawData {
  domain: string;
  monthly_visits: number | string | null;
  global_rank: number | null;
  country_rank: number | null;
  bounce_rate: number | string | null;
  pages_per_visit: number | string | null;
  avg_visit_duration: number | string | null;
  traffic_sources: TrafficSources | null;
  [key: string]: unknown; // Allow for additional fields from API
}

/**
 * Parsed and normalized SimilarWeb metrics
 */
export interface SimilarWebMetrics {
  monthly_visits: number | null;
  global_rank: number | null;
  country_rank: number | null;
  bounce_rate: number | null;
  pages_per_visit: number | null;
  avg_visit_duration: number | null;
  traffic_sources: TrafficSources | null;
  raw_data: SimilarWebRawData;
}

interface BatchApiResultItem {
  domain: string;
  monthly_visits: number | string | null;
  global_rank: number | null;
  country_rank: number | null;
  bounce_rate: number | string | null;
  pages_per_visit: number | string | null;
  avg_visit_duration: number | string | null;
  traffic_sources: TrafficSources | null;
  message?: string;
  [key: string]: unknown;
}

interface BatchResult {
  domain: string;
  data: SimilarWebMetrics | null;
  error: string | null;
}

export class SimilarWebClient {
  private baseURL: string;
  private apiKey: string;

  constructor() {
    this.baseURL = process.env.SIMILARWEB_API_URL || "http://localhost:3000/api/v1";
    this.apiKey = process.env.SIMILARWEB_API_KEY || "";

    if (!this.apiKey) {
      throw new Error("SIMILARWEB_API_KEY not configured");
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "X-API-Key": this.apiKey,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`SimilarWeb API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get traffic data for a single domain
   */
  async getDomainData(domain: string, maxAge = 30): Promise<SimilarWebMetrics | null> {
    try {
      const result = await this.request(`/domain/${domain}?maxAge=${maxAge}`);
      return result.data || null;
    } catch (error) {
      log.error(
        "Failed to fetch data for domain",
        { domain },
        error instanceof Error ? error : undefined,
      );
      return null;
    }
  }

  /**
   * Batch get traffic data for multiple domains (max 100)
   */
  async batchGetDomains(domains: string[], maxAge = 30): Promise<BatchResult[]> {
    if (domains.length === 0) return [];
    if (domains.length > 100) {
      throw new Error("Maximum 100 domains per batch request");
    }

    try {
      const result = await this.request("/domain/batch", {
        method: "POST",
        body: JSON.stringify({ domains, maxAge }),
      });

      // Handle the actual API response format: { data: [...], meta: {...} }
      const dataArray = (result.data || result.results || []) as BatchApiResultItem[];

      return dataArray.map((item: BatchApiResultItem) => ({
        domain: item.domain,
        // Accept data if we have monthly_visits OR global_rank (many smaller sites only have rank)
        data:
          item.monthly_visits !== null || item.global_rank !== null
            ? {
                monthly_visits: item.monthly_visits
                  ? parseInt(String(item.monthly_visits).replace(/,/g, ""), 10)
                  : null,
                global_rank: item.global_rank,
                country_rank: item.country_rank,
                bounce_rate: item.bounce_rate ? parseFloat(String(item.bounce_rate)) : null,
                pages_per_visit: item.pages_per_visit
                  ? parseFloat(String(item.pages_per_visit))
                  : null,
                avg_visit_duration: item.avg_visit_duration
                  ? parseInt(String(item.avg_visit_duration), 10)
                  : null,
                traffic_sources: item.traffic_sources || null,
                raw_data: item,
              }
            : null,
        error: item.message || null,
      }));
    } catch (error) {
      log.error("Batch fetch failed", {}, error instanceof Error ? error : undefined);
      // Return empty results for all domains
      return domains.map((domain) => ({
        domain,
        data: null,
        error: "Batch request failed",
      }));
    }
  }

  /**
   * Queue domains for collection (for missing data)
   */
  async queueCollection(
    domains: string[],
    priority: "high" | "normal" | "low" = "normal",
  ): Promise<void> {
    if (domains.length === 0) return;

    try {
      await this.request("/collect", {
        method: "POST",
        body: JSON.stringify({ domains, priority }),
      });
      log.info("Queued domains for collection", { count: domains.length });
    } catch (error) {
      log.error("Failed to queue domains", {}, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Get queue status
   */
  async getQueueStatus(): Promise<{
    pending: number;
    processing: number;
    completed: number;
  }> {
    try {
      const result = await this.request("/queue");
      return result;
    } catch (error) {
      log.error("Failed to get queue status", {}, error instanceof Error ? error : undefined);
      return { pending: 0, processing: 0, completed: 0 };
    }
  }
}

// Singleton instance
let similarWebClient: SimilarWebClient | null = null;

export function getSimilarWebClient(): SimilarWebClient {
  if (!similarWebClient) {
    similarWebClient = new SimilarWebClient();
  }
  return similarWebClient;
}
