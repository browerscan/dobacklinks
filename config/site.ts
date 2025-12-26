import { SiteConfig } from "@/types/siteConfig";

export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dobacklinks.com";

const GITHUB_URL = "";
const TWITTER_URL = "";
const BSKY_URL = "";
const DISCORD_URL = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL;
const EMAIL_URL = "outreach@dobacklinks.com";

export const siteConfig: SiteConfig = {
  name: "Dobacklinks",
  tagLine: "Guest Post Directory & Outreach Service",
  description:
    "Curated directory of 9,700+ guest post sites with DR, DA, traffic data, pricing, and contact info. Find quality publishers fast or hire me for done-for-you outreach.",
  url: BASE_URL,
  authors: [
    {
      name: "Dobacklinks",
      url: BASE_URL,
    },
  ],
  creator: "@judewei_dev",
  socialLinks: {
    github: GITHUB_URL,
    bluesky: BSKY_URL,
    twitter: TWITTER_URL,
    discord: DISCORD_URL,
    email: EMAIL_URL,
  },
  themeColors: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  defaultNextTheme: "light", // next-theme option: system | dark | light
  icons: {
    icon: "/favicon.ico",
    shortcut: "/logo.png",
    apple: "/logo.png", // apple-touch-icon.png
  },
};
