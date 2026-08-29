"use client"

import type { Article } from "@/api/interfaces/article.interface"
import { useArticleStore } from "@/api/stores/article.store"
import { usePriorityStore } from "@/api/stores/priority.store"
import { RippleSpinner } from "@/components/shadcn-space/radix/spinner/spinner-09"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Crosshair } from "lucide-react"
import { useEffect } from "react"
import { toast } from "sonner"

export function UpdatePriority({
  article,
  open,
  setOpen,
}: {
  article: Article
  open: boolean
  setOpen: (open: boolean) => void
}) {
  const updateArticle = useArticleStore((s) => s.updateArticle)
  const loading = useArticleStore((s) => s.loading)
  const priorities = usePriorityStore((s) => s.priorities)
  const fetchPriorities = usePriorityStore((s) => s.fetchPriorities)

  useEffect(() => {
    fetchPriorities()
  }, [fetchPriorities])

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const form = new FormData(e.currentTarget)
      const priority = form.get("priority") as string
      await updateArticle(article.id, { priorityId: priority })
      toast.success("Priorité mise à jour avec succès")
      setOpen(false)
    } catch (error) {
      toast.error("Impossible de mêtre à jour la priorité", {
        description:
          error instanceof Error ? error.message : "Veuillez réessayer",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="duration-300 data-open:zoom-in-100 data-open:slide-in-from-left-8 data-closed:zoom-out-100 data-closed:slide-out-to-left-8 [[data-slot=dialog-overlay]:has(~_&)]:duration-300">
        <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Crosshair size={18} />
        </div>
        <DialogHeader>
          <DialogTitle>Changer l'ordre de priorité</DialogTitle>
          <DialogDescription>
            Mettre à jour l'ordre de priorité
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="w-full space-y-2">
            <Label htmlFor="priority" className="gap-1">
              Priorité
            </Label>

            <Select name="priority" defaultValue={article.priorityId} required>
              <SelectTrigger id="priority" className="w-full">
                <SelectValue />
              </SelectTrigger>

              <SelectContent
                className={
                  "origin-center duration-400 data-[state=open]:zoom-in-0!"
                }
              >
                {priorities.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.priority}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            variant="secondary"
            className="w-full cursor-pointer hover:bg-primary/80"
          >
            <RippleSpinner size="sm" className={loading ? "flex" : "hidden"} />
            Mettre à jour
          </Button>
          <DialogClose asChild>
            <Button
              type="button"
              className="w-full cursor-pointer hover:bg-primary/80"
            >
              Fermer
            </Button>
          </DialogClose>
        </form>
      </DialogContent>
    </Dialog>
  )
}
