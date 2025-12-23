"use client";

import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface RangeSliderProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatValue?: (value: number) => string;
}

export function RangeSlider({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  formatValue = (v) => String(v),
}: RangeSliderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="text-sm text-muted-foreground">
          {formatValue(value[0])} - {formatValue(value[1])}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={value}
        onValueChange={onChange as (value: number[]) => void}
        className="w-full"
      />
    </div>
  );
}
