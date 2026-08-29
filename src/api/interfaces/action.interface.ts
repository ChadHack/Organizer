import type { Article } from "./article.interface"

export interface Action {
  id: string
  name: string
  description?: string
  articles: Article[]
  status: "En attente" | "En cours" | "Terminée" | "Annulée"
  /** Dérivé automatiquement des articles (somme des price non "Annulé"). Lecture seule. */
  cost: number
  createdAt: Date
  updatedAt: Date
}
