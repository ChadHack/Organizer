import type { User } from "@/api/interfaces/user.interface"
import { pb } from "@/lib/pocketbase"
import type { RecordModel } from "pocketbase"
import { create } from "zustand"

const COLLECTION = "users"

/** Mappe l'utilisateur propriétaire embarqué dans une action/un article/une
 * priorité — sans réexpanser ses propres actions/articles (non pertinent
 * ici, éviterait un expand circulaire). */
export function mapUser(record: RecordModel): User {
  return {
    id: record.id,
    name: record.name ?? "",
    email: record.email ?? "",
    isAdmin: !!record.isAdmin,
    avatar: record.avatar ? pb.files.getURL(record, record.avatar) : "",
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
export function mapUserOrUnknown(record?: RecordModel): User {
  return record ? mapUser(record) : UNKNOWN_USER
}

export interface UserInput {
  name?: string
  email?: string
  isAdmin?: boolean
  avatar?: File | null
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
      const records = await pb
        .collection(COLLECTION)
        .getFullList({ sort: "-created" })
      set({ users: records.map(mapUser), loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  updateUser: async (id, data) => {
    const record = await pb.collection(COLLECTION).update(id, data)
    const user = mapUser(record)
    set({
      users: get().users.map((u) => (u.id === id ? user : u)),
    })
    return user
  },

  deleteUser: async (id) => {
    await pb.collection(COLLECTION).delete(id)
    set({ users: get().users.filter((u) => u.id !== id) })
  },
}))
