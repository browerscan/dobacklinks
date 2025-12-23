import {
  getLast30DaysPageviews,
  getLast30DaysVisitors,
} from "@/actions/plausible";
import { cn } from "@/lib/utils";

interface Last30DaysStatsProps {
  variant?: "desktop" | "mobile";
  className?: string;
}

export async function Last30DaysStats({
  variant = "desktop",
  className,
}: Last30DaysStatsProps) {
  let last30DaysVisitors = 0;
  let last30DaysPageviews = 0;

  try {
    if (process.env.PLAUSIBLE_API_KEY) {
      const [last30DaysVisitorsResult, last30DaysPageviewsResult] =
        await Promise.all([getLast30DaysVisitors(), getLast30DaysPageviews()]);
      last30DaysVisitors = last30DaysVisitorsResult ?? 0;
      last30DaysPageviews = last30DaysPageviewsResult ?? 0;
    }
  } catch (error) {
    console.error(error);
  }

  if (last30DaysVisitors === 0 && last30DaysPageviews === 0) {
    return null;
  }

  if (variant === "mobile") {
    return (
      <div className={cn("md:hidden rounded-lg border p-3", className)}>
        <div className="text-xs font-medium text-muted-foreground mb-1">
          Last 30 Days
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-base font-semibold text-foreground">
              {new Intl.NumberFormat("en-US").format(last30DaysVisitors)}
            </div>
            <div className="text-[11px] text-muted-foreground">Visitors</div>
          </div>
          <div className="text-center">
            <div className="text-base font-semibold text-foreground">
              {new Intl.NumberFormat("en-US").format(last30DaysPageviews)}
            </div>
            <div className="text-[11px] text-muted-foreground">Page Views</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("hidden md:block text-right", className)}>
      <div className="text-sm font-medium mb-1">Last 30 Days</div>
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-xl font-semibold text-foreground">
            {new Intl.NumberFormat("en-US").format(last30DaysVisitors)}
          </div>
          <div className="text-xs text-muted-foreground">Visitors</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-semibold text-foreground">
            {new Intl.NumberFormat("en-US").format(last30DaysPageviews)}
          </div>
          <div className="text-xs text-muted-foreground">Page Views</div>
        </div>
      </div>
    </div>
  );
}
