"use client";

import { getMyProducts } from "@/actions/products/user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductWithCategories } from "@/types/product";
import { Rocket } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { MyProductCard } from "./MyProductCard";

interface ProductsProps {
  initialProducts?: ProductWithCategories[];
  totalCount?: number;
}

export default function MyProducts({
  initialProducts = [],
  totalCount = 0,
}: ProductsProps) {
  const [products, setProducts] =
    useState<ProductWithCategories[]>(initialProducts);
  const [pageIndex, setPageIndex] = useState(0);
  const [hasMore, setHasMore] = useState(initialProducts.length < totalCount);
  const { ref, inView } = useInView({
    threshold: 0,
  });

  const loadMoreProducts = useCallback(async () => {
    if (!hasMore) return;

    const nextPageIndex = pageIndex + 1;
    const response = await getMyProducts({
      pageIndex: nextPageIndex,
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
  }, [hasMore, pageIndex, totalCount]);

  useEffect(() => {
    setProducts(initialProducts);
    setPageIndex(0);
    setHasMore(initialProducts.length < totalCount);
  }, [initialProducts, totalCount]);

  useEffect(() => {
    if (inView && hasMore) {
      loadMoreProducts();
    }
  }, [inView, hasMore, loadMoreProducts]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>My Products</CardTitle>
          </div>
          {products.length > 0 && (
            <Button asChild>
              <Link href="/submit" title="Submit a Product">
                <Rocket /> Submit New Product
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <MyProductCard key={product.id} product={product} />
              ))}
            </div>
            {hasMore && (
              <div ref={ref} className="text-center py-8">
                <div className="text-sm text-gray-500">Loading More...</div>
              </div>
            )}
          </>
        ) : (
          <div className="py-8 flex flex-col items-center gap-4">
            <div className="w-fit flex justify-center items-center text-muted-foreground bg-muted rounded-full p-4">
              <Rocket className="w-8 h-8" />
            </div>
            <p className="text-muted-foreground text-sm">
              You have not submitted any products yet.
            </p>
            <Button asChild>
              <Link href="/submit" title="Submit a Product">
                <Rocket /> Submit a Product
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
