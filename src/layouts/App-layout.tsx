import type { NavGroup } from "@/api/interfaces/navigation.interface"
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
import { NavData } from "@/layouts/data"
import { cn } from "@/lib/utils"
import { Bell, LogOut, Menu, Settings, ShoppingBasket } from "lucide-react"
import { useState } from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"

const railPillButton =
  "grid size-10 shrink-0 place-items-center rounded-full text-neutral-700 transition-colors hover:bg-neutral-200"

function NavRailContent({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation()

  return (
    <>
      <div className="flex flex-col items-center gap-1 py-2.5 pb-1.5">
        <div className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
          <ShoppingBasket className="size-5.5" strokeWidth={2.75} />
        </div>
        <span className="font-heading text-xs tracking-tight">Organizer</span>
      </div>

      <div className="flex flex-col items-center gap-2 rounded-full bg-card p-2 shadow-sm">
        {(NavData as NavGroup[]).map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href ?? "#")
          const Icon = item.icon
          return (
            <NavLink
              key={item.label}
              to={item.href ?? "#"}
              title={item.label}
              onClick={onNavigate}
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-full transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-neutral-700 hover:bg-neutral-200"
              )}
            >
              <Icon className="size-4.5" strokeWidth={2.75} />
            </NavLink>
          )
        })}
      </div>

      <div className="flex flex-col items-center gap-2 rounded-full bg-card p-2 shadow-sm">
        <button
          type="button"
          title="Notifications"
          className={cn(railPillButton, "relative")}
        >
          <Bell className="size-4.5" strokeWidth={2.75} />
          <span className="absolute top-2 right-2.5 size-2 rounded-full border-2 border-card bg-primary" />
        </button>
        <button type="button" title="Paramètres" className={railPillButton}>
          <Settings className="size-4.5" strokeWidth={2.75} />
        </button>
      </div>

      <div className="mt-auto flex flex-col items-center gap-2.5 rounded-full bg-card p-2 shadow-sm">
        <button type="button" title="Déconnexion" className={railPillButton}>
          <LogOut className="size-4.5" strokeWidth={2.75} />
        </button>
        <div className="grid size-10 place-items-center rounded-full bg-accent-2-300 text-sm font-bold text-accent-2-800">
          NJ
        </div>
      </div>
    </>
  )
}

export function AppLayout() {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="flex h-screen gap-4.5 rounded-[32px] bg-background p-4.5 shadow-lg">
      <nav className="hidden w-19 shrink-0 flex-col items-center gap-3.5 md:flex">
        <NavRailContent />
      </nav>

      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="flex w-fit! flex-col items-center gap-3.5 rounded-r-[32px] bg-background p-4.5"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <NavRailContent onNavigate={() => setNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <main className="custom-scrollbar relative min-h-0 min-w-0 flex-1 overflow-y-auto">
        <button
          type="button"
          title="Ouvrir la navigation"
          onClick={() => setNavOpen(true)}
          className="absolute top-2 left-2 z-10 grid size-10 place-items-center rounded-full bg-card text-neutral-700 shadow-sm transition-colors hover:bg-neutral-200 md:hidden"
        >
          <Menu className="size-4.5" strokeWidth={2.75} />
        </button>
        <Outlet />
      </main>
    </div>
  )
}
