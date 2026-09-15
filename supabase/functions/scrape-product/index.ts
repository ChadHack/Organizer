// Edge Function "scrape-product" — récupère les métadonnées d'une page
// produit (nom, image, prix, devise, marchand) côté serveur, car le CORS
// des sites marchands interdit ce fetch depuis le navigateur.
//
// Déploiement : supabase functions deploy scrape-product --no-verify-jwt=false
// (JWT vérifié : seuls les utilisateurs connectés de l'app peuvent l'appeler.)
//
// Stratégie d'extraction, par ordre de fiabilité :
//   1. JSON-LD schema.org/Product (name, image, offers.price/priceCurrency)
//   2. Balises Open Graph / product:* (og:title, og:image, product:price:amount…)
//   3. <title> de la page en dernier recours
// Le tout par expressions régulières — pas de DOM complet nécessaire pour
// des balises <meta> et des blocs <script type="application/ld+json">.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const FETCH_TIMEOUT_MS = 12_000

// User-Agent de navigateur classique : beaucoup de sites e-commerce
// renvoient une page vide ou un blocage aux UA inconnus.
const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
}

interface ScrapeResult {
  name: string | null
  image: string | null
  price: number | null
  currency: string | null
  merchant: string
  url: string
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim()
}

/** Lit le content d'une balise <meta property=... | name=...>, dans les
 * deux ordres d'attributs (property avant/après content). */
function metaContent(html: string, key: string): string | null {
  const k = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${k}["'][^>]*content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${k}["']`,
      "i"
    ),
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m?.[1]) return decodeEntities(m[1])
  }
  return null
}

function parsePrice(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw
  if (typeof raw !== "string") return null
  // "1 299,99", "1,299.99", "1299.99" → nombre. On retire les espaces
  // (y compris insécables) puis on tranche sur le dernier séparateur.
  const cleaned = raw.replace(/[\s\u00a0\u202f]/g, "").replace(/[^\d.,-]/g, "")
  if (!cleaned) return null
  const lastComma = cleaned.lastIndexOf(",")
  const lastDot = cleaned.lastIndexOf(".")
  let normalized = cleaned
  if (lastComma > lastDot) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".")
  } else {
    normalized = cleaned.replace(/,/g, "")
  }
  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}

/** Cherche un objet schema.org Product (éventuellement imbriqué dans
 * @graph ou un tableau) dans les blocs JSON-LD de la page. */
function findProduct(node: unknown): Record<string, unknown> | null {
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findProduct(item)
      if (found) return found
    }
    return null
  }
  if (node && typeof node === "object") {
    const obj = node as Record<string, unknown>
    const type = obj["@type"]
    const types = Array.isArray(type) ? type : [type]
    if (types.some((t) => typeof t === "string" && /product/i.test(t))) {
      return obj
    }
    if (obj["@graph"]) return findProduct(obj["@graph"])
  }
  return null
}

function fromJsonLd(html: string): Partial<ScrapeResult> {
  const blocks = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )
  for (const [, raw] of blocks) {
    let parsed: unknown
    try {
      parsed = JSON.parse(raw.trim())
    } catch {
      continue
    }
    const product = findProduct(parsed)
    if (!product) continue

    const offersRaw = product.offers
    const offers = (
      Array.isArray(offersRaw) ? offersRaw[0] : offersRaw
    ) as Record<string, unknown> | undefined

    const imageRaw = product.image
    const image = Array.isArray(imageRaw)
      ? imageRaw[0]
      : typeof imageRaw === "object" && imageRaw !== null
        ? (imageRaw as Record<string, unknown>).url
        : imageRaw

    return {
      name: typeof product.name === "string" ? product.name : null,
      image: typeof image === "string" ? image : null,
      price: parsePrice(offers?.price ?? offers?.lowPrice),
      currency:
        typeof offers?.priceCurrency === "string"
          ? offers.priceCurrency
          : null,
    }
  }
  return {}
}

function fromMetaTags(html: string): Partial<ScrapeResult> {
  const name = metaContent(html, "og:title") ?? metaContent(html, "twitter:title")
  const image =
    metaContent(html, "og:image") ??
    metaContent(html, "og:image:url") ??
    metaContent(html, "twitter:image")
  const price = parsePrice(
    metaContent(html, "product:price:amount") ??
      metaContent(html, "og:price:amount") ??
      metaContent(html, "twitter:data1")
  )
  const currency =
    metaContent(html, "product:price:currency") ??
    metaContent(html, "og:price:currency")
  return { name, image, price, currency }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS })
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    })

  try {
    const { url } = (await req.json()) as { url?: string }
    if (!url) return json({ error: "Le champ 'url' est requis" }, 400)

    let target: URL
    try {
      target = new URL(url)
    } catch {
      return json({ error: "URL invalide" }, 400)
    }
    if (!["http:", "https:"].includes(target.protocol)) {
      return json({ error: "Seuls http/https sont autorisés" }, 400)
    }

    const merchant = target.hostname.replace(/^www\./, "")

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    let html = ""
    try {
      const res = await fetch(target.href, {
        headers: BROWSER_HEADERS,
        signal: controller.signal,
        redirect: "follow",
      })
      // Même sur un statut d'erreur, certains sites renvoient une page
      // exploitable ; on tente la lecture, plafonnée à 2 Mo.
      html = (await res.text()).slice(0, 2_000_000)
    } finally {
      clearTimeout(timeout)
    }

    const ld = fromJsonLd(html)
    const meta = fromMetaTags(html)
    const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]

    const result: ScrapeResult = {
      name:
        ld.name ??
        meta.name ??
        (titleTag ? decodeEntities(titleTag) : null),
      image: ld.image ?? meta.image ?? null,
      price: ld.price ?? meta.price ?? null,
      currency: ld.currency ?? meta.currency ?? null,
      merchant: metaContent(html, "og:site_name") ?? merchant,
      url: target.href,
    }

    return json(result)
  } catch (err) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "Le site n'a pas répondu à temps"
        : err instanceof Error
          ? err.message
          : "Erreur inconnue"
    return json({ error: message }, 502)
  }
})
