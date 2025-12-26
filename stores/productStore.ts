import { ProductWithCategories, UserProductFilters } from "@/types/product";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface ProductCacheEntry {
  filters: UserProductFilters;
  products: ProductWithCategories[];
  totalCount: number;
  timestamp: number;
  cacheKey: string;
}

interface ProductState {
  // Cached product entries
  cache: Map<string, ProductCacheEntry>;

  // Currently loading states
  loading: Map<string, boolean>;

  // Actions
  getCachedProducts: (filters: UserProductFilters) => ProductCacheEntry | null;
  setCachedProducts: (
    filters: UserProductFilters,
    products: ProductWithCategories[],
    totalCount: number,
  ) => void;
  setLoading: (cacheKey: string, loading: boolean) => void;
  isLoading: (filters: UserProductFilters) => boolean;
  clearCache: () => void;
  clearExpiredCache: () => void;
  invalidateCache: (filters?: Partial<UserProductFilters>) => void;
}

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

// Generate cache key from filters
function generateCacheKey(filters: UserProductFilters): string {
  const sortedEntries = Object.entries(filters)
    .filter(([_, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b));

  return JSON.stringify(sortedEntries);
}

// Check if cache entry is expired
function isCacheExpired(timestamp: number): boolean {
  return Date.now() - timestamp > CACHE_TTL;
}

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      cache: new Map(),
      loading: new Map(),

      getCachedProducts: (filters) => {
        const state = get();
        // Ensure cache is a Map
        const cache =
          state.cache instanceof Map
            ? state.cache
            : new Map(
                Object.entries(state.cache || {}).map(([k, v]) => [k, v as ProductCacheEntry]),
              );

        const cacheKey = generateCacheKey(filters);
        const entry = cache.get(cacheKey);

        if (!entry || isCacheExpired(entry.timestamp)) {
          return null;
        }

        return entry;
      },

      setCachedProducts: (filters, products, totalCount) => {
        const cacheKey = generateCacheKey(filters);
        const entry: ProductCacheEntry = {
          filters,
          products,
          totalCount,
          timestamp: Date.now(),
          cacheKey,
        };

        set((state) => {
          // Ensure cache is a Map
          const currentCache =
            state.cache instanceof Map
              ? state.cache
              : new Map(
                  Object.entries(state.cache || {}).map(([k, v]) => [k, v as ProductCacheEntry]),
                );
          const newCache = new Map(currentCache);
          newCache.set(cacheKey, entry);
          return { cache: newCache };
        });
      },

      setLoading: (cacheKey, loading) => {
        set((state) => {
          // Ensure loading is a Map
          const currentLoading =
            state.loading instanceof Map
              ? state.loading
              : new Map(Object.entries(state.loading || {}).map(([k, v]) => [k, v as boolean]));
          const newLoading = new Map(currentLoading);
          if (loading) {
            newLoading.set(cacheKey, true);
          } else {
            newLoading.delete(cacheKey);
          }
          return { loading: newLoading };
        });
      },

      isLoading: (filters) => {
        const state = get();
        // Ensure loading is a Map
        const loading =
          state.loading instanceof Map
            ? state.loading
            : new Map(Object.entries(state.loading || {}).map(([k, v]) => [k, v as boolean]));

        const cacheKey = generateCacheKey(filters);
        return loading.get(cacheKey) || false;
      },

      clearCache: () => {
        set({ cache: new Map(), loading: new Map() });
      },

      clearExpiredCache: () => {
        set((state) => {
          // Ensure cache is a Map
          const currentCache =
            state.cache instanceof Map
              ? state.cache
              : new Map(
                  Object.entries(state.cache || {}).map(([k, v]) => [k, v as ProductCacheEntry]),
                );
          const newCache = new Map<string, ProductCacheEntry>();
          for (const [key, entry] of currentCache) {
            if (!isCacheExpired(entry.timestamp)) {
              newCache.set(key, entry);
            }
          }
          return { cache: newCache };
        });
      },

      invalidateCache: (filters) => {
        if (!filters || Object.keys(filters).length === 0) {
          // Clear all cache if no specific filters provided
          get().clearCache();
          return;
        }

        set((state) => {
          // Ensure cache is a Map
          const currentCache =
            state.cache instanceof Map
              ? state.cache
              : new Map(
                  Object.entries(state.cache || {}).map(([k, v]) => [k, v as ProductCacheEntry]),
                );
          const newCache = new Map<string, ProductCacheEntry>();
          for (const [key, entry] of currentCache) {
            // Check if cached entry matches any of the invalidation filters
            let shouldInvalidate = false;

            for (const [filterKey, filterValue] of Object.entries(filters)) {
              if (
                filterValue !== undefined &&
                entry.filters[filterKey as keyof UserProductFilters] === filterValue
              ) {
                shouldInvalidate = true;
                break;
              }
            }

            if (!shouldInvalidate) {
              newCache.set(key, entry);
            }
          }

          return { cache: newCache };
        });
      },
    }),
    {
      name: "product-store",
      storage: createJSONStorage(() => sessionStorage),
      // Only persist cache, not loading state
      partialize: (state) => ({
        cache: state.cache instanceof Map ? Array.from(state.cache.entries()) : [],
        // Don't persist loading state as it should be reset on page reload
      }),
      // Handle rehydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert array back to Map after rehydration
          const cacheArray = (state as any).cache;
          if (Array.isArray(cacheArray)) {
            state.cache = new Map(cacheArray);
          } else {
            state.cache = new Map();
          }
          // Always reset loading state
          state.loading = new Map();
        }
      },
    },
  ),
);
