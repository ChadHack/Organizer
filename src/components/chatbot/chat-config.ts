import {
  BookOpen,
  CircleHelp,
  FileText,
  Headset,
  LayoutGrid,
  Phone,
  Sparkles,
  Truck,
  type LucideIcon,
} from "lucide-react"

/**
 * Requêtes spéciales interceptées par ChatWidget avant d'atteindre le moteur
 * de recherche (chatbot-knowledge.ts) — elles produisent une réponse dédiée
 * plutôt qu'une recherche par mots-clés.
 */
export const SPECIAL_QUERIES = {
  support: "__support__",
  menu: "__menu__",
  faq: "__faq__",
  glossary: "__glossary__",
  tips: "__tips__",
} as const

export interface QuickAction {
  key: string
  label: string
  icon: LucideIcon
  iconClassName: string
  query: string
}

/** Grille 2x2 affichée sur l'écran d'accueil du chat. */
export const QUICK_ACTIONS: QuickAction[] = [
  {
    key: "add-article",
    label: "Ajouter un article",
    icon: FileText,
    iconClassName: "bg-blue-100 text-blue-600",
    query: "Où puis-je ajouter un nouvel achat ?",
  },
  {
    key: "track-status",
    label: "Suivre un achat",
    icon: Truck,
    iconClassName: "bg-emerald-100 text-emerald-600",
    query: "Comment changer le statut d'un article ?",
  },
  {
    key: "support",
    label: "Contacter le support",
    icon: Headset,
    iconClassName: "bg-rose-100 text-rose-600",
    query: SPECIAL_QUERIES.support,
  },
  {
    key: "explore",
    label: "Explorer les menus",
    icon: LayoutGrid,
    iconClassName: "bg-amber-100 text-amber-600",
    query: SPECIAL_QUERIES.menu,
  },
]

export interface FooterLink {
  key: string
  label: string
  icon: LucideIcon
  query: string
}

/** Rangée de pastilles au-dessus de la zone de saisie, toujours visible. */
export const FOOTER_LINKS: FooterLink[] = [
  { key: "faq", label: "FAQ", icon: CircleHelp, query: SPECIAL_QUERIES.faq },
  { key: "glossary", label: "Glossaire", icon: BookOpen, query: SPECIAL_QUERIES.glossary },
  { key: "contact", label: "Contact", icon: Phone, query: SPECIAL_QUERIES.support },
  { key: "tips", label: "Astuces", icon: Sparkles, query: SPECIAL_QUERIES.tips },
]

export const SUPPORT_MESSAGE =
  "Je suis un assistant local qui ne peut pas transférer de message : je réponds uniquement à partir de ce que je connais de l'application Organizer. Pour une aide humaine, contactez un administrateur de votre organisation (visible dans « Utilisateurs » si vous y avez accès) ou vos canaux internes habituels."
