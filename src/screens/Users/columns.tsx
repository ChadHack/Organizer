"use client"

import type { User } from "@/api/interfaces/user.interface"
import type { DataTableFeatures } from "@/components/data-tables/table-features"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { fmtDay, getInitials } from "@/lib/utils"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Ban, CheckCircle, Star } from "lucide-react"
import { UsersCell } from "./actions-cell"

export const userColumns: ColumnDef<DataTableFeatures, User>[] = [
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
    accessorKey: "avatar",
    header: "Avatar",
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        <Avatar size="lg">
          <AvatarImage src={row.getValue("avatar")} alt={row.original.name} />
          <AvatarFallback>{getInitials(row.original.name)}</AvatarFallback>
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
      <div className="font-medium">
        {row.getValue("name")}{" "}
        <Star
          className={`text-yellow-500 ${
            row.getValue("isAdmin") ? "flex" : "hidden"
          } `}
        />
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <div className="min-w-2xs text-justify wrap-break-word whitespace-pre-wrap text-muted-foreground">
        {row.getValue("email") ?? "-"}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => {
      return (
        <Badge variant={row.getValue("status") ? "default" : "destructive"}>
          {row.getValue("status") ? (
            <CheckCircle className="size-3" />
          ) : (
            <Ban className="size-3" />
          )}
          {row.getValue("status") ? "Actif" : "Inactif"}
        </Badge>
      )
    },
    filterFn: (row, columnId, value) => {
      return row.getValue<string>(columnId) === value
    },
  },
  {
    accessorKey: "created",
    header: "Date d'inscription",
    cell: ({ row }) => (
      <div className="min-w-2xs text-justify wrap-break-word whitespace-pre-wrap text-muted-foreground">
        {fmtDay(row.getValue("created")) ?? "-"}
      </div>
    ),
  },
  {
    id: "users",
    enableHiding: false,
    cell: ({ row }) => <UsersCell user={row.original} />,
  },
]
