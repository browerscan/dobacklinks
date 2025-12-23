import { Metadata } from "next";
import { constructMetadata } from "@/lib/metadata";
import { getEnrichmentStatsAction } from "@/actions/enrichment";
import { EnrichmentDashboard } from "./enrichment-dashboard";

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    title: "SimilarWeb Enrichment",
    description:
      "Manage SimilarWeb traffic data collection for guest post sites",
    path: `/dashboard/enrichment`,
  });
}

export default async function EnrichmentPage() {
  // Fetch initial statistics
  const statsResult = await getEnrichmentStatsAction();
  const stats = statsResult.success ? (statsResult.data ?? null) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          SimilarWeb Enrichment
        </h1>
        <p className="text-sm text-muted-foreground">
          Collect traffic data for guest post sites from SimilarWeb API
        </p>
      </div>

      <EnrichmentDashboard initialStats={stats} />
    </div>
  );
}
