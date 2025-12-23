"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Star, Zap } from "lucide-react";

interface Product {
  dr?: number | null;
  da?: number | null;
  priceRange?: string | null;
  contentPlacementPrice?: number | string | null;
  writingPlacementPrice?: number | string | null;
  monthlyVisits?: number | null;
  googleNews?: boolean | null;
}

interface ValueForMoneyIndicatorProps {
  product: Product;
}

/**
 * Extract average price from price range string
 * "$100-$200" => 150
 * "$500+" => 500
 */
function parseAveragePrice(priceRange: string | null | undefined): number | null {
  if (!priceRange) return null;

  // Try to extract numbers
  const numbers = priceRange.match(/\d+/g);
  if (!numbers || numbers.length === 0) return null;

  if (numbers.length === 1) {
    // Single number like "$500+"
    return parseInt(numbers[0]);
  } else if (numbers.length >= 2) {
    // Range like "$100-$200"
    const low = parseInt(numbers[0]);
    const high = parseInt(numbers[1]);
    return (low + high) / 2;
  }

  return null;
}

/**
 * Calculate value-for-money score (0-100)
 * Higher DR + lower price = better value
 */
function calculateValueScore(product: Product): {
  score: number;
  rating: string;
  description: string;
  color: string;
  bgColor: string;
} | null {
  // Need both DR and price to calculate
  const dr = product.dr;
  let avgPrice = parseAveragePrice(product.priceRange);

  // Try content placement price if priceRange not available
  if (!avgPrice && product.contentPlacementPrice != null) {
    avgPrice = Number(product.contentPlacementPrice);
  }

  if (dr == null || avgPrice == null || avgPrice === 0) {
    return null;
  }

  // Calculate DR per dollar spent
  const drPerDollar = dr / avgPrice;

  // Scoring tiers (based on typical market rates)
  // Excellent: DR 70+ at $100 = 0.7, DR 80+ at $150 = 0.53
  // Good: DR 60+ at $100 = 0.6, DR 70+ at $200 = 0.35
  // Fair: DR 50+ at $150 = 0.33, DR 60+ at $300 = 0.2

  let score = 0;
  let rating = "";
  let description = "";
  let color = "";
  let bgColor = "";

  if (drPerDollar >= 0.6) {
    score = 95;
    rating = "Exceptional Value";
    description = "Outstanding DR-to-price ratio. Highly recommended!";
    color = "text-purple-600";
    bgColor = "bg-purple-100 dark:bg-purple-900/30";
  } else if (drPerDollar >= 0.45) {
    score = 85;
    rating = "Excellent Value";
    description = "Great DR for the price. Very competitive deal.";
    color = "text-green-600";
    bgColor = "bg-green-100 dark:bg-green-900/30";
  } else if (drPerDollar >= 0.3) {
    score = 70;
    rating = "Good Value";
    description = "Fair pricing for the authority level.";
    color = "text-blue-600";
    bgColor = "bg-blue-100 dark:bg-blue-900/30";
  } else if (drPerDollar >= 0.2) {
    score = 55;
    rating = "Fair Value";
    description = "Reasonable pricing, but there may be better options.";
    color = "text-yellow-600";
    bgColor = "bg-yellow-100 dark:bg-yellow-900/30";
  } else {
    score = 40;
    rating = "Premium Pricing";
    description = "Higher-end pricing. Consider if niche/quality justifies cost.";
    color = "text-orange-600";
    bgColor = "bg-orange-100 dark:bg-orange-900/30";
  }

  // Bonus points for additional features
  if (product.googleNews === true) {
    score = Math.min(score + 5, 100);
  }
  if (product.monthlyVisits != null && product.monthlyVisits >= 100000) {
    score = Math.min(score + 3, 100);
  }

  return { score, rating, description, color, bgColor };
}

export function ValueForMoneyIndicator({ product }: ValueForMoneyIndicatorProps) {
  const valueData = calculateValueScore(product);

  // Don't render if we can't calculate value
  if (!valueData) {
    return null;
  }

  const avgPrice = parseAveragePrice(product.priceRange) ||
    (product.contentPlacementPrice ? Number(product.contentPlacementPrice) : 0);

  return (
    <Card className={`border-2 ${valueData.bgColor}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Value Analysis
          </span>
          <Badge variant="secondary" className={valueData.color}>
            {valueData.rating}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Value Score Display */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Star className={`w-5 h-5 ${valueData.color} fill-current`} />
                <span className={`text-2xl font-bold ${valueData.color}`}>
                  {valueData.score}/100
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {valueData.description}
              </p>
            </div>
          </div>

          {/* Metrics Breakdown */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Authority (DR)
              </div>
              <div className="text-xl font-bold">{product.dr}</div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                Avg. Price
              </div>
              <div className="text-xl font-bold">${avgPrice}</div>
            </div>
          </div>

          {/* DR per Dollar Calculation */}
          <div className="pt-3 border-t">
            <div className="text-xs font-medium mb-2 text-muted-foreground">
              Cost Efficiency:
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">DR per $1 spent</span>
              <span className={`text-lg font-bold ${valueData.color}`}>
                {((product.dr || 0) / avgPrice).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Basic</span>
              <span>Exceptional</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${valueData.bgColor} transition-all duration-500`}
                style={{ width: `${valueData.score}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
