"use client"

import type { User } from "@/api/interfaces/user.interface"
import { useUserStore } from "@/api/stores/user.store"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Ban, CheckCircle } from "lucide-react"
import { toast } from "sonner"

export default function UpdateStatus({
  user,
  open,
  setOpen,
}: {
  user: User
  open: boolean
  setOpen: (open: boolean) => void
}) {
  const updateUser = useUserStore((s) => s.updateUser)

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogContent
        className="duration-300 data-open:zoom-in-100 data-open:slide-in-from-bottom-8 data-closed:zoom-out-100 data-closed:slide-out-to-bottom-8 [[data-slot=dialog-overlay]:has(~_&)]:duration-300"
        showCloseButton={false}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className={`flex size-12 items-center justify-center rounded-full ${user.status ? "bg-destructive/10 text-destructive" : "bg-green-600/10 text-green-600"}`}
          >
            {user.status ? <Ban size={20} /> : <CheckCircle size={20} />}
          </div>
          <DialogHeader className="items-center">
            <DialogTitle>
              {user.status ? "Désactiver" : "Activer"} l'utilisateur
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir {user.status ? "désactiver" : "activer"}{" "}
              l'utilisateur {user.name} ?
            </DialogDescription>
          </DialogHeader>
          <div className="flex w-full gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1 cursor-pointer">
                Fermer
              </Button>
            </DialogClose>
            <Button
              variant={user.status ? "destructive" : "default"}
              className="flex-1 cursor-pointer"
              onClick={async () => {
                if (user.status) {
                  try {
                    await updateUser(user.id, { status: false })
                    toast.success("Utilisateur désactivé avec succès")
                    setOpen(false)
                  } catch (error) {
                    toast.error("Impossible de désactiver l'utilisateur", {
                      description:
                        error instanceof Error
                          ? error.message
                          : "Veuillez réessayer",
                    })
                  }
                } else {
                  try {
                    await updateUser(user.id, { status: true })
                    toast.success("Utilisateur activé avec succès")
                    setOpen(false)
                  } catch (error) {
                    toast.error("Impossible d'activer l'utilisateur", {
                      description:
                        error instanceof Error
                          ? error.message
                          : "Veuillez réessayer",
                    })
                  }
                }
              }}
            >
              {user.status ? "Désactiver" : "Activer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
