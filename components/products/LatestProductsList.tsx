"use client";

import { getLatestProducts } from "@/actions/products/user";
import { LatestProductCard } from "@/components/products/LatestProductCard";
import { Button } from "@/components/ui/button";
import { useLatestProducts } from "@/hooks/useProducts";
import { ProductWithCategories } from "@/types/product";
import { Rocket } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

interface ProductsListProps {
  initialProducts?: ProductWithCategories[];
  totalCount?: number;
  categoryId?: string;
  // New prop to enable/disable client-side caching
  useClientCache?: boolean;
}

export function LatestProductsList({
  initialProducts = [],
  totalCount = 0,
  categoryId,
  useClientCache = false,
}: ProductsListProps) {
  // Use cached hook if enabled
  const {
    products: cachedProducts,
    totalCount: cachedTotalCount,
    loading: cachedLoading,
  } = useLatestProducts(useClientCache ? { categoryId, pageIndex: 0 } : {});

  // State for pagination
  const [products, setProducts] = useState<ProductWithCategories[]>(
    useClientCache ? cachedProducts : initialProducts,
  );
  const [pageIndex, setPageIndex] = useState(0);
  const [hasMore, setHasMore] = useState(
    useClientCache
      ? cachedProducts.length < cachedTotalCount
      : initialProducts.length < totalCount,
  );
  const [loading, setLoading] = useState(false);

  const { ref, inView } = useInView({
    threshold: 0,
  });

  const loadMoreProducts = useCallback(async () => {
    if (!hasMore || loading) return;

    setLoading(true);
    const nextPageIndex = pageIndex + 1;

    try {
      const response = await getLatestProducts({
        pageIndex: nextPageIndex,
        categoryId,
      });

      if (response.success && response.data?.products) {
        const newProducts = response.data.products;
        setProducts((prevProducts) => {
          const updatedProducts = [...prevProducts, ...newProducts];
          const currentTotalCount = useClientCache
            ? cachedTotalCount
            : totalCount;
          setHasMore(updatedProducts.length < currentTotalCount);
          return updatedProducts;
        });
        setPageIndex(nextPageIndex);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more products:", error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [
    hasMore,
    loading,
    pageIndex,
    categoryId,
    useClientCache,
    cachedTotalCount,
    totalCount,
  ]);

  // Update state when props change
  useEffect(() => {
    if (useClientCache) {
      setProducts(cachedProducts);
      setPageIndex(0);
      setHasMore(cachedProducts.length < cachedTotalCount);
    } else {
      setProducts(initialProducts);
      setPageIndex(0);
      setHasMore(initialProducts.length < totalCount);
    }
  }, [
    useClientCache,
    cachedProducts,
    cachedTotalCount,
    initialProducts,
    totalCount,
    categoryId,
  ]);

  useEffect(() => {
    if (inView && hasMore && !loading) {
      loadMoreProducts();
    }
  }, [inView, hasMore, loading, loadMoreProducts]);

  // Show skeleton loading for initial load when using client cache
  if (cachedLoading && useClientCache && products.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Latest
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-48 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Latest
      </h2>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 rounded-2xl flex items-center justify-center shadow-lg">
              <Rocket className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
            Be the first to list a site here!
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
            No sites in this category yet. Add yours and reach more publishers
            and marketers.
          </p>

          <Button
            asChild
            className="shadow-lg hover:shadow-xl transition-shadow"
          >
            <Link href="/submit" className="flex items-center gap-2">
              <Rocket className="w-4 h-4" />
              Submit Your Site
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
              <LatestProductCard key={product.id} product={product} />
            ))}
          </div>
          {hasMore && (
            <div ref={ref} className="text-center py-8">
              <div className="text-sm text-gray-500">
                {loading ? "Loading More..." : ""}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
