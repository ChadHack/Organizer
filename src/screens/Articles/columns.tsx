"use client"

import type { Article } from "@/api/interfaces/article.interface"
import type { DataTableFeatures } from "@/components/data-tables/table-features"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { fmtPrice } from "@/lib/utils"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Package } from "lucide-react"
import { ActionsCell } from "./actions-cell"
import { ARTICLE_STATUS_CONFIG } from "./article-status"

export const articleColumns: ColumnDef<DataTableFeatures, Article>[] = [
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
    accessorKey: "image",
    header: "Image",
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        <Avatar size="lg">
          <AvatarImage src={row.getValue("image")} alt={row.original.name} />
          <AvatarFallback>
            <Package className="size-4" />
          </AvatarFallback>
        </Avatar>
      </div>
    ),
    enableSorting: false,
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
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => {
      const status = row.getValue<Article["status"]>("status")
      const { icon: Icon, badgeClassName } = ARTICLE_STATUS_CONFIG[status]
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
    accessorKey: "priority",
    header: "Priorité",
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        {row.original.priority?.priority ?? "N/A"}
      </div>
    ),
    filterFn: (row, columnId, value) => {
      const priority = row.getValue<{ priority?: number }>(columnId)
      return String(priority?.priority) === value
    },
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        {row.original.action?.name ?? "N/A"}
      </div>
    ),
    filterFn: (row, columnId, value) => {
      const action = row.getValue<{ name?: string }>(columnId)
      return action?.name === value
    },
  },
  {
    accessorKey: "price",
    header: "Prix",
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        {fmtPrice(row.getValue("price"))}
      </div>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => <ActionsCell article={row.original} />,
  },
]
