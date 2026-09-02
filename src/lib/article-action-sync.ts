/**
 * Pure business logic for syncing an action's `cost` and `status` from its
 * articles (Règles 1-4). No backend dependency here on purpose — this is
 * the reference the Postgres trigger `sync_action_from_articles` (see
 * supabase/schema.sql) must replicate exactly.
 */

export const ARTICLE_STATUS = {
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  BOUCLE: "Bouclé",
  ANNULE: "Annulé",
} as const

export const ACTION_STATUS = {
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
  ANNULEE: "Annulée",
} as const

export interface SyncArticle {
  status: string
  price?: number | null
}

/**
 * Règle 1 — somme des `price` des articles dont le statut n'est pas
 * "Annulé" (les articles sans price comptent pour 0).
 */
export function computeArticlesCost(articles: SyncArticle[]): number {
  return articles.reduce((total, article) => {
    if (article.status === ARTICLE_STATUS.ANNULE) return total
    return total + (article.price || 0)
  }, 0)
}

/**
 * Règles 2-4 — statut dérivé de l'action, en ignorant les articles "Annulé".
 * Le statut "Annulée" de l'action n'est jamais écrasé (posé manuellement),
 * et si l'action n'a aucun article exploitable (aucun, ou tous "Annulé"),
 * son statut actuel est conservé tel quel.
 */
export function computeActionStatus(
  articles: { status: string }[],
  currentStatus: string
): string {
  if (currentStatus === ACTION_STATUS.ANNULEE) return currentStatus

  const active = articles.filter(
    (article) => article.status !== ARTICLE_STATUS.ANNULE
  )
  if (active.length === 0) return currentStatus

  const allBoucle = active.every(
    (article) => article.status === ARTICLE_STATUS.BOUCLE
  )
  if (allBoucle) return ACTION_STATUS.TERMINEE

  const hasProgress = active.some(
    (article) =>
      article.status === ARTICLE_STATUS.EN_COURS ||
      article.status === ARTICLE_STATUS.BOUCLE
  )
  if (hasProgress) return ACTION_STATUS.EN_COURS

  return ACTION_STATUS.EN_ATTENTE
}

/**
 * Combine les règles 1-4 : à appeler avec l'état courant de TOUS les
 * articles rattachés à l'action (après l'opération qui a déclenché le
 * recalcul), et le statut actuel de l'action.
 */
export function computeActionSync(
  articles: SyncArticle[],
  currentStatus: string
): { cost: number; status: string } {
  return {
    cost: computeArticlesCost(articles),
    status: computeActionStatus(articles, currentStatus),
  }
}

/**
 * Comme computeActionSync, mais compare le résultat à l'état actuel de
 * l'action pour permettre un appel idempotent : si rien ne change, `changed`
 * vaut false et l'appelant peut sauter l'écriture en base.
 */
export function computeActionSyncIfChanged(
  currentAction: { cost: number | null; status: string },
  articles: SyncArticle[]
): { changed: boolean; cost: number; status: string } {
  const { cost, status } = computeActionSync(articles, currentAction.status)
  const changed = currentAction.cost !== cost || currentAction.status !== status
  return { changed, cost, status }
}
