import type { Article } from "@/api/interfaces/article.interface"
import { useArticleStore } from "@/api/stores/article.store"
import type { RowActionGroup } from "@/components/data-tables/row-actions-menu"
import { Crosshair, Edit, ScrollText, Trash } from "lucide-react"
import { toast } from "sonner"

export function getArticleActionGroups(
  article: Article,
  navigate: (path: string) => void,
  onEditPriority: () => void,
  onEditArticle: () => void
): RowActionGroup[] {
  const deleteArticle = useArticleStore.getState().deleteArticle
  return [
    {
      heading: "Actions",
      actions: [
        {
          key: "details",
          label: "Détails",
          icon: ScrollText,
          onSelect: () => navigate(`/articles/${article.id}`),
        },
        {
          key: "update",
          label: "Modifier",
          icon: Edit,
          onSelect: onEditArticle,
        },
        {
          key: "priority",
          label: "Ordre de priorité",
          icon: Crosshair,
          onSelect: onEditPriority,
        },
      ],
    },
    {
      actions: [
        {
          key: "delete",
          label: "Supprimer",
          icon: Trash,
          variant: "destructive",
          onSelect: () => {
            toast.warning(`Supprimer "${article.name}" ?`, {
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
          },
        },
      ],
    },
  ]
}
