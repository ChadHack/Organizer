import type { Priority } from "@/api/interfaces/priority.interface"
import { pb } from "@/lib/pocketbase"
import type { RecordModel } from "pocketbase"
import { create } from "zustand"
import { mapArticle } from "./article.store"
import { mapUserOrUnknown } from "./user.store"

const COLLECTION = "priorities"
const EXPAND = "articles_via_priority.priority,user"

export function mapPriority(record: RecordModel): Priority {
  const expand = record.expand as
    { articles_via_priority?: RecordModel[]; user?: RecordModel } | undefined

  return {
    id: record.id,
    priority: record.priority,
    articles: expand?.articles_via_priority?.map(mapArticle) ?? [],
    userId: record.user ?? "",
    user: mapUserOrUnknown(expand?.user),
    created: new Date(record.created),
    updated: new Date(record.updated),
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
  fetchPrioritiesByUser: (userId: string) => Promise<void>
  createPriority: (data: PriorityInput) => Promise<Priority>
  updatePriority: (
    id: string,
    data: Partial<PriorityInput>
  ) => Promise<Priority>
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

  fetchPrioritiesByUser: async (userId) => {
    set({ loading: true, error: null })
    try {
      const records = await pb.collection(COLLECTION).getFullList({
        sort: "priority",
        expand: EXPAND,
        filter: pb.filter("user = {:userId}", { userId }),
      })
      set({ priorities: records.map(mapPriority), loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  createPriority: async (data) => {
    const record = await pb
      .collection(COLLECTION)
      .create({ ...data, user: pb.authStore.record?.id }, { expand: EXPAND })
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
