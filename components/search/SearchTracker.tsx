"use client";

import { useEffect } from "react";
import { trackSearch } from "@/lib/analytics";

interface SearchTrackerProps {
  searchTerm: string;
  resultsCount: number;
  searchCategory?: string;
}

export function SearchTracker({
  searchTerm,
  resultsCount,
  searchCategory,
}: SearchTrackerProps) {
  useEffect(() => {
    // Only track if there's a search term
    if (searchTerm) {
      trackSearch(searchTerm, searchCategory, resultsCount);
    }
  }, [searchTerm, resultsCount, searchCategory]);

  // This component doesn't render anything
  return null;
}
