"use client";
/* eslint-disable react-refresh/only-export-components -- barrel re-export of
   the calendar module's provider/hook/types alongside its components. */

import { cn } from "@/lib/utils";
import { DayView, WeekView } from "./agenda-views";
import type { CalendarEvent, CalendarView } from "./calendar-constants";
import { CalendarProvider, useCalendar } from "./calendar-context";
import { CalendarToolbar } from "./calendar-toolbar";
import { EventDetails } from "./event-details";
import { GanttView } from "./gantt-view";
import { MonthView } from "./month-view";

/**
 * Calendrier complet : vues Mois, Semaine, Jour et Gantt, dans le même
 * langage visuel que la sidebar (icônes colorées, remplissages qui
 * coulissent, apparitions en cascade).
 */
export function FullCalendar({
  className,
  defaultView = "month",
  events,
}: {
  className?: string;
  defaultView?: CalendarView;
  events?: CalendarEvent[];
}) {
  return (
    <CalendarProvider defaultView={defaultView} events={events}>
      <section
        className={cn(
          "flex min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-[28px] bg-card shadow-sm",
          className
        )}
      >
        <CalendarToolbar />
        <CalendarBody />
        <EventDetails />
      </section>
    </CalendarProvider>
  );
}

function CalendarBody() {
  const { view, direction, tick } = useCalendar();

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {/* La clé remonte la vue à chaque navigation : l'entrée est rejouée
          dans le sens du déplacement. */}
      <div
        key={`${view}-${tick}`}
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col",
          "animate-in duration-300 ease-out fade-in",
          direction === 1 ? "slide-in-from-right-4" : "slide-in-from-left-4"
        )}
      >
        {view === "month" && <MonthView />}
        {view === "week" && <WeekView />}
        {view === "day" && <DayView />}
        {view === "gantt" && <GanttView />}
      </div>
    </div>
  );
}

export { CalendarProvider, useCalendar } from "./calendar-context";
export type { CalendarEvent, CalendarView, EventTone } from "./calendar-constants";
