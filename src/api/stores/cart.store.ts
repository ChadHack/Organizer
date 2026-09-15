import type {
  CartItem,
  CartItemPricePoint,
  ScrapedProduct,
} from "@/api/interfaces/cart-item.interface"
import { supabase } from "@/lib/supabase"
import { create } from "zustand"
import { mapUserOrUnknown, type UserRow } from "./user.store"

const TABLE = "cart_items"
// Même convention que article.store.ts : les objets liés arrivent sous la
// clé (plurielle) de leur table, la colonne de relation "user" reste l'id.
const SELECT = "*, users(*), cart_item_prices(*)"

export interface CartItemPriceRow {
  id: string
  cartItem: string
  price: number
  recorded: string
}

export interface CartItemRow {
  id: string
  name: string
  url: string
  merchant: string
  image: string | null
  price: number | null
  currency: string
  quantity: number
  status: string
  notes: string | null
  user: string | null
  users?: UserRow | null
  cart_item_prices?: CartItemPriceRow[] | null
  created: string
  updated: string
}

function mapPricePoint(row: CartItemPriceRow): CartItemPricePoint {
  return { id: row.id, price: row.price, recorded: new Date(row.recorded) }
}

export function mapCartItem(record: CartItemRow): CartItem {
  return {
    id: record.id,
    name: record.name,
    url: record.url,
    merchant: record.merchant,
    image: record.image || undefined,
    price: record.price ?? undefined,
    currency: record.currency,
    quantity: record.quantity,
    status: record.status as CartItem["status"],
    notes: record.notes || undefined,
    userId: record.user ?? "",
    user: mapUserOrUnknown(record.users),
    prices: (record.cart_item_prices ?? [])
      .map(mapPricePoint)
      .sort((a, b) => b.recorded.getTime() - a.recorded.getTime()),
    created: new Date(record.created),
    updated: new Date(record.updated),
  }
}

export interface CartItemInput {
  name: string
  url: string
  merchant: string
  image?: string | null
  price?: number
  currency?: string
  quantity?: number
  status?: CartItem["status"]
  notes?: string
}

/** Hostname normalisé d'une URL produit — repli client si l'Edge Function
 * n'a pas répondu (le marchand reste dérivable du lien seul). */
export function merchantFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return ""
  }
}

interface CartState {
  cartItems: CartItem[]
  loading: boolean
  error: string | null
  fetchCartItems: () => Promise<void>
  /** Appelle l'Edge Function scrape-product (fetch côté serveur : les
   * pages marchandes bloquent le fetch direct depuis le navigateur). */
  scrapeProduct: (url: string) => Promise<ScrapedProduct>
  createCartItem: (data: CartItemInput) => Promise<CartItem>
  updateCartItem: (
    id: string,
    data: Partial<CartItemInput>
  ) => Promise<CartItem>
  /** Re-scrape la page produit et met à jour le prix courant ; le trigger
   * Postgres historise automatiquement tout changement effectif. */
  refreshPrice: (id: string) => Promise<CartItem>
  deleteCartItem: (id: string) => Promise<void>
}

export const useCartStore = create<CartState>((set, get) => ({
  cartItems: [],
  loading: false,
  error: null,

  fetchCartItems: async () => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select(SELECT)
        .order("created", { ascending: false })
      if (error) throw error
      set({
        cartItems: (data as unknown as CartItemRow[]).map(mapCartItem),
        loading: false,
      })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  scrapeProduct: async (url) => {
    const { data, error } = await supabase.functions.invoke("scrape-product", {
      body: { url },
    })
    if (error) throw error
    if (data?.error) throw new Error(data.error)
    return data as ScrapedProduct
  },

  createCartItem: async (data) => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    const { data: record, error } = await supabase
      .from(TABLE)
      .insert({
        currency: "XAF",
        quantity: 1,
        status: "À acheter",
        ...data,
        user: authUser?.id,
      })
      .select(SELECT)
      .single()
    if (error) throw error
    const item = mapCartItem(record as unknown as CartItemRow)
    set({ cartItems: [item, ...get().cartItems] })
    return item
  },

  updateCartItem: async (id, data) => {
    const { data: record, error } = await supabase
      .from(TABLE)
      .update(data)
      .eq("id", id)
      .select(SELECT)
      .single()
    if (error) throw error
    const item = mapCartItem(record as unknown as CartItemRow)
    set({
      cartItems: get().cartItems.map((c) => (c.id === id ? item : c)),
    })
    return item
  },

  refreshPrice: async (id) => {
    const current = get().cartItems.find((c) => c.id === id)
    if (!current) throw new Error("Article de panier introuvable")
    const scraped = await get().scrapeProduct(current.url)
    if (scraped.price === null) {
      throw new Error("Prix introuvable sur la page produit")
    }
    return get().updateCartItem(id, {
      price: scraped.price,
      ...(scraped.currency ? { currency: scraped.currency } : {}),
    })
  },

  deleteCartItem: async (id) => {
    const { error } = await supabase.from(TABLE).delete().eq("id", id)
    if (error) throw error
    set({ cartItems: get().cartItems.filter((c) => c.id !== id) })
  },
}))
