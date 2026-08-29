import type { Article } from "@/api/interfaces/article.interface"
import type { LucideIcon } from "lucide-react"

export type KanbanStatus = Article["status"]

export interface KanbanColumnData {
  id: KanbanStatus
  title: string
  icon: LucideIcon
  iconClassName: string
  articles: Article[]
}
