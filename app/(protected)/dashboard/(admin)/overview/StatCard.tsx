import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatValue } from "@/lib/utils";
import { GrowthIndicator } from "./GrowthIndicator";

interface StatCardProps {
  title: string;
  today: number | string;
  yesterday: number | string;
  growthRate: number;
  total?: number;
  totalLabel?: string;
  unit?: "count" | "revenue";
  t: (key: string) => string;
}

export function StatCard({
  title,
  today,
  yesterday,
  growthRate,
  total,
  totalLabel,
  unit = "count",
  t,
}: StatCardProps) {
  return (
    <Card className="bg-gradient-to-b from-background to-muted dark:to-muted/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-normal text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-semibold tabular-nums">{formatValue(today, unit)}</div>
            <p className="text-xs text-muted-foreground">
              {t("yesterday")}: {formatValue(yesterday, unit)}
            </p>
          </div>
          <GrowthIndicator rate={growthRate} />
        </div>

        <Separator className="my-2" />

        {total !== undefined && (
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">{formatValue(total, "count")}</div>
              <p className="text-xs text-muted-foreground">{totalLabel || t("totalUsers")}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
