/**
 * Google Analytics 4 Event Tracking Utilities
 *
 * This module provides type-safe event tracking functions for GA4.
 * All events follow GA4 recommended event patterns.
 */

// Declare gtag function for TypeScript
declare global {
  interface Window {
    gtag?: (command: "event", eventName: string, eventParams?: Record<string, any>) => void;
  }
}

/**
 * Generic event tracking function
 * @param eventName - GA4 event name
 * @param eventParams - Additional event parameters
 */
export function trackEvent(eventName: string, eventParams?: Record<string, any>): void {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, eventParams);
  }
}

/**
 * Track CTA click events
 * @param ctaName - Name of the CTA (e.g., "Hire Me", "Browse Sites")
 * @param ctaLocation - Where the CTA appears (e.g., "sidebar", "homepage", "404")
 * @param ctaUrl - Destination URL
 */
export function trackCTAClick(ctaName: string, ctaLocation: string, ctaUrl?: string): void {
  trackEvent("cta_click", {
    cta_name: ctaName,
    cta_location: ctaLocation,
    cta_url: ctaUrl,
  });
}

/**
 * Track product/site view events
 * @param productId - Product ID
 * @param productName - Product name
 * @param productCategory - Product category/niche
 * @param productDR - Domain Rating
 */
export function trackProductView(
  productId: string,
  productName: string,
  productCategory?: string,
  productDR?: number,
): void {
  trackEvent("view_item", {
    item_id: productId,
    item_name: productName,
    item_category: productCategory,
    item_brand: productName,
    domain_rating: productDR,
  });
}

/**
 * Track search events
 * @param searchTerm - User's search query
 * @param searchCategory - Category filter applied (if any)
 * @param resultsCount - Number of search results
 */
export function trackSearch(
  searchTerm: string,
  searchCategory?: string,
  resultsCount?: number,
): void {
  trackEvent("search", {
    search_term: searchTerm,
    search_category: searchCategory,
    results_count: resultsCount,
  });
}

/**
 * Track login events
 * @param method - Login method (e.g., "google", "github", "email")
 */
export function trackLogin(method: string): void {
  trackEvent("login", {
    method: method,
  });
}

/**
 * Track signup events
 * @param method - Signup method (e.g., "google", "github", "email")
 */
export function trackSignup(method: string): void {
  trackEvent("sign_up", {
    method: method,
  });
}
