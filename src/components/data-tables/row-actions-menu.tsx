"use client"

import * as React from "react"
import { MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"

export interface RowAction {
  /** Identifiant unique de l'action au sein du menu. */
  key: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  /** Absent pour une action pas encore implémentée : la sélection ferme simplement le dialog. */
  onSelect?: () => void
  variant?: "default" | "destructive"
  disabled?: boolean
}

export interface RowActionGroup {
  heading?: string
  actions: RowAction[]
}

interface RowActionsMenuProps {
  groups: RowActionGroup[]
  label?: string
  searchPlaceholder?: string
  emptyLabel?: string
}

/**
 * Bouton d'actions de ligne (DataTable) : ouvre une Command palette recherchable
 * au lieu d'un DropdownMenu. Utilisé par tous les `actions-cell.tsx` des écrans.
 */
export function RowActionsMenu({
  groups,
  label = "Ouvrir le menu",
  searchPlaceholder = "Rechercher une action...",
  emptyLabel = "Aucune action trouvée.",
}: RowActionsMenuProps) {
  const [open, setOpen] = React.useState(false)

  const visibleGroups = groups.filter((group) => group.actions.length > 0)

  const handleSelect = (action: RowAction) => {
    setOpen(false)
    action.onSelect?.()
  }

  return (
    <>
      <Button
        variant="ghost"
        className="h-8 w-8 p-0"
        data-slot="row-actions-trigger"
        onClick={() => setOpen(true)}
      >
        <span className="sr-only">{label}</span>
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={label}
        description={searchPlaceholder}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            {visibleGroups.map((group, groupIndex) => (
              <React.Fragment key={group.heading ?? `group-${groupIndex}`}>
                {groupIndex > 0 && <CommandSeparator />}
                <CommandGroup heading={group.heading}>
                  {group.actions.map((action) => {
                    const Icon = action.icon
                    return (
                      <CommandItem
                        key={action.key}
                        disabled={action.disabled}
                        onSelect={() => handleSelect(action)}
                        className={cn(
                          action.variant === "destructive" &&
                            "text-destructive data-selected:bg-destructive/10 data-selected:text-destructive"
                        )}
                      >
                        {Icon && <Icon className="h-3.5 w-3.5" />}
                        <span>{action.label}</span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </React.Fragment>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
