import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import { SimilarWebRawData, TrafficSources } from "@/types/product";
import {
  TrendingUp,
  TrendingDown,
  Globe,
  MousePointer,
  Clock,
  MapPin,
  FileText,
  BarChart,
  Link2,
  Search,
  Share2,
  Users,
  Mail,
  Monitor,
  Award,
  Layers,
} from "lucide-react";

// Extended SimilarWeb raw data with additional fields from API
interface ExtendedSimilarWebRawData extends SimilarWebRawData {
  category?: string;
  category_rank?: number;
  snapshot_date?: string;
  data_age_days?: string;
  monthly_visits_change?: number | null;
  stale?: boolean;
  data_source?: string;
}

interface Product {
  id: string;
  enrichmentStatus?: string | null;
  monthlyVisits?: number | null;
  globalRank?: number | null;
  countryRank?: number | null;
  bounceRate?: string | null;
  pagesPerVisit?: string | null;
  avgVisitDuration?: number | null;
  trafficSources?: TrafficSources | null;
  enrichedAt?: string | Date | null;
  similarwebData?: ExtendedSimilarWebRawData | null;
}

interface SimilarWebMetricsProps {
  product: Product;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Format category name for display
 * "news_and_media" -> "News & Media"
 * "arts_and_entertainment/music" -> "Music"
 */
function formatCategory(category: string): string {
  // Handle subcategories - take the last part
  const parts = category.split("/");
  const mainCategory = parts[parts.length - 1];

  // Convert snake_case to Title Case
  return mainCategory
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
    .replace(" And ", " & ");
}

/**
 * Get parent category from full category path
 * "arts_and_entertainment/music" -> "Arts & Entertainment"
 */
function getParentCategory(category: string): string | null {
  const parts = category.split("/");
  if (parts.length > 1) {
    return formatCategory(parts[0]);
  }
  return null;
}

export function SimilarWebMetrics({ product }: SimilarWebMetricsProps) {
  // Don't show anything if not enriched or failed
  if (product.enrichmentStatus === "pending" || product.enrichmentStatus === "failed") {
    return null;
  }

  const rawData = product.similarwebData as ExtendedSimilarWebRawData | null;

  // Check if we have any useful data to display
  const hasMonthlyVisits = product.monthlyVisits != null;
  const hasGlobalRank = product.globalRank != null;
  const hasCountryRank = product.countryRank != null;
  const hasCategoryRank = rawData?.category_rank != null;
  const hasCategory = rawData?.category && rawData.category !== "null";

  // Don't show anything if enriched but no data
  if (
    product.enrichmentStatus === "enriched" &&
    !hasMonthlyVisits &&
    !hasGlobalRank &&
    !hasCountryRank
  ) {
    return null;
  }

  // Hide if not enriched (shouldn't happen with above checks, but safety fallback)
  if (product.enrichmentStatus !== "enriched") {
    return null;
  }

  const hasTrafficSources =
    product.trafficSources && Object.values(product.trafficSources).some((v) => v != null && v > 0);

  // Enriched state with data
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Traffic Metrics
          <Badge variant="secondary" className="ml-auto text-xs">
            via SimilarWeb
          </Badge>
        </CardTitle>
        {/* Category Badge */}
        {rawData?.category && (
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              <Layers className="w-3 h-3 mr-1" />
              {formatCategory(rawData.category)}
            </Badge>
            {getParentCategory(rawData.category) && (
              <span className="text-xs text-muted-foreground">
                in {getParentCategory(rawData.category)}
              </span>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Key Metrics - Row 1 */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {hasMonthlyVisits ? (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span className="hidden sm:inline">Monthly Visits</span>
                <span className="sm:hidden">Visits</span>
              </div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">
                {formatNumber(product.monthlyVisits!)}
              </div>
              {/* Monthly Visits Change Trend */}
              {rawData?.monthly_visits_change != null && rawData.monthly_visits_change !== 0 && (
                <div className="flex items-center gap-1">
                  {rawData.monthly_visits_change > 0 ? (
                    <>
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="text-xs font-medium text-green-600">
                        +{(rawData.monthly_visits_change * 100).toFixed(1)}%
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-3 h-3 text-red-500" />
                      <span className="text-xs font-medium text-red-600">
                        {(rawData.monthly_visits_change * 100).toFixed(1)}%
                      </span>
                    </>
                  )}
                  <span className="text-xs text-muted-foreground">vs prev month</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span className="hidden sm:inline">Monthly Visits</span>
                <span className="sm:hidden">Visits</span>
              </div>
              <div className="text-sm text-muted-foreground">&lt;5K</div>
              <div className="text-xs text-muted-foreground">Low traffic site</div>
            </div>
          )}

          {hasGlobalRank && (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Globe className="w-3 h-3" />
                <span className="hidden sm:inline">Global Rank</span>
                <span className="sm:hidden">Global</span>
              </div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">
                #{formatNumber(product.globalRank!)}
              </div>
            </div>
          )}

          {product.bounceRate && (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <MousePointer className="w-3 h-3" />
                <span className="hidden sm:inline">Bounce Rate</span>
                <span className="sm:hidden">Bounce</span>
              </div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">
                {(parseFloat(product.bounceRate) * 100).toFixed(1)}%
              </div>
            </div>
          )}
        </div>

        {/* Rankings - Row 2 */}
        {(product.countryRank || rawData?.category_rank) && (
          <div className="pt-3 border-t">
            <div className="text-xs font-medium mb-3 text-muted-foreground">Rankings</div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {product.countryRank && (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span className="hidden sm:inline">Country Rank</span>
                    <span className="sm:hidden">Country</span>
                  </div>
                  <div className="text-lg sm:text-xl font-bold">
                    #{formatNumber(product.countryRank)}
                  </div>
                </div>
              )}

              {rawData?.category_rank && (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    <span className="hidden sm:inline">Category Rank</span>
                    <span className="sm:hidden">Category</span>
                  </div>
                  <div className="text-lg sm:text-xl font-bold">
                    #{formatNumber(rawData.category_rank)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Engagement Metrics - Row 3 */}
        <div className="pt-3 border-t">
          <div className="text-xs font-medium mb-3 text-muted-foreground">Engagement</div>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {product.pagesPerVisit && (
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Pages/Visit
                </div>
                <div className="text-lg sm:text-xl font-bold">{product.pagesPerVisit}</div>
                <div className="text-xs text-muted-foreground hidden sm:block">
                  {parseFloat(product.pagesPerVisit) > 2 ? "Good depth" : "Low depth"}
                </div>
              </div>
            )}

            {product.avgVisitDuration != null && (
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span className="hidden sm:inline">Avg Duration</span>
                  <span className="sm:hidden">Duration</span>
                </div>
                <div className="text-lg sm:text-xl font-bold">
                  {formatDuration(product.avgVisitDuration)}
                </div>
                <div className="text-xs text-muted-foreground hidden sm:block">
                  {product.avgVisitDuration > 120 ? "High engagement" : "Quick visits"}
                </div>
              </div>
            )}

            {product.bounceRate && (
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Engagement
                </div>
                <div className="text-lg sm:text-xl font-bold">
                  {parseFloat(product.bounceRate) < 0.4
                    ? "High"
                    : parseFloat(product.bounceRate) < 0.6
                      ? "Medium"
                      : "Low"}
                </div>
                <div className="text-xs text-muted-foreground hidden sm:block">
                  {parseFloat(product.bounceRate) < 0.5 ? "Good retention" : "Average"}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Traffic Sources */}
        {hasTrafficSources && (
          <div className="pt-3 border-t">
            <div className="text-xs font-medium mb-3 text-muted-foreground flex items-center gap-2">
              <BarChart className="w-3 h-3" />
              Traffic Sources
            </div>
            <div className="space-y-2.5">
              {Object.entries(product.trafficSources!)
                .filter(([, value]) => value != null && (value as number) > 0)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, 6)
                .map(([source, percentage]) => {
                  const IconComponent =
                    {
                      direct: Link2,
                      search: Search,
                      referral: Share2,
                      social: Users,
                      mail: Mail,
                      display: Monitor,
                    }[source] || Link2;

                  const displayPercentage = (percentage as number) * 100;

                  return (
                    <div key={source} className="flex items-center gap-2">
                      <div className="text-xs w-16 sm:w-20 capitalize flex items-center gap-1">
                        <IconComponent className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium truncate">{source}</span>
                      </div>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all"
                          style={{
                            width: `${Math.min(displayPercentage, 100)}%`,
                          }}
                        />
                      </div>
                      <div className="text-xs font-bold w-12 text-right text-primary">
                        {displayPercentage.toFixed(1)}%
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Data snapshot info */}
        <div className="pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {rawData?.snapshot_date && (
              <>
                Snapshot:{" "}
                {new Date(rawData.snapshot_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </>
            )}
          </span>
          {product.enrichedAt && (
            <span>
              Updated:{" "}
              {new Date(product.enrichedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
