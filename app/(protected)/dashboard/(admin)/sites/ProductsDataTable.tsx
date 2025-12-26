"use client";

import { Category } from "@/actions/categories/admin";
import { getProductsAsAdminAction } from "@/actions/products/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminProductFilters, ProductStatus, ProductWithCategories } from "@/types/product";
import {
  ColumnDef,
  ColumnPinningState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { LayoutGrid, Loader2, Table2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import { createColumns } from "./Columns";
import { ProductCardView } from "./ProductCardView";

interface ProductsDataTableProps {
  initialData: ProductWithCategories[];
  initialPageCount: number;
  pageSize: number;
  totalProducts: number;
  categories: Category[];
}

export function ProductsDataTable({
  initialData,
  initialPageCount,
  pageSize,
  totalProducts,
  categories,
}: ProductsDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [debouncedGlobalFilter] = useDebounce(globalFilter, 500);
  const [filters, setFilters] = useState<AdminProductFilters>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSize,
  });
  const [data, setData] = useState<ProductWithCategories[]>(initialData);
  const [pageCount, setPageCount] = useState<number>(initialPageCount);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: ["name", "logoUrl"],
    right: ["actions"],
  });
  const [hasUsedInitialData, setHasUsedInitialData] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Auto-switch to card view on mobile
      if (window.innerWidth < 768) {
        setViewMode("card");
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (debouncedGlobalFilter !== undefined) {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }
  }, [debouncedGlobalFilter]);

  useEffect(() => {
    const isInitialQuery =
      pagination.pageIndex === 0 && !debouncedGlobalFilter && Object.keys(filters).length === 0;

    if (hasUsedInitialData && isInitialQuery) {
      setHasUsedInitialData(false);
      return;
    }

    setHasUsedInitialData(false);

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await getProductsAsAdminAction({
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          name: debouncedGlobalFilter,
          ...filters,
        });

        if (!result.success) {
          throw new Error(result.error || "Failed to fetch products");
        }

        setData(result.data?.products as ProductWithCategories[]);
        setPageCount(Math.ceil((result.data?.count || 0) / pagination.pageSize));
      } catch (error: any) {
        toast.error("Failed to fetch products", {
          description: error.message,
        });
        setData([]);
        setPageCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [
    debouncedGlobalFilter,
    pagination.pageIndex,
    pagination.pageSize,
    filters,
    initialData,
    hasUsedInitialData,
  ]);

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handleColumnFilterChange = (key: string, value: any) => {
    handleFilterChange({ [key]: value });
  };

  const columns = createColumns({
    filters: {
      status: filters.status as ProductStatus,
      isFeatured: filters.isFeatured,
      priceRange: filters.priceRange,
    },
    onFilterChange: handleColumnFilterChange,
  });

  const table = useReactTable({
    data,
    columns: columns as ColumnDef<ProductWithCategories, any>[],
    pageCount: pageCount,
    state: {
      sorting,
      pagination,
      columnVisibility,
      columnPinning,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    enableColumnPinning: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    debugTable: process.env.NODE_ENV === "development",
  });

  return (
    <div className="w-full">
      <div className="flex flex-col items-start sm:flex-row sm:items-center gap-4 py-4">
        <Input
          placeholder="Search sites by name"
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
        <Select
          onValueChange={(value) =>
            handleFilterChange({
              categoryId: value === "all" ? undefined : value,
            })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* View Mode Toggle - Show on mobile */}
        {isMobile && (
          <div className="flex gap-2 ml-auto">
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              <Table2 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "card" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("card")}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Conditional rendering based on viewMode */}
      {viewMode === "card" ? (
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          <ProductCardView products={data} />
        </div>
      ) : (
        <div className="rounded-md border relative">
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          <div className="h-[calc(100vh-250px)] overflow-auto rounded-md">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead
                          key={header.id}
                          style={{
                            width: header.getSize(),
                            minWidth: header.column.columnDef.minSize,
                            maxWidth: header.column.columnDef.maxSize,
                            position: header.column.getIsPinned() ? "sticky" : "relative",
                            left:
                              header.column.getIsPinned() === "left"
                                ? `${header.column.getStart("left")}px`
                                : undefined,
                            right:
                              header.column.getIsPinned() === "right"
                                ? `${header.column.getAfter("right")}px`
                                : undefined,
                            zIndex: header.column.getIsPinned() ? 20 : 1,
                            backgroundColor: "hsl(var(--background))",
                            boxShadow:
                              header.column.getIsPinned() === "left" &&
                              header.column.getIsLastColumn("left")
                                ? "2px 0 4px -2px rgba(0, 0, 0, 0.1)"
                                : header.column.getIsPinned() === "right" &&
                                    header.column.getIsFirstColumn("right")
                                  ? "-2px 0 4px -2px rgba(0, 0, 0, 0.1)"
                                  : undefined,
                          }}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          style={{
                            width: cell.column.getSize(),
                            minWidth: cell.column.columnDef.minSize,
                            maxWidth: cell.column.columnDef.maxSize,
                            position: cell.column.getIsPinned() ? "sticky" : "relative",
                            left:
                              cell.column.getIsPinned() === "left"
                                ? `${cell.column.getStart("left")}px`
                                : undefined,
                            right:
                              cell.column.getIsPinned() === "right"
                                ? `${cell.column.getAfter("right")}px`
                                : undefined,
                            zIndex: cell.column.getIsPinned() ? 20 : 1,
                            backgroundColor: "hsl(var(--background))",
                            boxShadow:
                              cell.column.getIsPinned() === "left" &&
                              cell.column.getIsLastColumn("left")
                                ? "2px 0 4px -2px rgba(0, 0, 0, 0.1)"
                                : cell.column.getIsPinned() === "right" &&
                                    cell.column.getIsFirstColumn("right")
                                  ? "-2px 0 4px -2px rgba(0, 0, 0, 0.1)"
                                  : undefined,
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      {isLoading ? "" : "No results."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} (
          {totalProducts} Products)
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage() || isLoading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage() || isLoading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
