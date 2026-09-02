import type { Action } from "./action.interface"
import type { Article } from "./article.interface"

export interface User {
  id: string
  name: string
  email: string
  isAdmin: boolean
  avatar: string
  status: boolean
  actions: Action[]
  articles: Article[]
  created: Date
  updated: Date
}
