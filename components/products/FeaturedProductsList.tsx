"use client";

import { useFeaturedProducts } from "@/hooks/useProducts";
import { ProductWithCategories } from "@/types/product";
import { FeaturedProductCard } from "./FeaturedProductCard";

interface FeaturedProductsListProps {
  products?: ProductWithCategories[];
  categoryId?: string;
  // New prop to enable/disable client-side caching
  useClientCache?: boolean;
}

export function FeaturedProductsList({
  products: initialProducts,
  categoryId,
  useClientCache = false,
}: FeaturedProductsListProps) {
  // Use cached hook if enabled, otherwise use provided products
  const { products: cachedProducts, loading } = useFeaturedProducts(
    useClientCache ? { categoryId } : {},
  );

  const products = useClientCache ? cachedProducts : initialProducts || [];

  if (loading && useClientCache) {
    return (
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Featured
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-48 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Featured
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => (
          <FeaturedProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
