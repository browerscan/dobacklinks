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
  const [linkType, setLinkType] = useState<string>(
    searchParams.get("linkType") || "all",
  );
  const [niche, setNiche] = useState<string>(
    searchParams.get("niche") || "all",
  );

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

    const params = new URLSearchParams(searchParams.toString());
    params.delete("minDr");
    params.delete("maxDr");
    params.delete("minDa");
    params.delete("maxDa");
    params.delete("linkType");
    params.delete("niche");
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
    niche !== "all";

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

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <Button onClick={handleApplyFilters} className="w-full">
            Apply Filters
          </Button>
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={handleResetFilters}
              className="w-full"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Filters
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
