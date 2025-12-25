"use client";

import Image from "next/image";
import { useState } from "react";
import { getScreenshotUrl } from "@/lib/utils/screenshot-url";

interface ScreenshotDisplayProps {
  screenshotUrl?: string | null;
  thumbnailUrl?: string | null;
  name: string;
  className?: string;
}

/**
 * 详情页完整截图展示组件
 */
export function ScreenshotDisplay({
  screenshotUrl,
  thumbnailUrl,
  name,
  className = "",
}: ScreenshotDisplayProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (!screenshotUrl && !thumbnailUrl) {
    return null;
  }

  // Convert local paths to R2 CDN URLs
  const imageUrl = getScreenshotUrl(screenshotUrl) || getScreenshotUrl(thumbnailUrl);

  if (!imageUrl) {
    return null;
  }

  return (
    <div
      className={`rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 ${className}`}
    >
      {isLoading && (
        <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 animate-pulse flex items-center justify-center">
          <span className="text-gray-400 text-sm">Loading screenshot...</span>
        </div>
      )}

      {hasError ? (
        <div className="w-full h-64 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <span className="text-gray-400 text-sm">Screenshot unavailable</span>
        </div>
      ) : (
        <Image
          src={imageUrl}
          alt={`${name} screenshot`}
          width={1920}
          height={1080}
          className={`w-full h-auto ${isLoading ? "hidden" : "block"}`}
          onLoadingComplete={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          priority={false}
        />
      )}
    </div>
  );
}

/**
 * 列表页缩略图展示组件
 */
export function ScreenshotThumbnail({
  thumbnailUrl,
  name,
  className = "",
}: ScreenshotDisplayProps) {
  const [hasError, setHasError] = useState(false);

  // Convert local paths to R2 CDN URLs
  const imageUrl = getScreenshotUrl(thumbnailUrl);

  if (!imageUrl || hasError) {
    return null;
  }

  return (
    <div
      className={`mt-2 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 ${className}`}
    >
      <Image
        src={imageUrl}
        alt={`${name} preview`}
        width={400}
        height={300}
        className="w-full h-auto"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
