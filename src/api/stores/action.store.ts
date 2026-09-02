import type { Action } from "@/api/interfaces/action.interface"
import { supabase } from "@/lib/supabase"
import { create } from "zustand"
import type { ArticleRow } from "./article.store"
import { mapArticle } from "./article.store"
import { mapUserOrUnknown, type UserRow } from "./user.store"

const TABLE = "actions"
// Relation inverse (articles pointant sur cette action), chaque article
// embarquant lui-même sa propre priorité — requise par mapArticle. Ni
// "actions" ni "users" ne sont ré-imbriqués sous ces articles (même
// périmètre que l'EXPAND PocketBase d'origine : "articles_via_action.priority,user").
const SELECT = "*, users(*), articles(*, priorities(*))"

export interface ActionRow {
  id: string
  name: string
  description: string | null
  status: string
  cost: number | null
  user: string
  users?: UserRow | null
  articles?: ArticleRow[] | null
  created: string
  updated: string
}

export function mapAction(record: ActionRow): Action {
  return {
    id: record.id,
    name: record.name,
    description: record.description ?? undefined,
    articles: record.articles?.map(mapArticle) ?? [],
    status: record.status as Action["status"],
    cost: record.cost ?? 0,
    userId: record.user ?? "",
    user: mapUserOrUnknown(record.users),
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
      const { data, error } = await supabase
        .from(TABLE)
        .select(SELECT)
        .order("created", { ascending: false })
      if (error) throw error
      set({
        actions: (data as unknown as ActionRow[]).map(mapAction),
        loading: false,
      })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  fetchActionsByUser: async (userId) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select(SELECT)
        .eq("user", userId)
        .order("created", { ascending: false })
      if (error) throw error
      set({
        actions: (data as unknown as ActionRow[]).map(mapAction),
        loading: false,
      })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  createAction: async (data) => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    const { data: record, error } = await supabase
      .from(TABLE)
      .insert({ ...data, user: authUser?.id })
      .select(SELECT)
      .single()
    if (error) throw error
    const action = mapAction(record as unknown as ActionRow)
    set({ actions: [...get().actions, action] })
    return action
  },

  updateAction: async (id, data) => {
    const { data: record, error } = await supabase
      .from(TABLE)
      .update(data)
      .eq("id", id)
      .select(SELECT)
      .single()
    if (error) throw error
    const action = mapAction(record as unknown as ActionRow)
    set({
      actions: get().actions.map((a) => (a.id === id ? action : a)),
    })
    return action
  },

  deleteAction: async (id) => {
    const { error } = await supabase.from(TABLE).delete().eq("id", id)
    if (error) throw error
    set({ actions: get().actions.filter((a) => a.id !== id) })
  },
}))
