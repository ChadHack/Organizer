"use client"

import { format, isSameMonth } from "date-fns"
import { fr } from "date-fns/locale"
import {
  CalendarDays,
  CalendarRange,
  ChartGantt,
  ChevronLeft,
  ChevronRight,
  Clock3,
} from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"
import { PILL_FILL, type CalendarView } from "./calendar-constants"
import { useCalendar } from "./calendar-context"
import { weekDays } from "./calendar-utils"

const VIEWS: {
  key: CalendarView
  label: string
  short: string
  icon: typeof CalendarDays
}[] = [
  { key: "month", label: "Mois", short: "M", icon: CalendarDays },
  { key: "week", label: "Semaine", short: "S", icon: CalendarRange },
  { key: "day", label: "Jour", short: "J", icon: Clock3 },
  { key: "gantt", label: "Gantt", short: "G", icon: ChartGantt },
]

/** Titre contextuel : « octobre 2026 », « 5 – 11 oct. 2026 », « lundi 5 oct. ». */
function useTitle() {
  const { view, cursor } = useCalendar()
  return React.useMemo(() => {
    if (view === "day")
      return format(cursor, "EEEE d MMMM yyyy", { locale: fr })
    if (view === "week") {
      const days = weekDays(cursor)
      const [a, b] = [days[0], days[6]]
      return isSameMonth(a, b)
        ? `${format(a, "d")} – ${format(b, "d MMMM yyyy", { locale: fr })}`
        : `${format(a, "d MMM", { locale: fr })} – ${format(b, "d MMM yyyy", { locale: fr })}`
    }
    return format(cursor, "MMMM yyyy", { locale: fr })
  }, [cursor, view])
}

export function CalendarToolbar() {
  const { view, setView, next, previous, today, visibleEvents, tick } =
    useCalendar()
  const title = useTitle()
  const activeIndex = VIEWS.findIndex((v) => v.key === view)

  return (
    <header className="flex flex-col gap-4 bg-neutral-900 px-5 py-5 text-neutral-100 sm:px-6.5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
        {/* Navigation précédent / suivant */}
        <div className="flex items-center gap-1.5 rounded-full bg-neutral-100/10 p-1.5">
          <NavButton
            label="Période précédente"
            hint="Période précédente (←)"
            onClick={previous}
          >
            <ChevronLeft className="size-4" />
          </NavButton>
          <NavButton
            label="Période suivante"
            hint="Période suivante (→)"
            onClick={next}
          >
            <ChevronRight className="size-4" />
          </NavButton>
        </div>

        <button
          type="button"
          onClick={today}
          className="group/pill relative isolate shrink-0 overflow-hidden rounded-full border border-neutral-100/28 px-4 py-2.25 font-heading text-sm text-neutral-100 transition-transform duration-200 active:scale-[0.97]"
        >
          <span aria-hidden className={cn(PILL_FILL, "bg-neutral-100/12")} />
          Aujourd&apos;hui
        </button>

        <div className="min-w-0 flex-1">
          {/* La clé rejoue l'animation à chaque changement de période. */}
          <h2
            key={tick}
            className="animate-in truncate font-heading text-xl text-neutral-100 capitalize duration-300 ease-out fade-in slide-in-from-bottom-1"
          >
            {title}
          </h2>
          <p className="truncate text-xs text-neutral-400">
            {visibleEvents.length} évènement
            {visibleEvents.length > 1 ? "s" : ""} sur la période
          </p>
        </div>
      </div>

      {/* Commutateur de vues : la pastille active glisse d'un onglet à l'autre. */}
      <div
        role="tablist"
        aria-label="Vue du calendrier"
        className="relative isolate flex w-full shrink-0 rounded-full bg-neutral-100/10 p-1 lg:w-auto"
      >
        <span
          aria-hidden
          className="absolute inset-y-1 left-1 -z-10 rounded-full bg-primary transition-transform duration-300 ease-out"
          style={{
            width: `calc((100% - 0.5rem) / ${VIEWS.length})`,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />
        {VIEWS.map(({ key, label, short, icon: Icon }) => {
          const isActive = key === view
          return (
            <button
              key={key}
              role="tab"
              type="button"
              aria-selected={isActive}
              title={`Vue ${label} (${short})`}
              onClick={() => setView(key)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 font-heading text-sm transition-colors duration-200 lg:flex-none lg:px-4",
                isActive
                  ? "text-neutral-100"
                  : "text-neutral-400 hover:text-neutral-100"
              )}
            >
              <Icon
                className={cn(
                  "size-4 transition-all duration-300",
                  isActive ? "scale-110" : "text-current"
                )}
              />
              <span className="hidden md:block">{label}</span>
            </button>
          )
        })}
      </div>
    </header>
  )
}

function NavButton({
  label,
  hint,
  onClick,
  children,
}: {
  label: string
  hint?: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={hint ?? label}
      onClick={onClick}
      className="group/pill relative isolate flex size-8 items-center justify-center overflow-hidden rounded-full text-neutral-100 transition-[color,transform] duration-200 hover:text-neutral-100 active:scale-90"
    >
      <span aria-hidden className={cn(PILL_FILL, "bg-neutral-100/16")} />
      {children}
    </button>
  )
}
