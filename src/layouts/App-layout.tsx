import type { NavGroup } from "@/api/interfaces/navigation.interface"
import { useAuthStore } from "@/api/stores/auth.store"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { NavData } from "@/layouts/data"
import { cn, getInitials } from "@/lib/utils"
import { UserProfile } from "@/screens/Auth/User-profile"
import { Bell, CheckIcon, LogOut, Menu, Users2 } from "lucide-react"
import { useState } from "react"
import { Link, NavLink, Outlet, useLocation } from "react-router-dom"
import { toast } from "sonner"

const railPillButton =
  "grid size-10 shrink-0 place-items-center rounded-full text-neutral-700 transition-colors hover:bg-neutral-200 "

function NavRailContent({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation()
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const { user, logout } = useAuthStore((state) => state)

  return (
    <>
      <div className="flex flex-col items-center gap-1 py-2.5 pb-1.5">
        <div className="grid size-12 place-items-center">
          <img src="/logo.png" alt="Logo" className="size-full" />
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
        {user?.isAdmin && (
          <Link
            to="/utilisateurs"
            title="Paramètres"
            className={`${railPillButton} ${pathname.startsWith("/utilisateurs") ? "bg-primary text-primary-foreground shadow-sm" : "text-neutral-700 hover:bg-neutral-200"}`}
          >
            <Users2 className="size-4.5" strokeWidth={2.75} />
          </Link>
        )}
      </div>

      <div className="mt-auto flex flex-col items-center gap-2.5 rounded-full bg-card p-2 shadow-sm">
        <Button
          type="button"
          title="Déconnexion"
          variant="destructive"
          className={railPillButton}
          onClick={() => {
            toast.warning("Voulez-vous vraiment vous déconnectez ?", {
              action: {
                label: "Oui",
                onClick: async () => {
                  logout()
                  toast.success("Déconnecté avec succès")
                },
              },
              cancel: {
                label: "Annulée",
                onClick: () => toast.info("Déconnexion annulée"),
              },
            })
          }}
        >
          <LogOut className="size-4.5" strokeWidth={2.75} />
        </Button>
        <div
          className="flex items-center justify-center"
          onClick={() => setShowProfileDialog(true)}
        >
          <div className="relative w-fit">
            <Avatar className="ring-2 ring-teal-600 ring-offset-2 ring-offset-background dark:ring-teal-400">
              <AvatarImage src={user?.avatar} alt="border avatar" />
              <AvatarFallback className="text-xs">
                {user ? getInitials(user.name) : "U"}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -right-1.5 -bottom-1.5 inline-flex size-4 items-center justify-center rounded-full bg-teal-600 dark:bg-teal-400">
              <CheckIcon className="size-3 text-white" />
            </span>
          </div>
        </div>
      </div>

      {user && (
        <UserProfile
          user={user}
          open={showProfileDialog}
          setOpen={setShowProfileDialog}
        />
      )}
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

      <main className="relative custom-scrollbar min-h-0 min-w-0 flex-1 overflow-y-auto">
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
