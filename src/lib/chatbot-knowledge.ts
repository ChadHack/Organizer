import kb from "@/data/chatbot-knowledge-base.json"

/**
 * Moteur de réponse local pour l'assistant : recherche par recouvrement de
 * mots-clés (normalisés, sans accents/stopwords) dans la base de
 * connaissances JSON. Aucun appel réseau — tout tourne dans le navigateur.
 */

export interface ChatQuickReply {
  label: string
  /** Navigue vers cette route si présent. */
  route?: string
  /** Envoie ce texte comme nouveau message utilisateur si présent. */
  prompt?: string
}

export interface ChatAnswer {
  text: string
  quickReplies?: ChatQuickReply[]
  matched: boolean
}

interface NavItem {
  label: string
  route: string
  icon: string
  description: string
}

interface Workflow {
  goal: string
  steps: string[]
  alternative?: string
}

interface FaqEntry {
  question: string
  answer: string
}

interface Quirk {
  id: string
  description: string
  recommendation_for_users?: string
}

interface ScreenInfo {
  route?: string
  title?: string
  subtitle?: string
  purpose?: string
}

interface KnowledgeBase {
  navigation_menu: { items: NavItem[]; admin_only_item: NavItem }
  workflows: Workflow[]
  faq: FaqEntry[]
  glossary: Record<string, string>
  known_quirks_and_caveats: Quirk[]
  screens: Record<string, ScreenInfo>
}

const data = kb as unknown as KnowledgeBase

const STOPWORDS = new Set([
  "le", "la", "les", "un", "une", "des", "de", "du", "au", "aux", "et", "ou",
  "je", "tu", "il", "elle", "nous", "vous", "ils", "elles", "ce", "cet",
  "cette", "ces", "mon", "ma", "mes", "ton", "ta", "tes", "son", "sa", "ses",
  "notre", "nos", "votre", "vos", "leur", "leurs", "qui", "que", "quoi",
  "dont", "ou", "comment", "pourquoi", "quand", "quel", "quelle", "quels",
  "quelles", "combien", "est", "sont", "suis", "es", "sommes", "etes",
  "avoir", "ete", "etre", "dans", "sur", "pour", "par", "avec", "sans",
  "plus", "moins", "tres", "bien", "fait", "faire", "peut", "peux", "pouvez",
  "veux", "veut", "voudrais", "aimerais", "svp", "merci", "bonjour", "salut",
  "a", "l", "d", "j", "y", "en", "c", "s", "n", "m",
])

/** Racinisation minimale (pluriel -> singulier) pour rapprocher "articles"
 * de "article", "actions" de "action", etc. Se limite aux mots assez longs
 * pour éviter de mutiler de courts mots légitimes finissant par "s". */
function stem(word: string) {
  return word.length >= 5 && word.endsWith("s") ? word.slice(0, -1) : word
}

/** L'application (et sa documentation) utilise ces paires de façon
 * interchangeable ("achat" ~ "article", "projet" ~ "action") — sans cette
 * normalisation, une question posée avec l'un des deux termes ne
 * retrouverait pas les entrées écrites avec l'autre. */
const SYNONYMS: Record<string, string> = {
  achat: "article",
  commande: "article",
  produit: "article",
  projet: "action",
  regroupement: "action",
}

function canonicalize(word: string) {
  return SYNONYMS[word] ?? word
}

// Plage Unicode des diacritiques combinants (U+0300-U+036F), construite via
// charCode plutôt qu'écrite en toutes lettres dans le code source pour
// éviter tout risque de mauvais encodage des caractères combinants bruts.
const DIACRITICS = new RegExp(
  "[" + String.fromCharCode(0x0300) + "-" + String.fromCharCode(0x036f) + "]",
  "g"
)

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
}

function tokenize(text: string) {
  return normalize(text)
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t))
    .map(stem)
    .map(canonicalize)
}

interface IndexEntry {
  tokens: string[]
  raw: string
  answer: string
}

function buildEntries(): IndexEntry[] {
  const entries: IndexEntry[] = []

  for (const { question, answer } of data.faq) {
    entries.push({ tokens: tokenize(question), raw: normalize(question), answer })
  }

  for (const wf of data.workflows) {
    const answer = [
      `Voici comment « ${wf.goal} » :`,
      ...wf.steps.map((s, i) => `${i + 1}. ${s}`),
      ...(wf.alternative ? [wf.alternative] : []),
    ].join("\n")
    entries.push({
      tokens: tokenize(`comment ${wf.goal}`),
      raw: normalize(wf.goal),
      answer,
    })
  }

  const navItems = [...data.navigation_menu.items, data.navigation_menu.admin_only_item]
  for (const item of navItems) {
    entries.push({
      tokens: tokenize(`ou trouver menu ${item.label} ${item.description}`),
      raw: normalize(`${item.label} ${item.description}`),
      answer: `« ${item.label} » se trouve dans le menu de navigation (${item.route}). ${item.description}`,
    })
  }

  for (const screen of Object.values(data.screens)) {
    if (!screen.route || !screen.title) continue
    entries.push({
      tokens: tokenize(`${screen.title} ${screen.subtitle ?? ""} ${screen.purpose ?? ""}`),
      raw: normalize(`${screen.title} ${screen.purpose ?? ""}`),
      answer: `« ${screen.title} » (${screen.route}) — ${screen.purpose ?? screen.subtitle ?? ""}`,
    })
  }

  for (const [term, def] of Object.entries(data.glossary)) {
    entries.push({
      tokens: tokenize(`${term} definition signification ${def}`),
      raw: normalize(`${term} ${def}`),
      answer: `${term} : ${def}`,
    })
  }

  for (const quirk of data.known_quirks_and_caveats) {
    entries.push({
      tokens: tokenize(`${quirk.id.replace(/-/g, " ")} ${quirk.description}`),
      raw: normalize(quirk.description),
      answer: [quirk.description, quirk.recommendation_for_users].filter(Boolean).join(" "),
    })
  }

  return entries
}

const ENTRIES = buildEntries()

// Pondération TF-IDF légère : un mot présent dans beaucoup d'entrées (ex.
// "article", très fréquent) compte moins qu'un mot rare et distinctif (ex.
// "kanban", "excel") — évite qu'une question tombe sur la mauvaise réponse
// simplement parce qu'un mot très courant est partagé.
const DOC_FREQUENCY = new Map<string, number>()
for (const entry of ENTRIES) {
  for (const token of new Set(entry.tokens)) {
    DOC_FREQUENCY.set(token, (DOC_FREQUENCY.get(token) ?? 0) + 1)
  }
}
const ENTRY_COUNT = ENTRIES.length

function idf(token: string) {
  const df = DOC_FREQUENCY.get(token) ?? 0
  return Math.log((ENTRY_COUNT + 1) / (df + 1)) + 1
}

const ROUTE_PATTERN = /\/(dashboard|actions|articles|mise_en_oeuvre|planification|utilisateurs)\b/

function extractQuickReply(text: string): ChatQuickReply | undefined {
  const match = text.match(ROUTE_PATTERN)
  if (!match) return undefined
  const route = match[0]
  const item = data.navigation_menu.items.find((i) => i.route === route)
  return { label: `Aller à « ${item?.label ?? route} »`, route }
}

function scoreEntry(queryTokens: string[], queryRaw: string, entry: IndexEntry) {
  let score = 0
  const entryTokenSet = new Set(entry.tokens)
  for (const qt of queryTokens) {
    if (entryTokenSet.has(qt)) {
      score += idf(qt)
    } else if (entry.tokens.some((t) => t.length >= 4 && (t.includes(qt) || qt.includes(t)))) {
      score += idf(qt) * 0.4
    }
  }
  if (queryRaw.length > 3 && entry.raw.includes(queryRaw)) score += 6
  return score
}

const FALLBACK_SUGGESTIONS: ChatQuickReply[] = [
  { label: "Ajouter un article", prompt: "Où puis-je ajouter un nouvel achat ?" },
  { label: "Changer un statut", prompt: "Comment changer le statut d'un article ?" },
  { label: "Exporter mes données", prompt: "Comment exporter la liste des articles ?" },
]

export function answerQuestion(query: string): ChatAnswer {
  const queryTokens = tokenize(query)
  const queryRaw = normalize(query).trim()

  if (queryTokens.length === 0) {
    return {
      text: "Pouvez-vous préciser votre question ? Vous pouvez me demander comment ajouter un article, changer un statut, exporter vos données, etc.",
      matched: false,
      quickReplies: FALLBACK_SUGGESTIONS,
    }
  }

  let best: IndexEntry | null = null
  let bestScore = 0
  for (const entry of ENTRIES) {
    const s = scoreEntry(queryTokens, queryRaw, entry)
    if (s > bestScore) {
      bestScore = s
      best = entry
    }
  }

  // Score minimal absolu (une seule correspondance faible ne suffit pas) et
  // relatif au potentiel maximal de la requête (la meilleure entrée doit
  // couvrir une bonne part des mots posés, pas juste un mot au hasard).
  const maxPossible = queryTokens.reduce((sum, t) => sum + idf(t), 0)
  const isConfident = bestScore >= 3 && bestScore >= maxPossible * 0.5

  if (!best || !isConfident) {
    return {
      text: "Je n'ai pas de réponse précise pour cette question dans Organizer. Essayez de reformuler, ou choisissez une suggestion ci-dessous — je connais la navigation, les statuts, les priorités, l'export et la gestion des utilisateurs.",
      matched: false,
      quickReplies: FALLBACK_SUGGESTIONS,
    }
  }

  const quickReply = extractQuickReply(best.answer)
  return { text: best.answer, matched: true, quickReplies: quickReply ? [quickReply] : undefined }
}

export function greetingByTime(date: Date = new Date()): string {
  const h = date.getHours()
  return h >= 5 && h < 18 ? "Bonjour" : "Bonsoir"
}

export function navigationQuickReplies(): ChatQuickReply[] {
  return data.navigation_menu.items.map((item) => ({
    label: `${item.label} (${item.route})`,
    route: item.route,
  }))
}

export function faqQuickReplies(limit = 6): ChatQuickReply[] {
  return data.faq.slice(0, limit).map((f) => ({ label: f.question, prompt: f.question }))
}

export function glossaryText(): string {
  return Object.entries(data.glossary)
    .map(([term, def]) => `• ${term} : ${def}`)
    .join("\n")
}

export function randomTip(): string {
  const tips = data.known_quirks_and_caveats.filter((q) => q.recommendation_for_users)
  const pick = tips[Math.floor(Math.random() * tips.length)]
  return pick ? `💡 Astuce : ${pick.recommendation_for_users}` : "Je n'ai pas d'astuce à partager pour l'instant."
}
