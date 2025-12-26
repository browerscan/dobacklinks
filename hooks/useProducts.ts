import { getFeaturedProducts, getLatestProducts, getProducts } from "@/actions/products/user";
import { useProductStore } from "@/stores/productStore";
import { UserProductFilters } from "@/types/product";
import { useEffect, useMemo } from "react";
import useSWR from "swr";

// Generate cache key for SWR
function generateSWRKey(filters: UserProductFilters, type?: "featured" | "latest"): string {
  const baseKey = JSON.stringify(filters);
  return type ? `products:${type}:${baseKey}` : `products:${baseKey}`;
}

// SWR fetcher functions
const fetchers = {
  products: async (filters: UserProductFilters) => {
    const result = await getProducts(filters);
    if (!result.success) {
      throw new Error(result.error || "Failed to fetch products");
    }
    return result.data;
  },

  featured: async (filters: Omit<UserProductFilters, "isFeatured">) => {
    const result = await getFeaturedProducts(filters);
    if (!result.success) {
      throw new Error(result.error || "Failed to fetch featured products");
    }
    return result.data;
  },

  latest: async (filters: Omit<UserProductFilters, "isFeatured">) => {
    const result = await getLatestProducts(filters);
    if (!result.success) {
      throw new Error(result.error || "Failed to fetch latest products");
    }
    return result.data;
  },
};

// Configuration
const SWR_CONFIG = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  refreshInterval: 5 * 60 * 1000, // 5 minutes
  dedupingInterval: 2000, // 2 seconds
  errorRetryCount: 3,
  errorRetryInterval: 5000, // 5 seconds
};

/**
 * Hook for fetching general products with caching
 */
export function useProducts(filters: UserProductFilters = {}) {
  const { getCachedProducts, setCachedProducts, setLoading, isLoading, clearExpiredCache } =
    useProductStore();

  // Clear expired cache on mount
  useEffect(() => {
    clearExpiredCache();
  }, [clearExpiredCache]);

  const swrKey = generateSWRKey(filters);

  // Check if we have cached data first
  const cachedData = useMemo(() => {
    return getCachedProducts(filters);
  }, [filters, getCachedProducts]);

  const {
    data,
    error,
    isLoading: swrLoading,
    mutate,
    isValidating,
  } = useSWR(swrKey, () => fetchers.products(filters), {
    ...SWR_CONFIG,
    // Use cached data as fallback
    fallbackData: cachedData
      ? {
          products: cachedData.products,
          count: cachedData.totalCount,
        }
      : undefined,
    onSuccess: (data) => {
      if (data) {
        setCachedProducts(filters, data.products, data.count);
      }
    },
    onLoadingSlow: () => {
      setLoading(swrKey, true);
    },
    onError: () => {
      setLoading(swrKey, false);
    },
  });

  // Update loading state
  useEffect(() => {
    setLoading(swrKey, swrLoading);
    return () => {
      setLoading(swrKey, false);
    };
  }, [swrLoading, swrKey, setLoading]);

  return {
    products: data?.products || [],
    totalCount: data?.count || 0,
    loading: swrLoading || isLoading(filters),
    error,
    isValidating,
    mutate,
    // Helper to check if data is from cache
    isFromCache: !!cachedData && !swrLoading,
  };
}

/**
 * Hook for fetching featured products with caching
 */
export function useFeaturedProducts(filters: Omit<UserProductFilters, "isFeatured"> = {}) {
  const { getCachedProducts, setCachedProducts, setLoading, isLoading, clearExpiredCache } =
    useProductStore();

  // Convert to full filters with isFeatured: true
  const fullFilters: UserProductFilters = useMemo(
    () => ({ ...filters, isFeatured: true }),
    [filters],
  );

  // Clear expired cache on mount
  useEffect(() => {
    clearExpiredCache();
  }, [clearExpiredCache]);

  const swrKey = generateSWRKey(fullFilters, "featured");

  // Check if we have cached data first
  const cachedData = useMemo(() => {
    return getCachedProducts(fullFilters);
  }, [fullFilters, getCachedProducts]);

  const {
    data,
    error,
    isLoading: swrLoading,
    mutate,
    isValidating,
  } = useSWR(swrKey, () => fetchers.featured(filters), {
    ...SWR_CONFIG,
    // Use cached data as fallback
    fallbackData: cachedData
      ? {
          products: cachedData.products,
          count: cachedData.totalCount,
        }
      : undefined,
    onSuccess: (data) => {
      if (data) {
        setCachedProducts(fullFilters, data.products, data.count);
      }
    },
    onLoadingSlow: () => {
      setLoading(swrKey, true);
    },
    onError: () => {
      setLoading(swrKey, false);
    },
  });

  // Update loading state
  useEffect(() => {
    setLoading(swrKey, swrLoading);
    return () => {
      setLoading(swrKey, false);
    };
  }, [swrLoading, swrKey, setLoading]);

  return {
    products: data?.products || [],
    totalCount: data?.count || 0,
    loading: swrLoading || isLoading(fullFilters),
    error,
    isValidating,
    mutate,
    // Helper to check if data is from cache
    isFromCache: !!cachedData && !swrLoading,
  };
}

/**
 * Hook for fetching latest products with caching
 */
export function useLatestProducts(filters: Omit<UserProductFilters, "isFeatured"> = {}) {
  const { getCachedProducts, setCachedProducts, setLoading, isLoading, clearExpiredCache } =
    useProductStore();

  // Convert to full filters with specific status for latest products
  const fullFilters: UserProductFilters = useMemo(
    () => ({
      ...filters,
      status: ["live", "expired"] as any,
    }),
    [filters],
  );

  // Clear expired cache on mount
  useEffect(() => {
    clearExpiredCache();
  }, [clearExpiredCache]);

  const swrKey = generateSWRKey(fullFilters, "latest");

  // Check if we have cached data first
  const cachedData = useMemo(() => {
    return getCachedProducts(fullFilters);
  }, [fullFilters, getCachedProducts]);

  const {
    data,
    error,
    isLoading: swrLoading,
    mutate,
    isValidating,
  } = useSWR(swrKey, () => fetchers.latest(filters), {
    ...SWR_CONFIG,
    // Use cached data as fallback
    fallbackData: cachedData
      ? {
          products: cachedData.products,
          count: cachedData.totalCount,
        }
      : undefined,
    onSuccess: (data) => {
      if (data) {
        setCachedProducts(fullFilters, data.products, data.count);
      }
    },
    onLoadingSlow: () => {
      setLoading(swrKey, true);
    },
    onError: () => {
      setLoading(swrKey, false);
    },
  });

  // Update loading state
  useEffect(() => {
    setLoading(swrKey, swrLoading);
    return () => {
      setLoading(swrKey, false);
    };
  }, [swrLoading, swrKey, setLoading]);

  return {
    products: data?.products || [],
    totalCount: data?.count || 0,
    loading: swrLoading || isLoading(fullFilters),
    error,
    isValidating,
    mutate,
    // Helper to check if data is from cache
    isFromCache: !!cachedData && !swrLoading,
  };
}

/**
 * Hook for invalidating product caches
 */
export function useInvalidateProducts() {
  const { invalidateCache } = useProductStore();

  return {
    invalidateAll: () => invalidateCache(),
    invalidateByCategory: (categoryId: string) => invalidateCache({ categoryId }),
    invalidateFeatured: () => invalidateCache({ isFeatured: true }),
    invalidateByStatus: (status: string) => invalidateCache({ status } as any),
  };
}
