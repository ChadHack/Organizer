import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableSkeletonProps {
  columns: number;
  rows: number;
  showFilters?: boolean;
  showPagination?: boolean;
}

export function DataTableSkeleton({
  columns,
  rows,
  showFilters = true,
  showPagination = true,
}: DataTableSkeletonProps) {
  return (
    <div className="w-full">
      {/* Filters skeleton */}
      {showFilters && (
        <div className="flex items-center gap-4 py-4 flex-wrap">
          {/* Search input skeleton */}
          <Skeleton className="h-10 w-62.5" />

          {/* Filter select skeleton */}
          {/* <Skeleton className="h-10 w-45" /> */}

          {/* Columns dropdown skeleton */}
          <Skeleton className="h-10 w-30 ml-auto" />
        </div>
      )}

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: columns }).map((_, index) => (
                <TableHead key={index}>
                  <Skeleton className="h-4 w-full" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <TableCell key={colIndex}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination skeleton */}
      {showPagination && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex-1">
            <Skeleton className="h-4 w-50" />
          </div>
          <div className="space-x-2 flex">
            <Skeleton className="h-9 w-25" />
            <Skeleton className="h-9 w-25" />
          </div>
        </div>
      )}
    </div>
  );
}
