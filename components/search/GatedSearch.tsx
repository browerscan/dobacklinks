"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Search, Filter, BarChart3, Download } from "lucide-react";
import Link from "next/link";

export function GatedSearch() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Advanced Search & Filters</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Search and filter through 9,700+ guest post sites with advanced criteria
        </p>
      </div>

      {/* Main Gated Content */}
      <Card className="border-dashed border-2 border-primary/30 relative overflow-hidden max-w-4xl mx-auto">
        {/* Blurred background effect */}
        <div className="absolute inset-0 backdrop-blur-sm bg-background/80 z-10" />

        <CardContent className="relative z-20 py-12">
          <div className="text-center space-y-6">
            {/* Lock Icon */}
            <div className="w-fit mx-auto p-4 rounded-full bg-primary/10">
              <Lock className="w-12 h-12 text-primary" />
            </div>

            {/* Main Message */}
            <div>
              <h2 className="font-bold text-2xl mb-3">
                Sign in to unlock advanced search
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Create a free account to access powerful search and filtering tools for finding the perfect guest post sites.
              </p>
            </div>

            {/* Features List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <Search className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm mb-1">Full-Text Search</h3>
                  <p className="text-xs text-muted-foreground">
                    Search by site name, niche, or any keyword
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <Filter className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm mb-1">Advanced Filters</h3>
                  <p className="text-xs text-muted-foreground">
                    Filter by DR, DA, traffic, niche, link type, and more
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <BarChart3 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm mb-1">Traffic Data</h3>
                  <p className="text-xs text-muted-foreground">
                    See monthly visits, bounce rates, and traffic sources
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <Download className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm mb-1">Export Results</h3>
                  <p className="text-xs text-muted-foreground">
                    Download your filtered results as CSV
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button asChild size="lg">
                <Link href="/login?returnUrl=/search">
                  Sign In to Search
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/">Browse All Sites</Link>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Free to create an account • No credit card required
            </p>
          </div>

          {/* Fake blurred content in background */}
          <div className="absolute inset-0 z-0 opacity-10 p-8">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="h-10 bg-muted rounded" />
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-6 bg-muted rounded w-1/2" />
              </div>
              <div className="space-y-2">
                <div className="h-10 bg-muted rounded" />
                <div className="h-6 bg-muted rounded w-2/3" />
                <div className="h-6 bg-muted rounded w-3/4" />
              </div>
              <div className="space-y-2">
                <div className="h-10 bg-muted rounded" />
                <div className="h-6 bg-muted rounded w-1/2" />
                <div className="h-6 bg-muted rounded w-3/4" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <div className="max-w-4xl mx-auto mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          Looking for help with outreach?{" "}
          <Link href="/services" className="text-primary hover:underline font-medium">
            Hire our personal outreach service
          </Link>
        </p>
      </div>
    </div>
  );
}
