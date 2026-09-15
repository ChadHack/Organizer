import type { CartItem } from "@/api/interfaces/cart-item.interface"
import {
  Ban,
  CircleCheckBig,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react"

/** Source unique icône/couleur par statut d'article de panier — même
 * convention que ARTICLE_STATUS_CONFIG (article-status.ts). */
export const CART_STATUS_CONFIG: Record<
  CartItem["status"],
  { icon: LucideIcon; badgeClassName: string; dotClassName: string }
> = {
  "À acheter": {
    icon: ShoppingBag,
    badgeClassName: "bg-accent-200 text-accent-800",
    dotClassName: "bg-primary",
  },
  Acheté: {
    icon: CircleCheckBig,
    badgeClassName: "bg-accent-2-200 text-accent-2-800",
    dotClassName: "bg-accent-2-600",
  },
  Abandonné: {
    icon: Ban,
    badgeClassName: "bg-red-300 text-red-700",
    dotClassName: "bg-red-500",
  },
}

export const CART_STATUSES = Object.keys(
  CART_STATUS_CONFIG
) as CartItem["status"][]
