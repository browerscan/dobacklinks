"use client";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export interface BadgeItem {
  name: string;
  label: string;
  imageName: string;
}

export const badges: BadgeItem[] = [
  { name: "light", label: "Light", imageName: "badge_light.svg" },
  { name: "dark", label: "Dark", imageName: "badge_dark.svg" },
  {
    name: "transparent",
    label: "Transparent",
    imageName: "badge_transparent.svg",
  },
];

export function AuthorityBadgeSection() {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopyEmbed = (imageName: string) => {
    const imageWidth = 200;
    const imageHeight = 54;
    const embedCode = `<a href="${siteConfig.url}" target="_blank"><img src="${siteConfig.url}/badge/${imageName}" alt="Featured on ${siteConfig.name}" width="${imageWidth}" height="${imageHeight}" /></a>`;

    navigator.clipboard.writeText(embedCode);
    toast.success("Badge embed code copied to clipboard!");
  };

  const displayedBadges = isExpanded ? badges : [badges[0]];

  const layoutClass = "flex flex-col gap-4";

  return (
    <section>
      <div className="text-lg font-semibold">Authority Badge</div>

      <p className="text-muted-foreground text-sm leading-relaxed mb-4">
        Showcase your credibility by adding our badge to your website.
      </p>

      <div className="space-y-3">
        <div className={layoutClass}>
          {displayedBadges.map((badge) => (
            <div key={badge.name} className="flex flex-col items-center gap-1">
              <img
                src={`${siteConfig.url}/badge/${badge.imageName}`}
                alt={`Featured on ${siteConfig.name}`}
                title={`Copy ${badge.label} Embed`}
                width={150}
                height={40}
                loading="lazy"
                className="hover:opacity-80 transition-opacity cursor-pointer"
                onClick={() => {
                  handleCopyEmbed(badge.imageName);
                }}
              />
            </div>
          ))}
        </div>

        {!isExpanded && badges.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setIsExpanded(true)}
          >
            <ChevronDown className="w-3 h-3 mr-1" />
            Show {badges.length - 1} more style
            {badges.length > 2 ? "s" : ""}
          </Button>
        )}

        {isExpanded && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setIsExpanded(false)}
          >
            <ChevronUp className="w-3 h-3 mr-1" />
            Show less
          </Button>
        )}
      </div>
    </section>
  );
}
