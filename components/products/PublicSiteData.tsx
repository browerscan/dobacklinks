"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink,
  CheckCircle,
  XCircle,
  Tag,
  TrendingUp,
  BarChart,
  Award,
  Shield,
  Link2,
  FileText,
  Hash,
  Globe,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Product {
  name: string;
  url: string;
  description?: string | null;
  tagline?: string | null;
  logoUrl?: string | null;
  niche?: string | null;
  dr?: number | null;
  da?: number | null;
  spamScore?: number | null;
  googleNews?: boolean | null;
  linkType?: string | null;
  maxLinks?: number | null;
  requiredContentSize?: number | null;
  sampleUrls?: string[] | null;
  // Additional scraper fields
  ahrefsOrganicTraffic?: number | null;
  referralDomains?: number | null;
  semrushAS?: number | null;
  semrushTotalTraffic?: number | null;
  similarwebTrafficScraper?: number | null;
  language?: string | null;
  approvedDate?: string | null;
}

interface PublicSiteDataProps {
  product: Product;
}

export function PublicSiteData({ product }: PublicSiteDataProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start gap-4 mb-4">
          {product.logoUrl && (
            <Image
              src={product.logoUrl}
              alt={product.name}
              width={64}
              height={64}
              className="w-16 h-16 rounded-lg object-cover"
              unoptimized
            />
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            {product.tagline && (
              <p className="text-muted-foreground">{product.tagline}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {product.niche && (
            <Badge variant="default" className="bg-purple-500">
              <Tag className="w-3 h-3 mr-1" />
              {product.niche}
            </Badge>
          )}
          {product.googleNews && (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle className="w-3 h-3 mr-1" />
              Google News
            </Badge>
          )}
          {product.linkType === "dofollow" && (
            <Badge variant="default" className="bg-blue-500">
              Dofollow Links
            </Badge>
          )}
          {product.dr && product.dr >= 70 && (
            <Badge variant="secondary">High DR ({product.dr})</Badge>
          )}
          {product.spamScore != null && product.spamScore <= 5 && (
            <Badge variant="secondary">Low Spam Score</Badge>
          )}
        </div>

        <Link
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline flex items-center gap-1"
        >
          {product.url}
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>

      {/* Description */}
      {typeof product.description === "string" &&
        product.description.trim().length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {product.description}
              </p>
            </CardContent>
          </Card>
        )}

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Site Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {product.dr != null && (
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Domain Rating
                </div>
                <div className="text-3xl font-bold text-primary">
                  {product.dr}
                </div>
                <div className="text-xs text-muted-foreground">Ahrefs DR</div>
              </div>
            )}
            {product.da != null && (
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  Domain Authority
                </div>
                <div className="text-3xl font-bold text-primary">
                  {product.da}
                </div>
                <div className="text-xs text-muted-foreground">Moz DA</div>
              </div>
            )}
            {product.spamScore != null && (
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  Spam Score
                </div>
                <div
                  className={`text-3xl font-bold ${product.spamScore <= 5 ? "text-green-600" : "text-orange-600"}`}
                >
                  {product.spamScore}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {product.spamScore <= 5 ? "Low Risk" : "Moderate Risk"}
                </div>
              </div>
            )}
            {product.linkType && (
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Link2 className="w-4 h-4" />
                  Link Type
                </div>
                <div
                  className={`text-2xl font-bold ${product.linkType === "dofollow" ? "text-blue-600" : "text-gray-600"}`}
                >
                  {product.linkType === "dofollow" ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-6 h-6" />
                      Dofollow
                    </span>
                  ) : (
                    <span className="capitalize">{product.linkType}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Traffic Data from Scrapers */}
      {(product.ahrefsOrganicTraffic != null ||
        product.referralDomains != null ||
        product.semrushAS != null ||
        product.semrushTotalTraffic != null ||
        product.similarwebTrafficScraper != null) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="w-5 h-5" />
              Additional Traffic & SEO Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {product.ahrefsOrganicTraffic != null && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Image
                      src="https://www.google.com/s2/favicons?domain=ahrefs.com&sz=16"
                      alt="Ahrefs"
                      width={16}
                      height={16}
                      className="w-4 h-4"
                    />
                    Ahrefs Organic Traffic
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    {product.ahrefsOrganicTraffic >= 1000000
                      ? `${(product.ahrefsOrganicTraffic / 1000000).toFixed(1)}M`
                      : product.ahrefsOrganicTraffic >= 1000
                        ? `${(product.ahrefsOrganicTraffic / 1000).toFixed(1)}K`
                        : product.ahrefsOrganicTraffic.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Monthly organic visits
                  </div>
                </div>
              )}

              {product.referralDomains != null && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Link2 className="w-4 h-4" />
                    Referral Domains
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    {product.referralDomains >= 1000
                      ? `${(product.referralDomains / 1000).toFixed(1)}K`
                      : product.referralDomains.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Backlink sources
                  </div>
                </div>
              )}

              {product.semrushAS != null && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Image
                      src="https://www.google.com/s2/favicons?domain=semrush.com&sz=16"
                      alt="SEMrush"
                      width={16}
                      height={16}
                      className="w-4 h-4"
                    />
                    SEMrush Authority Score
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    {product.semrushAS}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Domain authority (0-100)
                  </div>
                </div>
              )}

              {product.semrushTotalTraffic != null && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Image
                      src="https://www.google.com/s2/favicons?domain=semrush.com&sz=16"
                      alt="SEMrush"
                      width={16}
                      height={16}
                      className="w-4 h-4"
                    />
                    SEMrush Total Traffic
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    {product.semrushTotalTraffic >= 1000000
                      ? `${(product.semrushTotalTraffic / 1000000).toFixed(1)}M`
                      : product.semrushTotalTraffic >= 1000
                        ? `${(product.semrushTotalTraffic / 1000).toFixed(1)}K`
                        : product.semrushTotalTraffic.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Monthly total visits
                  </div>
                </div>
              )}

              {product.similarwebTrafficScraper != null && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    SimilarWeb Traffic (Estimate)
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    {product.similarwebTrafficScraper >= 1000000
                      ? `${(product.similarwebTrafficScraper / 1000000).toFixed(1)}M`
                      : product.similarwebTrafficScraper >= 1000
                        ? `${(product.similarwebTrafficScraper / 1000).toFixed(1)}K`
                        : product.similarwebTrafficScraper.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Monthly visitors
                  </div>
                </div>
              )}

              {product.language && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    Language
                  </div>
                  <div className="text-2xl font-bold text-primary capitalize">
                    {product.language}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Site language
                  </div>
                </div>
              )}
            </div>

            {product.approvedDate && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-xs text-muted-foreground">
                  Platform approved:{" "}
                  <span className="font-medium text-foreground">
                    {product.approvedDate}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Additional Publishing Requirements */}
      {(product.maxLinks != null || product.requiredContentSize != null) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Publishing Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {product.maxLinks != null && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Link2 className="w-4 h-4" />
                    Max Links Allowed
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    {product.maxLinks}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {product.maxLinks === 1
                      ? "Single link only"
                      : `Up to ${product.maxLinks} links`}
                  </div>
                </div>
              )}
              {product.requiredContentSize != null && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Hash className="w-4 h-4" />
                    Minimum Word Count
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    {product.requiredContentSize.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    words minimum
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* External SEO Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="w-5 h-5" />
            SEO Analysis Tools
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            Analyze this domain with popular SEO tools:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href={`https://www.semrush.com/analytics/overview/?q=${product.url.replace(/^https?:\/\//, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 border rounded-lg hover:border-primary hover:bg-accent transition-colors"
            >
              <Image
                src="https://www.google.com/s2/favicons?domain=semrush.com&sz=32"
                alt="SEMrush"
                width={32}
                height={32}
                className="w-8 h-8 rounded"
                unoptimized
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium">SEMrush</div>
                <div className="text-xs text-muted-foreground truncate">
                  Traffic & Keywords
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </Link>

            <Link
              href={`https://ahrefs.com/site-explorer/overview/v2/subdomains/live?target=${product.url.replace(/^https?:\/\//, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 border rounded-lg hover:border-primary hover:bg-accent transition-colors"
            >
              <Image
                src="https://www.google.com/s2/favicons?domain=ahrefs.com&sz=32"
                alt="Ahrefs"
                width={32}
                height={32}
                className="w-8 h-8 rounded"
                unoptimized
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium">Ahrefs</div>
                <div className="text-xs text-muted-foreground truncate">
                  Backlinks & DR
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </Link>

            <Link
              href={`https://moz.com/domain-analysis?site=${product.url.replace(/^https?:\/\//, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 border rounded-lg hover:border-primary hover:bg-accent transition-colors"
            >
              <Image
                src="https://www.google.com/s2/favicons?domain=moz.com&sz=32"
                alt="Moz"
                width={32}
                height={32}
                className="w-8 h-8 rounded"
                unoptimized
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium">Moz</div>
                <div className="text-xs text-muted-foreground truncate">
                  Domain Authority
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </Link>

            <Link
              href={`https://majestic.com/reports/site-explorer?q=${product.url.replace(/^https?:\/\//, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 border rounded-lg hover:border-primary hover:bg-accent transition-colors"
            >
              <Image
                src="https://www.google.com/s2/favicons?domain=majestic.com&sz=32"
                alt="Majestic"
                width={32}
                height={32}
                className="w-8 h-8 rounded"
                unoptimized
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium">Majestic</div>
                <div className="text-xs text-muted-foreground truncate">
                  Trust Flow & Citations
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
