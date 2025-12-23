"use client";

import { useEffect, useState } from "react";

const SEARCH_HISTORY_KEY = "guest_post_search_history";
const MAX_HISTORY_ITEMS = 10;

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load history from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SearchHistoryItem[];
        setHistory(parsed);
      }
    } catch (error) {
      console.error("Failed to load search history:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save search to history
  const addToHistory = (query: string) => {
    if (!query.trim()) return;

    const newItem: SearchHistoryItem = {
      query: query.trim(),
      timestamp: Date.now(),
    };

    setHistory((prev) => {
      // Remove duplicate if exists
      const filtered = prev.filter(
        (item) => item.query.toLowerCase() !== query.toLowerCase(),
      );

      // Add new item to beginning
      const updated = [newItem, ...filtered];

      // Keep only the most recent MAX_HISTORY_ITEMS
      const limited = updated.slice(0, MAX_HISTORY_ITEMS);

      // Save to localStorage
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(limited));
      } catch (error) {
        console.error("Failed to save search history:", error);
      }

      return limited;
    });
  };

  // Clear all history
  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
      console.error("Failed to clear search history:", error);
    }
  };

  // Remove specific item
  const removeFromHistory = (query: string) => {
    setHistory((prev) => {
      const filtered = prev.filter(
        (item) => item.query.toLowerCase() !== query.toLowerCase(),
      );

      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filtered));
      } catch (error) {
        console.error("Failed to update search history:", error);
      }

      return filtered;
    });
  };

  return {
    history,
    isLoaded,
    addToHistory,
    clearHistory,
    removeFromHistory,
  };
}
