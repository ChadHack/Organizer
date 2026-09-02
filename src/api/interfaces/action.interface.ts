import type { Article } from "./article.interface"
import type { User } from "./user.interface"

export interface Action {
  id: string
  name: string
  description?: string
  articles: Article[]
  status: "En attente" | "En cours" | "Terminée" | "Annulée"
  /** Dérivé automatiquement des articles (somme des price non "Annulé"). Lecture seule. */
  cost: number
  userId: string
  user: User
  created: Date
  updated: Date
}
