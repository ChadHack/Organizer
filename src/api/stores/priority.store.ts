import type { Priority } from "@/api/interfaces/priority.interface"
import { supabase } from "@/lib/supabase"
import { create } from "zustand"
import type { ArticleRow } from "./article.store"
import { mapArticle } from "./article.store"

const TABLE = "priorities"
// Relation inverse (articles pointant sur cette priorité), chaque article
// embarquant lui-même sa propre priorité — requise par mapArticle. Une
// priorité n'a pas de propriétaire (pas de colonne "user").
const SELECT = "*, articles(*, priorities(*))"

export interface PriorityRow {
  id: string
  priority: number
  articles?: ArticleRow[] | null
  created: string
  updated: string
}

export function mapPriority(record: PriorityRow): Priority {
  return {
    id: record.id,
    priority: record.priority,
    articles: record.articles?.map(mapArticle) ?? [],
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
      const { data, error } = await supabase
        .from(TABLE)
        .select(SELECT)
        .order("priority", { ascending: true })
      if (error) throw error
      set({
        priorities: (data as unknown as PriorityRow[]).map(mapPriority),
        loading: false,
      })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  createPriority: async (data) => {
    const { data: record, error } = await supabase
      .from(TABLE)
      .insert(data)
      .select(SELECT)
      .single()
    if (error) throw error
    const priority = mapPriority(record as unknown as PriorityRow)
    set({ priorities: [...get().priorities, priority] })
    return priority
  },

  updatePriority: async (id, data) => {
    const { data: record, error } = await supabase
      .from(TABLE)
      .update(data)
      .eq("id", id)
      .select(SELECT)
      .single()
    if (error) throw error
    const priority = mapPriority(record as unknown as PriorityRow)
    set({
      priorities: get().priorities.map((p) => (p.id === id ? priority : p)),
    })
    return priority
  },

  deletePriority: async (id) => {
    const { error } = await supabase.from(TABLE).delete().eq("id", id)
    if (error) throw error
    set({ priorities: get().priorities.filter((p) => p.id !== id) })
  },
}))
