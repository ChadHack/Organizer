import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { ThemeProvider } from "@/components/theme-provider.tsx"
import { BrowserRouter } from "react-router-dom"
import App from "./App.tsx"
import "./index.css"

// PWA : le service worker (public/sw.js) rend l'app installable, condition
// nécessaire au Web Share Target (« Partager → Organizer » vers /paniers).
// Enregistré uniquement en production pour ne pas gêner le HMR de Vite.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {})
  })
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
)
