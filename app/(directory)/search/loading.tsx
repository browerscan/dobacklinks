import { ProductsSkeleton } from "@/components/products/ProductsSkeleton";

export default function SearchLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Header Skeleton */}
      <div className="mb-8">
        <div className="h-9 bg-muted rounded animate-pulse w-64 mb-4" />
        <div className="h-10 bg-muted rounded animate-pulse max-w-2xl" />
      </div>

      {/* Results Count Skeleton */}
      <div className="h-5 bg-muted rounded animate-pulse w-48 mb-4" />

      {/* Products Grid Skeleton */}
      <ProductsSkeleton />
    </div>
  );
}
