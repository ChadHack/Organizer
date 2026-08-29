"use client"

import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { PILL_FILL, tone, type CalendarEvent } from "./calendar-constants"
import { useCalendar } from "./calendar-context"

/**
 * Pastille compacte d'évènement (vue mois). Le hover coulisse de gauche à
 * droite comme les entrées de la sidebar, et le clic ouvre le détail.
 */
export function EventChip({
  event,
  className,
  style,
  continuesBefore,
  continuesAfter,
  index = 0,
}: {
  event: CalendarEvent
  className?: string
  style?: React.CSSProperties
  continuesBefore?: boolean
  continuesAfter?: boolean
  index?: number
}) {
  const { select } = useCalendar()
  const t = tone(event.tone)

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        select(event)
      }}
      title={event.title}
      className={cn(
        "group/pill relative isolate flex h-5 w-full items-center gap-1.5 overflow-hidden rounded-md px-1.5 text-left text-[11px] font-medium",
        "animate-in fade-in slide-in-from-left-2 fill-mode-backwards duration-300 ease-out",
        "transition-transform duration-200 hover:-translate-y-px active:scale-[0.98]",
        t.soft,
        t.text,
        continuesBefore && "rounded-l-none",
        continuesAfter && "rounded-r-none",
        className
      )}
      style={{ animationDelay: `${index * 35}ms`, ...style }}
    >
      {/* Remplissage qui coulisse : `bg-current` reprend la teinte du texte. */}
      <span aria-hidden className={cn(PILL_FILL, "bg-current/20")} />
      {continuesBefore ? (
        <span aria-hidden className="text-[10px] leading-none opacity-70">
          ◀
        </span>
      ) : (
        <span
          aria-hidden
          className={cn(
            "size-1.5 shrink-0 rounded-full transition-transform duration-300 group-hover/pill:scale-150",
            t.dot
          )}
        />
      )}
      <span className="truncate">
        {!event.allDay && (
          <span className="mr-1 tabular-nums opacity-70">
            {format(event.start, "HH:mm")}
          </span>
        )}
        {event.title}
      </span>
      {continuesAfter && (
        <span aria-hidden className="ml-auto text-[10px] leading-none opacity-70">
          ▶
        </span>
      )}
    </button>
  )
}

/** Bloc positionné d'un évènement horaire (vues jour et semaine). */
export function EventBlock({
  event,
  top,
  height,
  left,
  width,
  index = 0,
}: {
  event: CalendarEvent
  top: number
  height: number
  left: number
  width: number
  index?: number
}) {
  const { select } = useCalendar()
  const t = tone(event.tone)
  const compact = height < 44

  return (
    <button
      type="button"
      onClick={() => select(event)}
      className={cn(
        "group/pill absolute isolate flex flex-col overflow-hidden rounded-lg px-2 py-1 text-left ring-1 backdrop-blur-[1px]",
        "animate-in fade-in zoom-in-95 fill-mode-backwards duration-300 ease-out",
        "transition-[transform,box-shadow] duration-200 hover:z-10 hover:-translate-y-px hover:shadow-lg active:scale-[0.99]",
        t.solid,
        t.text
      )}
      style={{
        top,
        height,
        left: `calc(${left}% + 2px)`,
        width: `calc(${width}% - 4px)`,
        animationDelay: `${index * 40}ms`,
      }}
    >
      {/* Liseré de couleur à gauche, qui s'épaissit au survol. */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 w-0.5 transition-all duration-300 group-hover/pill:w-1",
          t.bar
        )}
      />
      <span className="truncate pl-1 text-xs font-semibold leading-tight">
        {event.title}
      </span>
      {!compact && (
        <span className="truncate pl-1 text-[11px] tabular-nums opacity-80">
          {format(event.start, "HH:mm")} – {format(event.end, "HH:mm")}
          {event.location ? ` · ${event.location}` : ""}
        </span>
      )}
    </button>
  )
}
