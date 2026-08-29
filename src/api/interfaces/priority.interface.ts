import type { Article } from "./article.interface"

export interface Priority {
  id: string
  priority: number
  articles: Article[]
  createdAt: Date
  updatedAt: Date
}
