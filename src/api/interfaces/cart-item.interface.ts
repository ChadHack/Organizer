import type { User } from "./user.interface"

/** Point d'historique de prix (alimenté par trigger Postgres, cf.
 * supabase/cart-tracking.sql — jamais écrit par l'application). */
export interface CartItemPricePoint {
  id: string
  price: number
  recorded: Date
}

export interface CartItem {
  id: string
  name: string
  /** URL de la page produit d'origine. */
  url: string
  /** Marchand normalisé (hostname sans "www."), clé de regroupement. */
  merchant: string
  /** URL absolue de l'image produit (og:image / JSON-LD). */
  image?: string
  price?: number
  currency: string
  quantity: number
  status: "À acheter" | "Acheté" | "Abandonné"
  notes?: string
  userId: string
  user: User
  /** Historique de prix, du plus récent au plus ancien. */
  prices: CartItemPricePoint[]
  created: Date
  updated: Date
}

/** Résultat de l'Edge Function scrape-product. */
export interface ScrapedProduct {
  name: string | null
  image: string | null
  price: number | null
  currency: string | null
  merchant: string
  url: string
}
