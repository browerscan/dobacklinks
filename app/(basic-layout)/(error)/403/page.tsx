import { Button } from "@/components/ui/button";
import { constructMetadata } from "@/lib/metadata";
import { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    title: "403 Forbidden",
    description: "You do not have permission to access this page.",
    path: `/403`,
  });
}

export default function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <h1 className="text-4xl font-bold">403 Forbidden</h1>
      <p className="text-muted-foreground">
        Sorry, you do not have permission to access this page.
      </p>
      <Button
        asChild
        className="highlight-bg text-white px-8 py-3 rounded-lg font-medium text-center hover:opacity-90 shadow-lg"
      >
        <Link href="/" title="Back to Home">
          Back to Home
        </Link>
      </Button>
    </div>
  );
}
