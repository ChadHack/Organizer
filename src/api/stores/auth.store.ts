import type { User } from "@/api/interfaces/user.interface"
import { pb } from "@/lib/pocketbase"
import { create } from "zustand"
import { mapUser } from "./user.store"

type OAuthProvider = "google" | "github"

interface AuthState {
  user: User | null
  isValid: boolean
  pending: OAuthProvider | null
  error: string | null
  accountDisabled: boolean
  loginWithOAuth2: (provider: OAuthProvider) => Promise<void>
  logout: () => void
  clearError: () => void
}

const DISABLED_ACCOUNT_MESSAGE =
  "Votre compte a été désactivé. Contactez un administrateur."

// Réabonnement au propre enregistrement de l'utilisateur connecté, pour
// détecter en temps réel une désactivation décidée par un administrateur
// pendant que la session est déjà ouverte.
let unwatchCurrentUser: (() => void) | null = null

export const useAuthStore = create<AuthState>((set) => {
  function watchCurrentUser(userId: string) {
    unwatchCurrentUser?.()
    unwatchCurrentUser = null
    pb.collection("users")
      .subscribe(userId, (e) => {
        if (e.action === "update" && !e.record.status) {
          set({ accountDisabled: true })
        }
      })
      .then((unsubscribe) => {
        unwatchCurrentUser = unsubscribe
      })
  }

  pb.authStore.onChange(() => {
    const record = pb.authStore.record
    set({
      user: record ? mapUser(record) : null,
      isValid: pb.authStore.isValid,
    })
    if (record && pb.authStore.isValid) {
      watchCurrentUser(record.id)
    } else {
      unwatchCurrentUser?.()
      unwatchCurrentUser = null
    }
  }, true)

  return {
    user: pb.authStore.record ? mapUser(pb.authStore.record) : null,
    isValid: pb.authStore.isValid,
    pending: null,
    error: null,
    accountDisabled: false,
    loginWithOAuth2: async (provider) => {
      set({ pending: provider, error: null })
      try {
        const { record } = await pb
          .collection("users")
          .authWithOAuth2({ provider })
        if (!record.status) {
          pb.authStore.clear()
          set({ error: DISABLED_ACCOUNT_MESSAGE })
        }
      } catch {
        set({ error: "Connexion interrompue. Réessayez." })
      } finally {
        set({ pending: null })
      }
    },
    logout: () => {
      pb.authStore.clear()
      set({ accountDisabled: false })
    },
    clearError: () => set({ error: null }),
  }
})
