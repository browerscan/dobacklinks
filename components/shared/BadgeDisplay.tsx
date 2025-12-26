"use client";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { Copy } from "lucide-react";
import { toast } from "sonner";

export interface BadgeItem {
  name: string;
  label: string;
  imageName: string;
}

export interface BadgeDisplayProps {
  badges?: BadgeItem[];
  showTitle?: boolean;
  title?: string;
  layout?: "horizontal" | "vertical";
  className?: string;
  imageWidth?: number;
  imageHeight?: number;
}

export const defaultBadges: BadgeItem[] = [
  { name: "dark", label: "Dark", imageName: "badge_dark.svg" },
  { name: "light", label: "Light", imageName: "badge_light.svg" },
  {
    name: "transparent",
    label: "Transparent",
    imageName: "badge_transparent.svg",
  },
];

export function BadgeDisplay({
  badges = defaultBadges,
  showTitle = true,
  title = "Select a badge to display on your website",
  layout = "horizontal",
  className = "",
  imageWidth = 200,
  imageHeight = 54,
}: BadgeDisplayProps) {
  const handleCopyEmbed = (image_name: string) => {
    const embedCode = `<a href="${siteConfig.url}" target="_blank"><img src="${siteConfig.url}/badge/${image_name}" alt="Featured on ${siteConfig.name}" width="${imageWidth}" height="${imageHeight}" /></a>`;

    navigator.clipboard.writeText(embedCode);
    toast.success("Badge embed code copied to clipboard!");
  };

  const layoutClass =
    layout === "vertical" ? "flex flex-col gap-4" : "flex items-center gap-4 flex-col md:flex-row";

  return (
    <div className={className}>
      {showTitle && title && <p className="text-sm mb-2">{title}</p>}
      <div className={layoutClass}>
        {badges.map((badge) => (
          <div key={badge.name} className="flex flex-col items-center gap-1">
            <a href={siteConfig.url} target="_blank" rel="noopener noreferrer">
              <img
                src={`${siteConfig.url}/badge/${badge.imageName}`}
                alt={`Featured on ${siteConfig.name}`}
                width={imageWidth}
                height={imageHeight}
                loading="lazy"
                className="hover:opacity-80 transition-opacity"
              />
            </a>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                handleCopyEmbed(badge.imageName);
              }}
              className="text-xs"
            >
              <Copy className="w-4 h-4 mr-1" />
              Copy {badge.label} Embed
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Export utility function for manual embed code generation
export function generateEmbedCode(
  imageName: string,
  width: number = 200,
  height: number = 54,
): string {
  return `<a href="${siteConfig.url}" target="_blank"><img src="${siteConfig.url}/badge/${imageName}" alt="Featured on ${siteConfig.name}" width="${width}" height="${height}" /></a>`;
}
