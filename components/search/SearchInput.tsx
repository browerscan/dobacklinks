"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { Clock, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

interface SearchInputProps {
  placeholder?: string;
  className?: string;
  defaultValue?: string;
  onSearch?: (query: string) => void;
}

export function SearchInput({
  placeholder = "Search sites by name, niche, or URL...",
  className = "",
  defaultValue = "",
  onSearch,
}: SearchInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(
    defaultValue || searchParams.get("q") || "",
  );
  const [isOpen, setIsOpen] = useState(false);
  const { history, addToHistory, removeFromHistory } = useSearchHistory();

  const handleSearch = useCallback(() => {
    const trimmedQuery = query.trim();

    if (onSearch) {
      onSearch(trimmedQuery);
      return;
    }

    if (trimmedQuery) {
      // Add to search history
      addToHistory(trimmedQuery);
    }

    setIsOpen(false);

    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (trimmedQuery) {
        params.set("q", trimmedQuery);
      } else {
        params.delete("q");
      }
      params.delete("page"); // Reset to page 1
      router.push(`/search?${params.toString()}`);
    });
  }, [query, onSearch, router, searchParams, addToHistory]);

  const handleClear = useCallback(() => {
    setQuery("");
    if (onSearch) {
      onSearch("");
      return;
    }
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("q");
      params.delete("page");
      router.push(`/search?${params.toString()}`);
    });
  }, [onSearch, router, searchParams]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleHistoryItemClick = (historyQuery: string) => {
    setQuery(historyQuery);
    setIsOpen(false);

    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("q", historyQuery);
      params.delete("page");
      router.push(`/search?${params.toString()}`);
    });
  };

  // Show history dropdown when input is focused and has no value
  const handleInputFocus = () => {
    if (history.length > 0) {
      setIsOpen(true);
    }
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              className="pl-10 pr-10"
              disabled={isPending}
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </PopoverTrigger>
        {history.length > 0 && (
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-0"
            align="start"
          >
            <Command>
              <CommandList>
                <CommandEmpty>No search history</CommandEmpty>
                <CommandGroup heading="Recent Searches">
                  {history.map((item) => (
                    <CommandItem
                      key={item.timestamp}
                      onSelect={() => handleHistoryItemClick(item.query)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{item.query}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromHistory(item.query);
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        )}
      </Popover>
      <Button
        onClick={handleSearch}
        disabled={isPending}
        className="ml-2"
        size="default"
      >
        {isPending ? "Searching..." : "Search"}
      </Button>
    </div>
  );
}

export function CompactSearchInput({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search sites..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        className="pl-10 h-9 w-full md:w-[200px] lg:w-[300px]"
      />
    </div>
  );
}
