import {
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns"

import {
  DAY_END_HOUR,
  DAY_START_HOUR,
  HOUR_HEIGHT,
  type CalendarEvent,
} from "./calendar-constants"

export const WEEK_OPTS = { weekStartsOn: 1 } as const

/** Grille de 6 semaines × 7 jours couvrant le mois de `cursor`. */
export function monthGrid(cursor: Date): Date[][] {
  const first = startOfWeek(startOfMonth(cursor), WEEK_OPTS)
  const last = endOfWeek(endOfMonth(cursor), WEEK_OPTS)
  const total = differenceInCalendarDays(last, first) + 1
  const days: Date[] = Array.from({ length: total }, (_, i) =>
    startOfDay(new Date(first.getTime() + i * 86400000))
  )
  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
  return weeks
}

/** Les 7 jours de la semaine de `cursor`. */
export function weekDays(cursor: Date): Date[] {
  const first = startOfWeek(cursor, WEEK_OPTS)
  return Array.from(
    { length: 7 },
    (_, i) => new Date(first.getTime() + i * 86400000)
  )
}

/** Un évènement touche-t-il ce jour ? */
export function touchesDay(event: CalendarEvent, day: Date) {
  const dayStart = startOfDay(day)
  const dayEnd = endOfDay(day)
  return event.start <= dayEnd && event.end >= dayStart
}

export function eventsForDay(events: CalendarEvent[], day: Date) {
  return events
    .filter((e) => touchesDay(e, day))
    .sort(
      (a, b) =>
        Number(!!b.allDay) - Number(!!a.allDay) ||
        a.start.getTime() - b.start.getTime()
    )
}

export function isSameDayEvent(event: CalendarEvent) {
  return startOfDay(event.start).getTime() === startOfDay(event.end).getTime()
}

/* -------------------------------------------------------------------------- */
/* Barres multi-jours (vue mois)                                              */
/* -------------------------------------------------------------------------- */

export type WeekSegment = {
  event: CalendarEvent
  /** Index de colonne 0–6 dans la ligne de semaine. */
  colStart: number
  /** Nombre de colonnes occupées. */
  span: number
  /** L'évènement commence-t-il / finit-il dans cette ligne ? */
  startsHere: boolean
  endsHere: boolean
  /** Piste verticale (empilement). */
  lane: number
}

/**
 * Découpe les évènements « barre » (journée entière ou multi-jours) en
 * segments par ligne de semaine, en les empilant sur des pistes libres.
 */
export function weekSegments(
  events: CalendarEvent[],
  week: Date[]
): WeekSegment[] {
  const rowStart = startOfDay(week[0])
  const rowEnd = endOfDay(week[6])

  const bars = events
    .filter((e) => e.allDay || !isSameDayEvent(e))
    .filter((e) => e.start <= rowEnd && e.end >= rowStart)
    .sort(
      (a, b) =>
        a.start.getTime() - b.start.getTime() ||
        b.end.getTime() - a.end.getTime()
    )

  // occupied[lane] = index de colonne libre à partir de laquelle on peut poser
  const occupied: number[] = []
  const segments: WeekSegment[] = []

  for (const event of bars) {
    const from = event.start < rowStart ? rowStart : startOfDay(event.start)
    const to = event.end > rowEnd ? rowEnd : startOfDay(event.end)
    const colStart = Math.max(0, differenceInCalendarDays(from, rowStart))
    const colEnd = Math.min(6, differenceInCalendarDays(to, rowStart))
    const span = Math.max(1, colEnd - colStart + 1)

    let lane = occupied.findIndex((next) => next <= colStart)
    if (lane === -1) {
      lane = occupied.length
      occupied.push(0)
    }
    occupied[lane] = colStart + span

    segments.push({
      event,
      colStart,
      span,
      startsHere: startOfDay(event.start) >= rowStart,
      endsHere: startOfDay(event.end) <= rowEnd,
      lane,
    })
  }

  return segments
}

/* -------------------------------------------------------------------------- */
/* Grille horaire (vues jour et semaine)                                      */
/* -------------------------------------------------------------------------- */

export const HOURS = Array.from(
  { length: DAY_END_HOUR - DAY_START_HOUR + 1 },
  (_, i) => DAY_START_HOUR + i
)

/** Décalage vertical (px) d'une date dans la grille horaire. */
export function offsetFor(date: Date, day: Date) {
  const minutes =
    date < startOfDay(day)
      ? DAY_START_HOUR * 60
      : date.getHours() * 60 + date.getMinutes()
  return ((minutes - DAY_START_HOUR * 60) / 60) * HOUR_HEIGHT
}

export type PositionedEvent = {
  event: CalendarEvent
  top: number
  height: number
  /** Position horizontale en % pour gérer les chevauchements. */
  left: number
  width: number
}

/**
 * Positionne les évènements horaires d'une journée et répartit les
 * chevauchements en colonnes de largeur égale.
 */
export function positionEvents(
  events: CalendarEvent[],
  day: Date
): PositionedEvent[] {
  const timed = events
    .filter((e) => !e.allDay && touchesDay(e, day))
    .sort((a, b) => a.start.getTime() - b.start.getTime())

  const minHeight = 22
  const columns: CalendarEvent[][] = []
  const assignment = new Map<string, number>()

  for (const event of timed) {
    let placed = false
    for (let i = 0; i < columns.length; i++) {
      const last = columns[i][columns[i].length - 1]
      if (last.end <= event.start) {
        columns[i].push(event)
        assignment.set(event.id, i)
        placed = true
        break
      }
    }
    if (!placed) {
      assignment.set(event.id, columns.length)
      columns.push([event])
    }
  }

  // Nombre de colonnes réellement en conflit avec chaque évènement.
  return timed.map((event) => {
    const overlapping = timed.filter(
      (o) => o.start < event.end && o.end > event.start
    )
    const lanes = new Set(overlapping.map((o) => assignment.get(o.id)!))
    const count = Math.max(lanes.size, 1)
    const index = assignment.get(event.id)!
    const top = offsetFor(event.start, day)
    const bottom =
      event.end > endOfDay(day)
        ? (DAY_END_HOUR - DAY_START_HOUR + 1) * HOUR_HEIGHT
        : offsetFor(event.end, day)

    return {
      event,
      top,
      height: Math.max(minHeight, bottom - top),
      left: (index / count) * 100,
      width: 100 / count,
    }
  })
}

/** Position (px) du trait « maintenant », ou null hors plage affichée. */
export function nowOffset(now: Date, day: Date) {
  if (!isWithinInterval(now, { start: startOfDay(day), end: endOfDay(day) }))
    return null
  const minutes = now.getHours() * 60 + now.getMinutes()
  if (minutes < DAY_START_HOUR * 60 || minutes > (DAY_END_HOUR + 1) * 60)
    return null
  return ((minutes - DAY_START_HOUR * 60) / 60) * HOUR_HEIGHT
}

/* -------------------------------------------------------------------------- */
/* Gantt                                                                      */
/* -------------------------------------------------------------------------- */

export type GanttLane = { name: string; events: CalendarEvent[] }

/** Regroupe les évènements par `lane` et trie chaque groupe par date. */
export function ganttLanes(events: CalendarEvent[]): GanttLane[] {
  const map = new Map<string, CalendarEvent[]>()
  for (const event of events) {
    const key = event.lane ?? "Autres"
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(event)
  }
  return [...map.entries()]
    .map(([name, list]) => ({
      name,
      events: list.sort((a, b) => a.start.getTime() - b.start.getTime()),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"))
}
