import type { Action } from "./action.interface"
import type { Priority } from "./priority.interface"
import type { User } from "./user.interface"

export interface Article {
  id: string
  name: string
  description?: string
  image?: string
  imageUrl?: string
  link?: string
  price?: number
  quantity: number
  status: "En attente" | "En cours" | "Bouclé" | "Annulé"
  estimateDate: Date
  priorityId: string
  priority: Priority
  actionId?: string
  action?: Action
  userId: string
  user: User
  created: Date
  updated: Date
}
