import { lazy, Suspense } from "react"
import { Route, Routes } from "react-router-dom"
import AppLayout from "./App-layout"
import { RippleSpinner } from "./components/shadcn-space/radix/spinner/spinner-09"
import { Toaster } from "./components/ui/sonner"

// Chargées à la demande : chaque écran embarque ses propres dépendances
// lourdes (exceljs/jspdf pour l'export, dnd-kit pour le kanban, le module
// calendrier), inutiles tant que l'utilisateur n'a pas visité la route.
const Actions = lazy(() => import("./screens/Actions/Actions"))
const Articles = lazy(() => import("./screens/Articles/Articles"))
const ArticleDetails = lazy(
  () => import("./screens/Articles/actions/details-article")
)
const Calendar = lazy(() => import("./screens/Canlendar/Calendar"))
const Monitoring = lazy(() => import("./screens/Monitoring/Monitoring"))
const Dashboard = lazy(() => import("./screens/Dashboard"))
const NotFound = lazy(() => import("./screens/NotFound"))

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
          <Route element={<AppLayout />}>
            <Route index path="*" element={<NotFound />} />
            <Route index path="/" element={<Dashboard />} />
            <Route path="/actions" element={<Actions />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/articles/:id" element={<ArticleDetails />} />
            <Route path="/mise_en_oeuvre" element={<Monitoring />} />
            <Route path="/plannification" element={<Calendar />} />
          </Route>
        </Routes>
      </Suspense>
      <Toaster richColors closeButton position="top-right"></Toaster>
    </>
  )
}
export default App
