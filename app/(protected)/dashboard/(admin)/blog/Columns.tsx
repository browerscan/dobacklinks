"use client";

import { type PostWithTags } from "@/actions/blogs/posts";
import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { Pin } from "lucide-react";
import { BlogListActions } from "./BlogListActions";

const getStatusBadgeVariant = (
  status: string,
): "default" | "secondary" | "outline" | "destructive" => {
  switch (status) {
    case "published":
      return "default";
    case "draft":
      return "secondary";
    case "archived":
      return "outline";
    default:
      return "secondary";
  }
};

const getVisibilityBadgeVariant = (
  visibility: string,
): "default" | "secondary" | "outline" | "destructive" => {
  switch (visibility) {
    case "public":
      return "secondary";
    case "logged_in":
    case "subscribers":
      return "outline";
    default:
      return "secondary";
  }
};

export const columns: ColumnDef<PostWithTags>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue("title")}</div>;
    },
  },
  {
    accessorKey: "isPinned",
    header: "Pinned",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.getValue("isPinned") ? <Pin className="w-4 h-4" /> : "-"}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return <Badge variant={getStatusBadgeVariant(status)}>{status}</Badge>;
    },
  },
  {
    accessorKey: "visibility",
    header: "Visibility",
    cell: ({ row }) => {
      const visibility = row.getValue("visibility") as string;
      const label =
        visibility === "logged_in" || visibility === "subscribers"
          ? "members"
          : visibility;
      return (
        <Badge variant={getVisibilityBadgeVariant(visibility)}>{label}</Badge>
      );
    },
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: ({ row }) => {
      const tags = row.original.tags || [];
      if (tags.length === 0)
        return <span className="text-muted-foreground">-</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="text-xs">
              {tag.name}
            </Badge>
          ))}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "publishedAt",
    header: "Published",
    cell: ({ row }) => {
      const date = row.getValue("publishedAt") as string | Date;
      try {
        return date ? dayjs(date).format("YYYY-MM-DD HH:mm") : "-";
      } catch {
        return "-";
      }
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const post = row.original;
      return <BlogListActions post={post} />;
    },
  },
];
