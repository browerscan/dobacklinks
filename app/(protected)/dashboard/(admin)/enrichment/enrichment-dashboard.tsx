"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  enrichAllPendingAction,
  resetFailedToPendingAction,
  getEnrichmentStatsAction,
  getProductsWithEnrichmentStatusAction,
} from "@/actions/enrichment";
import {
  Database,
  RefreshCw,
  RotateCcw,
  TrendingUp,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { EnrichmentStats } from "@/lib/services/enrichment-service";

interface EnrichmentDashboardProps {
  initialStats: EnrichmentStats | null;
}

export function EnrichmentDashboard({
  initialStats,
}: EnrichmentDashboardProps) {
  const [stats, setStats] = useState<EnrichmentStats | null>(initialStats);
  const [isEnriching, setIsEnriching] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh statistics
  const refreshStats = async () => {
    setIsRefreshing(true);
    try {
      const result = await getEnrichmentStatsAction();
      if (result.success) {
        setStats(result.data ?? null);
        toast.success("Statistics refreshed");
      } else {
        toast.error(result.error || "Failed to refresh statistics");
      }
    } catch (error) {
      toast.error("Failed to refresh statistics");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Enrich all pending products
  const handleEnrichAll = async () => {
    if (!confirm("This will process up to 100 pending products. Continue?")) {
      return;
    }

    setIsEnriching(true);
    toast.info("Starting enrichment...");

    try {
      const result = await enrichAllPendingAction();

      if (result.success) {
        if (result.data) {
          const { stats } = result.data;
          toast.success(
            `Enrichment complete: ${stats.enriched} enriched, ${stats.failed} failed`,
          );
        }
        // Refresh statistics
        await refreshStats();
      } else {
        toast.error(result.error || "Enrichment failed");
      }
    } catch (error) {
      toast.error("Enrichment failed");
    } finally {
      setIsEnriching(false);
    }
  };

  // Reset failed products to pending
  const handleResetFailed = async () => {
    if (!confirm("Reset all failed products to pending status?")) {
      return;
    }

    setIsResetting(true);
    toast.info("Resetting failed products...");

    try {
      const result = await resetFailedToPendingAction();

      if (result.success) {
        if (result.data) {
          toast.success(
            `Reset ${result.data.count} failed products to pending`,
          );
        }
        await refreshStats();
      } else {
        toast.error(result.error || "Reset failed");
      }
    } catch (error) {
      toast.error("Reset failed");
    } finally {
      setIsResetting(false);
    }
  };

  if (!stats) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Failed to load statistics</p>
        </CardContent>
      </Card>
    );
  }

  const totalProducts =
    stats.total + stats.pending + stats.enriched + stats.failed;
  const enrichedPercentage =
    totalProducts > 0
      ? ((stats.enriched / totalProducts) * 100).toFixed(1)
      : "0.0";
  const failedPercentage =
    totalProducts > 0
      ? ((stats.failed / totalProducts) * 100).toFixed(1)
      : "0.0";

  return (
    <>
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Products
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalProducts.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              All guest post sites
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.pending.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {((stats.pending / totalProducts) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enriched</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.enriched.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {enrichedPercentage}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.failed.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {failedPercentage}% no data available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Manage SimilarWeb data collection for guest post sites
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleEnrichAll}
              disabled={isEnriching || stats.pending === 0}
              size="lg"
            >
              {isEnriching ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Enriching...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Enrich 100 Pending Products
                </>
              )}
            </Button>

            <Button
              onClick={handleResetFailed}
              disabled={isResetting || stats.failed === 0}
              variant="outline"
              size="lg"
            >
              {isResetting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Failed to Pending
                </>
              )}
            </Button>

            <Button
              onClick={refreshStats}
              disabled={isRefreshing}
              variant="ghost"
              size="lg"
            >
              {isRefreshing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4 space-y-2 text-sm">
            <p className="font-medium">💡 How it works:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>
                <strong>Enrich</strong>: Processes 100 pending products, fetches
                traffic data from SimilarWeb API (~60-70 seconds)
              </li>
              <li>
                <strong>Success rate</strong>: ~7-11% (most small sites don't
                have SimilarWeb data)
              </li>
              <li>
                <strong>Failed products</strong>: Hidden on frontend (no traffic
                data shown to users)
              </li>
              <li>
                <strong>Reset</strong>: Retry failed products if SimilarWeb adds
                new data
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Recent Enrichments */}
      <Card>
        <CardHeader>
          <CardTitle>Status Distribution</CardTitle>
          <CardDescription>
            Overview of enrichment status across all products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-yellow-50">
                  Pending
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Awaiting enrichment
                </span>
              </div>
              <span className="text-sm font-medium">
                {stats.pending.toLocaleString()} (
                {((stats.pending / totalProducts) * 100).toFixed(1)}%)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50">
                  Enriched
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Has traffic data
                </span>
              </div>
              <span className="text-sm font-medium">
                {stats.enriched.toLocaleString()} ({enrichedPercentage}%)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-red-50">
                  Failed
                </Badge>
                <span className="text-sm text-muted-foreground">
                  No data available
                </span>
              </div>
              <span className="text-sm font-medium">
                {stats.failed.toLocaleString()} ({failedPercentage}%)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Command Line Usage</CardTitle>
          <CardDescription>Bulk enrichment via scripts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <strong className="text-sm">Full Enrichment (All Pending)</strong>
            <pre className="mt-2 bg-muted rounded-lg p-3 text-xs overflow-x-auto">
              CRON_SECRET=your_secret ./scripts/run-full-enrichment.sh
            </pre>
          </div>

          <div>
            <strong className="text-sm">Monitor Progress</strong>
            <pre className="mt-2 bg-muted rounded-lg p-3 text-xs overflow-x-auto">
              ./scripts/check-enrichment-progress.sh
            </pre>
          </div>

          <div>
            <strong className="text-sm">API Trigger (Single Batch)</strong>
            <pre className="mt-2 bg-muted rounded-lg p-3 text-xs overflow-x-auto">
              curl -X GET http://localhost:3000/api/cron/enrich-sites \{"\n"}
              {"  "}-H "Authorization: Bearer YOUR_CRON_SECRET"
            </pre>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
