import { ExternalLink } from "lucide-react";
import Link from "next/link";

interface SearchEngineLinksProps {
  hostname: string;
}

const SEARCH_ENGINES = [
  {
    name: "Google",
    getUrl: (domain: string) =>
      `https://www.google.com/search?hl=en&safe=off&q=site%3A${encodeURIComponent(domain)}`,
  },
  {
    name: "Bing",
    getUrl: (domain: string) =>
      `https://www.bing.com/search?qs=n&form=QBRE&sp=-1&ghc=1&lq=0&q=site%3A${encodeURIComponent(domain)}`,
  },
  {
    name: "Yahoo",
    getUrl: (domain: string) =>
      `https://search.yahoo.com/search?p=site%3A${encodeURIComponent(domain)}`,
  },
  {
    name: "DuckDuckGo",
    getUrl: (domain: string) =>
      `https://duckduckgo.com/?q=site%3A${encodeURIComponent(domain)}`,
  },
];

export function SearchEngineLinks({ hostname }: SearchEngineLinksProps) {
  return (
    <div className="grid grid-cols-4 gap-2 text-center text-sm">
      {SEARCH_ENGINES.map((engine) => (
        <div key={engine.name} className="flex flex-col">
          <span className="bg-muted/50 py-2 text-muted-foreground font-medium rounded-t-md">
            {engine.name}
          </span>
          <Link
            href={engine.getUrl(hostname)}
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center justify-center py-2 h-10 text-primary hover:text-primary/80 hover:bg-muted/30 rounded-b-md transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      ))}
    </div>
  );
}
