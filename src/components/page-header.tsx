import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

/** En-tête d'écran commun (titre Caprasimo + sous-titre + action optionnelle), remplace l'ancien fil d'Ariane. */
export function PageHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-start justify-between gap-6 px-1",
        className
      )}
    >
      <div>
        <h1 className="font-heading text-[34px] leading-[1.18] text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </header>
  )
}
