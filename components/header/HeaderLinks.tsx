"use client";

import { cn } from "@/lib/utils";
import { HeaderLink } from "@/types/common";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const headerLinks: HeaderLink[] = [
  {
    id: "directory",
    name: "Directory",
    href: "/",
  },
  {
    id: "categories",
    name: "Categories",
    href: "/categories",
  },
  {
    id: "search",
    name: "Search",
    href: "/search",
  },
  {
    id: "services",
    name: "Services",
    href: "/services",
  },
  {
    id: "submit",
    name: "Submit Site",
    href: "/submit",
  },
  {
    id: "hire-me",
    name: "Hire Me",
    href: "/services#hire-me",
  },
];

export const HeaderLinks = () => {
  const pathname = usePathname();

  return (
    <div className="hidden lg:flex flex-row items-center gap-x-2 text-sm text-muted-foreground">
      {headerLinks.map((link) => (
        <Link
          key={link.name}
          href={link.href}
          title={link.name}
          prefetch={link.target && link.target === "_blank" ? false : true}
          target={link.target || "_self"}
          rel={link.rel || undefined}
          className={cn(
            "rounded-xl px-4 py-2 flex items-center gap-x-1 hover:bg-accent-foreground/10 hover:text-primary",
            pathname === link.href && "font-medium text-primary",
            link.id === "hire-me" &&
              "bg-primary text-primary-foreground hover:text-primary-foreground hover:bg-primary/90",
          )}
        >
          {link.name}
          {link.target && link.target === "_blank" && (
            <span className="text-xs">
              <ExternalLink className="w-4 h-4" />
            </span>
          )}
        </Link>
      ))}
    </div>
  );
};
