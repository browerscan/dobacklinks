"use client";

import { Category } from "@/actions/categories/admin";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { CategoryForm } from "./CategoryForm";
import { columns } from "./Columns";
import { DeleteCategoryDialog } from "./DeleteCategoryDialog";

interface CategoriesDataTableProps {
  data: Category[];
}

export function CategoriesDataTable({ data }: CategoriesDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    meta: {
      editCategory: (category: Category) => {
        setSelectedCategory(category);
        setIsFormOpen(true);
      },
      deleteCategory: (category: Category) => {
        setSelectedCategory(category);
        setIsDeleteDialogOpen(true);
      },
    },
  });

  const handleNewCategory = () => {
    setSelectedCategory(null);
    setIsFormOpen(true);
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Categories Management
          </h1>
        </div>
        <Button className="highlight-button" onClick={handleNewCategory}>
          <PlusIcon className="w-4 h-4" />
          Add New Category
        </Button>
      </div>

      <CategoryForm
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
        category={selectedCategory}
      />

      <DeleteCategoryDialog
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
        category={selectedCategory}
      />

      <div className="rounded-md border relative min-h-[200px] max-h-[calc(100vh-120px)] overflow-y-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
