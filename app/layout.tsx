import { GoogleOneTap } from "@/components/auth/GoogleOneTap";
import { TailwindIndicator } from "@/components/TailwindIndicator";
import GoogleAdsense from "@/components/tracking/GoogleAdsense";
import UmamiAnalytics from "@/components/tracking/UmamiAnalytics";
import ToltScript from "@/components/tracking/ToltScript";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/config/site";
import { constructMetadata } from "@/lib/metadata";
import { generateOrganizationSchema, generateWebSiteSchema } from "@/lib/structured-data";
import { cn } from "@/lib/utils";
import "@/styles/globals.css";
import "@/styles/loading.css";
import { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import Script from "next/script";

// JSON-LD Structured Data for SEO (using centralized schema generator)
const organizationSchema = generateOrganizationSchema();
const websiteSchema = generateWebSiteSchema();

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    path: `/`,
  });
}

export const viewport: Viewport = {
  themeColor: siteConfig.themeColors,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ToltScript />
        {/* Organization Schema */}
        <Script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        {/* WebSite Schema with SearchAction */}
        <Script
          id="website-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className={cn("min-h-screen bg-background flex flex-col font-sans")}>
        <ThemeProvider attribute="class" defaultTheme={siteConfig.defaultNextTheme} enableSystem>
          {children}
        </ThemeProvider>
        <GoogleOneTap />
        <Toaster richColors />
        <TailwindIndicator />
        {process.env.NODE_ENV === "development" ? null : (
          <>
            <GoogleAdsense />
            <UmamiAnalytics />
          </>
        )}
      </body>
    </html>
  );
}
