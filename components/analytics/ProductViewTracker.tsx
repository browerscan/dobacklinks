"use client";

import { useEffect } from "react";
import { trackProductView } from "@/lib/analytics";

interface ProductViewTrackerProps {
  productId: string;
  productName: string;
  productCategory?: string;
  productDR?: number;
}

export function ProductViewTracker({
  productId,
  productName,
  productCategory,
  productDR,
}: ProductViewTrackerProps) {
  useEffect(() => {
    // Track product view on mount
    trackProductView(productId, productName, productCategory, productDR);
  }, [productId, productName, productCategory, productDR]);

  // This component doesn't render anything
  return null;
}
