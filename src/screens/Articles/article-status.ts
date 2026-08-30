import type { Article } from "@/api/interfaces/article.interface"
import {
  Ban,
  CircleCheckBig,
  CirclePlay,
  RotateCwFadingClock,
  type LucideIcon,
} from "lucide-react"

/** Source unique icône/couleur par statut d'article, utilisée par columns.tsx, details-article.tsx, card-24.tsx et le kanban. */
export const ARTICLE_STATUS_CONFIG: Record<
  Article["status"],
  { icon: LucideIcon; badgeClassName: string; dotClassName: string }
> = {
  "En attente": {
    icon: RotateCwFadingClock,
    badgeClassName: "bg-neutral-200 text-neutral-800",
    dotClassName: "bg-neutral-900",
  },
  "En cours": {
    icon: CirclePlay,
    badgeClassName: "bg-accent-200 text-accent-800",
    dotClassName: "bg-primary",
  },
  Bouclé: {
    icon: CircleCheckBig,
    badgeClassName: "bg-accent-2-200 text-accent-2-800",
    dotClassName: "bg-accent-2-600",
  },
  Annulé: {
    icon: Ban,
    badgeClassName: "bg-red-300 text-red-700",
    dotClassName: "bg-red-500",
  },
}
