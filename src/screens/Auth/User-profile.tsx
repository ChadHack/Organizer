"use client"

import { useActionStore } from "@/api/stores/action.store"
import { useArticleStore } from "@/api/stores/article.store"
import type { User } from "@/api/interfaces/user.interface"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { getInitials } from "@/lib/utils"
import { MailIcon } from "lucide-react"
import { useEffect } from "react"

export function UserProfile({
  user,
  open,
  setOpen,
}: {
  user: User
  open: boolean
  setOpen: (open: boolean) => void
}) {
  const { actions, fetchActionsByUser } = useActionStore()
  const { articles, fetchArticlesByUser } = useArticleStore()

  useEffect(() => {
    if (!open) return
    fetchActionsByUser(user.id)
    fetchArticlesByUser(user.id)
  }, [open, user.id, fetchActionsByUser, fetchArticlesByUser])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="duration-300 data-open:zoom-in-100 data-open:slide-in-from-right-8 data-closed:zoom-out-100 data-closed:slide-out-to-right-8 [[data-slot=dialog-overlay]:has(~_&)]:duration-300">
        <div className="flex items-center gap-3">
          <Avatar className="size-12">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0.5">
            <DialogTitle className="text-sm leading-none font-semibold">
              {user.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {user.isAdmin ? "Administrateur" : "Membre"}
            </DialogDescription>
          </div>
        </div>
        <div className="flex flex-col gap-2 rounded-lg bg-muted p-3 dark:bg-muted/50">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MailIcon size={14} />
            <span className="text-xs">{user.email}</span>
          </div>
          {/* <div className="flex items-center gap-2 text-muted-foreground">
            <PhoneIcon size={14} />
            <span className="text-xs">+1 (415) 867-5309</span>
          </div> */}
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          {[
            { label: "Actions", value: actions.length },
            { label: "Articles", value: articles.length },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg bg-muted p-2 dark:bg-muted/50"
            >
              <p className="text-sm font-semibold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <DialogClose asChild>
            <Button variant="outline" className="flex-1 cursor-pointer">
              Fermer
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
