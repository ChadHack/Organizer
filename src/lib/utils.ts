import { clsx, type ClassValue } from "clsx"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const fmtPrice = (n: number) => n.toLocaleString("fr-FR") + " Fcfa"

export const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

export const fmtDay = (date: Date) =>
  format(date, "dd MMM yyyy", { locale: fr })
