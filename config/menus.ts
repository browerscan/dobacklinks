type Menu = {
  name: string;
  href: string;
  target?: string;
  icon: string;
};

export const userMenus: Menu[] = [
  {
    name: "Profile",
    href: "/dashboard/profile",
    icon: "UserRoundCog",
  },
  {
    name: "Saved Products",
    href: "/dashboard/saved",
    icon: "Bookmark",
  },
];

export const adminMenus: Menu[] = [
  {
    name: "Overview",
    href: "/dashboard/overview",
    icon: "ChartNoAxesCombined",
  },
  {
    name: "Categories",
    href: "/dashboard/categories",
    icon: "ListOrdered",
  },
  {
    name: "Sites",
    href: "/dashboard/sites",
    icon: "Box",
  },
  {
    name: "Examples",
    href: "/dashboard/examples",
    icon: "CheckCircle",
  },
  {
    name: "Enrichment",
    href: "/dashboard/enrichment",
    icon: "TrendingUp",
  },
  {
    name: "Users",
    href: "/dashboard/users",
    icon: "Users",
  },
  {
    name: "Blogs",
    href: "/dashboard/blog",
    icon: "BookText",
  },
];
