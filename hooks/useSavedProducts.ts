"use client";

import { isProductSavedAction } from "@/actions/saved-products";
import { authClient } from "@/lib/auth/auth-client";
import { useCallback, useEffect, useState } from "react";

export function useIsProductSaved(productId: string) {
  const { data: session } = authClient.useSession();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const checkSavedStatus = useCallback(async () => {
    if (!session?.user) {
      setIsSaved(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await isProductSavedAction(productId);
      if (result.success) {
        setIsSaved(result.data?.saved ?? false);
      }
    } catch (error) {
      console.error("Error checking saved status:", error);
    } finally {
      setIsLoading(false);
    }
  }, [productId, session]);

  useEffect(() => {
    checkSavedStatus();
  }, [checkSavedStatus]);

  return { isSaved, isLoading, refetch: checkSavedStatus };
}
