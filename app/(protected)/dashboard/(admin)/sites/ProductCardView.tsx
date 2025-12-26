"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ProductWithCategories } from "@/types/product";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ProductActions } from "./ProductActions";

const statusBadgeStyle = {
  live: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  pending_review: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
};

interface ProductCardViewProps {
  products: ProductWithCategories[];
}

export function ProductCardView({ products }: ProductCardViewProps) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {products.map((product) => (
        <Card key={product.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              {product.logoUrl ? (
                <Image
                  src={product.logoUrl}
                  alt={`${product.name} logo`}
                  width={48}
                  height={48}
                  loading="lazy"
                  className="rounded-md"
                />
              ) : (
                <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center text-xs">
                  -
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/sites/${product.slug}`}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    prefetch={false}
                    className="font-semibold hover:underline truncate"
                  >
                    {product.name}
                  </Link>
                  <Badge
                    className={cn(
                      "capitalize shrink-0",
                      statusBadgeStyle[product.status] || "bg-gray-500",
                    )}
                    variant="outline"
                  >
                    {product.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                {product.tagline && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {product.tagline}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pb-3 space-y-3">
            {/* Niche */}
            {product.niche && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Niche:</span>
                <Badge variant="secondary">{product.niche}</Badge>
              </div>
            )}

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">DR:</span>
                <span className="ml-2 font-medium">{product.dr ?? "-"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">DA:</span>
                <span className="ml-2 font-medium">{product.da ?? "-"}</span>
              </div>
            </div>

            {/* Website Link */}
            <Link
              href={product.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              prefetch={false}
              className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <span>Visit Website</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </CardContent>

          <CardFooter className="pt-0">
            <ProductActions product={product} />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
