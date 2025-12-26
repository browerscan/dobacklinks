"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, DollarSign, Eye, Mail, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function GatedPricing() {
  const pathname = usePathname();

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 relative overflow-hidden">
      <CardHeader className="relative z-20 pb-4">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          <span>Pricing & Contact Information</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="relative z-20">
        <div className="space-y-6">
          {/* Value Preview - What's inside */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/60 border">
              <div className="p-2 rounded-md bg-green-100 dark:bg-green-900/30">
                <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Exact Pricing</h4>
                <p className="text-xs text-muted-foreground">Price ranges and breakdowns</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/60 border">
              <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30">
                <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Direct Contact</h4>
                <p className="text-xs text-muted-foreground">Email for direct outreach</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/60 border">
              <div className="p-2 rounded-md bg-amber-100 dark:bg-amber-900/30">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Turnaround Time</h4>
                <p className="text-xs text-muted-foreground">How fast they publish</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/60 border">
              <div className="p-2 rounded-md bg-purple-100 dark:bg-purple-900/30">
                <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Sample Posts</h4>
                <p className="text-xs text-muted-foreground">See published examples</p>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-4 py-2 border-y border-dashed">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              <span>9,700+ Sites</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              <span>Verified Metrics</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              <span>Free Account</span>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild size="lg" className="shadow-lg">
              <Link href={`/login?returnUrl=${encodeURIComponent(pathname)}`}>
                <Eye className="w-4 h-4 mr-2" />
                Sign In to Reveal Pricing
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/services">Hire Our Outreach Service Instead</Link>
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Free account • No credit card required • Instant access
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
