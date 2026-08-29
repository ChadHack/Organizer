import type { KanbanStatus } from "@/components/shadcn-space/radix/blocks/kanban-application-01/types"
import {
  Circle,
  CircleCheck,
  CircleDot,
  CircleX,
  type LucideIcon,
} from "lucide-react"

export const statusColumns: {
  id: KanbanStatus
  title: string
  icon: LucideIcon
  iconClassName: string
}[] = [
  {
    id: "En attente",
    title: "En attente",
    icon: Circle,
    iconClassName: "text-neutral-900 fill-neutral-900 size-2!",
  },
  {
    id: "En cours",
    title: "En cours",
    icon: CircleDot,
    iconClassName: "text-primary",
  },
  {
    id: "Bouclé",
    title: "Bouclé",
    icon: CircleCheck,
    iconClassName: "text-accent-2-600",
  },
  {
    id: "Annulé",
    title: "Annulé",
    icon: CircleX,
    iconClassName: "text-neutral-500",
  },
]
