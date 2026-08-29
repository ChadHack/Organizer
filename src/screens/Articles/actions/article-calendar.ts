import type { Article } from "@/api/interfaces/article.interface"
import type { CalendarEvent, EventTone } from "@/components/calendar"

/** Ton associé à chaque statut d'article, pour les distinguer d'un coup d'œil. */
const STATUS_TONES: Record<Article["status"], EventTone> = {
  "En attente": "amber",
  "En cours": "sky",
  Bouclé: "emerald",
  Annulé: "rose",
}

/** Convertit les articles en évènements pour le calendrier, calés sur leur date estimée. */
export function articlesToEvents(articles: Article[]): CalendarEvent[] {
  return articles.map((article) => {
    const date = new Date(article.estimateDate)
    return {
      id: article.id,
      title: article.name,
      start: date,
      end: date,
      allDay: true,
      tone: STATUS_TONES[article.status] ?? "indigo",
      lane: article.action?.name ?? "Sans action",
      details: [
        { label: "Statut", value: article.status },
        { label: "Priorité", value: String(article.priority.priority) },
        { label: "Quantité", value: String(article.quantity) },
        ...(article.action
          ? [{ label: "Action", value: article.action.name }]
          : []),
        ...(article.price !== undefined
          ? [{ label: "Prix", value: `${article.price}` }]
          : []),
      ],
    }
  })
}
