import { lazy, Suspense } from "react"
import { Route, Routes } from "react-router-dom"
import { RippleSpinner } from "./components/shadcn-space/radix/spinner/spinner-09"
import { Toaster } from "./components/ui/sonner"
import { AppLayout } from "./layouts/App-layout"
import { AccountDisabledDialog } from "./screens/Auth/Account-disabled-dialog"

// Chargées à la demande : chaque écran embarque ses propres dépendances
// lourdes (exceljs/jspdf pour l'export, dnd-kit pour le kanban, le module
// calendrier), inutiles tant que l'utilisateur n'a pas visité la route.
const Actions = lazy(() => import("./screens/Actions/Actions"))
const Articles = lazy(() => import("./screens/Articles/Articles"))
const ArticleDetails = lazy(
  () => import("./screens/Articles/actions/details-article")
)
const Calendar = lazy(() => import("./screens/Canlendar/Calendar"))
const Users = lazy(() => import("./screens/Users/Users"))
const Monitoring = lazy(() => import("./screens/Monitoring/Monitoring"))
const Paniers = lazy(() => import("./screens/Paniers/Paniers"))
const Dashboard = lazy(() => import("./screens/Dashboard"))
const NotFound = lazy(() => import("./screens/NotFound"))
const Authentification = lazy(() => import("./screens/Auth/Authentification"))
const RequireAuth = lazy(() =>
  import("./screens/Auth/RequireAuth").then((m) => ({ default: m.RequireAuth }))
)
const RequireAdmin = lazy(() =>
  import("./screens/Auth/RequireAdmin").then((m) => ({
    default: m.RequireAdmin,
  }))
)

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <RippleSpinner size="lg" className="text-muted-foreground" />
    </div>
  )
}

export function App() {
  return (
    <>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route index path="/" element={<Authentification />} />
          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route path="*" element={<NotFound />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/actions" element={<Actions />} />
              <Route path="/articles" element={<Articles />} />
              <Route path="/articles/:id" element={<ArticleDetails />} />
              <Route path="/mise_en_oeuvre" element={<Monitoring />} />
              <Route path="/planification" element={<Calendar />} />
              <Route path="/paniers" element={<Paniers />} />
              <Route element={<RequireAdmin />}>
                <Route path="/utilisateurs" element={<Users />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </Suspense>
      <Toaster richColors closeButton position="top-right"></Toaster>
      <AccountDisabledDialog />
    </>
  )
}
export default App
