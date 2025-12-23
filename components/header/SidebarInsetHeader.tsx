import { ThemeToggle } from "@/components/ThemeToggle";
import { HeaderLinks } from "@/components/header/HeaderLinks";
import MobileMenu from "@/components/header/MobileMenu";
import { UserAvatar } from "@/components/header/UserAvatar";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { user as userSchema } from "@/lib/db/schema";

type User = typeof userSchema.$inferSelect;

export default function SidebarInsetHeader() {
  return (
    <header className="w-full py-2 px-4 backdrop-blur-md sticky top-0 z-50">
      <nav className="flex justify-between items-center w-full mx-auto">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <HeaderLinks />
        </div>

        <div className="flex items-center gap-x-2 flex-1 justify-end">
          {/* PC */}
          <div className="hidden lg:flex items-center gap-x-2">
            <ThemeToggle />
            <UserAvatar />
          </div>

          {/* Mobile */}
          <div className="flex lg:hidden">
            <UserAvatar />
            <MobileMenu />
          </div>
        </div>
      </nav>
    </header>
  );
}
