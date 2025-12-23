import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Mail,
  Clock,
  Link as LinkIcon,
  FileText,
  ExternalLink,
} from "lucide-react";
import { ObfuscatedEmailLink } from "@/lib/utils/ObfuscatedEmailLink";
import Link from "next/link";
import { ValueForMoneyIndicator } from "@/components/products/ValueForMoneyIndicator";
import { EnhancedSampleUrls } from "@/components/products/EnhancedSampleUrls";

interface Product {
  name: string;
  url: string;
  priceRange: string | null;
  turnaroundTime: string | null;
  contactEmail: string | null;
  maxLinks?: number | null;
  requiredContentSize?: number | null;
  sampleUrls?: string[] | null;
  // Price breakdown
  contentPlacementPrice?: number | string | null;
  writingPlacementPrice?: number | string | null;
  specialTopicPrice?: number | string | null;
  // Metrics for ValueForMoneyIndicator
  dr?: number | null;
  da?: number | null;
  spamScore?: number | null;
  monthlyVisits?: number | null;
}

interface PrivateSiteDataProps {
  product: Product;
}

export function PrivateSiteData({ product }: PrivateSiteDataProps) {
  return (
    <div className="space-y-6">
      {/* Value for Money Indicator */}
      {product.dr != null && product.priceRange && (
        <ValueForMoneyIndicator product={product} />
      )}

      {/* Pricing Information */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Guest Post Pricing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {product.priceRange && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Price Range
                </div>
                <div className="text-2xl font-bold text-primary">
                  {product.priceRange}
                </div>
              </div>
            )}

            {/* Price Breakdown */}
            {(product.contentPlacementPrice != null ||
              product.writingPlacementPrice != null ||
              product.specialTopicPrice != null) && (
              <div className="pt-3 border-t space-y-2">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Price Breakdown
                </div>

                {product.contentPlacementPrice != null &&
                  Number(product.contentPlacementPrice) > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Content Placement Only
                      </span>
                      <span className="text-sm font-semibold">
                        ${Number(product.contentPlacementPrice).toFixed(2)}
                      </span>
                    </div>
                  )}

                {product.writingPlacementPrice != null &&
                  Number(product.writingPlacementPrice) > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Writing + Placement
                      </span>
                      <span className="text-sm font-semibold">
                        ${Number(product.writingPlacementPrice).toFixed(2)}
                      </span>
                    </div>
                  )}

                {product.specialTopicPrice != null &&
                  Number(product.specialTopicPrice) > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Special Topic (add-on)
                      </span>
                      <span className="text-sm font-semibold text-orange-600">
                        +${Number(product.specialTopicPrice).toFixed(2)}
                      </span>
                    </div>
                  )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {product.turnaroundTime && (
                <div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                    <Clock className="w-4 h-4" />
                    Turnaround Time
                  </div>
                  <div className="font-semibold">{product.turnaroundTime}</div>
                </div>
              )}

              {product.maxLinks != null && (
                <div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                    <LinkIcon className="w-4 h-4" />
                    Max Links
                  </div>
                  <div className="font-semibold">{product.maxLinks} links</div>
                </div>
              )}
            </div>

            {product.requiredContentSize != null &&
              product.requiredContentSize > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Required Word Count
                  </div>
                  <div className="font-semibold">
                    {product.requiredContentSize} words minimum
                  </div>
                </div>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      {product.contactEmail && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                Direct Contact
              </div>
              <ObfuscatedEmailLink email={product.contactEmail} />
            </div>
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Tip:</strong> Or use our outreach service at{" "}
                <ObfuscatedEmailLink
                  email="outreach@dobacklinks.com"
                  className="text-blue-600 hover:underline"
                />{" "}
                - We handle everything for you!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Sample URLs */}
      {Array.isArray(product.sampleUrls) && product.sampleUrls.length > 0 && (
        <EnhancedSampleUrls
          sampleUrls={product.sampleUrls}
          siteName={product.name}
          siteUrl={product.url}
        />
      )}
    </div>
  );
}
