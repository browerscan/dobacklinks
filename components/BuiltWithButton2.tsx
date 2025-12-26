import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Nexty.dev Affiliate Link: https://affiliates.nexty.dev/
// sign up and use your affiliate link on BuiltWithButton to earn money

export default function BuiltWithButton2() {
  return (
    <Link
      href="https://nexty.dev?ref=dofollow-tools"
      title="Built with Nexty.dev"
      prefetch={false}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "px-4 rounded-md bg-white text-gray-900 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-700",
      )}
    >
      <span>Built with</span>
      <span>
        <LogoNexty className="size-4 rounded-full" />
      </span>
      <span className="text-base-content flex gap-0.5 items-center tracking-tight">Nexty.dev</span>
    </Link>
  );
}

function LogoNexty({ className }: { className?: string }) {
  return (
    <img
      src="/logo_nexty.png"
      alt="Logo"
      title="Logo"
      width={96}
      height={96}
      className={cn("size-8 rounded-md", className)}
    />
  );
}
