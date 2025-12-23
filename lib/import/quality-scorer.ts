import { ScrapedSite, QualityScore, ScoredSite } from "./types";

export function calculateQualityScore(site: ScrapedSite): QualityScore {
  let score = 0;
  const reasons: string[] = [];

  // 1. Google News Approval (+30 points)
  if (site.data.googleNews?.toLowerCase() === "yes") {
    score += 30;
    reasons.push("✓ Google News approved");
  }

  // 2. Spam Score (+25 if ≤5%, +15 if ≤15%, -20 if >30%)
  const spamScore = parseInt(site.data.spamScore?.replace("%", "") || "100");
  if (spamScore <= 5) {
    score += 25;
    reasons.push(`✓ Low spam score (${spamScore}%)`);
  } else if (spamScore <= 15) {
    score += 15;
    reasons.push(`○ Moderate spam score (${spamScore}%)`);
  } else if (spamScore > 30) {
    score -= 20;
    reasons.push(`✗ High spam score (${spamScore}%)`);
  }

  // 3. Sample URLs Available (+15 points)
  if (site.data.sampleUrls && site.data.sampleUrls.length > 0) {
    score += 15;
    reasons.push(`✓ ${site.data.sampleUrls.length} sample posts`);
  }

  // 4. Multiple Links Allowed (+10 if ≥2)
  const maxLinks = parseInt(site.data.maxLinks || "1");
  if (maxLinks >= 2) {
    score += 10;
    reasons.push(`✓ Allows ${maxLinks} links`);
  }

  // 5. Early Approval Date (+10 if before 2022)
  if (site.data.approvedDate) {
    try {
      const approvedYear = new Date(site.data.approvedDate).getFullYear();
      if (approvedYear < 2022 && approvedYear > 2000) {
        score += 10;
        reasons.push(`✓ Established since ${approvedYear}`);
      }
    } catch (e) {
      // Invalid date, skip
    }
  }

  // 6. Domain Authority bonus (+10 if DR ≥ 70)
  const dr = parseInt(site.data.ahrefsDR || "0");
  if (dr >= 70) {
    score += 10;
    reasons.push(`✓ High DR (${dr})`);
  }

  // Clamp score to 0-100
  score = Math.min(100, Math.max(0, score));

  // Determine tier
  let tier: QualityScore["tier"];
  if (score >= 70) tier = "premium";
  else if (score >= 50) tier = "high";
  else if (score >= 30) tier = "medium";
  else tier = "low";

  return { score, tier, reasons };
}

export function scoreAllSites(sites: ScrapedSite[]): ScoredSite[] {
  return sites
    .map((site, index) => ({
      site,
      quality: calculateQualityScore(site),
      status: "pending_review" as const,
      rank: index + 1,
    }))
    .sort((a, b) => b.quality.score - a.quality.score) // Descending by score
    .map((scored, index) => ({ ...scored, rank: index + 1 })); // Update ranks after sorting
}
