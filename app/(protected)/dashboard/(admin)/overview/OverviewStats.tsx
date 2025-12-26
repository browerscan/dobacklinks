import { getOverviewStats } from "@/actions/overview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { StatCard } from "./StatCard";

export function OverviewStats() {
  return (
    <Suspense fallback={<OverviewStatsSkeleton />}>
      <OverviewStatsContent />
    </Suspense>
  );
}

async function OverviewStatsContent() {
  const t = (key: string) => {
    const dict: Record<string, string> = {
      newUsers: "New Users",
      newSubmissions: "New Submissions",
      totalUsers: "Total Users",
      totalSubmissions: "Total Submissions",
      yesterday: "Yesterday",
    };
    return dict[key] || key;
  };
  const result = await getOverviewStats();

  if (!result.success) {
    return (
      <div className="flex items-center justify-center h-full min-h-36">
        <p className="text-red-500">{result.error || "Failed to load dashboard data."}</p>
      </div>
    );
  }

  if (!result.data) {
    return (
      <div className="flex items-center justify-center h-full min-h-36">
        <p className="text-gray-500">No data available.</p>
      </div>
    );
  }

  const stats = result.data;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
      <StatCard
        title={t("newUsers")}
        today={stats.users.today}
        yesterday={stats.users.yesterday}
        growthRate={stats.users.growthRate}
        total={stats.users.total}
        totalLabel={t("totalUsers")}
        t={t}
      />
      <StatCard
        title={t("newSubmissions")}
        today={stats.submissions.today}
        yesterday={stats.submissions.yesterday}
        growthRate={stats.submissions.growthRate}
        total={stats.submissions.total}
        totalLabel={t("totalSubmissions")}
        t={t}
      />
    </div>
  );
}

function OverviewStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
      {[0, 1].map((i) => (
        <Card key={i} className="bg-gradient-to-b from-background to-muted dark:to-muted/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              <Skeleton className="h-4 w-28" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>

            <Skeleton className="my-2 h-2 w-full" />

            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
