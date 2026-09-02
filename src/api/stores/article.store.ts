import type { Article } from "@/api/interfaces/article.interface"
import { supabase, ARTICLE_IMAGES_BUCKET } from "@/lib/supabase"
import { create } from "zustand"
import type { ActionRow } from "./action.store"
import { mapAction } from "./action.store"
import type { PriorityRow } from "./priority.store"
import { mapPriority } from "./priority.store"
import { mapUserOrUnknown, type UserRow } from "./user.store"

const TABLE = "articles"
// Les objets liés sont récupérés sous la clé (plurielle) de leur table —
// jamais sous le nom de la colonne de relation elle-même ("priority",
// "action", "user"), qui reste la valeur brute de l'id via `*` : les deux
// coexisteraient sinon sous la même clé.
const SELECT = "*, priorities(*), actions(*), users(*)"

export interface ArticleRow {
  id: string
  name: string
  description: string
  image: string | null
  link: string | null
  price: number | null
  quantity: number
  status: string
  estimateDate: string
  priority: string
  action: string | null
  user: string | null
  priorities?: PriorityRow | null
  actions?: ActionRow | null
  users?: UserRow | null
  imageUrl: string | null
  created: string
  updated: string
}

export function mapArticle(record: ArticleRow): Article {
  if (!record.priorities) {
    throw new Error(`Article "${record.id}" is missing its expanded priority`)
  }

  return {
    id: record.id,
    name: record.name,
    description: record.description,
    image: record.image || record.imageUrl || undefined,
    imageUrl: record.imageUrl || undefined,
    link: record.link || undefined,
    price: record.price ?? undefined,
    quantity: record.quantity,
    status: record.status as Article["status"],
    estimateDate: new Date(record.estimateDate),
    priorityId: record.priority,
    priority: mapPriority(record.priorities),
    actionId: record.action || undefined,
    action: record.actions ? mapAction(record.actions) : undefined,
    userId: record.user ?? "",
    user: mapUserOrUnknown(record.users),
    created: new Date(record.created),
    updated: new Date(record.updated),
  }
}

export interface ArticleInput {
  name: string
  description: string
  image?: File | null
  imageUrl?: string | null
  link?: string
  price?: number
  quantity: number
  status: Article["status"]
  estimateDate: Date
  priorityId: string
  actionId?: string
}

async function uploadArticleImage(file: File): Promise<string> {
  const path = `${crypto.randomUUID()}-${file.name}`
  const { error } = await supabase.storage
    .from(ARTICLE_IMAGES_BUCKET)
    .upload(path, file)
  if (error) throw error
  const {
    data: { publicUrl },
  } = supabase.storage.from(ARTICLE_IMAGES_BUCKET).getPublicUrl(path)
  return publicUrl
}

function extractStoragePath(url: string): string | null {
  const marker = `/object/public/${ARTICLE_IMAGES_BUCKET}/`
  const index = url.indexOf(marker)
  if (index === -1) return null
  return decodeURIComponent(url.slice(index + marker.length))
}

/** Best-effort : ne bloque jamais la mutation en cours si la suppression
 * de l'ancien fichier échoue (fichier déjà absent, réseau, ...). */
function deleteArticleImage(url: string) {
  const path = extractStoragePath(url)
  if (!path) return
  supabase.storage
    .from(ARTICLE_IMAGES_BUCKET)
    .remove([path])
    .catch(() => {})
}

/** Résout le champ `image` du payload : un `File` est téléversé vers le
 * bucket puis remplacé par son URL publique, `null` efface explicitement
 * la valeur, une valeur absente laisse la colonne inchangée — même
 * contrat que côté PocketBase (multipart vs. valeur vide vs. champ omis). */
async function resolveImagePayload(
  image: File | null | undefined,
  previousImage?: string | null
): Promise<{ image?: string | null }> {
  if (image === undefined) return {}
  if (previousImage) deleteArticleImage(previousImage)
  if (image === null) return { image: null }
  return { image: await uploadArticleImage(image) }
}

async function toPayload(
  data: Partial<ArticleInput>,
  previousImage?: string | null
) {
  const { priorityId, actionId, estimateDate, image, ...rest } = data
  const imagePayload = await resolveImagePayload(image, previousImage)
  return {
    ...rest,
    ...imagePayload,
    ...(estimateDate ? { estimateDate: estimateDate.toISOString() } : {}),
    ...(priorityId !== undefined ? { priority: priorityId } : {}),
    ...(actionId !== undefined ? { action: actionId || null } : {}),
  }
}

interface ArticleState {
  articles: Article[]
  loading: boolean
  error: string | null
  fetchArticles: () => Promise<void>
  fetchArticlesByUser: (userId: string) => Promise<void>
  createArticle: (data: ArticleInput) => Promise<Article>
  updateArticle: (id: string, data: Partial<ArticleInput>) => Promise<Article>
  deleteArticle: (id: string) => Promise<void>
}

export const useArticleStore = create<ArticleState>((set, get) => ({
  articles: [],
  loading: false,
  error: null,

  fetchArticles: async () => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select(SELECT)
        .order("created", { ascending: false })
      if (error) throw error
      set({
        articles: (data as unknown as ArticleRow[]).map(mapArticle),
        loading: false,
      })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  fetchArticlesByUser: async (userId) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select(SELECT)
        .eq("user", userId)
        .order("created", { ascending: false })
      if (error) throw error
      set({
        articles: (data as unknown as ArticleRow[]).map(mapArticle),
        loading: false,
      })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  createArticle: async (data) => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    const payload = await toPayload(data)
    const { data: record, error } = await supabase
      .from(TABLE)
      .insert({ ...payload, user: authUser?.id })
      .select(SELECT)
      .single()
    if (error) throw error
    const article = mapArticle(record as unknown as ArticleRow)
    set({ articles: [...get().articles, article] })
    return article
  },

  updateArticle: async (id, data) => {
    let previousImage: string | null | undefined
    if ("image" in data) {
      const { data: current } = await supabase
        .from(TABLE)
        .select("image")
        .eq("id", id)
        .single()
      previousImage = (current as { image: string | null } | null)?.image
    }
    const payload = await toPayload(data, previousImage)
    const { data: record, error } = await supabase
      .from(TABLE)
      .update(payload)
      .eq("id", id)
      .select(SELECT)
      .single()
    if (error) throw error
    const article = mapArticle(record as unknown as ArticleRow)
    set({
      articles: get().articles.map((a) => (a.id === id ? article : a)),
    })
    return article
  },

  deleteArticle: async (id) => {
    const { error } = await supabase.from(TABLE).delete().eq("id", id)
    if (error) throw error
    set({ articles: get().articles.filter((a) => a.id !== id) })
  },
}))
