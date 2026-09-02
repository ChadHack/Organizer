import type { User } from "@/api/interfaces/user.interface"
import { supabase } from "@/lib/supabase"
import { create } from "zustand"

const TABLE = "users"

export interface UserRow {
  id: string
  name: string | null
  email: string | null
  isAdmin: boolean | null
  avatar: string | null
  status: boolean | null
  created: string
  updated: string
}

/** Mappe l'utilisateur propriétaire embarqué dans une action/un article/une
 * priorité — sans réexpanser ses propres actions/articles (non pertinent
 * ici, éviterait un expand circulaire). */
export function mapUser(record: UserRow): User {
  return {
    id: record.id,
    name: record.name ?? "",
    email: record.email ?? "",
    isAdmin: !!record.isAdmin,
    avatar: record.avatar ?? "",
    status: !!record.status,
    actions: [],
    articles: [],
    created: new Date(record.created),
    updated: new Date(record.updated),
  }
}

const UNKNOWN_USER: User = {
  id: "",
  name: "Utilisateur inconnu",
  email: "",
  isAdmin: false,
  avatar: "",
  actions: [],
  articles: [],
  status: true,
  created: new Date(0),
  updated: new Date(0),
}

/** Utilisé quand un enregistrement antérieur à l'ajout du champ `user`
 * n'a pas encore de propriétaire. */
export function mapUserOrUnknown(record?: UserRow | null): User {
  return record ? mapUser(record) : UNKNOWN_USER
}

export interface UserInput {
  name?: string
  email?: string
  isAdmin?: boolean
  avatar?: string | null
  status?: boolean
}

interface UserState {
  users: User[]
  loading: boolean
  error: string | null
  fetchUsers: () => Promise<void>
  updateUser: (id: string, data: Partial<UserInput>) => Promise<User>
  deleteUser: (id: string) => Promise<void>
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  loading: false,
  error: null,

  fetchUsers: async () => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .order("created", { ascending: false })
      if (error) throw error
      set({ users: (data as UserRow[]).map(mapUser), loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  updateUser: async (id, data) => {
    const { data: record, error } = await supabase
      .from(TABLE)
      .update(data)
      .eq("id", id)
      .select("*")
      .single()
    if (error) throw error
    const user = mapUser(record as UserRow)
    set({
      users: get().users.map((u) => (u.id === id ? user : u)),
    })
    return user
  },

  deleteUser: async (id) => {
    const { error } = await supabase.from(TABLE).delete().eq("id", id)
    if (error) throw error
    set({ users: get().users.filter((u) => u.id !== id) })
  },
}))
