"use client";

import { DynamicIcon } from "@/components/DynamicIcon";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { adminMenus, userMenus } from "@/config/menus";
import { siteConfig } from "@/config/site";
import { authClient } from "@/lib/auth/auth-client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Menu = {
  name: string;
  href: string;
  target?: string;
  icon: string;
};

export function DashboardSidebar() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any | undefined;

  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  const { state } = useSidebar();

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarHeader>
        <Link
          href="/"
          title={siteConfig.name}
          prefetch={true}
          className="flex items-center space-x-1 px-2 py-1"
        >
          <Image src="/logo.png" alt="Logo" width={24} height={24} className="rounded-md" />
          {!isCollapsed && <h1 className="font-semibold">{siteConfig.name}</h1>}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {userMenus.map((menu) => (
                <SidebarMenuItem key={menu.href}>
                  <SidebarMenuButton asChild isActive={isActive(menu.href)}>
                    <Link href={menu.href} title={menu.name} prefetch={true} target={menu.target}>
                      {menu.icon ? (
                        <DynamicIcon name={menu.icon} className="h-4 w-4" />
                      ) : (
                        <span>{menu.name.slice(0, 1)}</span>
                      )}
                      {!isCollapsed && <span>{menu.name}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user?.role === "admin" && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Admin Menus</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminMenus.map((menu) => (
                    <SidebarMenuItem key={menu.href}>
                      <SidebarMenuButton asChild isActive={isActive(menu.href)}>
                        <Link href={menu.href} title={menu.name} prefetch={false}>
                          <DynamicIcon name={menu.icon} className="h-4 w-4" />
                          {!isCollapsed && <span>{menu.name}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
