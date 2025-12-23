import { getEnrichmentStatsAction } from "@/actions/enrichment";
import { getOverviewStats } from "@/actions/overview";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isAdminCheck } from "@/lib/auth/server";
import { BarChart3, FileText, FolderOpen, Settings, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const isAdmin = await isAdminCheck();

  // Non-admin users go to profile
  if (!isAdmin) {
    redirect("/dashboard/profile");
  }

  // Fetch admin stats
  const [overviewResult, enrichmentResult] = await Promise.all([
    getOverviewStats(),
    getEnrichmentStatsAction(),
  ]);

  const overview = overviewResult.success ? overviewResult.data : null;
  const enrichment = enrichmentResult.success ? enrichmentResult.data : null;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          System overview and quick actions
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sites</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrichment?.total ?? "-"}</div>
            <p className="text-xs text-muted-foreground">
              {enrichment?.enriched ?? 0} enriched, {enrichment?.pending ?? 0}{" "}
              pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.users.total ?? "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              +{overview?.users.today ?? 0} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submissions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.submissions.total ?? "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              +{overview?.submissions.today ?? 0} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrichment</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {enrichment?.enrichedPercentage ?? 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {enrichment?.failed ?? 0} failed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Jump to common admin tasks</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/dashboard/overview">
            <Button variant="outline" className="w-full justify-start">
              <BarChart3 className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
          </Link>
          <Link href="/dashboard/sites">
            <Button variant="outline" className="w-full justify-start">
              <FolderOpen className="mr-2 h-4 w-4" />
              Manage Sites
            </Button>
          </Link>
          <Link href="/dashboard/enrichment">
            <Button variant="outline" className="w-full justify-start">
              <Settings className="mr-2 h-4 w-4" />
              Enrichment
            </Button>
          </Link>
          <Link href="/dashboard/users">
            <Button variant="outline" className="w-full justify-start">
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
