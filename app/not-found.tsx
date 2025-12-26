"use client";

import { Button } from "@/components/ui/button";
import { HireMeCTA } from "@/components/cta/HireMeCTA";
import Link from "next/link";
import { Home, Search, ArrowLeft, BookOpen } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center py-12">
      <div className="container max-w-4xl px-4">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left side - Error message */}
          <div className="text-center md:text-left">
            <div className="text-6xl sm:text-8xl font-bold mb-4 text-primary">404</div>

            <h1 className="text-2xl sm:text-3xl font-bold mb-4">Page Not Found</h1>

            <p className="text-gray-600 dark:text-gray-400 mb-8 text-base sm:text-lg">
              Sorry, we couldn&apos;t find the page you&apos;re looking for. The site may have been
              removed or the URL might be incorrect.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start mb-8">
              <Button asChild>
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Browse Directory
                </Link>
              </Button>

              <Button variant="outline" onClick={() => window.history.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>

            {/* Quick links */}
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground font-medium">Popular pages:</p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/categories">
                    <Search className="w-3 h-3 mr-1" />
                    Categories
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/services">Services</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/blog">
                    <BookOpen className="w-3 h-3 mr-1" />
                    Blog
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Right side - Hire Me CTA */}
          <div className="hidden md:block">
            <HireMeCTA
              variant="sidebar"
              title="Can't Find What You Need?"
              description="Let me help you find the perfect guest post opportunities. Personal service, curated data, fast delivery."
              ctaText="Get Custom List"
            />
          </div>
        </div>

        {/* Mobile CTA */}
        <div className="mt-8 md:hidden">
          <HireMeCTA
            variant="inline"
            title="Can't find what you need?"
            description="Let me help you find the perfect guest post opportunities."
            ctaText="Get Custom List"
          />
        </div>
      </div>
    </div>
  );
}
