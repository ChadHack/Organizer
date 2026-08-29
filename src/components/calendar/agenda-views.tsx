"use client"

import { differenceInMinutes, format, isToday, startOfDay } from "date-fns"
import { fr } from "date-fns/locale"
import { Clock3, MapPin, User2 } from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"
import {
  DAY_END_HOUR,
  DAY_START_HOUR,
  HOUR_HEIGHT,
  PILL_FILL,
  tone,
} from "./calendar-constants"
import { useCalendar } from "./calendar-context"
import {
  HOURS,
  eventsForDay,
  isSameDayEvent,
  nowOffset,
  positionEvents,
  touchesDay,
  weekDays,
} from "./calendar-utils"
import { EventBlock, EventChip } from "./event-chip"

const GUTTER = 60

/** Horloge partagée : met à jour le trait « maintenant » chaque minute. */
function useNow() {
  const [now, setNow] = React.useState<Date | null>(null)
  React.useEffect(() => {
    // Initialise "maintenant" dès le montage (sinon le trait n'apparaît
    // qu'à la première minute écoulée), puis se resynchronise chaque minute.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])
  return now
}

/**
 * `minmax(0, 1fr)` (et non `1fr`) : sinon les titres longs des évènements
 * « journée entière » imposent leur largeur min-content et désalignent la
 * rangée par rapport aux colonnes horaires.
 */
const columns = (count: number) => `repeat(${count}, minmax(0, 1fr))`

/**
 * Grille horaire commune aux vues Semaine (7 colonnes) et Jour (1 colonne).
 */
function TimeGrid({ days }: { days: Date[] }) {
  const { visibleEvents, setCursor, setView } = useCalendar()
  const now = useNow()
  const scroller = React.useRef<HTMLDivElement>(null)
  const totalHeight = (DAY_END_HOUR - DAY_START_HOUR + 1) * HOUR_HEIGHT

  // Au montage, on cadre la grille sur le début de journée de travail.
  React.useEffect(() => {
    scroller.current?.scrollTo({ top: HOUR_HEIGHT, behavior: "smooth" })
  }, [])

  const allDayByDay = days.map((day) =>
    visibleEvents.filter(
      (e) => (e.allDay || !isSameDayEvent(e)) && touchesDay(e, day)
    )
  )
  const hasAllDay = allDayByDay.some((list) => list.length > 0)

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {/* En-tête collant : jours + rangée « journée entière » */}
      <div className="sticky top-0 z-20 border-b border-border/60 bg-card/95 backdrop-blur">
        <div className="flex">
          <div style={{ width: GUTTER }} className="shrink-0" />
          <div
            className="grid flex-1 divide-x divide-border/60"
            style={{ gridTemplateColumns: columns(days.length) }}
          >
            {days.map((day, i) => {
              const today = isToday(day)
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => {
                    setCursor(day)
                    setView("day")
                  }}
                  className={cn(
                    "group/cell flex flex-col items-center gap-0.5 px-2 py-2 transition-colors duration-200 hover:bg-accent/40",
                    "animate-in duration-400 ease-out fill-mode-backwards fade-in slide-in-from-top-1"
                  )}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    {format(day, "EEE", { locale: fr })}
                  </span>
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full text-sm font-semibold tabular-nums transition-all duration-300 group-hover/cell:scale-110",
                      today
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {hasAllDay && (
          <div className="flex border-t border-border/60 bg-muted/20">
            <div
              style={{ width: GUTTER }}
              className="shrink-0 px-2 py-1.5 text-right text-[10px] font-medium tracking-wide text-muted-foreground uppercase"
            >
              Journée
            </div>
            <div
              className="custom-scrollbar grid max-h-24 flex-1 divide-x divide-border/60 overflow-y-auto"
              style={{ gridTemplateColumns: columns(days.length) }}
            >
              {allDayByDay.map((list, i) => (
                <div
                  key={days[i].toISOString()}
                  className="flex min-w-0 flex-col gap-1 p-1"
                >
                  {list.map((event, j) => (
                    <EventChip key={event.id} event={event} index={j} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Corps défilant */}
      <div ref={scroller} className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
        <div className="flex" style={{ height: totalHeight }}>
          {/* Gouttière des heures */}
          <div
            style={{ width: GUTTER }}
            className="relative shrink-0 border-r border-border/60"
          >
            {HOURS.map((hour, i) => (
              <div
                key={hour}
                className="absolute right-2 -translate-y-1/2 text-[11px] font-medium text-muted-foreground tabular-nums"
                style={{ top: i * HOUR_HEIGHT }}
              >
                {String(hour).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* Colonnes de jours */}
          <div
            className="relative grid flex-1 divide-x divide-border/60"
            style={{ gridTemplateColumns: columns(days.length) }}
          >
            {/* Lignes d'heures, dessinées une seule fois derrière les colonnes */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ gridColumn: `1 / -1`, gridRow: 1 }}
            >
              {HOURS.map((hour, i) => (
                <div
                  key={hour}
                  className="absolute inset-x-0 border-t border-border/50"
                  style={{ top: i * HOUR_HEIGHT }}
                />
              ))}
            </div>

            {days.map((day, dayIndex) => {
              const positioned = positionEvents(visibleEvents, day)
              const marker = now ? nowOffset(now, day) : null
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "relative",
                    isToday(day) && "bg-primary/5"
                  )}
                  style={{ gridColumn: dayIndex + 1, gridRow: 1 }}
                >
                  {positioned.map((p, i) => (
                    <EventBlock
                      key={p.event.id}
                      event={p.event}
                      top={p.top}
                      height={p.height}
                      left={p.left}
                      width={p.width}
                      index={i}
                    />
                  ))}

                  {marker !== null && (
                    <div
                      className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
                      style={{ top: marker }}
                    >
                      <span className="size-2 shrink-0 -translate-x-1 animate-pulse rounded-full bg-rose-500 ring-2 ring-rose-500/25 dark:bg-rose-400" />
                      <span className="h-px flex-1 bg-rose-500/70 dark:bg-rose-400/70" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export function DayView() {
  const { cursor, visibleEvents, select } = useCalendar()
  const day = React.useMemo(() => startOfDay(cursor), [cursor])
  const agenda = React.useMemo(
    () => eventsForDay(visibleEvents, day),
    [day, visibleEvents]
  )

  const busyMinutes = agenda
    .filter((e) => !e.allDay)
    .reduce((sum, e) => sum + differenceInMinutes(e.end, e.start), 0)

  return (
    <div className="flex min-h-0 flex-1 divide-x divide-border/60">
      {/* `max-w` évite une colonne unique démesurément large sur grand écran. */}
      <div className="mx-auto flex min-w-0 flex-1 flex-col lg:max-w-3xl">
        <TimeGrid days={[day]} />
      </div>

      {/* Agenda latéral — résumé de la journée */}
      <aside className="custom-scrollbar hidden w-64 shrink-0 flex-col overflow-y-auto p-4 lg:flex xl:w-72">
        <h3 className="text-sm font-semibold text-foreground capitalize">
          {format(day, "EEEE d MMMM", { locale: fr })}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {agenda.length} évènement{agenda.length > 1 ? "s" : ""} ·{" "}
          {Math.round(busyMinutes / 60)} h planifiée
          {busyMinutes >= 120 ? "s" : ""}
        </p>

        <div className="mt-4 flex flex-col gap-2">
          {agenda.length === 0 && (
            <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              Aucun évènement ce jour.
            </p>
          )}
          {agenda.map((event, i) => {
            const t = tone(event.tone)
            return (
              <button
                key={event.id}
                type="button"
                onClick={() => select(event)}
                className={cn(
                  "group/pill relative isolate flex flex-col gap-1 overflow-hidden rounded-xl p-3 text-left ring-1 ring-border/60",
                  "animate-in duration-400 ease-out fill-mode-backwards fade-in slide-in-from-right-2",
                  "transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.99]"
                )}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span aria-hidden className={cn(PILL_FILL, t.soft)} />
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-full transition-transform duration-300 group-hover/pill:scale-125",
                      t.dot
                    )}
                  />
                  <span className="truncate text-sm font-medium text-foreground">
                    {event.title}
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-4 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1 tabular-nums">
                    <Clock3 className={cn("size-3", t.text)} />
                    {event.allDay
                      ? "Journée entière"
                      : `${format(event.start, "HH:mm")} – ${format(event.end, "HH:mm")}`}
                  </span>
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className={cn("size-3", t.text)} />
                      {event.location}
                    </span>
                  )}
                  {event.owner && (
                    <span className="flex items-center gap-1">
                      <User2 className={cn("size-3", t.text)} />
                      {event.owner}
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </aside>
    </div>
  )
}

export function WeekView() {
  const { cursor } = useCalendar()
  const days = React.useMemo(() => weekDays(cursor), [cursor])
  return <TimeGrid days={days} />
}
