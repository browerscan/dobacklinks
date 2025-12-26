"use client";

import { removeSavedProductAction } from "@/actions/saved-products";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/products/SaveButton";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils";
import { TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { SavedProductWithDetails } from "@/actions/saved-products";

interface SavedProductCardProps {
  savedProduct: SavedProductWithDetails;
}

const statusBadgeStyle: Record<string, string> = {
  live: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  pending_review: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
};

export function SavedProductCard({ savedProduct }: SavedProductCardProps) {
  const router = useRouter();
  const [isRemoving, setIsRemoving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const product = savedProduct.product;

  const handleRemove = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsRemoving(true);
    try {
      const result = await removeSavedProductAction(product.id);
      if (result.success) {
        setIsDialogOpen(false);
        toast.success("Product removed from saved items.");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to remove product.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unknown error occurred.");
    } finally {
      setIsRemoving(false);
    }
  };

  const savedDate = new Date(savedProduct.createdAt).toLocaleDateString();

  return (
    <div
      className={cn(
        `bg-card rounded-xl shadow-md border-2 border-primary/20 dark:border-primary/30 p-4 hover:shadow-lg h-full flex flex-col`,
        "border-gray-100 dark:border-gray-800",
      )}
    >
      <div className="flex items-start justify-between mb-3 flex-shrink-0">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {product.logoUrl ? (
            <Image
              src={product.logoUrl}
              alt={`${product.name} logo`}
              width={40}
              height={40}
              className="rounded-lg flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700">
              <span className="text-white font-bold">{product.name.charAt(0)}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold line-clamp-1 text-gray-900 dark:text-gray-100">
              {product.name}
            </h3>
            {product.niche && (
              <p className="text-xs text-muted-foreground truncate">{product.niche}</p>
            )}
          </div>
        </div>
        <SaveButton productId={product.id} initialSaved={true} variant="icon" size="sm" />
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
        {product.tagline}
      </p>

      <div className="flex-grow"></div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 text-xs mb-3 p-2 bg-muted/50 rounded-lg">
        <div className="text-center">
          <div className="text-muted-foreground">DR</div>
          <div className="font-semibold">{product.dr ?? "—"}</div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground">DA</div>
          <div className="font-semibold">{product.da ?? "—"}</div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground">Traffic</div>
          <div className="font-semibold flex items-center justify-center gap-0.5">
            {product.monthlyVisits ? (
              <>
                <TrendingUp className="w-2.5 h-2.5" />
                {formatNumber(product.monthlyVisits)}
              </>
            ) : (
              product.traffic || "N/A"
            )}
          </div>
        </div>
      </div>

      {/* Categories and Status */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {savedProduct.categories?.slice(0, 2).map((category) => (
          <Badge
            key={category.id}
            variant="outline"
            className="text-xs bg-gray-100 dark:bg-gray-700"
          >
            {category.name}
          </Badge>
        ))}
        {product.status && (
          <Badge
            className={cn("capitalize text-xs", statusBadgeStyle[product.status] || "bg-gray-500")}
            variant="outline"
          >
            {product.status.replace(/_/g, " ")}
          </Badge>
        )}
      </div>

      {/* Footer with date and actions */}
      <div className="flex items-center justify-between border-t pt-3 mt-auto text-xs text-muted-foreground">
        <span>Saved {savedDate}</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link
              href={`/sites/${product.slug}`}
              target="_blank"
              title={`View ${product.name}`}
              prefetch={false}
            >
              View
            </Link>
          </Button>

          <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                Remove
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove from saved items?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove {product.name} from your saved products. You can save it again
                  later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRemove}
                  disabled={isRemoving}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
