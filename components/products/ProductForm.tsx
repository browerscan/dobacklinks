"use client";

import { ImageUpload } from "@/app/(basic-layout)/submit/ImageUpload";
import { ProductFormValues } from "@/app/(basic-layout)/submit/schema";
import AutoFillButton from "@/components/products/AutoFillButton";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MultiSelect, Option } from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PRODUCTS_LOGO_PATH, PRODUCTS_SCREENSHOTS_PATH } from "@/config/common";
import { Category } from "@/types/product";
import { Info, Link as LinkIcon, Rocket, ShieldCheck, Clock3 } from "lucide-react";
import { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";

interface ProductFormProps {
  form: UseFormReturn<ProductFormValues>;
  categories: Category[];
  isEditing?: boolean;
}

export default function ProductForm({ form, categories, isEditing = false }: ProductFormProps) {
  const { control } = form;
  const [isAutoFillEnabled, setIsAutoFillEnabled] = useState(false);

  const categoryOptions: Option[] = categories.map((category) => ({
    label: category.name,
    value: category.id,
  }));

  useEffect(() => {
    setIsAutoFillEnabled(
      !!(
        process.env.NEXT_PUBLIC_AUTO_FILL_AI_PROVIDER &&
        process.env.NEXT_PUBLIC_AUTO_FILL_AI_MODEL_ID
      ),
    );
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-4">
      <div className="space-y-8">
        <div className="bg-card rounded-lg border p-6 space-y-6">
          <h2 className="text-lg font-semibold border-b pb-3 flex items-center gap-2">
            <span className="bg-primary/10 text-primary rounded-md p-1.5">
              <Info className="w-4 h-4" />
            </span>
            Site Basics
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Site URL <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="https://example.com"
                        className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                        {...field}
                        maxLength={120}
                        disabled={isEditing}
                      />
                      {!isEditing && isAutoFillEnabled && (
                        <AutoFillButton
                          form={form}
                          categories={categories}
                          disabled={!field.value}
                        />
                      )}
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs text-muted-foreground">
                    Paste the homepage or the dedicated “Write for us” page.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Site Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Publisher or site name"
                      className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      {...field}
                      maxLength={100}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={control}
              name="tagline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    One-line Summary <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Tech news site accepting guest posts"
                      className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      {...field}
                      maxLength={160}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-muted-foreground">
                    {field.value?.length || 0}/160
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="niche"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Niche</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Tech, Crypto, Health, Finance..."
                      className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      {...field}
                      maxLength={50}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  Guest Post Guidelines <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Topics accepted, word count, links policy, sample headlines..."
                    rows={7}
                    className="resize-none transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    {...field}
                    maxLength={3000}
                  />
                </FormControl>
                <FormDescription className="text-xs text-muted-foreground">
                  {field.value?.length || 0}/3000 (minimum 200). Markdown supported.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="logoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  Logo <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <ImageUpload
                    value={field.value}
                    onChange={field.onChange}
                    path={PRODUCTS_LOGO_PATH}
                    filenamePrefix="logo"
                    maxSizeInMB={0.5}
                  />
                </FormControl>
                <FormDescription className="text-xs text-muted-foreground">
                  SVG, WEBP, PNG or JPG (Max 500kb).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="appImages"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Screenshots</FormLabel>
                <FormControl>
                  <ImageUpload
                    value={field.value}
                    onChange={field.onChange}
                    path={PRODUCTS_SCREENSHOTS_PATH}
                    filenamePrefix="screenshot"
                    multiple
                    maxFiles={4}
                    maxSizeInMB={5}
                  />
                </FormControl>
                <FormDescription className="text-xs text-muted-foreground">
                  Up to 4 images (homepage, “write for us” page, sample article).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="categoryIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">
                  Categories <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <MultiSelect
                    options={categoryOptions}
                    selected={field.value || []}
                    onChange={field.onChange}
                    placeholder="Select up to 3 categories..."
                    maxSelected={3}
                  />
                </FormControl>
                <FormDescription className="text-xs text-muted-foreground">
                  Helps users filter sites by niche.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="bg-card rounded-lg border p-6 space-y-6">
          <h2 className="text-lg font-semibold border-b pb-3 flex items-center gap-2">
            <span className="bg-primary/10 text-primary rounded-md p-1.5">
              <ShieldCheck className="w-4 h-4" />
            </span>
            SEO & Offer Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={control}
              name="dr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">DR</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="e.g. 72"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="da"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">DA</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="e.g. 60"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="traffic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Monthly Traffic</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 50k+, 10k-50k" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={control}
              name="priceRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Price / Status</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Free, $80, Sponsored, Exchange"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="linkType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Link Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="dofollow / nofollow" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="dofollow">Dofollow</SelectItem>
                      <SelectItem value="nofollow">Nofollow</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={control}
              name="turnaroundTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium flex items-center gap-1">
                    Turnaround Time <Clock3 className="w-4 h-4" />
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 2-3 days, 1 week" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium flex items-center gap-1">
                    Contact Email <LinkIcon className="w-4 h-4" />
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="editor@example.com"
                      className="h-11"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-muted-foreground">
                    Kept private; used for verification or outreach.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Ready to submit</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            We review each site for relevance and quality. Free submissions are accepted; verified
            badges are added after manual review.
          </p>
        </div>
      </div>
    </div>
  );
}
