"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, TrendingUp, Shield, CheckCircle } from "lucide-react";

interface Product {
  dr?: number | null;
  da?: number | null;
  spamScore?: number | null;
  googleNews?: boolean | null;
  linkType?: string | null;
  monthlyVisits?: number | null;
  approvedDate?: string | null;
}

interface QualityScoreBadgeProps {
  product: Product;
}

/**
 * Calculate quality score based on available metrics (0-100)
 * This is a frontend-only calculation, no database changes needed
 */
function calculateQualityScore(product: Product): number {
  let score = 0;

  // Domain Rating contribution (max 30 points)
  if (product.dr != null) {
    if (product.dr >= 80) score += 30;
    else if (product.dr >= 70) score += 25;
    else if (product.dr >= 60) score += 20;
    else if (product.dr >= 50) score += 15;
    else if (product.dr >= 40) score += 10;
    else score += 5;
  }

  // Domain Authority contribution (max 20 points)
  if (product.da != null) {
    if (product.da >= 80) score += 20;
    else if (product.da >= 70) score += 16;
    else if (product.da >= 60) score += 12;
    else if (product.da >= 50) score += 8;
    else score += 4;
  }

  // Spam Score contribution (max 20 points)
  if (product.spamScore != null) {
    if (product.spamScore <= 5) score += 20;
    else if (product.spamScore <= 10) score += 15;
    else if (product.spamScore <= 20) score += 10;
    else if (product.spamScore <= 30) score += 5;
    // Above 30% spam score gets 0 points
  }

  // Google News approval (15 points)
  if (product.googleNews === true) {
    score += 15;
  }

  // Link Type (10 points)
  if (product.linkType === "dofollow") {
    score += 10;
  }

  // Traffic bonus (max 5 points)
  if (product.monthlyVisits != null) {
    if (product.monthlyVisits >= 1000000) score += 5;
    else if (product.monthlyVisits >= 500000) score += 4;
    else if (product.monthlyVisits >= 100000) score += 3;
    else if (product.monthlyVisits >= 50000) score += 2;
    else if (product.monthlyVisits >= 10000) score += 1;
  }

  return Math.min(score, 100); // Cap at 100
}

function getScoreGrade(score: number): {
  label: string;
  color: string;
  bgColor: string;
  description: string;
} {
  if (score >= 90) {
    return {
      label: "Premium",
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      description: "Exceptional quality site with top-tier metrics",
    };
  } else if (score >= 75) {
    return {
      label: "Excellent",
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      description: "High-quality site with strong authority",
    };
  } else if (score >= 60) {
    return {
      label: "Good",
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      description: "Solid quality site with good metrics",
    };
  } else if (score >= 40) {
    return {
      label: "Fair",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
      description: "Decent site with average metrics",
    };
  } else {
    return {
      label: "Basic",
      color: "text-gray-600",
      bgColor: "bg-gray-100 dark:bg-gray-900/30",
      description: "Entry-level site with basic metrics",
    };
  }
}

export function QualityScoreBadge({ product }: QualityScoreBadgeProps) {
  const score = calculateQualityScore(product);
  const grade = getScoreGrade(score);

  // Get breakdown of score components
  const breakdown = [];
  if (product.dr != null)
    breakdown.push({ label: "Domain Rating", icon: TrendingUp });
  if (product.da != null)
    breakdown.push({ label: "Domain Authority", icon: Award });
  if (product.spamScore != null && product.spamScore <= 20)
    breakdown.push({ label: "Low Spam Score", icon: Shield });
  if (product.googleNews === true)
    breakdown.push({ label: "Google News", icon: CheckCircle });

  return (
    <Card className={`border-2 ${grade.bgColor}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Quality Score
          </span>
          <Badge variant="secondary" className={grade.color}>
            {grade.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Score Display */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <svg className="w-24 h-24 transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted opacity-20"
                />
                {/* Progress circle */}
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - score / 100)}`}
                  className={grade.color}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-2xl font-bold ${grade.color}`}>
                  {score}
                </span>
              </div>
            </div>

            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                {grade.description}
              </p>
            </div>
          </div>

          {/* Score Breakdown */}
          {breakdown.length > 0 && (
            <div className="pt-3 border-t">
              <div className="text-xs font-medium mb-2 text-muted-foreground">
                Quality Factors:
              </div>
              <div className="flex flex-wrap gap-2">
                {breakdown.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <Badge
                      key={index}
                      variant="outline"
                      className="text-xs flex items-center gap-1"
                    >
                      <Icon className="w-3 h-3" />
                      {item.label}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>100</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${grade.bgColor} transition-all duration-500`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
