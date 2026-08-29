import type { NavItem } from "@/api/interfaces/navigation.interface"
import { Button } from "@/components/ui/button"
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import type { LucideIcon } from "lucide-react"
import { Link } from "react-router-dom"

export function NavDropdown({
  label,
  icon: Icon,
  items,
}: {
  label: string
  icon: LucideIcon
  items: NavItem[]
}) {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className="cursor-pointer gap-2 rounded-lg border border-transparent hover:bg-accent data-[state=open]:border-muted data-[state=open]:bg-accent">
        <Icon size={16} />
        <span className="text-sm">{label}</span>
      </NavigationMenuTrigger>

      <NavigationMenuContent className="min-w-48 p-1">
        <ul className="space-y-1">
          {items.map((item) => {
            const ItemIcon = item.icon
            return (
              <li key={item.label}>
                <NavigationMenuLink asChild>
                  <a
                    href={item.href}
                    className="items-left flex gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-foreground"
                  >
                    <div className="flex items-center gap-2">
                      <ItemIcon size={16} />
                      <span>{item.label}</span>
                    </div>
                  </a>
                </NavigationMenuLink>
              </li>
            )
          })}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  )
}

export function NavButton({
  label,
  href,
  icon: Icon,
}: {
  href: string
  label: string
  icon: LucideIcon
}) {
  return (
    <Button variant="ghost" className="gap-2 rounded-lg">
      <Link to={href} className="flex items-center gap-2">
        <Icon size={16} />
        <span className="text-sm">{label}</span>
      </Link>
    </Button>
  )
}
