import type { NavGroup } from "@/api/interfaces/navigation.interface"
import {
  CalendarDays,
  LayoutDashboard,
  ListChecks,
  Package,
  Workflow,
} from "lucide-react"

const NavData: NavGroup[] = [
  {
    type: "link",
    label: "Tableau de bord",
    icon: LayoutDashboard,
    href: "/",
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
    icon: ListChecks,
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
    href: "/plannification",
  },
]

export default NavData
