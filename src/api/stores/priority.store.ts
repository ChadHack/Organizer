import type { Priority } from "@/api/interfaces/priority.interface"
import { pb } from "@/lib/pocketbase"
import type { RecordModel } from "pocketbase"
import { create } from "zustand"
import { mapArticle } from "./article.store"

const COLLECTION = "priorities"
const EXPAND = "articles_via_priority.priority"

export function mapPriority(record: RecordModel): Priority {
  const expand = record.expand as
    | { articles_via_priority?: RecordModel[] }
    | undefined

  return {
    id: record.id,
    priority: record.priority,
    articles: expand?.articles_via_priority?.map(mapArticle) ?? [],
    createdAt: new Date(record.created),
    updatedAt: new Date(record.updated),
  }
}

export interface PriorityInput {
  priority: number
}

interface PriorityState {
  priorities: Priority[]
  loading: boolean
  error: string | null
  fetchPriorities: () => Promise<void>
  createPriority: (data: PriorityInput) => Promise<Priority>
  updatePriority: (id: string, data: Partial<PriorityInput>) => Promise<Priority>
  deletePriority: (id: string) => Promise<void>
}

export const usePriorityStore = create<PriorityState>((set, get) => ({
  priorities: [],
  loading: false,
  error: null,

  fetchPriorities: async () => {
    set({ loading: true, error: null })
    try {
      const records = await pb
        .collection(COLLECTION)
        .getFullList({ sort: "priority", expand: EXPAND })
      set({ priorities: records.map(mapPriority), loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  createPriority: async (data) => {
    const record = await pb
      .collection(COLLECTION)
      .create(data, { expand: EXPAND })
    const priority = mapPriority(record)
    set({ priorities: [...get().priorities, priority] })
    return priority
  },

  updatePriority: async (id, data) => {
    const record = await pb
      .collection(COLLECTION)
      .update(id, data, { expand: EXPAND })
    const priority = mapPriority(record)
    set({
      priorities: get().priorities.map((p) => (p.id === id ? priority : p)),
    })
    return priority
  },

  deletePriority: async (id) => {
    await pb.collection(COLLECTION).delete(id)
    set({ priorities: get().priorities.filter((p) => p.id !== id) })
  },
}))
