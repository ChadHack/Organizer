"use client"

import { cn } from "@/lib/utils"
import {
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  isToday,
  isWeekend,
  startOfDay,
  startOfMonth,
} from "date-fns"
import { fr } from "date-fns/locale"
import * as React from "react"
import { GANTT_DAY_WIDTH, GANTT_LABEL_WIDTH, tone } from "./calendar-constants"
import { useCalendar } from "./calendar-context"
import { ganttLanes } from "./calendar-utils"

const ROW_HEIGHT = 40

export function GanttView() {
  const { cursor, visibleEvents, select, tick } = useCalendar()

  const days = React.useMemo(
    () =>
      eachDayOfInterval({
        start: startOfMonth(cursor),
        end: endOfMonth(cursor),
      }),
    [cursor]
  )
  const lanes = React.useMemo(() => ganttLanes(visibleEvents), [visibleEvents])
  const gridWidth = days.length * GANTT_DAY_WIDTH

  // Index global (toutes lanes confondues) de chaque évènement, pour étager
  // le délai d'animation des barres sans muter de compteur pendant le rendu.
  const rowIndexByEventId = React.useMemo(() => {
    const map = new Map<string, number>()
    let i = 0
    for (const lane of lanes) {
      for (const event of lane.events) map.set(event.id, i++)
    }
    return map
  }, [lanes])

  // Les barres poussent de 0 à leur largeur cible au montage / à la navigation.
  const [grown, setGrown] = React.useState(false)
  React.useEffect(() => {
    // Remise à 0 volontaire puis passage à true au frame suivant : c'est ce
    // qui déclenche la transition CSS de croissance des barres à chaque
    // navigation. Un seul setState avant le RAF, pas de boucle de rendu.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGrown(false)
    const id = requestAnimationFrame(() => setGrown(true))
    return () => cancelAnimationFrame(id)
  }, [tick, cursor])

  return (
    <div className="custom-scrollbar min-h-0 min-w-0 flex-1 overflow-auto">
      <div style={{ width: GANTT_LABEL_WIDTH + gridWidth }}>
        {/* En-tête des jours */}
        <div className="sticky top-0 z-20 flex border-b border-border/60 bg-card/95 backdrop-blur">
          <div
            style={{ width: GANTT_LABEL_WIDTH }}
            className="sticky left-0 z-10 shrink-0 border-r border-border/60 bg-card/95 px-4 py-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
          >
            Chantier
          </div>
          <div className="flex">
            {days.map((day) => (
              <div
                key={day.toISOString()}
                style={{ width: GANTT_DAY_WIDTH }}
                className={cn(
                  "flex shrink-0 flex-col items-center gap-0.5 py-1.5 text-[10px] font-medium",
                  isWeekend(day) ? "bg-muted/40" : "",
                  isToday(day)
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <span className="uppercase">
                  {format(day, "EEEEE", { locale: fr })}
                </span>
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full tabular-nums",
                    isToday(day) &&
                      "bg-primary text-primary-foreground"
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Lignes : un groupe par « lane », une barre par évènement */}
        <div className="relative">
          {/* Colonnes de fond (week-ends, jour courant) */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 flex"
            style={{ left: GANTT_LABEL_WIDTH }}
          >
            {days.map((day) => (
              <div
                key={day.toISOString()}
                style={{ width: GANTT_DAY_WIDTH }}
                className={cn(
                  "h-full shrink-0 border-r border-border/40",
                  isWeekend(day) && "bg-muted/30",
                  isToday(day) &&
                    "bg-primary/8"
                )}
              />
            ))}
          </div>

          {lanes.map((lane) => (
            <div key={lane.name}>
              {/* Bandeau de groupe : la teinte porte sur toute la ligne, le
                  libellé reste collé à gauche sans fond propre pour éviter
                  une rupture visuelle au milieu de la bande. */}
              <div className="relative flex h-8 items-center border-y border-border/60 bg-muted/70 backdrop-blur">
                <div
                  style={{ width: GANTT_LABEL_WIDTH }}
                  className="sticky left-0 z-10 shrink-0 truncate px-4 text-xs font-semibold tracking-wide text-foreground/80 uppercase"
                >
                  {lane.name}
                </div>
              </div>

              {lane.events.map((event) => {
                const t = tone(event.tone)
                const start = startOfDay(event.start)
                const offset = Math.max(
                  0,
                  differenceInCalendarDays(start, days[0])
                )
                const rawSpan =
                  differenceInCalendarDays(startOfDay(event.end), start) + 1
                const span = Math.min(rawSpan, days.length - offset)
                const progress = event.progress
                const hasProgress = typeof progress === "number"
                const delay = (rowIndexByEventId.get(event.id) ?? 0) * 45
                // Sous 3 jours, la barre est trop étroite pour un libellé
                // lisible : on le rejette à droite de la barre.
                const wide = span >= 3
                const barWidth = Math.max(GANTT_DAY_WIDTH * span - 6, 18)

                return (
                  <div
                    key={event.id}
                    className="group/cell relative flex items-center border-b border-border/40 transition-colors duration-200 hover:bg-accent/30"
                    style={{ height: ROW_HEIGHT }}
                  >
                    {/* Le libellé ouvre aussi la fiche : toute la ligne est
                        cliquable, pas seulement la barre. */}
                    <button
                      type="button"
                      onClick={() => select(event)}
                      style={{ width: GANTT_LABEL_WIDTH }}
                      className="sticky left-0 z-10 shrink-0 border-r border-border/60 bg-card/95 px-4 text-left backdrop-blur"
                    >
                      <p className="truncate text-xs font-medium text-foreground">
                        {event.title}
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {event.owner ?? "—"}
                        {hasProgress ? ` · ${progress}%` : ""}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => select(event)}
                      title={
                        hasProgress
                          ? `${event.title} — ${progress}%`
                          : event.title
                      }
                      className={cn(
                        "absolute flex h-6 items-center overflow-hidden rounded-full ring-1 transition-[width,transform,box-shadow] duration-500 ease-out",
                        "hover:z-10 hover:scale-[1.015] hover:shadow-lg",
                        t.solid
                      )}
                      style={{
                        left: GANTT_LABEL_WIDTH + offset * GANTT_DAY_WIDTH + 3,
                        width: grown ? barWidth : 0,
                        transitionDelay: `${delay}ms`,
                      }}
                    >
                      {/* Portion réalisée */}
                      {hasProgress && (
                        <span
                          aria-hidden
                          className={cn(
                            "absolute inset-y-0 left-0 rounded-full opacity-80 transition-[width] duration-700 ease-out",
                            t.bar
                          )}
                          style={{
                            width: grown ? `${progress}%` : "0%",
                            transitionDelay: `${delay + 120}ms`,
                          }}
                        />
                      )}
                      {wide && (
                        <span
                          className={cn(
                            "relative z-10 truncate px-2.5 text-[10px] font-semibold tabular-nums",
                            hasProgress && progress > 55
                              ? "text-background"
                              : t.text
                          )}
                        >
                          {format(event.start, "d MMM", { locale: fr })} →{" "}
                          {format(event.end, "d MMM", { locale: fr })}
                        </span>
                      )}
                    </button>

                    {/* Libellé déporté des barres courtes : l'avancement s'il
                        existe, sinon la date de l'échéance. */}
                    {!wide && (
                      <span
                        aria-hidden
                        className={cn(
                          "pointer-events-none absolute z-10 text-[10px] font-semibold whitespace-nowrap tabular-nums opacity-0 transition-opacity duration-500",
                          grown && "opacity-100",
                          t.text
                        )}
                        style={{
                          left:
                            GANTT_LABEL_WIDTH +
                            offset * GANTT_DAY_WIDTH +
                            barWidth +
                            9,
                          transitionDelay: `${delay + 300}ms`,
                        }}
                      >
                        {hasProgress
                          ? `${progress}%`
                          : format(event.start, "d MMM", { locale: fr })}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}

          {lanes.length === 0 && (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Aucun chantier sur cette période.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
