import { HeaderLinks } from "@/components/header/HeaderLinks";
import MobileMenu from "@/components/header/MobileMenu";
import { UserAvatar } from "@/components/header/UserAvatar";
import { CompactSearchInput } from "@/components/search/SearchInput";
import { ThemeToggle } from "@/components/ThemeToggle";
import { siteConfig } from "@/config/site";
import { user as userSchema } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

type User = typeof userSchema.$inferSelect;

const Header = () => {
  return (
    <header className="py-2 px-6 backdrop-blur-md sticky top-0 z-50">
      <nav className="flex justify-between items-center w-full mx-auto">
        <div className="flex items-center space-x-6 md:space-x-12">
          <Link href="/" title={siteConfig.name} className="flex items-center space-x-1">
            <Image src="/logo.png" alt="Logo" width={28} height={28} />
            <span className={cn("text-md font-medium")}>{siteConfig.name}</span>
          </Link>

          <HeaderLinks />
        </div>

        <div className="flex items-center gap-x-2 flex-1 justify-end">
          {/* PC - Search + Theme + User */}
          <div className="hidden lg:flex items-center gap-x-3">
            <CompactSearchInput />
            <ThemeToggle />
            <UserAvatar />
          </div>

          {/* Mobile */}
          <div className="flex lg:hidden items-center gap-x-2">
            <UserAvatar />
            <MobileMenu />
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
