"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, Home, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[SiteDetail] Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-6">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">Something went wrong</h2>
      <p className="text-muted-foreground mb-6 text-center max-w-md">
        We couldn&apos;t load this site&apos;s details. This might be a
        temporary issue.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => reset()} variant="default">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Try again
        </Button>
        <Link href="/">
          <Button variant="outline">
            <Home className="mr-2 h-4 w-4" />
            Back to Directory
          </Button>
        </Link>
      </div>
      {process.env.NODE_ENV === "development" && error.message && (
        <div className="mt-8 p-4 bg-muted rounded-lg max-w-lg">
          <p className="text-sm font-mono text-muted-foreground break-all">
            {error.message}
          </p>
        </div>
      )}
    </div>
  );
}
