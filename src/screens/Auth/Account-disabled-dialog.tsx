"use client"

import { useAuthStore } from "@/api/stores/auth.store"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Ban } from "lucide-react"
import { useEffect } from "react"

const LOGOUT_DELAY_MS = 4000

export function AccountDisabledDialog() {
  const { accountDisabled, logout } = useAuthStore()

  useEffect(() => {
    if (!accountDisabled) return
    const timeout = setTimeout(logout, LOGOUT_DELAY_MS)
    return () => clearTimeout(timeout)
  }, [accountDisabled, logout])

  return (
    <Dialog open={accountDisabled}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Ban size={20} />
          </div>
          <DialogHeader className="items-center">
            <DialogTitle>Compte désactivé</DialogTitle>
            <DialogDescription>
              Votre compte a été désactivé par un administrateur. Vous allez
              être déconnecté dans quelques secondes.
            </DialogDescription>
          </DialogHeader>
        </div>
      </DialogContent>
    </Dialog>
  )
}
