import { describe, expect, it } from "vitest"
import { answerQuestion, faqQuickReplies, glossaryText, navigationQuickReplies } from "./chatbot-knowledge"

describe("answerQuestion", () => {
  it("finds the right FAQ answer for a paraphrased question about adding an article", () => {
    const { text, matched, quickReplies } = answerQuestion("comment je fais pour ajouter un article ?")
    expect(matched).toBe(true)
    expect(text.toLowerCase()).toContain("nouvel article")
    expect(quickReplies?.[0].route).toBe("/articles")
  })

  it("finds the workflow answer for changing an article's status", () => {
    const { text, matched } = answerQuestion("comment changer le statut d'un article")
    expect(matched).toBe(true)
    expect(text.toLowerCase()).toContain("kanban")
  })

  it("is accent- and case-insensitive", () => {
    const a = answerQuestion("COMMENT EXPORTER MES ARTICLES")
    const b = answerQuestion("comment exporter mes articles")
    expect(a.matched).toBe(true)
    expect(a.text).toBe(b.text)
  })

  it("falls back gracefully on an unrelated question", () => {
    const { matched, quickReplies } = answerQuestion("quelle est la météo à Paris ?")
    expect(matched).toBe(false)
    expect(quickReplies?.length).toBeGreaterThan(0)
  })

  it("handles an empty query without throwing", () => {
    const { matched } = answerQuestion("   ")
    expect(matched).toBe(false)
  })
})

describe("navigationQuickReplies", () => {
  it("exposes every route from the app's nav menu", () => {
    const routes = navigationQuickReplies().map((r) => r.route)
    expect(routes).toEqual(
      expect.arrayContaining(["/dashboard", "/actions", "/articles", "/mise_en_oeuvre", "/planification"])
    )
  })
})

describe("faqQuickReplies / glossaryText", () => {
  it("returns a non-empty, bounded list of FAQ prompts", () => {
    const replies = faqQuickReplies(3)
    expect(replies).toHaveLength(3)
    expect(replies[0].prompt).toBeTruthy()
  })

  it("renders the glossary as readable text", () => {
    expect(glossaryText()).toContain("Article")
  })
})
