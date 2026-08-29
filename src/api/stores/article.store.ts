import type { Article } from "@/api/interfaces/article.interface"
import { pb } from "@/lib/pocketbase"
import type { RecordModel } from "pocketbase"
import { create } from "zustand"
import { mapAction } from "./action.store"
import { mapPriority } from "./priority.store"

const COLLECTION = "articles"
const EXPAND = "priority,action"

export function mapArticle(record: RecordModel): Article {
  const expand = record.expand as
    | { priority?: RecordModel; action?: RecordModel }
    | undefined

  if (!expand?.priority) {
    throw new Error(`Article "${record.id}" is missing its expanded priority`)
  }

  return {
    id: record.id,
    name: record.name,
    description: record.description,
    image: record.image
      ? pb.files.getURL(record, record.image)
      : record.imageUrl || undefined,
    imageUrl: record.imageUrl || undefined,
    link: record.link || undefined,
    price: record.price ?? undefined,
    quantity: record.quantity,
    status: record.status,
    estimateDate: new Date(record.estimateDate),
    priorityId: record.priority,
    priority: mapPriority(expand.priority),
    actionId: record.action || undefined,
    action: expand.action ? mapAction(expand.action) : undefined,
    createdAt: new Date(record.created),
    updatedAt: new Date(record.updated),
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

function toPayload(data: Partial<ArticleInput>) {
  const { priorityId, actionId, estimateDate, ...rest } = data
  return {
    ...rest,
    ...(estimateDate ? { estimateDate: estimateDate.toISOString() } : {}),
    ...(priorityId !== undefined ? { priority: priorityId } : {}),
    ...(actionId !== undefined ? { action: actionId } : {}),
  }
}

interface ArticleState {
  articles: Article[]
  loading: boolean
  error: string | null
  fetchArticles: () => Promise<void>
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
      const records = await pb.collection(COLLECTION).getFullList({
        sort: "-created",
        expand: EXPAND,
      })
      set({ articles: records.map(mapArticle), loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  createArticle: async (data) => {
    const record = await pb
      .collection(COLLECTION)
      .create(toPayload(data), { expand: EXPAND })
    const article = mapArticle(record)
    set({ articles: [...get().articles, article] })
    return article
  },

  updateArticle: async (id, data) => {
    const record = await pb
      .collection(COLLECTION)
      .update(id, toPayload(data), { expand: EXPAND })
    const article = mapArticle(record)
    set({
      articles: get().articles.map((a) => (a.id === id ? article : a)),
    })
    return article
  },

  deleteArticle: async (id) => {
    await pb.collection(COLLECTION).delete(id)
    set({ articles: get().articles.filter((a) => a.id !== id) })
  },
}))
