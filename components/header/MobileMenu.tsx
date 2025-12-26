"use client";

import { headerLinks } from "@/components/header/HeaderLinks";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { siteConfig } from "@/config/site";
import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function MobileMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="p-2" aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <Link href="/" title={siteConfig.name} className="flex items-center space-x-1 font-bold">
            <Image
              alt={siteConfig.name}
              src="/logo.svg"
              className="w-6 h-6"
              width={32}
              height={32}
            />
            <span className="highlight-text">{siteConfig.name}</span>
          </Link>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {headerLinks.map((link) => (
            <DropdownMenuItem key={link.name}>
              <Link
                href={link.href}
                title={link.name}
                prefetch={link.target && link.target === "_blank" ? false : true}
                target={link.target || "_self"}
                rel={link.rel || undefined}
                className={link.id === "hire-me" ? "font-semibold text-primary" : ""}
              >
                {link.name}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <div className="flex items-center justify-end px-1">
          <ThemeToggle />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
