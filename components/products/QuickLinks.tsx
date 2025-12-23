import { ExternalLink } from "lucide-react";
import Link from "next/link";

interface QuickLinksProps {
  url: string;
  hostname: string;
}

const QUICK_LINKS = [
  {
    name: "Archive",
    getUrl: (hostname: string, _url: string) =>
      `https://web.archive.org/web/${hostname}`,
    icon: "archive",
  },
  {
    name: "Similarweb",
    getUrl: (hostname: string, _url: string) =>
      `https://www.similarweb.com/website/${hostname}`,
    icon: "chart",
  },
  {
    name: "Semrush",
    getUrl: (_hostname: string, url: string) =>
      `https://www.semrush.com/analytics/overview/?searchType=domain&q=${encodeURIComponent(url)}`,
    icon: "analytics",
  },
  {
    name: "Ahrefs",
    getUrl: (hostname: string, _url: string) =>
      `https://app.ahrefs.com/site-explorer/overview/v2/subdomains/live?target=${hostname}`,
    icon: "link",
  },
  {
    name: "PageSpeed",
    getUrl: (_hostname: string, url: string) =>
      `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(url)}`,
    icon: "speed",
  },
];

export function QuickLinks({ url, hostname }: QuickLinksProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground">
        Quick Links
      </h3>
      <div className="flex flex-wrap gap-2">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.name}
            href={link.getUrl(hostname, url)}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-muted/50 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"
          >
            {link.name}
            <ExternalLink className="h-3 w-3" />
          </Link>
        ))}
      </div>
    </div>
  );
}
