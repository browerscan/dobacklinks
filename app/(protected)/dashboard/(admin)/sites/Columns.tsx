"use client";

import { approveProductAction } from "@/actions/products/admin";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ProductWithCategories } from "@/types/product";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { Check, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { ProductActions } from "./ProductActions";

interface ApproveProductButtonProps {
  productId: string;
}

const ApproveProductButton = ({ productId }: ApproveProductButtonProps) => {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approveProductAction({ productId });
      if (result.success) {
        toast.success("Product approved successfully!");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to approve product.");
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="mt-1 h-6 px-2 text-xs border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-700 mr-1"></div>
              Approving...
            </>
          ) : (
            <>
              <Check className="h-3 w-3 mr-1" />
              Approve
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Approve Product?</AlertDialogTitle>
          <AlertDialogDescription>
            This will change the product status to &quot;live&quot; and it will be visible to the
            public. Are you sure?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleApprove} disabled={isPending}>
            {isPending ? "Approving..." : "Yes, approve"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

interface StatusFilterProps {
  onStatusChange: (status: string | undefined) => void;
  currentStatus?: string;
}

interface BooleanFilterProps {
  onFilterChange: (value: boolean | undefined) => void;
  currentValue?: boolean;
  label: string;
}

const statusBadgeStyle = {
  live: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  pending_review: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
};

const StatusFilter = ({ onStatusChange, currentStatus }: StatusFilterProps) => {
  return (
    <Select
      value={currentStatus || "all"}
      onValueChange={(value) => {
        onStatusChange(value === "all" ? undefined : value);
      }}
    >
      <SelectTrigger className="w-[120px] h-8">
        <SelectValue placeholder="All" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All</SelectItem>
        <SelectItem value="live">Live</SelectItem>
        <SelectItem value="pending_review">Pending Review</SelectItem>
      </SelectContent>
    </Select>
  );
};

const BooleanFilter = ({ onFilterChange, currentValue, label }: BooleanFilterProps) => {
  return (
    <Select
      value={currentValue === undefined ? "all" : currentValue ? "true" : "false"}
      onValueChange={(value) => {
        if (value === "all") {
          onFilterChange(undefined);
        } else {
          onFilterChange(value === "true");
        }
      }}
    >
      <SelectTrigger className="w-[80px] h-8">
        <SelectValue placeholder="All" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All</SelectItem>
        <SelectItem value="true">Yes</SelectItem>
        <SelectItem value="false">No</SelectItem>
      </SelectContent>
    </Select>
  );
};

interface ColumnFilters {
  status?: string;
  isFeatured?: boolean;
  priceRange?: string;
}

interface CreateColumnsProps {
  filters: ColumnFilters;
  onFilterChange: (key: keyof ColumnFilters, value: any) => void;
}

export const createColumns = ({
  filters,
  onFilterChange,
}: CreateColumnsProps): ColumnDef<ProductWithCategories>[] => [
  {
    accessorKey: "logoUrl",
    header: "Logo",
    cell: ({ row }) => {
      const logoUrl = row.original.logoUrl;
      const productName = row.original.name;
      return logoUrl ? (
        <Image
          src={logoUrl}
          alt={`${productName} logo`}
          width={32}
          height={32}
          loading="lazy"
          className="rounded-md"
        />
      ) : (
        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-xs">
          -
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Name",
    minSize: 200,
    cell: ({ row }) => {
      const name = row.original.name;
      return (
        <Link
          href={`/sites/${row.original.slug}`}
          target="_blank"
          rel="noopener noreferrer nofollow"
          prefetch={false}
          className="hover:underline"
        >
          {name}
        </Link>
      );
    },
  },
  {
    accessorKey: "url",
    header: "Website",
    cell: ({ row }) => {
      const url = row.original.url;
      return (
        <Link
          href={url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          prefetch={false}
          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
        >
          <span className="text-xs">Visit</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      );
    },
  },
  {
    accessorKey: "status",
    minSize: 200,
    header: () => (
      <div className="flex flex-col gap-1">
        <span>Status</span>
        <StatusFilter
          onStatusChange={(value) => onFilterChange("status", value)}
          currentStatus={filters.status}
        />
      </div>
    ),
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <div className="">
          <Badge
            className={cn("capitalize", statusBadgeStyle[status] || "bg-gray-500")}
            variant="outline"
          >
            {status.replace(/_/g, " ")}
          </Badge>
          {status === "pending_review" && <ApproveProductButton productId={row.original.id} />}
        </div>
      );
    },
  },
  {
    accessorKey: "tagline",
    header: "Tagline",
    maxSize: 300,
    cell: ({ row }) => {
      const tagline = row.original.tagline;
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="truncate max-w-72 md:max-w-[31rem]">{tagline}</span>
            </TooltipTrigger>
            <TooltipContent>
              <span className="text-xs max-w-72 md:max-w-[31rem]">{tagline}</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    accessorKey: "categories",
    header: "Categories",
    minSize: 360,
    cell: ({ row }) => {
      const categories = row.original.categories;
      return (
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className=" text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
            >
              #{category.name}
            </div>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "dr",
    header: "DR",
    minSize: 80,
    cell: ({ row }) => <span>{row.original.dr ?? "-"}</span>,
  },
  {
    accessorKey: "da",
    header: "DA",
    minSize: 80,
    cell: ({ row }) => <span>{row.original.da ?? "-"}</span>,
  },
  {
    accessorKey: "priceRange",
    header: "Price",
    minSize: 120,
    cell: ({ row }) => <span>{row.original.priceRange || "Contact"}</span>,
  },
  {
    accessorKey: "isFeatured",
    minSize: 150,
    header: () => (
      <div className="flex flex-col gap-1">
        <span>Featured</span>
        <BooleanFilter
          onFilterChange={(value) => onFilterChange("isFeatured", value)}
          currentValue={filters.isFeatured}
          label="Featured"
        />
      </div>
    ),
    cell: ({ row }) => {
      return row.original.isFeatured ? (
        <Badge variant="default">Yes</Badge>
      ) : (
        <Badge variant="secondary">No</Badge>
      );
    },
  },
  {
    accessorKey: "submittedAt",
    header: "Submitted At",
    minSize: 180,
    cell: ({ row }) => {
      const date = row.original.submittedAt;
      return date ? <span>{dayjs(date).format("YYYY-MM-DD HH:mm")}</span> : "-";
    },
  },
  {
    accessorKey: "lastRenewedAt",
    header: "Last Renewed At",
    minSize: 180,
    cell: ({ row }) => {
      const date = row.original.lastRenewedAt;
      return date ? <span>{dayjs(date).format("YYYY-MM-DD HH:mm")}</span> : "-";
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const product = row.original;
      return <ProductActions product={product} />;
    },
  },
];
