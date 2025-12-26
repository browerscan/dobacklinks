"use client";

import { generatePublicPresignedUploadUrl } from "@/actions/r2-resources";
import { ImagePreview } from "@/components/shared/ImagePreview";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/error-utils";
import { Loader2, UploadCloud, X } from "lucide-react";
import Image from "next/image";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

export interface ImageUploadProps {
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  disabled?: boolean;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeInMB?: number;
  path: string;
  filenamePrefix: string;
}

export function ImageUpload({
  value,
  onChange,
  disabled,
  multiple = false,
  maxFiles = 1,
  maxSizeInMB = 5,
  path,
  filenamePrefix,
}: ImageUploadProps) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const urls = value ? (Array.isArray(value) ? value : [value]) : [];
    if (JSON.stringify(urls) !== JSON.stringify(previews)) {
      setPreviews(urls);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleFilesSelected = async (files: File[]) => {
    if (!files || files.length === 0) return;

    const currentFilesCount = previews.length;
    if (multiple && currentFilesCount + files.length > maxFiles) {
      toast.error("Upload Error", {
        description: `You can upload a maximum of ${maxFiles} images.`,
      });
      return;
    }

    setIsLoading(true);

    const uploadPromises = files.map(async (file) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Upload Error", {
          description: `File ${file.name} is not a valid image.`,
        });
        return null;
      }

      const maxSize = maxSizeInMB * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("Upload Error", {
          description: `File ${file.name} size cannot exceed ${maxSizeInMB}MB.`,
        });
        return null;
      }

      try {
        const presignedUrlActionResponse = await generatePublicPresignedUploadUrl({
          fileName: file.name,
          contentType: file.type,
          prefix: filenamePrefix,
          path,
        });

        if (!presignedUrlActionResponse.success || !presignedUrlActionResponse.data) {
          toast.error("Upload Error", {
            description: presignedUrlActionResponse.error || "Failed to generate presigned URL.",
          });
          return null;
        }

        const { presignedUrl, publicObjectUrl } = presignedUrlActionResponse.data;

        const uploadResponse = await fetch(presignedUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });

        if (!uploadResponse.ok) {
          let r2Error = "";
          try {
            r2Error = await uploadResponse.text();
          } catch {}
          console.error("R2 Upload Error:", r2Error, uploadResponse);
          throw new Error(r2Error || "Failed to upload to R2");
        }

        return publicObjectUrl;
      } catch (error) {
        console.error("MDX Image Upload failed:", error);
        toast.error(getErrorMessage(error) || "An unexpected error occurred during upload.");
        return null;
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      const successfulUrls = results.filter((url): url is string => !!url);

      if (successfulUrls.length > 0) {
        const currentUrls = value ? (Array.isArray(value) ? value : [value]) : [];
        const newUrls = [...currentUrls, ...successfulUrls];
        if (multiple) {
          onChange(newUrls);
        } else {
          onChange(newUrls[newUrls.length - 1] || "");
        }
      }
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        handleFilesSelected(acceptedFiles);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value, onChange, maxFiles, multiple],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
    },
    multiple,
    disabled: disabled || isLoading,
    noClick: true,
  });

  const handleLegacyFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    handleFilesSelected(files);
  };

  const handleRemoveImage = async (indexToRemove: number) => {
    const currentUrls = value ? (Array.isArray(value) ? value : [value]) : [];
    const newUrls = currentUrls.filter((_, index) => index !== indexToRemove);

    if (multiple) {
      onChange(newUrls);
    } else {
      onChange("");
    }
  };

  const renderUploader = () => (
    <div
      {...getRootProps()}
      onClick={() => fileInputRef.current?.click()}
      className={`mt-2 flex flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed border-border p-6 transition-colors min-h-[150px]
          ${isDragActive ? "border-primary bg-primary/10" : ""}
          ${
            disabled || isLoading
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer hover:border-muted-foreground"
          }`}
    >
      <input
        {...getInputProps()}
        id="logo-image-upload"
        ref={fileInputRef}
        onChange={handleLegacyFileChange}
      />
      {isLoading ? (
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Uploading...</p>
        </div>
      ) : (
        <div className="text-center">
          <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-sm text-foreground">
            {isDragActive ? "Drop the image(s) here..." : "Drag & drop or click to upload"}
          </p>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, WEBP
            {multiple && ` Max ${maxFiles} files.`}
          </p>
        </div>
      )}
    </div>
  );

  const renderPreviews = () => (
    <div className={`mt-2 grid gap-4 ${multiple ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-1"}`}>
      {previews.map((url, index) => (
        <div key={url} className="relative group aspect-video w-full max-h-[160px]">
          <ImagePreview>
            <Image
              src={url}
              alt="Image preview"
              fill
              className="object-contain rounded-md border border-border"
            />
          </ImagePreview>
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveImage(index);
            }}
            disabled={disabled}
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full">
      {previews.length > 0 && renderPreviews()}
      {(multiple ? previews.length < maxFiles : previews.length === 0) && renderUploader()}
    </div>
  );
}
