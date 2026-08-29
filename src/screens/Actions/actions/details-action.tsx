"use client"

import type { Action } from "@/api/interfaces/action.interface"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { EmptyStateIllustration } from "@/components/ui/empty-state-illustration"
import { motion, type Variants } from "motion/react"
import { Link } from "react-router-dom"
import { ACTION_STATUS_CONFIG } from "../action-status"

const EASE = [0.16, 1, 0.3, 1] as const

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
}
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE },
  },
}

export default function DetailsAction({
  action,
  open,
  setOpen,
}: {
  action: Action
  open: boolean
  setOpen: (open: boolean) => void
}) {
  const { icon: StatusIcon, badgeClassName } =
    ACTION_STATUS_CONFIG[action.status]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="gap-6 sm:max-w-3xl">
        <DialogHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <DialogTitle className="flex items-center gap-2">
              {action.name}
              <Badge className={badgeClassName}>
                <StatusIcon className="size-3" />
                {action.status}
              </Badge>
            </DialogTitle>
            <DialogDescription>{action.description}</DialogDescription>
          </div>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">Articles</p>
          {action.articles.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {action.articles.map(({ name, description, image, id }) => (
                <Link
                  to={"articles/" + id}
                  key={name}
                  type="button"
                  className="flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex shrink-0 items-center justify-center rounded-md border p-2">
                    <Avatar>
                      <AvatarImage src={image} alt="user" />
                      <AvatarFallback className="text-sm font-medium">
                        IMG
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {name}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex w-full items-center justify-center px-4 py-10 sm:py-16">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="flex w-92 max-w-full flex-col items-center gap-6"
              >
                <Empty className="gap-4 border-none p-0">
                  <EmptyHeader className="gap-4">
                    <motion.div variants={itemVariants}>
                      <EmptyMedia variant="default" className="mb-0">
                        <EmptyStateIllustration />
                      </EmptyMedia>
                    </motion.div>
                    <motion.div
                      variants={itemVariants}
                      className="flex flex-col items-center gap-0.5"
                    >
                      <EmptyTitle className="text-lg font-medium text-destructive">
                        Vide
                      </EmptyTitle>
                      <EmptyDescription className="text-center">
                        La liste est vide, aucune donnée trouvée.
                      </EmptyDescription>
                    </motion.div>
                  </EmptyHeader>
                </Empty>
              </motion.div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
