import type { Action } from "@/api/interfaces/action.interface"
import { useActionStore } from "@/api/stores/action.store"
import {
  RowActionsMenu,
  type RowAction,
  type RowActionGroup,
} from "@/components/data-tables/row-actions-menu"
import { Ban, Edit, Play, ScrollText, Trash } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import DetailsAction from "./actions/details-action"
import UpdateAction from "./actions/update-action"

export function ActionsCell({ action }: { action: Action }) {
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const updateAction = useActionStore((s) => s.updateAction)
  const deleteAction = useActionStore((s) => s.deleteAction)

  const groups: RowActionGroup[] = [
    {
      heading: "Actions",
      actions: [
        {
          key: "details",
          label: "Détails",
          icon: ScrollText,
          onSelect: () => setShowDetailDialog(true),
        },
        {
          key: "update",
          label: "Modifier",
          icon: Edit,
          onSelect: () => setShowUpdateDialog(true),
        },
      ],
    },
    {
      actions: [
        ...(action.status === "Annulée"
          ? ([
              {
                key: "restart",
                label: "Reprendre",
                icon: Play,
                variant: "default",
                onSelect: () => {
                  toast.warning(
                    "Etes vous sûr de vouloir reprendre cette action ?",
                    {
                      description: "Cette action sera repris à l'état.",
                      action: {
                        label: "Reprendre",
                        onClick: async () => {
                          await updateAction(action.id, { status: "En cours" })
                        },
                      },
                      cancel: {
                        label: "Fermer",
                        onClick: () => toast.info("Reprise annulée"),
                      },
                    }
                  )
                },
              },
            ] satisfies RowAction[])
          : ([
              {
                key: "abort",
                label: "Annulé",
                icon: Ban,
                variant: "destructive",
                onSelect: () => {
                  toast.warning(
                    "Etes vous sûr de vouloir annuler cette action ?",
                    {
                      description:
                        "Cette action annulera l'action mais pourra être reprise plutard",
                      action: {
                        label: "Annulé",
                        onClick: async () => {
                          await updateAction(action.id, { status: "Annulée" })
                        },
                      },
                      cancel: {
                        label: "Fermer",
                        onClick: () => toast.info("Suppression annulée"),
                      },
                    }
                  )
                },
              },
            ] satisfies RowAction[])),
        {
          key: "delete",
          label: "Supprimer",
          icon: Trash,
          variant: "destructive" as const,
          onSelect: () => {
            toast.warning("Etes vous sûr de vouloir le supprimer ?", {
              description: `Cette action supprimera définitivement l'entité(${action.name}) et toutes ses données.`,
              action: {
                label: "Supprimer",
                onClick: async () => await deleteAction(action.id),
              },
              cancel: {
                label: "Annulée",
                onClick: () => toast.info("Suppression annulée"),
              },
            })
          },
        },
      ],
    },
  ]

  return (
    <>
      <RowActionsMenu groups={groups} />

      <UpdateAction
        action={action}
        open={showUpdateDialog}
        setOpen={setShowUpdateDialog}
      />
      <DetailsAction
        action={action}
        open={showDetailDialog}
        setOpen={setShowDetailDialog}
      />
    </>
  )
}
