import { describe, expect, it } from "vitest"
import {
  ACTION_STATUS,
  ARTICLE_STATUS,
  computeActionStatus,
  computeActionSync,
  computeActionSyncIfChanged,
  computeArticlesCost,
} from "./article-action-sync.cjs"

const article = (status, price) => ({ status, price })

describe("computeArticlesCost (Règle 1)", () => {
  it("sums the price of non-cancelled articles", () => {
    const articles = [
      article(ARTICLE_STATUS.EN_ATTENTE, 10),
      article(ARTICLE_STATUS.EN_COURS, 5),
      article(ARTICLE_STATUS.BOUCLE, 20),
    ]
    expect(computeArticlesCost(articles)).toBe(35)
  })

  it("treats articles with no price as 0", () => {
    const articles = [
      article(ARTICLE_STATUS.EN_ATTENTE, undefined),
      article(ARTICLE_STATUS.EN_COURS, null),
      article(ARTICLE_STATUS.BOUCLE, 20),
    ]
    expect(computeArticlesCost(articles)).toBe(20)
  })

  it("reflects adding an article with a price", () => {
    const before = [article(ARTICLE_STATUS.EN_ATTENTE, 10)]
    const after = [...before, article(ARTICLE_STATUS.EN_COURS, 15)]
    expect(computeArticlesCost(before)).toBe(10)
    expect(computeArticlesCost(after)).toBe(25)
  })

  it("reflects editing an article's price", () => {
    const before = [article(ARTICLE_STATUS.EN_ATTENTE, 10)]
    const after = [article(ARTICLE_STATUS.EN_ATTENTE, 40)]
    expect(computeArticlesCost(before)).toBe(10)
    expect(computeArticlesCost(after)).toBe(40)
  })

  it("reflects deleting an article (removed from the list)", () => {
    const before = [
      article(ARTICLE_STATUS.EN_ATTENTE, 10),
      article(ARTICLE_STATUS.EN_COURS, 15),
    ]
    const afterDelete = [article(ARTICLE_STATUS.EN_ATTENTE, 10)]
    expect(computeArticlesCost(before)).toBe(25)
    expect(computeArticlesCost(afterDelete)).toBe(10)
  })

  it("drops the price when an article is cancelled, and restores it on reactivation", () => {
    const active = [
      article(ARTICLE_STATUS.EN_COURS, 30),
      article(ARTICLE_STATUS.EN_ATTENTE, 10),
    ]
    expect(computeArticlesCost(active)).toBe(40)

    const cancelled = [
      article(ARTICLE_STATUS.ANNULE, 30),
      article(ARTICLE_STATUS.EN_ATTENTE, 10),
    ]
    expect(computeArticlesCost(cancelled)).toBe(10)

    const reactivated = [
      article(ARTICLE_STATUS.BOUCLE, 30),
      article(ARTICLE_STATUS.EN_ATTENTE, 10),
    ]
    expect(computeArticlesCost(reactivated)).toBe(40)
  })
})

describe("computeActionStatus (Règles 2-4)", () => {
  it("goes to 'En cours' when at least one article is 'En cours'", () => {
    const articles = [
      article(ARTICLE_STATUS.EN_ATTENTE),
      article(ARTICLE_STATUS.EN_COURS),
    ]
    expect(computeActionStatus(articles, ACTION_STATUS.EN_ATTENTE)).toBe(
      ACTION_STATUS.EN_COURS
    )
  })

  it("mix Bouclé + En attente -> 'En cours' (avancement partiel)", () => {
    const articles = [
      article(ARTICLE_STATUS.BOUCLE),
      article(ARTICLE_STATUS.EN_ATTENTE),
    ]
    expect(computeActionStatus(articles, ACTION_STATUS.EN_ATTENTE)).toBe(
      ACTION_STATUS.EN_COURS
    )
  })

  it("mix Bouclé + En cours -> 'En cours'", () => {
    const articles = [
      article(ARTICLE_STATUS.BOUCLE),
      article(ARTICLE_STATUS.EN_COURS),
    ]
    expect(computeActionStatus(articles, ACTION_STATUS.TERMINEE)).toBe(
      ACTION_STATUS.EN_COURS
    )
  })

  it("returns to 'En attente' once all non-cancelled articles are 'En attente'", () => {
    const articles = [
      article(ARTICLE_STATUS.EN_ATTENTE),
      article(ARTICLE_STATUS.EN_ATTENTE),
    ]
    expect(computeActionStatus(articles, ACTION_STATUS.EN_COURS)).toBe(
      ACTION_STATUS.EN_ATTENTE
    )
  })

  it("all non-cancelled 'Bouclé' -> 'Terminée'", () => {
    const articles = [article(ARTICLE_STATUS.BOUCLE), article(ARTICLE_STATUS.BOUCLE)]
    expect(computeActionStatus(articles, ACTION_STATUS.EN_COURS)).toBe(
      ACTION_STATUS.TERMINEE
    )
  })

  it("mix Bouclé + Annulé only -> 'Terminée' (cancelled articles ignored)", () => {
    const articles = [
      article(ARTICLE_STATUS.BOUCLE),
      article(ARTICLE_STATUS.ANNULE),
      article(ARTICLE_STATUS.ANNULE),
    ]
    expect(computeActionStatus(articles, ACTION_STATUS.EN_COURS)).toBe(
      ACTION_STATUS.TERMINEE
    )
  })

  it("reopening a 'Bouclé' article after closure drops the action back to the right status", () => {
    const closed = [article(ARTICLE_STATUS.BOUCLE), article(ARTICLE_STATUS.BOUCLE)]
    expect(computeActionStatus(closed, ACTION_STATUS.EN_COURS)).toBe(
      ACTION_STATUS.TERMINEE
    )

    const reopened = [article(ARTICLE_STATUS.EN_COURS), article(ARTICLE_STATUS.BOUCLE)]
    expect(computeActionStatus(reopened, ACTION_STATUS.TERMINEE)).toBe(
      ACTION_STATUS.EN_COURS
    )

    const reopenedToWaiting = [
      article(ARTICLE_STATUS.EN_ATTENTE),
      article(ARTICLE_STATUS.EN_ATTENTE),
    ]
    expect(computeActionStatus(reopenedToWaiting, ACTION_STATUS.TERMINEE)).toBe(
      ACTION_STATUS.EN_ATTENTE
    )
  })

  it("no articles at all -> keeps the current status unchanged", () => {
    expect(computeActionStatus([], ACTION_STATUS.EN_COURS)).toBe(
      ACTION_STATUS.EN_COURS
    )
    expect(computeActionStatus([], ACTION_STATUS.EN_ATTENTE)).toBe(
      ACTION_STATUS.EN_ATTENTE
    )
  })

  it("all articles cancelled -> keeps the current status unchanged", () => {
    const articles = [article(ARTICLE_STATUS.ANNULE), article(ARTICLE_STATUS.ANNULE)]
    expect(computeActionStatus(articles, ACTION_STATUS.EN_COURS)).toBe(
      ACTION_STATUS.EN_COURS
    )
    expect(computeActionStatus(articles, ACTION_STATUS.TERMINEE)).toBe(
      ACTION_STATUS.TERMINEE
    )
  })

  it("an action manually set to 'Annulée' is never overwritten by the sync", () => {
    const articles = [
      article(ARTICLE_STATUS.BOUCLE),
      article(ARTICLE_STATUS.BOUCLE),
    ]
    expect(computeActionStatus(articles, ACTION_STATUS.ANNULEE)).toBe(
      ACTION_STATUS.ANNULEE
    )

    const mixed = [
      article(ARTICLE_STATUS.EN_COURS),
      article(ARTICLE_STATUS.EN_ATTENTE),
    ]
    expect(computeActionStatus(mixed, ACTION_STATUS.ANNULEE)).toBe(
      ACTION_STATUS.ANNULEE
    )
  })
})

describe("computeActionSync (Règles 1-4 combinées)", () => {
  it("computes cost and status together", () => {
    const articles = [
      article(ARTICLE_STATUS.BOUCLE, 100),
      article(ARTICLE_STATUS.ANNULE, 50),
    ]
    expect(computeActionSync(articles, ACTION_STATUS.EN_COURS)).toEqual({
      cost: 100,
      status: ACTION_STATUS.TERMINEE,
    })
  })

  it("keeps recalculating cost even when the action is 'Annulée'", () => {
    const articles = [article(ARTICLE_STATUS.EN_COURS, 42)]
    expect(computeActionSync(articles, ACTION_STATUS.ANNULEE)).toEqual({
      cost: 42,
      status: ACTION_STATUS.ANNULEE,
    })
  })

  it("is idempotent: recomputing on an unchanged state changes nothing", () => {
    const articles = [
      article(ARTICLE_STATUS.EN_COURS, 10),
      article(ARTICLE_STATUS.BOUCLE, 5),
    ]
    const first = computeActionSync(articles, ACTION_STATUS.EN_ATTENTE)
    const second = computeActionSync(articles, first.status)
    expect(second).toEqual(first)
  })
})

describe("computeActionSyncIfChanged", () => {
  it("reports no change when cost and status already match", () => {
    const articles = [article(ARTICLE_STATUS.EN_COURS, 10)]
    const currentAction = { cost: 10, status: ACTION_STATUS.EN_COURS }
    expect(computeActionSyncIfChanged(currentAction, articles)).toEqual({
      changed: false,
      cost: 10,
      status: ACTION_STATUS.EN_COURS,
    })
  })

  it("reports a change when the cost drifted", () => {
    const articles = [article(ARTICLE_STATUS.EN_COURS, 25)]
    const currentAction = { cost: 10, status: ACTION_STATUS.EN_COURS }
    expect(computeActionSyncIfChanged(currentAction, articles)).toEqual({
      changed: true,
      cost: 25,
      status: ACTION_STATUS.EN_COURS,
    })
  })

  it("reports a change when the status drifted", () => {
    const articles = [
      article(ARTICLE_STATUS.BOUCLE, 10),
      article(ARTICLE_STATUS.BOUCLE, 5),
    ]
    const currentAction = { cost: 15, status: ACTION_STATUS.EN_COURS }
    expect(computeActionSyncIfChanged(currentAction, articles)).toEqual({
      changed: true,
      cost: 15,
      status: ACTION_STATUS.TERMINEE,
    })
  })
})
