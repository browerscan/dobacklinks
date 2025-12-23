"use client";

import { formatNumber } from "@/lib/utils";
import { ProductWithCategories } from "@/types/product";
import {
  Crown,
  ExternalLink,
  CheckCircle,
  TrendingUp,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ScreenshotThumbnail } from "./ScreenshotDisplay";

interface FeaturedProductCardProps {
  product: ProductWithCategories;
}

export function FeaturedProductCard({ product }: FeaturedProductCardProps) {
  return (
    <div className="relative group">
      <Link
        href={`/sites/${product.slug}`}
        title={product.name}
        className="group block h-full"
      >
        <div className="relative pt-3 h-full">
          <div className="relative h-full">
            <div className="relative bg-card rounded-xl shadow-md border-2 border-primary/40 dark:border-primary/40 p-3 hover:shadow-lg hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-300 h-full flex flex-col">
              <div className="absolute -top-3 -right-3 z-50">
                <div className="bg-primary text-primary-foreground px-3 py-1 rounded-lg flex items-center gap-1 text-xs font-semibold">
                  <Crown className="w-3 h-3" />
                  FEATURED
                </div>
              </div>

              <div className="mb-2 flex-shrink-0">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="relative">
                    {product.logoUrl ? (
                      <div className="relative">
                        <Image
                          src={product.logoUrl}
                          alt={`${product.name} logo`}
                          width={32}
                          height={32}
                          className="rounded-lg flex-shrink-0"
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700">
                        <span className="text-white font-bold text-sm">
                          {product.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold line-clamp-1 truncate text-gray-900 dark:text-gray-100">
                      {product.name}
                    </h3>
                    {product.niche && (
                      <p className="text-xs text-muted-foreground truncate">
                        {product.niche}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
                  {product.tagline}
                </p>

                {/* Screenshot Thumbnail */}
                <ScreenshotThumbnail
                  thumbnailUrl={product.screenshotThumbnailUrl}
                  name={product.name}
                />

                {/* Badges */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {product.googleNews && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle className="w-2.5 h-2.5" />
                      News
                    </span>
                  )}
                  {product.linkType === "dofollow" && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      Dofollow
                    </span>
                  )}
                  {product.spamScore != null && product.spamScore <= 5 && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <Zap className="w-2.5 h-2.5" />
                      Low Spam
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-grow" />

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                <div>
                  <div className="text-muted-foreground">DR/DA</div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {product.dr ?? "—"}/{product.da ?? "—"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Traffic</div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100 inline-flex items-center gap-0.5">
                    {product.monthlyVisits ? (
                      <>
                        <TrendingUp className="w-3 h-3" />
                        {formatNumber(product.monthlyVisits)}
                      </>
                    ) : (
                      product.traffic || "N/A"
                    )}
                  </div>
                </div>
                {product.bounceRate && (
                  <div>
                    <div className="text-muted-foreground">Bounce</div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {product.bounceRate}%
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-muted-foreground">Price</div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {product.priceRange || "Contact"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>

      <a
        href={product.url}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-5 right-2 p-2 text-transparent group-hover:text-primary/80 transition-all duration-200 hover:scale-110 z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
}
