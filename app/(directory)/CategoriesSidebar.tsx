"use client";

import { CategoryWithCount } from "@/actions/categories/user";
import { DynamicIcon } from "@/components/DynamicIcon";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { siteConfig } from "@/config/site";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

interface CategoriesSidebarProps {
  categories: CategoryWithCount[];
  productCount: number;
}

export function CategoriesSidebar({
  categories,
  productCount,
}: CategoriesSidebarProps) {
  const { state } = useSidebar();
  const params = useParams();
  const currentCategory = (params.slug as string) || null;

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <Image
            src="/logo.png"
            alt="Logo"
            width={28}
            height={28}
            className="rounded-md"
          />
          {!isCollapsed && (
            <span className="text-md font-medium">{siteConfig.name}</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <TooltipProvider>
              <SidebarMenu>
                {/* All Categories Option */}
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild isActive={!currentCategory}>
                        <Link
                          href="/"
                          title="All Products"
                          className="flex items-center gap-2"
                        >
                          <DynamicIcon name="House" className="h-4 w-4" />
                          {!isCollapsed && (
                            <span>
                              All{" "}
                              {productCount > 0 && (
                                <span className="ml-auto text-sm font-semibold">
                                  ({productCount})
                                </span>
                              )}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right">
                        <p>All Categories</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </SidebarMenuItem>

                {/* Categories */}
                {categories.length === 0 ? (
                  <>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <SidebarMenuItem key={i}>
                        <SidebarMenuSkeleton />
                      </SidebarMenuItem>
                    ))}
                  </>
                ) : (
                  categories
                    .filter((c) => c.productCount > 0)
                    .map((category) => (
                      <SidebarMenuItem key={category.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuButton
                              asChild
                              isActive={currentCategory === category.slug}
                            >
                              <Link
                                href={`/categories/${category.slug}`}
                                title={category.name}
                                className="flex items-center gap-2"
                              >
                                {category.icon ? (
                                  <DynamicIcon
                                    name={category.icon}
                                    className="h-4 w-4"
                                  />
                                ) : (
                                  <div className="h-4 w-4 rounded bg-muted flex items-center justify-center text-xs">
                                    {category.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                {!isCollapsed && (
                                  <span>
                                    {category.name}{" "}
                                    <span className="text-sm text-muted-foreground">
                                      ({category.productCount})
                                    </span>
                                  </span>
                                )}
                              </Link>
                            </SidebarMenuButton>
                          </TooltipTrigger>
                          {isCollapsed && (
                            <TooltipContent side="right">
                              <p>
                                {category.name} ({category.productCount})
                              </p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </SidebarMenuItem>
                    ))
                )}
              </SidebarMenu>
            </TooltipProvider>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
