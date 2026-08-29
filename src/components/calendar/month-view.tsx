"use client"

import * as React from "react"
import { format, isSameMonth, isToday } from "date-fns"
import { fr } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { CELL_FILL } from "./calendar-constants"
import { useCalendar } from "./calendar-context"
import { EventChip } from "./event-chip"
import {
  eventsForDay,
  isSameDayEvent,
  monthGrid,
  weekSegments,
} from "./calendar-utils"

const BAR_HEIGHT = 22
/** Nombre maximum de pistes de barres multi-jours affichées par semaine. */
const MAX_LANES = 2
/** Nombre maximum de pastilles « évènement du jour » par cellule. */
const MAX_CHIPS = 3

export function MonthView() {
  const { cursor, visibleEvents, setCursor, setView } = useCalendar()
  const weeks = React.useMemo(() => monthGrid(cursor), [cursor])

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="grid grid-cols-7 border-b border-border/60 bg-surface">
        {weeks[0].map((day) => (
          <div
            key={day.toISOString()}
            className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            <span className="hidden sm:inline">
              {format(day, "EEEE", { locale: fr })}
            </span>
            <span className="sm:hidden">
              {format(day, "EEEEE", { locale: fr })}
            </span>
          </div>
        ))}
      </div>

      <div className="custom-scrollbar flex min-h-0 flex-1 flex-col divide-y divide-border/60 overflow-y-auto">
        {weeks.map((week, weekIndex) => {
          const segments = weekSegments(visibleEvents, week)
          const lanes = Math.min(
            MAX_LANES,
            segments.reduce((max, s) => Math.max(max, s.lane + 1), 0)
          )
          const chipSlots = Math.max(1, MAX_CHIPS - lanes)

          return (
            <div
              key={week[0].toISOString()}
              className="relative min-h-26 flex-1"
            >
              <div className="grid h-full grid-cols-7 divide-x divide-border/60">
                {week.map((day, dayIndex) => {
                  const outside = !isSameMonth(day, cursor)
                  const today = isToday(day)
                  const dayEvents = eventsForDay(visibleEvents, day)
                  const single = dayEvents.filter(
                    (e) => !e.allDay && isSameDayEvent(e)
                  )
                  const hiddenBars = segments.filter(
                    (s) =>
                      s.lane >= MAX_LANES &&
                      dayIndex >= s.colStart &&
                      dayIndex < s.colStart + s.span
                  ).length
                  const extra = Math.max(0, single.length - chipSlots) + hiddenBars

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "group/cell relative isolate flex flex-col gap-1 overflow-hidden p-1.5 pt-1",
                        "animate-in fade-in fill-mode-backwards duration-500 ease-out",
                        outside && "bg-neutral-100"
                      )}
                      style={{
                        animationDelay: `${(weekIndex * 7 + dayIndex) * 12}ms`,
                      }}
                    >
                      <span aria-hidden className={CELL_FILL} />

                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            setCursor(day)
                            setView("day")
                          }}
                          aria-label={`Ouvrir le ${format(day, "d MMMM", { locale: fr })}`}
                          className={cn(
                            "flex size-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums transition-all duration-300 hover:scale-110",
                            today
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-foreground/80 group-hover/cell:bg-card group-hover/cell:text-foreground",
                            outside && !today && "text-muted-foreground"
                          )}
                        >
                          {format(day, "d")}
                        </button>
                        {dayEvents.length > 0 && (
                          <span className="text-[10px] font-medium tabular-nums text-muted-foreground opacity-0 transition-opacity duration-300 group-hover/cell:opacity-100">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      {/* Réserve la hauteur occupée par les barres multi-jours. */}
                      <div
                        aria-hidden
                        style={{ height: lanes * BAR_HEIGHT }}
                        className="shrink-0"
                      />

                      <div className="flex min-h-0 flex-col gap-1 overflow-hidden">
                        {single.slice(0, chipSlots).map((event, i) => (
                          <EventChip key={event.id} event={event} index={i} />
                        ))}
                      </div>

                      {extra > 0 && (
                        <span className="mt-auto pl-1 text-[10px] font-medium text-muted-foreground transition-colors duration-200 group-hover/cell:text-foreground">
                          +{extra} autre{extra > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Barres multi-jours superposées à la grille de la semaine. */}
              <div className="pointer-events-none absolute inset-x-0 top-8 grid grid-cols-7 px-1.5">
                {segments
                  .filter((s) => s.lane < MAX_LANES)
                  .map((s, i) => (
                    <div
                      key={`${s.event.id}-${s.colStart}`}
                      className="pointer-events-auto"
                      style={{
                        gridColumn: `${s.colStart + 1} / span ${s.span}`,
                        gridRow: 1,
                        marginTop: s.lane * BAR_HEIGHT,
                      }}
                    >
                      <EventChip
                        event={s.event}
                        index={i}
                        continuesBefore={!s.startsHere}
                        continuesAfter={!s.endsHere}
                      />
                    </div>
                  ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
