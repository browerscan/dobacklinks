"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Mail } from "lucide-react";
import Link from "next/link";
import { trackCTAClick } from "@/lib/analytics";

interface HireMeCTAProps {
  variant?: "sidebar" | "inline" | "modal";
  title?: string;
  description?: string;
  ctaText?: string;
}

export function HireMeCTA({ variant = "sidebar", title, description, ctaText }: HireMeCTAProps) {
  const handleCTAClick = (ctaName: string, ctaUrl: string) => {
    trackCTAClick(ctaName, variant, ctaUrl);
  };

  // Sidebar variant (vertical card)
  if (variant === "sidebar") {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-primary" />
            {title || "Need Help with Outreach?"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {description ||
              "Let me handle the guest posting for you. Personal service, proven results."}
          </p>

          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/services" onClick={() => handleCTAClick("Hire Me", "/services")}>
                <Sparkles className="w-4 h-4 mr-2" />
                {ctaText || "Hire Me"}
              </Link>
            </Button>

            <Button variant="outline" asChild className="w-full">
              <a
                href="mailto:outreach@dobacklinks.com"
                onClick={() => handleCTAClick("Email Me", "mailto:outreach@dobacklinks.com")}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email Me
              </a>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Pay now via PayPal, I start immediately
          </p>
        </CardContent>
      </Card>
    );
  }

  // Inline variant (horizontal banner)
  if (variant === "inline") {
    return (
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>

            <div className="flex-1 text-center md:text-left">
              <h3 className="font-semibold mb-1">{title || "Can't find what you need?"}</h3>
              <p className="text-sm text-muted-foreground">
                {description ||
                  "Hire me for custom research and personal outreach to 1,000+ publishers"}
              </p>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <Button asChild>
                <Link href="/services" onClick={() => handleCTAClick("Learn More", "/services")}>
                  {ctaText || "Learn More"}
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <a
                  href="mailto:outreach@dobacklinks.com"
                  onClick={() => handleCTAClick("Contact", "mailto:outreach@dobacklinks.com")}
                >
                  Contact
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Modal variant (for future use)
  return null;
}
