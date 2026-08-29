"use client"

import type { NavGroup } from "@/api/interfaces/navigation.interface"
import NavData from "@/components/shadcn-space/radix/blocks/topbar-04/data"
import {
  NavButton,
  NavDropdown,
} from "@/components/shadcn-space/radix/blocks/topbar-04/header/desktop-nav"
import ProfileDropdown from "@/components/shadcn-space/radix/blocks/topbar-04/header/dropdown-profile"
import Sidebar from "@/components/shadcn-space/radix/blocks/topbar-04/header/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { useEffect, useState } from "react"

export default function Header() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const BREAKPOINT = 1024

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= BREAKPOINT) {
        setSheetOpen(false)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      {/* TOP BAR */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5">
        {/* LEFT */}
        <div className="flex items-center gap-3">
          {/* Mobile Sidebar */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger
              id="mobile-sidebar-trigger-04"
              className="lg:hidden"
              asChild
            >
              <Button variant="ghost" size="icon" className="cursor-pointer">
                <Menu size={20} />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-75 p-0">
              <SheetTitle className="sr-only">customizer</SheetTitle>

              <ScrollArea className="h-full">
                <a
                  href="#"
                  className="sticky top-0 z-10 block bg-background p-4"
                >
                  <img
                    src="https://images.shadcnspace.com/assets/logo/shadcnspace.svg"
                    alt="logo"
                    className="h-10 w-40 dark:hidden"
                  />
                  <img
                    src="https://images.shadcnspace.com/assets/logo/shadcnspace-white.svg"
                    alt="logo"
                    className="hidden h-10 w-40 dark:block"
                  />
                </a>

                <Sidebar onLinkClick={() => setSheetOpen(false)} />
              </ScrollArea>
            </SheetContent>
          </Sheet>

          <a href="#">
            <img
              src="https://images.shadcnspace.com/assets/logo/shadcnspace.svg"
              alt="logo"
              className="h-10 w-40 dark:hidden"
            />
            <img
              src="https://images.shadcnspace.com/assets/logo/shadcnspace-white.svg"
              alt="logo"
              className="hidden h-10 w-40 dark:block"
            />
          </a>
        </div>

        {/* MIDDLE NAV (DESKTOP ONLY) */}
        <div className="hidden items-center justify-between lg:flex">
          <NavigationMenu>
            <NavigationMenuList className="space-x-0">
              {(NavData as NavGroup[]).map((item) => {
                if (item.type === "dropdown" && item.items) {
                  return (
                    <NavDropdown
                      key={item.label}
                      label={item.label}
                      icon={item.icon}
                      items={item.items}
                    />
                  )
                }
                return (
                  <NavigationMenuItem key={item.label}>
                    <NavigationMenuLink asChild>
                      <NavButton
                        label={item.label}
                        icon={item.icon}
                        href={item.href ?? "#"}
                      />
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                )
              })}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2">
          <ProfileDropdown
            trigger={
              <Button
                id="profile-dropdown-trigger-04"
                variant="ghost"
                size="icon"
                className="size-7 cursor-pointer rounded-full"
                suppressHydrationWarning
              >
                <Avatar className="size-7 rounded-full">
                  <AvatarImage src="https://images.shadcnspace.com/assets/profiles/user-11.jpg" />
                  <AvatarFallback>NJ</AvatarFallback>
                </Avatar>
              </Button>
            }
          />
        </div>
      </div>
    </header>
  )
}
