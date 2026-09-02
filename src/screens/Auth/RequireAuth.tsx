import { useAuthStore } from "@/api/stores/auth.store"
import { RippleSpinner } from "@/components/shadcn-space/radix/spinner/spinner-09"
import { Navigate, Outlet, useLocation } from "react-router-dom"

export function RequireAuth() {
  const isValid = useAuthStore((s) => s.isValid)
  const initializing = useAuthStore((s) => s.initializing)
  const location = useLocation()

  // La session persistée se relit de façon asynchrone au démarrage : sans
  // ce garde, un utilisateur déjà connecté verrait un flash de
  // redirection vers "/" le temps que la session soit retrouvée.
  if (initializing) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center">
        <RippleSpinner size="lg" className="text-muted-foreground" />
      </div>
    )
  }

  if (!isValid) {
    return <Navigate to="/" replace state={{ from: location }} />
  }

  return <Outlet />
}
