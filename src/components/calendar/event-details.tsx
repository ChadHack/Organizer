"use client"

import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarDays, Clock3, Info, MapPin, Tags, User2 } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { tone } from "./calendar-constants"
import { useCalendar } from "./calendar-context"

/** Fiche détaillée de l'évènement sélectionné. */
export function EventDetails() {
  const { selected, select } = useCalendar()
  const t = selected ? tone(selected.tone) : null

  return (
    <Dialog
      open={!!selected}
      onOpenChange={(open) => {
        if (!open) select(null)
      }}
    >
      <DialogContent className="sm:max-w-md">
        {selected && t && (
          <>
            <DialogHeader>
              <span className="flex items-center gap-2">
                <span className={cn("size-2.5 rounded-full", t.dot)} />
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    t.soft,
                    t.text
                  )}
                >
                  {selected.lane ?? "Évènement"}
                </span>
              </span>
              <DialogTitle className="text-lg leading-tight">
                {selected.title}
              </DialogTitle>
              <DialogDescription className="capitalize">
                {format(selected.start, "EEEE d MMMM yyyy", { locale: fr })}
              </DialogDescription>
            </DialogHeader>

            <dl className="flex flex-col gap-2.5 text-sm">
              <Row icon={Clock3} tint={t.text} label="Horaire">
                {selected.allDay
                  ? "Journée entière"
                  : `${format(selected.start, "HH:mm")} – ${format(selected.end, "HH:mm")}`}
              </Row>
              <Row icon={CalendarDays} tint={t.text} label="Période">
                {format(selected.start, "d MMM", { locale: fr })} →{" "}
                {format(selected.end, "d MMM yyyy", { locale: fr })}
              </Row>
              {selected.location && (
                <Row icon={MapPin} tint={t.text} label="Lieu">
                  {selected.location}
                </Row>
              )}
              {selected.owner && (
                <Row icon={User2} tint={t.text} label="Responsable">
                  {selected.owner}
                </Row>
              )}
              {typeof selected.progress === "number" && (
                <Row icon={Tags} tint={t.text} label="Avancement">
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-28 overflow-hidden rounded-full bg-muted">
                      <span
                        className={cn("block h-full rounded-full", t.bar)}
                        style={{ width: `${selected.progress}%` }}
                      />
                    </span>
                    <span className="tabular-nums">{selected.progress}%</span>
                  </span>
                </Row>
              )}
              {selected.details?.map((d) => (
                <Row key={d.label} icon={Info} tint={t.text} label={d.label}>
                  {d.value}
                </Row>
              ))}
            </dl>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Row({
  icon: Icon,
  tint,
  label,
  children,
}: {
  icon: typeof Clock3
  tint: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className={cn("size-4 shrink-0", tint)} />
      <dt className="w-28 shrink-0 text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-foreground">{children}</dd>
    </div>
  )
}
