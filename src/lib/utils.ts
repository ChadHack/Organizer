import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const fmtPrice = (n: number) => n.toLocaleString("fr-FR") + " Fcfa"
