import { useActionStore } from "@/api/stores/action.store"
import { DataTableSkeleton } from "@/components/data-tables/data-table-skeleton"
import { DataTable } from "@/components/data-tables/data-tables"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import groupBy from "lodash/groupBy"
import { Plus } from "lucide-react"
import { motion } from "motion/react"
import { useEffect, useState } from "react"
import { ACTION_STATUS_CONFIG } from "./action-status"
import NewAction from "./actions/new-action"
import { actionColumns } from "./columns"

const STATUS_ORDER: (keyof typeof ACTION_STATUS_CONFIG)[] = [
  "En attente",
  "En cours",
  "Terminée",
  "Annulée",
]

const Actions = () => {
  const { actions, fetchActions, loading } = useActionStore()
  const [showNewActionDialog, setShowNewActionDialog] = useState(false)

  useEffect(() => {
    fetchActions()
  }, [fetchActions])
  const actionStatus = groupBy(actions, "status")

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative space-y-6"
    >
      <PageHeader
        title="Actions"
        subtitle="Regroupements d'articles et suivi de leur coût"
        action={
          <Button
            className="bg-neutral-900 text-neutral-100 hover:bg-neutral-800"
            onClick={() => setShowNewActionDialog(true)}
          >
            <Plus className="size-4" />
            Nouvelle action
          </Button>
        }
      />

      {actions.length > 0 && (
        <div className="grid grid-cols-2 gap-4.5 lg:grid-cols-4">
          {STATUS_ORDER.map((status) => {
            const { icon: Icon, badgeClassName } = ACTION_STATUS_CONFIG[status]
            const count = actionStatus[status]?.length ?? 0
            return (
              <Card key={status} className="p-5.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{status}</p>
                    <p className="mt-2 font-heading text-[28px] leading-none">
                      {count}
                    </p>
                  </div>
                  <span
                    className={
                      "grid size-10 shrink-0 place-items-center rounded-full " +
                      badgeClassName
                    }
                  >
                    <Icon className="size-4" />
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Liste des actions</CardTitle>
          <CardDescription>
            Liste exhaustive de toutes les actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <DataTableSkeleton
              columns={actionColumns.length}
              rows={actions.length}
            />
          ) : (
            <DataTable
              tableId="actions"
              columns={actionColumns}
              data={actions}
              searchKey="name"
              searchPlaceholder="Filtrer par nom.."
              columnFilters={[
                {
                  columnId: "status",
                  label: "Status",
                  options: ["En attente", "En cours", "Terminée", "Annulée"],
                },
              ]}
            />
          )}
        </CardContent>
      </Card>

      <NewAction open={showNewActionDialog} setOpen={setShowNewActionDialog} />
    </motion.div>
  )
}
export default Actions
