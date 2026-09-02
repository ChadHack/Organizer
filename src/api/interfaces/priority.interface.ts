import type { Article } from "./article.interface"

export interface Priority {
  id: string
  priority: number
  articles: Article[]
  created: Date
  updated: Date
}
