"use client"

import type { Article } from "@/api/interfaces/article.interface"
import { useArticleStore } from "@/api/stores/article.store"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

type Props = {
  article: Article
}

const ArticleCard = ({ article }: Props) => {
  const deleteArticle = useArticleStore((state) => state.deleteArticle)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: article.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleDelete = () => {
    toast.warning("Êtes-vous sûr de vouloir le supprimer ?", {
      description:
        "Cette action supprimera définitivement l'article et toutes ses données.",
      action: {
        label: "Supprimer",
        onClick: () => deleteArticle(article.id),
      },
      cancel: {
        label: "Annulée",
        onClick: () => toast.info("Suppression annulée"),
      },
    })
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group flex w-full cursor-grab touch-none flex-col gap-1.5 rounded-[20px] bg-card p-3.5 shadow-sm active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium wrap-break-word text-card-foreground">
          {article.name}
        </p>
        <Button
          variant="link"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={handleDelete}
          size="icon-xs"
          className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-accent-800"
        >
          <Trash2 size={14} className="size-4!" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <span>Priorité {article.priority.priority}</span>
        <span aria-hidden>·</span>
        <span>Qté {article.quantity}</span>
        {article.action && (
          <>
            <span aria-hidden>·</span>
            <span className="truncate">{article.action.name}</span>
          </>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        {format(new Date(article.estimateDate), "d MMM yyyy", { locale: fr })}
      </p>
    </div>
  )
}

export default ArticleCard
