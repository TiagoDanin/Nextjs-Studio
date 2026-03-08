"use client";

import { Fragment, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { useEditorStore } from "@/stores/editor-store";
import { SheetCell } from "./sheet-cell";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Eye, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SheetRowInspector } from "./sheet-row-inspector";

export function SheetTable() {
  const router = useRouter();
  const rows = useEditorStore((s) => s.rows);
  const sortColumn = useEditorStore((s) => s.sortColumn);
  const sortDirection = useEditorStore((s) => s.sortDirection);
  const selectedRowIndex = useEditorStore((s) => s.selectedRowIndex);
  const isMdx = useEditorStore((s) => s.isMdx);
  const collectionName = useEditorStore((s) => s.collectionName);
  const rowSlugs = useEditorStore((s) => s.rowSlugs);
  const sortBy = useEditorStore((s) => s.sortBy);
  const selectRow = useEditorStore((s) => s.selectRow);
  const deleteRow = useEditorStore((s) => s.deleteRow);

  const columnKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const row of rows) {
      for (const key of Object.keys(row)) {
        keys.add(key);
      }
    }
    return Array.from(keys);
  }, [rows]);

  const columns: ColumnDef<Record<string, unknown>>[] = useMemo(
    () => [
      ...columnKeys.map(
        (key): ColumnDef<Record<string, unknown>> => ({
          accessorKey: key,
          header: () => (
            <button
              className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide hover:text-foreground"
              onClick={() => sortBy(key)}
            >
              {key}
              <ArrowUpDown
                className={cn(
                  "h-3 w-3",
                  sortColumn === key
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              />
              {sortColumn === key && (
                <span className="text-xs">
                  {sortDirection === "asc" ? "↑" : "↓"}
                </span>
              )}
            </button>
          ),
          cell: ({ row }) => (
            <SheetCell value={row.original[key]} />
          ),
        }),
      ),
      {
        id: "actions",
        header: () => (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Actions
          </span>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            {isMdx && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(
                      `/collection/${collectionName}/${rowSlugs[row.index] ?? ""}`,
                    );
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                deleteRow(row.index);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ),
        size: isMdx ? 100 : 40,
      },
    ],
    [columnKeys, sortColumn, sortDirection, sortBy, deleteRow, isMdx, collectionName, rowSlugs, router],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={columns.length}
      className="h-24 text-center text-muted-foreground"
            >
              No data
            </TableCell>
          </TableRow>
        ) : (
          table.getRowModel().rows.map((row) => (
            <Fragment key={row.id}>
              {selectedRowIndex === row.index ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="p-0">
                    <SheetRowInspector rowIndex={row.index} />
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow
                  data-state={undefined}
                  className="cursor-pointer"
                  onClick={() => selectRow(row.index)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              )}
            </Fragment>
          ))
        )}
      </TableBody>
    </Table>
  );
}
