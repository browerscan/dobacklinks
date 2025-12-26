import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp } from "lucide-react";

export const GrowthIndicator = ({ rate }: { rate: number }) => {
  const isFinite = Number.isFinite(rate);
  const symbol =
    rate > 0 ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />;

  if (!isFinite) {
    return <div className="text-xs text-gray-500">N/A</div>;
  }

  return (
    <Badge variant="outline">
      {symbol} {Math.abs(rate).toFixed(2)}%
    </Badge>
  );
};
