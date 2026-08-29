"use client"

import type { Action } from "@/api/interfaces/action.interface"
import type { DataTableFeatures } from "@/components/data-tables/table-features"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { cn, fmtPrice } from "@/lib/utils"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { ACTION_STATUS_CONFIG } from "./action-status"
import { ActionsCell } from "./actions-cell"

export const actionColumns: ColumnDef<DataTableFeatures, Action>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected()
            ? true
            : table.getIsSomePageRowsSelected()
              ? "indeterminate"
              : false
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Tout sélectionner"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Sélectionner la ligne"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nom
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <div className="min-w-2xs text-justify wrap-break-word whitespace-pre-wrap text-muted-foreground">
        {row.getValue("description") ?? "-"}
      </div>
    ),
  },
  {
    accessorKey: "articles",
    header: "Progression",
    cell: ({ row }) => {
      const articles = row.original.articles
      const articleClotured = articles.filter((a) => a.status === "Bouclé")
      const percent =
        articles.length > 0 && articleClotured.length > 0
          ? (articleClotured.length * 100) / articles.length
          : 0

      return (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">
              {articleClotured.length + "/" + articles.length}
            </span>
            <span className="text-xs font-medium text-muted-foreground tabular-nums">
              {percent.toFixed(2)}%
            </span>
          </div>
          <Progress
            value={percent}
            className={cn(
              "bg-neutral-200 **:data-[slot='progress-indicator']:duration-1000! **:data-[slot='progress-track']:h-2!",
              percent <= 50
                ? "**:data-[slot='progress-indicator']:bg-accent-500!"
                : percent <= 75
                  ? "**:data-[slot='progress-indicator']:bg-accent-400!"
                  : "**:data-[slot='progress-indicator']:bg-accent-2-600!"
            )}
          />
        </div>
      )
    },
  },
  {
    accessorKey: "cost",
    header: "Coût",
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        {fmtPrice(row.getValue("cost"))}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => {
      const status = row.getValue<Action["status"]>("status")
      const { icon: Icon, badgeClassName } = ACTION_STATUS_CONFIG[status]
      return (
        <Badge className={badgeClassName}>
          <Icon className="size-3" />
          {status}
        </Badge>
      )
    },
    filterFn: (row, columnId, value) => {
      return row.getValue<string>(columnId) === value
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => <ActionsCell action={row.original} />,
  },
]
