"use client";

import Link from "next/link";
import { clearAllSavedProductsAction, getSavedProductsAction } from "@/actions/saved-products";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SavedProductCard } from "@/components/products/SavedProductCard";
import type { SavedProductWithDetails } from "@/actions/saved-products";
import { Bookmark, BookmarkX, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";

interface SavedProductsProps {
  initialProducts?: SavedProductWithDetails[];
  totalCount?: number;
}

export default function SavedProductsClient({
  initialProducts = [],
  totalCount = 0,
}: SavedProductsProps) {
  const [products, setProducts] = useState<SavedProductWithDetails[]>(initialProducts);
  const [pageIndex, setPageIndex] = useState(0);
  const [hasMore, setHasMore] = useState(initialProducts.length < totalCount);
  const [isLoading, setIsLoading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const { ref, inView } = useInView({
    threshold: 0,
  });

  const loadMoreProducts = useCallback(async () => {
    if (!hasMore || isLoading) return;

    setIsLoading(true);
    const nextPageIndex = pageIndex + 1;
    const response = await getSavedProductsAction({
      pageIndex: nextPageIndex,
      pageSize: 12,
    });

    if (response.success && response.data?.products) {
      const newProducts = response.data.products;
      setProducts((prevProducts) => {
        const updatedProducts = [...prevProducts, ...newProducts];
        setHasMore(updatedProducts.length < totalCount);
        return updatedProducts;
      });
      setPageIndex(nextPageIndex);
    } else {
      setHasMore(false);
    }
    setIsLoading(false);
  }, [hasMore, isLoading, pageIndex, totalCount]);

  useEffect(() => {
    setProducts(initialProducts);
    setPageIndex(0);
    setHasMore(initialProducts.length < totalCount);
  }, [initialProducts, totalCount]);

  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      loadMoreProducts();
    }
  }, [inView, hasMore, isLoading, loadMoreProducts]);

  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      const result = await clearAllSavedProductsAction();
      if (result.success) {
        setProducts([]);
        setPageIndex(0);
        setHasMore(false);
        toast.success("All saved products cleared.");
      } else {
        toast.error(result.error || "Failed to clear saved products.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            <CardTitle>Saved Products</CardTitle>
            {products.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">({products.length})</span>
            )}
          </div>
          {products.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <BookmarkX className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all saved products?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all products from your saved items. This action cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearAll}
                    disabled={isClearing}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isClearing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((savedProduct) => (
                <SavedProductCard key={savedProduct.id} savedProduct={savedProduct} />
              ))}
            </div>
            {hasMore && (
              <div ref={ref} className="text-center py-8">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Loading more saved products...</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-16 flex flex-col items-center gap-4">
            <div className="w-fit flex justify-center items-center text-muted-foreground bg-muted rounded-full p-6">
              <Bookmark className="h-12 w-12" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-1">No saved products yet</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Start saving products you're interested in for easy access later.
              </p>
              <Button asChild>
                <Link href="/categories" title="Browse products">
                  Browse Products
                </Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
