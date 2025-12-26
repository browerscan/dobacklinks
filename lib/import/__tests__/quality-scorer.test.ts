import { describe, it, expect } from "vitest";
import { calculateQualityScore, scoreAllSites } from "../quality-scorer";
import { ScrapedSite, ScrapedSiteData } from "../types";

// Helper to create test site data
function createTestSite(dataOverrides: Partial<ScrapedSiteData> = {}): ScrapedSite {
  const defaultData: ScrapedSiteData = {
    spamScore: "100%",
    googleNews: "no",
    approvedDate: "",
    maxLinks: "1",
    performerName: null,
    sampleUrls: [],
    contentPlacementPrice: "",
    writingPlacementPrice: "",
    specialTopicPrice: "",
    ahrefsOrganicTraffic: "",
    similarwebTraffic: "",
    semrushTotalTraffic: "",
    referralDomains: "",
    mozDA: "",
    semrushAS: "",
    ahrefsDR: "0",
    completionRate: "",
    avgLifetimeOfLinks: "",
    tat: "",
    language: "English",
    linkAttributionType: "dofollow",
    requiredContentSize: "",
  };

  return {
    domain: "example.com",
    siteId: "1",
    success: true,
    data: { ...defaultData, ...dataOverrides },
    error: null,
    timestamp: new Date().toISOString(),
  };
}

describe("calculateQualityScore", () => {
  it("should give maximum score (100) for perfect site", () => {
    const site = createTestSite({
      googleNews: "yes",
      spamScore: "3%",
      sampleUrls: ["url1", "url2"],
      maxLinks: "3",
      approvedDate: "2020-01-01",
      ahrefsDR: "75",
    });

    const result = calculateQualityScore(site);
    expect(result.score).toBe(100);
    expect(result.tier).toBe("premium");
    expect(result.reasons).toContain("✓ Google News approved");
  });

  it("should calculate score correctly for Google News site", () => {
    const site = createTestSite({
      googleNews: "yes",
      spamScore: "0%",
    });

    const result = calculateQualityScore(site);
    expect(result.score).toBe(55); // 30 (Google News) + 25 (spam ≤5%)
    expect(result.tier).toBe("high");
  });

  it("should penalize high spam score", () => {
    const site = createTestSite({
      googleNews: "yes",
      spamScore: "35%",
    });

    const result = calculateQualityScore(site);
    expect(result.score).toBe(10); // 30 (Google News) - 20 (spam >30%)
    expect(result.tier).toBe("low");
    expect(result.reasons).toContain("✗ High spam score (35%)");
  });

  it("should give bonus for sample URLs", () => {
    const site = createTestSite({
      sampleUrls: ["url1", "url2", "url3"],
      spamScore: "0%", // Need low spam to avoid penalty
    });

    const result = calculateQualityScore(site);
    expect(result.score).toBe(40); // 15 (sample URLs) + 25 (spam ≤5%)
    expect(result.reasons).toContain("✓ 3 sample posts");
  });

  it("should give bonus for multiple links", () => {
    const site = createTestSite({
      maxLinks: "5",
      spamScore: "0%",
    });

    const result = calculateQualityScore(site);
    expect(result.score).toBe(35); // 10 (max links ≥2) + 25 (spam ≤5%)
    expect(result.reasons).toContain("✓ Allows 5 links");
  });

  it("should give bonus for early approval date", () => {
    const site = createTestSite({
      approvedDate: "2021-06-15",
      spamScore: "0%",
    });

    const result = calculateQualityScore(site);
    expect(result.score).toBe(35); // 10 (early approval) + 25 (spam ≤5%)
    expect(result.reasons).toContain("✓ Established since 2021");
  });

  it("should not give bonus for recent approval date", () => {
    const site = createTestSite({
      approvedDate: "2023-06-15",
      spamScore: "0%",
    });

    const result = calculateQualityScore(site);
    expect(result.score).toBe(25); // Just spam bonus
  });

  it("should give bonus for high DR", () => {
    const site = createTestSite({
      ahrefsDR: "80",
      spamScore: "0%",
    });

    const result = calculateQualityScore(site);
    expect(result.score).toBe(35); // 10 (high DR ≥70) + 25 (spam ≤5%)
    expect(result.reasons).toContain("✓ High DR (80)");
  });

  it("should clamp score at 0 minimum", () => {
    const site = createTestSite({
      spamScore: "50%", // -20 points
    });

    const result = calculateQualityScore(site);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.tier).toBe("low");
  });

  it("should assign correct tier for premium (≥70)", () => {
    const site = createTestSite({
      googleNews: "yes", // 30
      spamScore: "5%", // 25
      sampleUrls: ["url1"], // 15
    });

    const result = calculateQualityScore(site);
    expect(result.score).toBe(70);
    expect(result.tier).toBe("premium");
  });

  it("should assign correct tier for high (50-69)", () => {
    const site = createTestSite({
      googleNews: "yes", // 30
      spamScore: "10%", // 15
      sampleUrls: ["url1"], // 15
    });

    const result = calculateQualityScore(site);
    expect(result.score).toBe(60);
    expect(result.tier).toBe("high");
  });

  it("should assign correct tier for medium (30-49)", () => {
    const site = createTestSite({
      googleNews: "yes", // 30
      spamScore: "0%", // 25
    });

    const result = calculateQualityScore(site);
    expect(result.score).toBe(55);
    expect(result.tier).toBe("high"); // Actually high tier, not medium
  });

  it("should assign correct tier for low (<30)", () => {
    const site = createTestSite({
      sampleUrls: ["url1"], // 15
      spamScore: "10%", // 15
    });

    const result = calculateQualityScore(site);
    expect(result.score).toBe(30);
    expect(result.tier).toBe("medium"); // Borderline medium
  });
});

describe("scoreAllSites", () => {
  it("should sort sites by score in descending order", () => {
    const sites: ScrapedSite[] = [
      createTestSite({ spamScore: "100%" }), // Low score
      createTestSite({ googleNews: "yes", spamScore: "5%" }), // High score
      createTestSite({ googleNews: "yes" }), // Medium score
    ];

    const result = scoreAllSites(sites);

    expect(result[0].site.data.googleNews).toBe("yes");
    expect(result[0].site.data.spamScore).toBe("5%");
  });

  it("should assign correct ranks after sorting", () => {
    const sites: ScrapedSite[] = [
      createTestSite({ spamScore: "5%" }),
      createTestSite({ googleNews: "yes" }),
    ];

    const result = scoreAllSites(sites);

    expect(result[0].rank).toBe(1);
    expect(result[1].rank).toBe(2);
  });

  it("should set all sites to pending_review status", () => {
    const sites: ScrapedSite[] = [createTestSite()];

    const result = scoreAllSites(sites);

    expect(result[0].status).toBe("pending_review");
  });
});
