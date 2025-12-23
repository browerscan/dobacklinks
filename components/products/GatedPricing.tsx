"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, DollarSign } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function GatedPricing() {
  const pathname = usePathname();

  return (
    <Card className="border-dashed border-2 border-muted-foreground/30 relative overflow-hidden">
      {/* Blurred background effect */}
      <div className="absolute inset-0 backdrop-blur-sm bg-background/80 z-10" />

      <CardHeader className="relative z-20">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-muted-foreground" />
          <span className="text-muted-foreground">Pricing Information</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="relative z-20">
        <div className="text-center py-8 space-y-4">
          <div className="w-fit mx-auto p-4 rounded-full bg-muted">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">
              Sign in to see pricing and contact info
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Get access to detailed pricing, turnaround times, and direct
              contact information by signing in with your account.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link href={`/login?returnUrl=${encodeURIComponent(pathname)}`}>
                Sign In to View Pricing
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/services">Or Hire Our Outreach Service</Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Free to create an account • No credit card required
          </p>
        </div>

        {/* Fake blurred content in background */}
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="p-6 space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-8 bg-muted rounded w-2/3" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-1/4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
