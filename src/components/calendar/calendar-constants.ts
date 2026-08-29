/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

/** Vues disponibles du calendrier. */
export type CalendarView = "month" | "week" | "day" | "gantt"

/** Tons d'accent, alignés sur la palette de la sidebar. */
export type EventTone =
  | "indigo"
  | "sky"
  | "emerald"
  | "amber"
  | "rose"
  | "violet"
  | "teal"
  | "orange"

export type CalendarEvent = {
  id: string
  title: string
  /** Début de l'évènement. */
  start: Date
  /** Fin de l'évènement (exclusive côté horaire, inclusive côté jour). */
  end: Date
  tone: EventTone
  /** Journée entière : ignore les heures dans les vues jour/semaine. */
  allDay?: boolean
  location?: string
  /** Avancement 0–100, affiché dans la vue Gantt. */
  progress?: number
  /** Regroupement des barres du Gantt (ex. « Conformité »). */
  lane?: string
  owner?: string
  /** Paires libellé/valeur additionnelles affichées dans la fiche détail. */
  details?: { label: string; value: string }[]
}

/* -------------------------------------------------------------------------- */
/* Dimensions                                                                 */
/* -------------------------------------------------------------------------- */

/** Hauteur d'une heure (px) dans les vues jour et semaine. */
export const HOUR_HEIGHT = 56
/** Première et dernière heure affichées dans la grille horaire. */
export const DAY_START_HOUR = 7
export const DAY_END_HOUR = 21
/** Largeur d'une colonne de jour (px) dans la vue Gantt. */
export const GANTT_DAY_WIDTH = 44
/** Largeur de la colonne des libellés (px) dans la vue Gantt. */
export const GANTT_LABEL_WIDTH = 232

/* -------------------------------------------------------------------------- */
/* Animations de remplissage                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Remplissage animé du hover — même principe que la sidebar : un calque
 * masqué par un clip-path replié à gauche qui « coulisse » jusqu'à remplir
 * la cellule. Il vit en `-z-10` dans un parent `isolate relative group/cell`.
 */
export const CELL_FILL =
  "pointer-events-none absolute inset-0 -z-10 bg-accent/60 opacity-0 [clip-path:inset(0_100%_0_0)] transition-[clip-path,opacity] duration-300 ease-out group-hover/cell:opacity-100 group-hover/cell:[clip-path:inset(0_0_0_0)]"

/** Variante arrondie pour les pastilles (boutons, chips d'évènement). */
export const PILL_FILL =
  "pointer-events-none absolute inset-0 -z-10 opacity-0 [clip-path:inset(0_100%_0_0_round_9999px)] transition-[clip-path,opacity] duration-300 ease-out group-hover/pill:opacity-100 group-hover/pill:[clip-path:inset(0_0_0_0_round_9999px)]"

/* -------------------------------------------------------------------------- */
/* Palette des évènements                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Palette des évènements. `soft` sert aux chips (mois), `solid` aux barres
 * (semaine, jour, Gantt), `bar` à la portion remplie d'une barre Gantt.
 */
export const eventTones: Record<
  EventTone,
  { soft: string; text: string; dot: string; solid: string; bar: string }
> = {
  // "amber" est le ton du statut "En attente" (cf. article-calendar.ts) : encre neutre.
  amber: {
    soft: "bg-neutral-200",
    text: "text-neutral-800",
    dot: "bg-neutral-900",
    solid: "bg-neutral-200 ring-neutral-400/50",
    bar: "bg-neutral-900",
  },
  // "sky" = "En cours" : terracotta.
  sky: {
    soft: "bg-accent-200",
    text: "text-accent-800",
    dot: "bg-primary",
    solid: "bg-accent-200 ring-accent-400/60",
    bar: "bg-primary",
  },
  // "emerald" = "Bouclé" : sauge.
  emerald: {
    soft: "bg-accent-2-200",
    text: "text-accent-2-800",
    dot: "bg-accent-2-600",
    solid: "bg-accent-2-200 ring-accent-2-400/60",
    bar: "bg-accent-2-600",
  },
  // "rose" = "Annulé" : neutre estompé.
  rose: {
    soft: "bg-neutral-300",
    text: "text-neutral-700",
    dot: "bg-neutral-500",
    solid: "bg-neutral-300 ring-neutral-400/60",
    bar: "bg-neutral-500",
  },
  indigo: {
    soft: "bg-accent-800/12",
    text: "text-accent-900",
    dot: "bg-accent-800",
    solid: "bg-accent-800/15 ring-accent-800/35",
    bar: "bg-accent-800",
  },
  violet: {
    soft: "bg-accent-2-700/12",
    text: "text-accent-2-900",
    dot: "bg-accent-2-700",
    solid: "bg-accent-2-700/15 ring-accent-2-700/35",
    bar: "bg-accent-2-700",
  },
  teal: {
    soft: "bg-accent-2-500/15",
    text: "text-accent-2-800",
    dot: "bg-accent-2-500",
    solid: "bg-accent-2-500/20 ring-accent-2-500/35",
    bar: "bg-accent-2-500",
  },
  orange: {
    soft: "bg-accent-500/15",
    text: "text-accent-900",
    dot: "bg-accent-500",
    solid: "bg-accent-500/20 ring-accent-500/40",
    bar: "bg-accent-500",
  },
}

export const tone = (t: EventTone) => eventTones[t]
