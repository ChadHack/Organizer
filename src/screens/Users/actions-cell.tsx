import type { User } from "@/api/interfaces/user.interface"
import { useUserStore } from "@/api/stores/user.store"
import {
  RowActionsMenu,
  type RowActionGroup,
} from "@/components/data-tables/row-actions-menu"
import { Ban, CheckCircle, ScrollText, Trash } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { UserProfile } from "../Auth/User-profile"
import UpdateStatus from "./action/update-status"

export function UsersCell({ user }: { user: User }) {
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const deleteUser = useUserStore((s) => s.deleteUser)

  const groups: RowActionGroup[] = [
    {
      heading: "Users",
      actions: [
        {
          key: "details",
          label: "Détails",
          icon: ScrollText,
          onSelect: () => setShowDetailDialog(true),
        },
        {
          key: "status",
          label: user.status ? "Désactiver" : "Activer",
          icon: user.status ? Ban : CheckCircle,
          onSelect: () => setShowStatusDialog(true),
        }, 
      ],
    },
    {
      actions: [
        {
          key: "delete",
          label: "Supprimer",
          icon: Trash,
          variant: "destructive" as const,
          onSelect: () => {
            toast.warning("Etes vous sûr de vouloir le supprimer ?", {
              description: `Cette user supprimera définitivement l'entité(${user.name}) et toutes ses données.`,
              action: {
                label: "Supprimer",
                onClick: async () => await deleteUser(user.id),
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
      <UserProfile
        user={user}
        open={showDetailDialog}
        setOpen={setShowDetailDialog}
      />
      <UpdateStatus
        user={user}
        open={showStatusDialog}
        setOpen={setShowStatusDialog}
      />
    </>
  )
}
