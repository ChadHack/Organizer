import type { NavGroup } from "@/api/interfaces/navigation.interface"
import {
  CalendarDays,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Workflow,
} from "lucide-react"

export const NavData: NavGroup[] = [
  {
    type: "link",
    label: "Tableau de bord",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    type: "link",
    label: "Liste des actions",
    icon: Package,
    href: "/actions",
  },
  {
    type: "link",
    label: "Liste des articles",
    icon: ShoppingCart,
    href: "/articles",
  },
  {
    type: "link",
    label: "Suivi de mise en oeuvre",
    icon: Workflow,
    href: "/mise_en_oeuvre",
  },
  {
    type: "link",
    label: "Plannification",
    icon: CalendarDays,
    href: "/planification",
  },
]
