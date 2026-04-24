import React from "react";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (value: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  className?: string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export function Table<T extends Record<string, unknown>>({
  data,
  columns,
  className,
  emptyMessage = "No data available.",
  onRowClick,
}: TableProps<T>) {
  return (
    <div className={cn("overflow-x-auto rounded-xl border border-slate-100", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface/50 border-b border-slate-100">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={cn(
                  "text-left px-4 py-3 font-semibold text-primary/80 whitespace-nowrap",
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center py-12 text-gray-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={i}
                className={cn(
                  "border-b border-slate-50 table-row-hover",
                  onRowClick && "cursor-pointer",
                  i % 2 === 1 && "bg-slate-50/40"
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={cn("px-4 py-3 text-gray-700", col.className)}
                  >
                    {col.render
                      ? col.render(row)
                      : String(row[col.key as keyof T] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ←
      </button>
      {Array.from({ length: totalPages }).map((_, i) => (
        <button
          key={i}
          onClick={() => onPage(i + 1)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm",
            page === i + 1
              ? "bg-accent text-white"
              : "border border-slate-200 hover:bg-surface"
          )}
        >
          {i + 1}
        </button>
      ))}
      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed"
      >
        →
      </button>
    </div>
  );
}
