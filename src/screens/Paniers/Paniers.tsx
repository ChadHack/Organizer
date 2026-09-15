import type { CartItem } from "@/api/interfaces/cart-item.interface"
import { useCartStore } from "@/api/stores/cart.store"
import { PageHeader } from "@/components/page-header"
import { RippleSpinner } from "@/components/shadcn-space/radix/spinner/spinner-09"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { EmptyStateIllustration } from "@/components/ui/empty-state-illustration"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import groupBy from "lodash/groupBy"
import {
  ExternalLink,
  ImageOff,
  MoreVertical,
  Plus,
  RefreshCw,
  Store,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { CART_STATUS_CONFIG, CART_STATUSES } from "./cart-status"
import NewCartItem from "./actions/new-cart-item"

const fmtAmount = (n: number, currency: string) =>
  `${n.toLocaleString("fr-FR")} ${currency}`

/** Extrait la première URL http(s) d'un texte partagé : selon l'app
 * mobile d'origine, le lien arrive dans le paramètre `url` ou noyé dans
 * `text` (comportement Android courant du Web Share Target). */
function extractSharedUrl(params: URLSearchParams): string | null {
  const direct = params.get("url")
  if (direct && /^https?:\/\//.test(direct)) return direct
  const candidates = [params.get("text"), params.get("title")]
  for (const value of candidates) {
    const match = value?.match(/https?:\/\/\S+/)
    if (match) return match[0]
  }
  return null
}

/** Variation entre les deux derniers points d'historique de prix. */
function priceTrend(item: CartItem): { delta: number; previous: number } | null {
  if (item.prices.length < 2) return null
  const [last, previous] = item.prices
  if (last.price === previous.price) return null
  return { delta: last.price - previous.price, previous: previous.price }
}

function CartItemCard({ item }: { item: CartItem }) {
  const updateCartItem = useCartStore((s) => s.updateCartItem)
  const deleteCartItem = useCartStore((s) => s.deleteCartItem)
  const refreshPrice = useCartStore((s) => s.refreshPrice)
  const [refreshing, setRefreshing] = useState(false)

  const status = CART_STATUS_CONFIG[item.status]
  const trend = priceTrend(item)

  const handleStatus = async (value: CartItem["status"]) => {
    try {
      await updateCartItem(item.id, { status: value })
    } catch (error) {
      toast.error("Impossible de changer le statut", {
        description:
          error instanceof Error ? error.message : "Veuillez réessayer",
      })
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const updated = await refreshPrice(item.id)
      toast.success("Prix actualisé", {
        description:
          updated.price !== undefined
            ? fmtAmount(updated.price, updated.currency)
            : undefined,
      })
    } catch (error) {
      toast.error("Actualisation impossible", {
        description:
          error instanceof Error ? error.message : "Veuillez réessayer",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteCartItem(item.id)
      toast.success("Article retiré du panier")
    } catch (error) {
      toast.error("Suppression impossible", {
        description:
          error instanceof Error ? error.message : "Veuillez réessayer",
      })
    }
  }

  return (
    <div className="flex gap-3 rounded-xl border border-border bg-card p-3">
      {item.image ? (
        <img
          src={item.image}
          alt=""
          loading="lazy"
          className="size-20 shrink-0 rounded-lg border border-border object-cover"
        />
      ) : (
        <div className="flex size-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground">
          <ImageOff className="size-5" />
        </div>
      )}

      <div className="flex min-w-0 grow flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="line-clamp-2 text-sm font-medium text-foreground hover:underline"
            title={item.name}
          >
            {item.name}
          </a>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 text-muted-foreground"
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <a href={item.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" /> Ouvrir la page produit
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw
                  className={cn("size-4", refreshing && "animate-spin")}
                />
                Actualiser le prix
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {CART_STATUSES.filter((s) => s !== item.status).map((s) => {
                const Icon = CART_STATUS_CONFIG[s].icon
                return (
                  <DropdownMenuItem key={s} onClick={() => handleStatus(s)}>
                    <Icon className="size-4" /> Marquer « {s} »
                  </DropdownMenuItem>
                )
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleDelete}>
                <Trash2 className="size-4" /> Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge className={cn("gap-1 border-none", status.badgeClassName)}>
            <status.icon className="size-3" /> {item.status}
          </Badge>
          {item.quantity > 1 && (
            <span className="text-xs text-muted-foreground">
              × {item.quantity}
            </span>
          )}
        </div>

        <div className="mt-auto flex flex-wrap items-baseline gap-2">
          {item.price !== undefined ? (
            <span className="text-sm font-semibold text-foreground">
              {fmtAmount(item.price, item.currency)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              Prix non renseigné
            </span>
          )}
          {trend && (
            <span
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                trend.delta < 0 ? "text-accent-2-600" : "text-red-500"
              )}
              title={`Prix précédent : ${fmtAmount(trend.previous, item.currency)}`}
            >
              {trend.delta < 0 ? (
                <TrendingDown className="size-3.5" />
              ) : (
                <TrendingUp className="size-3.5" />
              )}
              {trend.delta > 0 ? "+" : ""}
              {trend.delta.toLocaleString("fr-FR")}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

const Paniers = () => {
  const { cartItems, loading, error, fetchCartItems } = useCartStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [statusFilter, setStatusFilter] = useState<string>("Tous")
  const [search, setSearch] = useState("")
  // Réception Web Share Target : « Partager → Organizer » depuis une app
  // mobile (Amazon, AliExpress…) provoque une navigation complète vers
  // /paniers?url=… — l'URL partagée est donc capturée au montage
  // (initialisation paresseuse), puis les paramètres sont nettoyés.
  const [sharedUrl, setSharedUrl] = useState<string | undefined>(
    () => extractSharedUrl(searchParams) ?? undefined
  )
  const [newOpen, setNewOpen] = useState(() =>
    Boolean(extractSharedUrl(searchParams))
  )

  useEffect(() => {
    fetchCartItems()
  }, [fetchCartItems])

  useEffect(() => {
    if (extractSharedUrl(searchParams)) setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return cartItems.filter((item) => {
      if (statusFilter !== "Tous" && item.status !== statusFilter) return false
      if (!q) return true
      return (
        item.name.toLowerCase().includes(q) ||
        item.merchant.toLowerCase().includes(q)
      )
    })
  }, [cartItems, statusFilter, search])

  const byMerchant = useMemo(
    () =>
      Object.entries(groupBy(filtered, (item) => item.merchant)).sort(
        ([a], [b]) => a.localeCompare(b)
      ),
    [filtered]
  )

  /** Total « À acheter » d'un groupe, par devise (prix × quantité). */
  const merchantTotals = (items: CartItem[]) => {
    const totals = new Map<string, number>()
    for (const item of items) {
      if (item.status !== "À acheter" || item.price === undefined) continue
      totals.set(
        item.currency,
        (totals.get(item.currency) ?? 0) + item.price * item.quantity
      )
    }
    return [...totals.entries()]
  }

  const hasActiveFilters = statusFilter !== "Tous" || search.trim() !== ""

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Paniers"
        subtitle="Vos paniers d'achat en ligne, regroupés par marchand"
        action={
          <Button className="gap-2" onClick={() => setNewOpen(true)}>
            <Plus className="size-4" /> Ajouter
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="Tous">Tous</TabsTrigger>
            {CART_STATUSES.map((s) => (
              <TabsTrigger key={s} value={s}>
                {s}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative w-full max-w-xs">
          <Input
            placeholder="Rechercher un produit ou un marchand…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pe-8 text-sm"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <RippleSpinner size="lg" className="text-muted-foreground" />
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {!loading && !error && byMerchant.length === 0 && (
        <Empty className="gap-4 border-none p-0">
          <EmptyHeader className="gap-4">
            <EmptyMedia variant="default" className="mb-0">
              <EmptyStateIllustration />
            </EmptyMedia>
            <div className="flex flex-col items-center gap-0.5">
              <EmptyTitle className="text-lg font-medium text-destructive">
                Vide
              </EmptyTitle>
              <EmptyDescription className="text-center">
                {hasActiveFilters
                  ? "Aucun article ne correspond aux filtres sélectionnés."
                  : "Aucun panier pour le moment. Collez le lien d'un produit pour commencer."}
              </EmptyDescription>
            </div>
          </EmptyHeader>
        </Empty>
      )}

      {!loading && !error && (
        <div className="flex flex-col gap-5">
          {byMerchant.map(([merchant, items]) => (
            <Card key={merchant}>
              <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Store className="size-4 text-muted-foreground" />
                    {merchant}
                  </CardTitle>
                  <CardDescription>
                    {items.length} article{items.length > 1 ? "s" : ""}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  {merchantTotals(items).map(([currency, total]) => (
                    <span
                      key={currency}
                      className="text-sm font-semibold text-foreground"
                    >
                      {fmtAmount(total, currency)}
                    </span>
                  ))}
                  {merchantTotals(items).length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      à acheter
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <CartItemCard key={item.id} item={item} />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <NewCartItem
        open={newOpen}
        setOpen={(v) => {
          setNewOpen(v)
          if (!v) setSharedUrl(undefined)
        }}
        initialUrl={sharedUrl}
      />
    </div>
  )
}

export default Paniers
