import type { Article } from "./article.interface"
import type { User } from "./user.interface"

export interface Priority {
  id: string
  priority: number
  articles: Article[]
  userId: string
  user: User
  created: Date
  updated: Date
}
