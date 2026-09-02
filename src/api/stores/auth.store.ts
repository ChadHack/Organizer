import type { User } from "@/api/interfaces/user.interface"
import { supabase } from "@/lib/supabase"
import { create } from "zustand"
import { mapUser, type UserRow } from "./user.store"

type OAuthProvider = "google" | "github"

interface AuthState {
  user: User | null
  isValid: boolean
  /** Vrai tant que la session persistée n'a pas encore été relue au
   * démarrage — évite un flash de redirection vers /login pour un
   * utilisateur déjà connecté (voir RequireAuth.tsx). */
  initializing: boolean
  pending: OAuthProvider | null
  error: string | null
  accountDisabled: boolean
  loginWithOAuth2: (provider: OAuthProvider) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

const DISABLED_ACCOUNT_MESSAGE =
  "Votre compte a été désactivé. Contactez un administrateur."

// Réabonnement au propre enregistrement de l'utilisateur connecté, pour
// détecter en temps réel une désactivation décidée par un administrateur
// pendant que la session est déjà ouverte.
let unwatchCurrentUser: (() => void) | null = null

/** Relit le profil `public.users` de l'utilisateur connecté. Si absent
 * (ex: profil supprimé par un admin, cf. user.store.ts `deleteUser`),
 * le reprovisionne à la volée — comme le ferait `authWithOAuth2` côté
 * PocketBase, dont la collection `users` unifiée permettait de recréer un
 * compte au login suivant. */
async function fetchOrProvisionProfile(userId: string): Promise<UserRow> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle()
  if (error) throw error
  if (data) return data as UserRow

  const { data: authUser } = await supabase.auth.getUser()
  const metadata = authUser.user?.user_metadata ?? {}
  const { data: created, error: insertError } = await supabase
    .from("users")
    .insert({
      id: userId,
      name: metadata.full_name ?? metadata.name ?? metadata.user_name ?? "",
      email: authUser.user?.email ?? "",
      avatar: metadata.avatar_url ?? null,
      status: false,
      isAdmin: false,
    })
    .select("*")
    .single()
  if (insertError) throw insertError
  return created as UserRow
}

export const useAuthStore = create<AuthState>((set) => {
  function clearWatch() {
    unwatchCurrentUser?.()
    unwatchCurrentUser = null
  }

  function watchCurrentUser(userId: string) {
    clearWatch()
    const channel = supabase
      .channel(`user-status-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          if (!(payload.new as UserRow).status) {
            set({ accountDisabled: true })
          }
        }
      )
      .subscribe()
    unwatchCurrentUser = () => {
      supabase.removeChannel(channel)
    }
  }

  supabase.auth.onAuthStateChange((event, session) => {
    void (async () => {
      if (!session) {
        clearWatch()
        set({ user: null, isValid: false, initializing: false })
        return
      }

      try {
        const profile = await fetchOrProvisionProfile(session.user.id)

        // Le contrôle "compte désactivé" ne s'applique qu'à une connexion
        // qui vient d'aboutir (retour du flux OAuth) — comme côté
        // PocketBase, où seul `authWithOAuth2` faisait ce contrôle. Une
        // session déjà ouverte qui se retrouve désactivée est gérée en
        // temps réel par watchCurrentUser, pas ici.
        if (event === "SIGNED_IN" && !profile.status) {
          clearWatch()
          await supabase.auth.signOut()
          set({
            user: null,
            isValid: false,
            error: DISABLED_ACCOUNT_MESSAGE,
            initializing: false,
          })
          return
        }

        set({ user: mapUser(profile), isValid: true, initializing: false })
        watchCurrentUser(session.user.id)
      } catch {
        set({ initializing: false })
      }
    })()
  })

  return {
    user: null,
    isValid: false,
    initializing: true,
    pending: null,
    error: null,
    accountDisabled: false,

    loginWithOAuth2: async (provider) => {
      set({ pending: provider, error: null })
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/` },
      })
      // Sur succès, le navigateur est redirigé vers le provider — la page
      // se décharge, inutile de réinitialiser `pending`.
      if (error) {
        set({ error: "Connexion interrompue. Réessayez.", pending: null })
      }
    },

    logout: async () => {
      clearWatch()
      await supabase.auth.signOut()
      set({ accountDisabled: false })
    },

    clearError: () => set({ error: null }),
  }
})
