"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Filter, RotateCcw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface BasicFiltersProps {
  onApply?: () => void;
}

const NICHE_OPTIONS = [
  "Technology",
  "Finance",
  "Health",
  "Marketing",
  "Business",
  "Lifestyle",
  "Education",
  "Entertainment",
  "Travel",
  "Food",
] as const;

type SortValue = "relevance" | "dr_desc" | "dr_asc" | "traffic_desc";

function getSortValueFromParams(params: URLSearchParams): SortValue {
  const sortBy = params.get("sortBy") || "relevance";
  const sortOrder = params.get("sortOrder") || "desc";

  if (sortBy === "dr" && sortOrder === "asc") return "dr_asc";
  if (sortBy === "dr") return "dr_desc";
  if (sortBy === "traffic") return "traffic_desc";
  return "relevance";
}

function applySortToParams(params: URLSearchParams, sort: SortValue) {
  if (sort === "relevance") {
    params.delete("sortBy");
    params.delete("sortOrder");
    return;
  }

  if (sort === "dr_asc") {
    params.set("sortBy", "dr");
    params.set("sortOrder", "asc");
    return;
  }

  if (sort === "dr_desc") {
    params.set("sortBy", "dr");
    params.set("sortOrder", "desc");
    return;
  }

  if (sort === "traffic_desc") {
    params.set("sortBy", "traffic");
    params.set("sortOrder", "desc");
    return;
  }
}

export function BasicFilters({ onApply }: BasicFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [niche, setNiche] = useState(searchParams.get("niche") || "all");
  const [minDr, setMinDr] = useState(searchParams.get("minDr") || "0");
  const [linkType, setLinkType] = useState(searchParams.get("linkType") || "all");
  const [sort, setSort] = useState<SortValue>(getSortValueFromParams(searchParams));

  useEffect(() => {
    setNiche(searchParams.get("niche") || "all");
    setMinDr(searchParams.get("minDr") || "0");
    setLinkType(searchParams.get("linkType") || "all");
    setSort(getSortValueFromParams(searchParams));
  }, [searchParams]);

  const handleApply = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (niche !== "all") params.set("niche", niche);
    else params.delete("niche");

    if (minDr !== "0") params.set("minDr", minDr);
    else params.delete("minDr");

    if (linkType !== "all") params.set("linkType", linkType);
    else params.delete("linkType");

    applySortToParams(params, sort);

    params.set("page", "1");
    router.push(`/search?${params.toString()}`);
    onApply?.();
  };

  const handleReset = () => {
    setNiche("all");
    setMinDr("0");
    setLinkType("all");
    setSort("relevance");

    const params = new URLSearchParams(searchParams.toString());
    params.delete("niche");
    params.delete("minDr");
    params.delete("linkType");
    params.delete("sortBy");
    params.delete("sortOrder");
    params.set("page", "1");
    router.push(`/search?${params.toString()}`);
    onApply?.();
  };

  const hasActiveFilters =
    niche !== "all" || minDr !== "0" || linkType !== "all" || sort !== "relevance";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="w-5 h-5" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Niche</Label>
          <Select value={niche} onValueChange={setNiche}>
            <SelectTrigger>
              <SelectValue placeholder="Select niche" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Niches</SelectItem>
              {NICHE_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-sm font-medium">Minimum DR</Label>
          <Select value={minDr} onValueChange={setMinDr}>
            <SelectTrigger>
              <SelectValue placeholder="Min DR" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Any</SelectItem>
              <SelectItem value="30">30+</SelectItem>
              <SelectItem value="40">40+</SelectItem>
              <SelectItem value="50">50+</SelectItem>
              <SelectItem value="60">60+</SelectItem>
              <SelectItem value="70">70+</SelectItem>
              <SelectItem value="80">80+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-sm font-medium">Link Type</Label>
          <Select value={linkType} onValueChange={setLinkType}>
            <SelectTrigger>
              <SelectValue placeholder="Link type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="dofollow">Dofollow</SelectItem>
              <SelectItem value="nofollow">Nofollow</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-sm font-medium">Sort</Label>
          <Select value={sort} onValueChange={(v) => setSort(v as SortValue)}>
            <SelectTrigger>
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="dr_desc">DR: High to Low</SelectItem>
              <SelectItem value="dr_asc">DR: Low to High</SelectItem>
              <SelectItem value="traffic_desc">Traffic: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <Button onClick={handleApply} className="w-full">
            Apply
          </Button>
          {hasActiveFilters && (
            <Button variant="outline" onClick={handleReset} className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

