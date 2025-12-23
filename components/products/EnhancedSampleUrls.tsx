"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink, Calendar, Link2, Eye } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface Product {
  name: string;
  sampleUrls?: string[] | null;
}

interface EnhancedSampleUrlsProps {
  product: Product;
}

/**
 * Extract metadata from URL
 */
function analyzeUrl(url: string): {
  domain: string;
  path: string;
  slug: string;
  estimatedDate?: string;
} {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace("www.", "");
    const path = urlObj.pathname;
    const pathParts = path.split("/").filter(Boolean);
    const slug = pathParts[pathParts.length - 1] || "home";

    // Try to extract date from URL pattern (e.g., /2024/01/15/article)
    let estimatedDate: string | undefined;
    const datePattern = /\/(\d{4})\/(\d{1,2})\/(\d{1,2})\//;
    const dateMatch = path.match(datePattern);
    if (dateMatch) {
      const [, year, month, day] = dateMatch;
      estimatedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    return { domain, path, slug, estimatedDate };
  } catch (e) {
    return {
      domain: url,
      path: "",
      slug: url,
    };
  }
}

/**
 * Generate a human-readable title from URL slug
 */
function titleFromSlug(slug: string): string {
  return slug
    .replace(/\.(html|htm|php|asp|aspx)$/, "")
    .replace(/[-_]/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
    .slice(0, 80);
}

export function EnhancedSampleUrls({ product }: EnhancedSampleUrlsProps) {
  const [showAll, setShowAll] = useState(false);

  if (!Array.isArray(product.sampleUrls) || product.sampleUrls.length === 0) {
    return null;
  }

  const displayUrls = showAll
    ? product.sampleUrls
    : product.sampleUrls.slice(0, 3);
  const hasMore = product.sampleUrls.length > 3;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Example Publications
          </CardTitle>
          <Badge variant="secondary">{product.sampleUrls.length} samples</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayUrls.map((url: string, index: number) => {
            const metadata = analyzeUrl(url);
            const title = titleFromSlug(metadata.slug);

            return (
              <div
                key={index}
                className="group p-3 border rounded-lg hover:border-primary hover:bg-accent/50 transition-all"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    {/* Title (derived from slug) */}
                    <div className="font-medium text-sm line-clamp-1">
                      {title}
                    </div>

                    {/* URL */}
                    <Link
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 truncate"
                    >
                      <span className="truncate">{url}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </Link>

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        <Link2 className="w-3 h-3 mr-1" />
                        {metadata.domain}
                      </Badge>

                      {metadata.estimatedDate && (
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(metadata.estimatedDate).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Preview Button */}
                  <Link
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}

          {/* Show More Button */}
          {hasMore && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="w-full mt-2"
            >
              {showAll
                ? "Show Less"
                : `Show ${product.sampleUrls.length - 3} More`}
            </Button>
          )}
        </div>

        {/* Info Note */}
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> Review these examples to understand the
            site&apos;s content style and quality standards before submitting
            your guest post.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
