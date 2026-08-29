"use client";
/* eslint-disable react-refresh/only-export-components -- Provider + hook
   colocated on purpose, same convention as theme-provider.tsx. */

import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import * as React from "react";

import type { CalendarEvent, CalendarView } from "./calendar-constants";
import { WEEK_OPTS } from "./calendar-utils";

type Direction = 1 | -1;

type CalendarContextValue = {
  view: CalendarView;
  setView: (view: CalendarView) => void;
  cursor: Date;
  setCursor: (date: Date) => void;
  /** Sens du dernier déplacement — pilot le sens des animations. */
  direction: Direction;
  /** Incrémenté à chaque navigation : sert de clé pour rejouer les animations. */
  tick: number;
  next: () => void;
  previous: () => void;
  today: () => void;
  events: CalendarEvent[];
  /** Évènements de la période affichée. */
  visibleEvents: CalendarEvent[];
  selected: CalendarEvent | null;
  select: (event: CalendarEvent | null) => void;
};

const CalendarContext = React.createContext<CalendarContextValue | null>(null);

export function useCalendar() {
  const ctx = React.useContext(CalendarContext);
  if (!ctx)
    throw new Error("useCalendar doit être utilisé dans un <CalendarProvider>");
  return ctx;
}

export function CalendarProvider({
  children,
  defaultView = "month",
  events = [],
}: {
  children: React.ReactNode;
  defaultView?: CalendarView;
  events?: CalendarEvent[];
}) {
  const [view, setViewState] = React.useState<CalendarView>(defaultView);
  const [cursor, setCursorState] = React.useState(() => startOfDay(new Date()));
  const [direction, setDirection] = React.useState<Direction>(1);
  const [tick, setTick] = React.useState(0);
  const [selected, setSelected] = React.useState<CalendarEvent | null>(null);

  const allEvents = events;

  const move = React.useCallback((dir: Direction, date: Date) => {
    setDirection(dir);
    setCursorState(startOfDay(date));
    setTick((t) => t + 1);
  }, []);

  const step = React.useCallback(
    (dir: Direction) => {
      const amount = dir;
      if (view === "month" || view === "gantt")
        move(dir, addMonths(cursor, amount));
      else if (view === "week") move(dir, addDays(cursor, 7 * amount));
      else move(dir, addDays(cursor, amount));
    },
    [cursor, move, view]
  );

  const setView = React.useCallback((v: CalendarView) => {
    setViewState(v);
    setTick((t) => t + 1);
  }, []);

  const visibleEvents = React.useMemo(() => {
    const from =
      view === "month" || view === "gantt"
        ? startOfWeek(startOfMonth(cursor), WEEK_OPTS)
        : view === "week"
          ? startOfWeek(cursor, WEEK_OPTS)
          : startOfDay(cursor);
    const to =
      view === "month" || view === "gantt"
        ? endOfWeek(endOfMonth(cursor), WEEK_OPTS)
        : view === "week"
          ? endOfWeek(cursor, WEEK_OPTS)
          : addDays(startOfDay(cursor), 1);
    return allEvents.filter((e) => e.start <= to && e.end >= from);
  }, [allEvents, cursor, view]);

  // Raccourcis clavier : flèches pour naviguer, M/S/J/G pour changer de vue.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        e.metaKey ||
        e.ctrlKey ||
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      )
        return;
      if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key.toLowerCase() === "t") move(1, new Date());
      else if (e.key.toLowerCase() === "m") setView("month");
      else if (e.key.toLowerCase() === "s") setView("week");
      else if (e.key.toLowerCase() === "j") setView("day");
      else if (e.key.toLowerCase() === "g") setView("gantt");
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move, setView, step]);

  const value = React.useMemo<CalendarContextValue>(
    () => ({
      view,
      setView,
      cursor,
      setCursor: (d) => move(d > cursor ? 1 : -1, d),
      direction,
      tick,
      next: () => step(1),
      previous: () => step(-1),
      today: () => move(1, new Date()),
      events: allEvents,
      visibleEvents,
      selected,
      select: setSelected,
    }),
    [
      allEvents,
      cursor,
      direction,
      move,
      selected,
      setView,
      step,
      tick,
      view,
      visibleEvents,
    ]
  );

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}
