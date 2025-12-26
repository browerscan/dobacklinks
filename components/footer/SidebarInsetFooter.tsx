import BuiltWithButton2 from "@/components/BuiltWithButton2";
import { siteConfig } from "@/config/site";
import Link from "next/link";

export default function SidebarInsetFooter() {
  return (
    <div className="px-4 py-2 border-t border-gray-300 dark:border-gray-700 flex flex-col lg:flex-row gap-2 justify-between items-center">
      <div className="text-xs text-gray-400 dark:text-gray-400 flex flex-col lg:flex-row gap-2 justify-between items-center w-full">
        <div>
          <Link href="/about" title="About" prefetch={false}>
            © {new Date().getFullYear()} {siteConfig.name}.
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/privacy-policy" title="Privacy Policy" prefetch={false}>
            Privacy
          </Link>
          <Link href="/terms-of-service" title="Terms of Service" prefetch={false}>
            Terms
          </Link>
        </div>
      </div>
    </div>
  );
}
