import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
/**
 * Convert kebab-case string to PascalCase
 * @param str - The kebab-case string to convert
 * @returns PascalCase string
 */
export function kebabToPascalCase(str: string): string {
  if (!str) return str;
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

export function formatCurrency(
  amount: number | null | undefined,
  currency: string | null | undefined,
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "-";
  }
  const effectiveCurrency = currency || process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || "usd";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: effectiveCurrency.toUpperCase(),
    }).format(amount);
  } catch (e) {
    console.error("Error formatting currency:", e);
    return `${amount.toFixed(2)} ${effectiveCurrency.toUpperCase()}`;
  }
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatValue(value: number | string, unit: "count" | "revenue") {
  if (unit === "revenue") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(value));
  }
  return value.toLocaleString();
}

/**
 * Format a number with K/M/B suffix for display
 * @param num - The number to format
 * @returns Formatted string (e.g., "1.5K", "2.3M")
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return "-";
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toString();
}
