"use client";

import { Category } from "@/actions/categories/admin";
import { DynamicIcon } from "@/components/DynamicIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { MoreHorizontal } from "lucide-react";

export const columns: ColumnDef<Category>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const name = row.original.name;
      const icon = row.original.icon;

      return (
        <div className="flex items-center gap-2">
          {icon && <DynamicIcon name={icon} className="h-4 w-4" />}
          <span>{name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "slug",
    header: "Slug",
  },
  {
    accessorKey: "displayOrder",
    header: "Order",
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive");
      return (
        <Badge variant={isActive ? "default" : "destructive"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      const date = row.getValue("createdAt");
      return <div>{dayjs(date as string).format("DD/MM/YYYY")}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const category = row.original;
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
            <DropdownMenuItem onClick={() => (table.options.meta as any)?.editCategory(category)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-500"
              onClick={() => (table.options.meta as any)?.deleteCategory(category)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
