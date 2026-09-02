import { useAuthStore } from "@/api/stores/auth.store"
import { Navigate, Outlet, useLocation } from "react-router-dom"

export function RequireAuth() {
  const isValid = useAuthStore((s) => s.isValid)
  const location = useLocation()

  if (!isValid) {
    return <Navigate to="/" replace state={{ from: location }} />
  }

  return <Outlet />
}
