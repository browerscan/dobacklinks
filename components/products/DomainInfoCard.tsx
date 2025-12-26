"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Lock, Calendar, CheckCircle, XCircle } from "lucide-react";

interface Product {
  url: string;
  approvedDate?: string | null;
}

interface DomainInfoCardProps {
  product: Product;
}

/**
 * Estimate domain age based on approval date
 * This is a rough estimate since we don't have exact domain registration date
 */
function estimateDomainAge(approvedDate: string | null | undefined): {
  years: number;
  label: string;
  description: string;
} | null {
  if (!approvedDate) return null;

  try {
    const approved = new Date(approvedDate);
    const now = new Date();
    const diffYears = now.getFullYear() - approved.getFullYear();
    const diffMonths =
      (now.getFullYear() - approved.getFullYear()) * 12 + (now.getMonth() - approved.getMonth());

    let label = "";
    let description = "";

    if (diffYears >= 10) {
      label = "Veteran Site";
      description = "Established domain with long history";
    } else if (diffYears >= 5) {
      label = "Mature Site";
      description = "Well-established with proven track record";
    } else if (diffYears >= 3) {
      label = "Established Site";
      description = "Solid presence in the market";
    } else if (diffYears >= 1) {
      label = "Growing Site";
      description = "Building authority and presence";
    } else if (diffMonths >= 6) {
      label = "New Site";
      description = "Recently established";
    } else {
      label = "Very New";
      description = "Fresh domain";
    }

    return {
      years: diffYears,
      label,
      description,
    };
  } catch (e) {
    return null;
  }
}

/**
 * Check if URL uses HTTPS
 */
function checkHTTPS(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "https:";
  } catch (e) {
    return false;
  }
}

/**
 * Extract TLD from URL
 */
function extractTLD(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const parts = hostname.split(".");
    return parts[parts.length - 1].toUpperCase();
  } catch (e) {
    return "N/A";
  }
}

export function DomainInfoCard({ product }: DomainInfoCardProps) {
  const ageInfo = estimateDomainAge(product.approvedDate);
  const isHTTPS = checkHTTPS(product.url);
  const tld = extractTLD(product.url);

  // Extract hostname
  let hostname = "";
  try {
    const urlObj = new URL(product.url);
    hostname = urlObj.hostname.replace("www.", "");
  } catch (e) {
    hostname = product.url;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Domain Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Domain Name */}
          <div>
            <div className="text-xs text-muted-foreground mb-1">Domain</div>
            <div className="text-sm font-medium break-all">{hostname}</div>
          </div>

          {/* Security & Technical Info */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t">
            {/* HTTPS Status */}
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Security
              </div>
              <div className="flex items-center gap-1">
                {isHTTPS ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">HTTPS</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-600">HTTP Only</span>
                  </>
                )}
              </div>
            </div>

            {/* TLD */}
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Extension
              </div>
              <Badge variant="outline" className="font-mono">
                .{tld}
              </Badge>
            </div>
          </div>

          {/* Domain Age Estimate */}
          {ageInfo && (
            <div className="pt-3 border-t">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">
                      {ageInfo.years > 0
                        ? `${ageInfo.years} Year${ageInfo.years !== 1 ? "s" : ""} Old`
                        : "< 1 Year"}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {ageInfo.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{ageInfo.description}</p>

                  {product.approvedDate && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Platform approved since:{" "}
                      {new Date(product.approvedDate).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Trust Indicators */}
          <div className="pt-3 border-t">
            <div className="text-xs font-medium mb-2 text-muted-foreground">Trust Indicators:</div>
            <div className="flex flex-wrap gap-2">
              {isHTTPS && (
                <Badge variant="outline" className="text-xs">
                  <Lock className="w-3 h-3 mr-1" />
                  SSL Secured
                </Badge>
              )}
              {ageInfo && ageInfo.years >= 3 && (
                <Badge variant="outline" className="text-xs">
                  <Calendar className="w-3 h-3 mr-1" />
                  Established
                </Badge>
              )}
              {(tld === "COM" || tld === "ORG" || tld === "NET") && (
                <Badge variant="outline" className="text-xs">
                  <Globe className="w-3 h-3 mr-1" />
                  Generic TLD
                </Badge>
              )}
            </div>
          </div>

          {/* Info Note */}
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              Domain age is estimated based on platform approval date. Actual registration date may
              be earlier.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
