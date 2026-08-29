/**
 * Pure business logic for syncing an action's `cost` and `status` from its
 * articles (Règles 1-4). No PocketBase dependency here on purpose, so this
 * file can be unit tested with a plain JS test runner and required as-is
 * from the PocketBase JSVM hook (pb_hooks/main.pb.js).
 */

const ARTICLE_STATUS = {
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  BOUCLE: "Bouclé",
  ANNULE: "Annulé",
}

const ACTION_STATUS = {
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
  ANNULEE: "Annulée",
}

/**
 * Règle 1 — somme des `price` des articles dont le statut n'est pas
 * "Annulé" (les articles sans price comptent pour 0).
 * @param {{ status: string, price?: number|null }[]} articles
 */
function computeArticlesCost(articles) {
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
 * @param {{ status: string }[]} articles
 * @param {string} currentStatus
 */
function computeActionStatus(articles, currentStatus) {
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
 * @param {{ status: string, price?: number|null }[]} articles
 * @param {string} currentStatus
 * @returns {{ cost: number, status: string }}
 */
function computeActionSync(articles, currentStatus) {
  return {
    cost: computeArticlesCost(articles),
    status: computeActionStatus(articles, currentStatus),
  }
}

/**
 * Comme computeActionSync, mais compare le résultat à l'état actuel de
 * l'action pour permettre un appel idempotent : si rien ne change, `changed`
 * vaut false et l'appelant peut sauter l'écriture en base.
 * @param {{ cost: number|null, status: string }} currentAction
 * @param {{ status: string, price?: number|null }[]} articles
 * @returns {{ changed: boolean, cost: number, status: string }}
 */
function computeActionSyncIfChanged(currentAction, articles) {
  const { cost, status } = computeActionSync(articles, currentAction.status)
  const changed = currentAction.cost !== cost || currentAction.status !== status
  return { changed, cost, status }
}

module.exports = {
  ARTICLE_STATUS,
  ACTION_STATUS,
  computeArticlesCost,
  computeActionStatus,
  computeActionSync,
  computeActionSyncIfChanged,
}
