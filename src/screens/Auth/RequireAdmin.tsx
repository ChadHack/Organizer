import { useAuthStore } from "@/api/stores/auth.store"
import { Navigate, Outlet } from "react-router-dom"

export function RequireAdmin() {
  const isAdmin = useAuthStore((s) => s.user?.isAdmin ?? false)

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
