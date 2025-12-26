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
import { useState, useEffect } from "react";
import { RangeSlider } from "./RangeSlider";

interface AdvancedFiltersProps {
  onApply?: () => void;
}

type SortValue =
  | "relevance"
  | "dr_desc"
  | "dr_asc"
  | "da_desc"
  | "da_asc"
  | "traffic_desc"
  | "traffic_asc";

function getSortValueFromParams(params: URLSearchParams): SortValue {
  const sortBy = params.get("sortBy") || "relevance";
  const sortOrder = params.get("sortOrder") || "desc";

  if (sortBy === "dr" && sortOrder === "asc") return "dr_asc";
  if (sortBy === "dr") return "dr_desc";
  if (sortBy === "da" && sortOrder === "asc") return "da_asc";
  if (sortBy === "da") return "da_desc";
  if (sortBy === "traffic" && sortOrder === "asc") return "traffic_asc";
  if (sortBy === "traffic") return "traffic_desc";
  return "relevance";
}

function applySortToParams(params: URLSearchParams, sort: SortValue) {
  if (sort === "relevance") {
    params.delete("sortBy");
    params.delete("sortOrder");
    return;
  }

  const [sortBy, sortOrder] = sort.split("_") as ["dr" | "da" | "traffic", "asc" | "desc"];
  params.set("sortBy", sortBy);
  params.set("sortOrder", sortOrder);
}

export function AdvancedFilters({ onApply }: AdvancedFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize filter state from URL params
  const [drRange, setDrRange] = useState<[number, number]>([
    parseInt(searchParams.get("minDr") || "0"),
    parseInt(searchParams.get("maxDr") || "100"),
  ]);
  const [daRange, setDaRange] = useState<[number, number]>([
    parseInt(searchParams.get("minDa") || "0"),
    parseInt(searchParams.get("maxDa") || "100"),
  ]);
  const [linkType, setLinkType] = useState<string>(searchParams.get("linkType") || "all");
  const [niche, setNiche] = useState<string>(searchParams.get("niche") || "all");
  const [minTraffic, setMinTraffic] = useState<string>(searchParams.get("minTraffic") || "0");
  const [maxSpamScore, setMaxSpamScore] = useState<string>(
    searchParams.get("maxSpamScore") || "none",
  );
  const [googleNews, setGoogleNews] = useState<string>(searchParams.get("googleNews") || "all");
  const [verified, setVerified] = useState<string>(searchParams.get("verified") || "all");
  const [featured, setFeatured] = useState<string>(searchParams.get("featured") || "all");
  const [sort, setSort] = useState<SortValue>(getSortValueFromParams(searchParams));

  // Update state when URL params change
  useEffect(() => {
    setDrRange([
      parseInt(searchParams.get("minDr") || "0"),
      parseInt(searchParams.get("maxDr") || "100"),
    ]);
    setDaRange([
      parseInt(searchParams.get("minDa") || "0"),
      parseInt(searchParams.get("maxDa") || "100"),
    ]);
    setLinkType(searchParams.get("linkType") || "all");
    setNiche(searchParams.get("niche") || "all");
    setMinTraffic(searchParams.get("minTraffic") || "0");
    setMaxSpamScore(searchParams.get("maxSpamScore") || "none");
    setGoogleNews(searchParams.get("googleNews") || "all");
    setVerified(searchParams.get("verified") || "all");
    setFeatured(searchParams.get("featured") || "all");
    setSort(getSortValueFromParams(searchParams));
  }, [searchParams]);

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    // DR filters
    if (drRange[0] > 0) params.set("minDr", String(drRange[0]));
    else params.delete("minDr");
    if (drRange[1] < 100) params.set("maxDr", String(drRange[1]));
    else params.delete("maxDr");

    // DA filters
    if (daRange[0] > 0) params.set("minDa", String(daRange[0]));
    else params.delete("minDa");
    if (daRange[1] < 100) params.set("maxDa", String(daRange[1]));
    else params.delete("maxDa");

    // Link type filter
    if (linkType !== "all") params.set("linkType", linkType);
    else params.delete("linkType");

    // Niche filter
    if (niche !== "all") params.set("niche", niche);
    else params.delete("niche");

    // Traffic filter (monthly visits)
    if (minTraffic !== "0") params.set("minTraffic", minTraffic);
    else params.delete("minTraffic");

    // Spam score filter
    if (maxSpamScore !== "none") params.set("maxSpamScore", maxSpamScore);
    else params.delete("maxSpamScore");

    // Boolean flags
    if (googleNews === "only") params.set("googleNews", "1");
    else params.delete("googleNews");

    if (verified === "only") params.set("verified", "1");
    else params.delete("verified");

    if (featured === "only") params.set("featured", "1");
    else params.delete("featured");

    // Sort
    applySortToParams(params, sort);

    // Reset to page 1 when filters change
    params.set("page", "1");

    router.push(`/search?${params.toString()}`);
    onApply?.();
  };

  const handleResetFilters = () => {
    setDrRange([0, 100]);
    setDaRange([0, 100]);
    setLinkType("all");
    setNiche("all");
    setMinTraffic("0");
    setMaxSpamScore("none");
    setGoogleNews("all");
    setVerified("all");
    setFeatured("all");
    setSort("relevance");

    const params = new URLSearchParams(searchParams.toString());
    params.delete("minDr");
    params.delete("maxDr");
    params.delete("minDa");
    params.delete("maxDa");
    params.delete("linkType");
    params.delete("niche");
    params.delete("minTraffic");
    params.delete("maxTraffic");
    params.delete("maxSpamScore");
    params.delete("googleNews");
    params.delete("verified");
    params.delete("featured");
    params.delete("sortBy");
    params.delete("sortOrder");
    params.set("page", "1");

    router.push(`/search?${params.toString()}`);
    onApply?.();
  };

  const hasActiveFilters =
    drRange[0] > 0 ||
    drRange[1] < 100 ||
    daRange[0] > 0 ||
    daRange[1] < 100 ||
    linkType !== "all" ||
    niche !== "all" ||
    minTraffic !== "0" ||
    maxSpamScore !== "none" ||
    googleNews !== "all" ||
    verified !== "all" ||
    featured !== "all" ||
    sort !== "relevance";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="w-5 h-5" />
          Advanced Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* DR Range */}
        <RangeSlider
          label="Domain Rating (DR)"
          min={0}
          max={100}
          step={5}
          value={drRange}
          onChange={setDrRange}
        />

        <Separator />

        {/* DA Range */}
        <RangeSlider
          label="Domain Authority (DA)"
          min={0}
          max={100}
          step={5}
          value={daRange}
          onChange={setDaRange}
        />

        <Separator />

        {/* Link Type */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Link Type</Label>
          <Select value={linkType} onValueChange={setLinkType}>
            <SelectTrigger>
              <SelectValue placeholder="Select link type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="dofollow">Dofollow</SelectItem>
              <SelectItem value="nofollow">Nofollow</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Niche */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Niche</Label>
          <Select value={niche} onValueChange={setNiche}>
            <SelectTrigger>
              <SelectValue placeholder="Select niche" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Niches</SelectItem>
              <SelectItem value="Technology">Technology</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="Health">Health</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
              <SelectItem value="Business">Business</SelectItem>
              <SelectItem value="Lifestyle">Lifestyle</SelectItem>
              <SelectItem value="Education">Education</SelectItem>
              <SelectItem value="Entertainment">Entertainment</SelectItem>
              <SelectItem value="Travel">Travel</SelectItem>
              <SelectItem value="Food">Food</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Monthly Visits */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Minimum Monthly Visits</Label>
          <Select value={minTraffic} onValueChange={setMinTraffic}>
            <SelectTrigger>
              <SelectValue placeholder="Min traffic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Any</SelectItem>
              <SelectItem value="1000">1,000+</SelectItem>
              <SelectItem value="5000">5,000+</SelectItem>
              <SelectItem value="10000">10,000+</SelectItem>
              <SelectItem value="50000">50,000+</SelectItem>
              <SelectItem value="100000">100,000+</SelectItem>
              <SelectItem value="500000">500,000+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Google News */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Google News</Label>
          <Select value={googleNews} onValueChange={setGoogleNews}>
            <SelectTrigger>
              <SelectValue placeholder="Google News" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="only">Only Google News approved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Verified */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Verification</Label>
          <Select value={verified} onValueChange={setVerified}>
            <SelectTrigger>
              <SelectValue placeholder="Verification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="only">Only verified</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Featured */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Featured</Label>
          <Select value={featured} onValueChange={setFeatured}>
            <SelectTrigger>
              <SelectValue placeholder="Featured" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="only">Only featured</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Spam Score */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Max Spam Score</Label>
          <Select value={maxSpamScore} onValueChange={setMaxSpamScore}>
            <SelectTrigger>
              <SelectValue placeholder="Max spam score" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Any</SelectItem>
              <SelectItem value="5">≤ 5</SelectItem>
              <SelectItem value="10">≤ 10</SelectItem>
              <SelectItem value="20">≤ 20</SelectItem>
              <SelectItem value="30">≤ 30</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Sort */}
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
              <SelectItem value="da_desc">DA: High to Low</SelectItem>
              <SelectItem value="da_asc">DA: Low to High</SelectItem>
              <SelectItem value="traffic_desc">Traffic: High to Low</SelectItem>
              <SelectItem value="traffic_asc">Traffic: Low to High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <Button onClick={handleApplyFilters} className="w-full">
            Apply Filters
          </Button>
          {hasActiveFilters && (
            <Button variant="outline" onClick={handleResetFilters} className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Filters
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
