import type { Action } from "@/api/interfaces/action.interface"
import { pb } from "@/lib/pocketbase"
import type { RecordModel } from "pocketbase"
import { create } from "zustand"
import { mapArticle } from "./article.store"
import { mapUserOrUnknown } from "./user.store"

const COLLECTION = "actions"
const EXPAND = "articles_via_action.priority,user"

export function mapAction(record: RecordModel): Action {
  const expand = record.expand as
    { articles_via_action?: RecordModel[]; user?: RecordModel } | undefined

  return {
    id: record.id,
    name: record.name,
    description: record.description,
    articles: expand?.articles_via_action?.map(mapArticle) ?? [],
    status: record.status,
    cost: record.cost ?? 0,
    userId: record.user ?? "",
    user: mapUserOrUnknown(expand?.user),
    created: new Date(record.created),
    updated: new Date(record.updated),
  }
}

export interface ActionInput {
  name: string
  description?: string
  status: Action["status"]
}

interface ActionState {
  actions: Action[]
  loading: boolean
  error: string | null
  fetchActions: () => Promise<void>
  fetchActionsByUser: (userId: string) => Promise<void>
  createAction: (data: ActionInput) => Promise<Action>
  updateAction: (id: string, data: Partial<ActionInput>) => Promise<Action>
  deleteAction: (id: string) => Promise<void>
}

export const useActionStore = create<ActionState>((set, get) => ({
  actions: [],
  loading: false,
  error: null,

  fetchActions: async () => {
    set({ loading: true, error: null })
    try {
      const records = await pb
        .collection(COLLECTION)
        .getFullList({ sort: "-created", expand: EXPAND })
      set({ actions: records.map(mapAction), loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  fetchActionsByUser: async (userId) => {
    set({ loading: true, error: null })
    try {
      const records = await pb.collection(COLLECTION).getFullList({
        sort: "-created",
        expand: EXPAND,
        filter: pb.filter("user = {:userId}", { userId }),
      })
      set({ actions: records.map(mapAction), loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  createAction: async (data) => {
    const record = await pb
      .collection(COLLECTION)
      .create({ ...data, user: pb.authStore.record?.id }, { expand: EXPAND })
    const action = mapAction(record)
    set({ actions: [...get().actions, action] })
    return action
  },

  updateAction: async (id, data) => {
    const record = await pb
      .collection(COLLECTION)
      .update(id, data, { expand: EXPAND })
    const action = mapAction(record)
    set({
      actions: get().actions.map((a) => (a.id === id ? action : a)),
    })
    return action
  },

  deleteAction: async (id) => {
    await pb.collection(COLLECTION).delete(id)
    set({ actions: get().actions.filter((a) => a.id !== id) })
  },
}))
