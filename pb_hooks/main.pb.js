/// <reference path="../pb_data/types.d.ts" />

/**
 * Garde les champs `cost` et `status` de la collection "actions" synchronisés
 * avec leurs articles (Règles 1-4, voir pb_hooks/lib/article-action-sync.cjs).
 *
 * Se déclenche uniquement via les hooks *AfterSuccess sur "articles" —
 * jamais manuellement. Ces hooks s'exécutent dans la même transaction que
 * l'opération sur l'article (e.app y est l'instance transactionnelle), donc
 * la mise à jour de l'action est atomique avec l'écriture de l'article.
 *
 * Important : le callback passé à onRecordAfter*Success est ré-exécuté par
 * PocketBase dans un scope isolé qui ne voit pas les autres déclarations de
 * fonctions top-level de ce fichier ("X is not defined" sinon) — chaque
 * handler doit donc être entièrement autonome (require() + logique inline).
 */

/** @param {any} e */
function handleArticleChange(e) {
  const {
    computeActionSyncIfChanged,
  } = require(`${__hooks}/lib/article-action-sync.cjs`)

  /** Fonction centrale unique de synchronisation, appelée après chaque
   * opération sur un article — jamais dupliquée par endpoint. Idempotente :
   * si le cost/status recalculés sont déjà ceux en base, aucune écriture.
   * @param {string} [actionId] */
  function syncActionFromArticles(actionId) {
    if (!actionId) return

    const action = e.app.findRecordById("actions", actionId)

    const articles = e.app
      .findRecordsByFilter("articles", "action = {:actionId}", "", 0, 0, {
        actionId,
      })
      .map((record) => ({
        status: record.get("status"),
        price: record.get("price"),
      }))

    const currentAction = {
      cost: action.get("cost"),
      status: action.get("status"),
    }
    const { changed, cost, status } = computeActionSyncIfChanged(
      currentAction,
      articles
    )
    if (!changed) return

    action.set("cost", cost)
    action.set("status", status)
    e.app.save(action)
  }

  const actionIds = new Set()
  const current = e.record.get("action")
  if (current) actionIds.add(current)

  // Sur une mise à jour, l'article peut avoir changé d'action : l'ancienne
  // action doit aussi être recalculée (elle a perdu cet article).
  const original = e.record.original && e.record.original()
  if (original) {
    const previous = original.get("action")
    if (previous) actionIds.add(previous)
  }

  actionIds.forEach((id) => syncActionFromArticles(id))

  e.next()
}

onRecordAfterCreateSuccess(handleArticleChange, "articles")
onRecordAfterUpdateSuccess(handleArticleChange, "articles")
onRecordAfterDeleteSuccess(handleArticleChange, "articles")
