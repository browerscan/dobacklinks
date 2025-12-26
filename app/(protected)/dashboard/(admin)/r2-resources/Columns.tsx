"use client";

import { R2File } from "@/actions/r2-resources";
import { ImagePreview } from "@/components/shared/ImagePreview";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { Copy, Download, MoreHorizontal, Trash2, Video } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const getFileType = (key: string): "image" | "video" | "other" => {
  const lowerKey = key.toLowerCase();

  if (lowerKey.includes("image-to-videos/")) return "video";

  const parts = lowerKey.split(".");
  if (parts.length < 2) {
    return "other";
  }

  const extension = parts.pop();
  if (!extension) {
    return "other";
  }

  if (
    extension?.includes("png") ||
    extension?.includes("jpg") ||
    extension?.includes("jpeg") ||
    extension?.includes("webp") ||
    extension?.includes("gif") ||
    extension?.includes("icon") ||
    extension?.includes("svg")
  ) {
    return "image";
  }
  if (extension?.includes("mp4") || extension?.includes("webm") || extension?.includes("mov")) {
    return "video";
  }
  return "other";
};

const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

interface ActionsCellProps {
  file: R2File;
  r2PublicUrl?: string;
  onDelete: (key: string) => void;
}

const ActionsCell: React.FC<ActionsCellProps> = ({ file, r2PublicUrl, onDelete }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(`${r2PublicUrl}/${file.key}`);
    toast.success("Filename copied to clipboard");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={handleCopy}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Public URL
        </DropdownMenuItem>
        {r2PublicUrl ? (
          <DropdownMenuItem asChild>
            <Link
              href={`${r2PublicUrl}/${file.key}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center w-full"
              title="Download"
              prefetch={false}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Link>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem disabled>
            <Download className="mr-2 h-4 w-4 opacity-50" />
            Download Unavailable
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => onDelete(file.key)}
          className="text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const getColumns = (
  r2PublicUrl: string | undefined,
  onDelete: (key: string) => void,
): ColumnDef<R2File>[] => [
  {
    accessorKey: "preview",
    header: "Preview",
    cell: ({ row }) => {
      const file = row.original;
      const fileType = getFileType(file.key);
      const previewUrl = r2PublicUrl ? `${r2PublicUrl}/${file.key}` : undefined;

      if (!previewUrl) return <span className="text-xs text-muted-foreground">N/A</span>;

      if (fileType === "image") {
        return (
          <ImagePreview>
            <img
              src={previewUrl}
              alt={`Preview of ${file.key}`}
              width={48}
              height={48}
              className="object-contain rounded border bg-muted"
            />
          </ImagePreview>
        );
      } else if (fileType === "video") {
        return (
          <video
            src={previewUrl}
            width="64"
            height="48"
            controls={false}
            muted
            preload="metadata"
            className="rounded border bg-muted"
          >
            <Video className="h-8 w-8 text-muted-foreground" />
          </video>
        );
      } else {
        return <span className="text-xs text-muted-foreground">No Preview</span>;
      }
    },
    enableSorting: false,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => getFileType(row.original.key).toUpperCase() ?? "Unknown",
  },
  {
    accessorKey: "size",
    header: "Size",
    cell: ({ row }) => formatBytes(row.getValue<number>("size")),
  },
  {
    accessorKey: "lastModified",
    header: "Last Modified",
    cell: ({ row }) => {
      const date = row.getValue<Date>("lastModified");
      return dayjs(date).format("YYYY-MM-DD HH:mm:ss");
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <ActionsCell file={row.original} r2PublicUrl={r2PublicUrl} onDelete={onDelete} />
    ),
    enableSorting: false,
    enableHiding: false,
  },
];
