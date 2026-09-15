import type { Article } from "@/api/interfaces/article.interface"
import { useActionStore } from "@/api/stores/action.store"
import { useArticleStore } from "@/api/stores/article.store"
import { useAuthStore } from "@/api/stores/auth.store"
import { PageHeader } from "@/components/page-header"
import Chart02 from "@/components/shadcn-space/radix/blocks/chart-02/chart"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn, fmtPrice } from "@/lib/utils"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { ArrowRight, ChartPie } from "lucide-react"
import { motion } from "motion/react"
import { useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"

function progressColor(pct: number) {
  if (pct <= 50) return "bg-accent-500"
  if (pct <= 75) return "bg-accent-400"
  return "bg-accent-2-600"
}

function progressFor(articles: Article[]) {
  const done = articles.filter((a) => a.status === "Bouclé").length
  const total = articles.length
  const pct = total ? (done * 100) / total : 0
  return { done, total, pct }
}

const STATUS_LEGEND: {
  key: Article["status"]
  label: string
  swatch: string
}[] = [
  { key: "En attente", label: "En attente", swatch: "bg-neutral-900" },
  { key: "En cours", label: "En cours", swatch: "bg-primary" },
  { key: "Bouclé", label: "Bouclé", swatch: "bg-accent-300" },
  { key: "Annulé", label: "Annulé", swatch: "bg-neutral-400" },
]

const Dashboard = () => {
  const navigate = useNavigate()
  const { articles, fetchArticlesByUser } = useArticleStore()
  const { actions, fetchActionsByUser } = useActionStore()
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    if (user) {
      fetchArticlesByUser(user.id)
      fetchActionsByUser(user.id)
    }
  }, [fetchArticlesByUser, fetchActionsByUser, user])

  const countByStatus = (status: Article["status"]) =>
    articles.filter((a) => a.status === status).length

  const live = articles.filter((a) => a.status !== "Annulé")
  const totalCost = live.reduce((s, a) => s + (a.price ?? 0), 0)
  const engaged = articles
    .filter((a) => a.status === "En cours" || a.status === "Bouclé")
    .reduce((s, a) => s + (a.price ?? 0), 0)
  const engagedPct = totalCost ? Math.round((engaged * 100) / totalCost) : 0

  const topPriority = useMemo(
    () =>
      articles
        .filter((a) => a.status !== "Bouclé")
        .sort((a, b) => a.priority.priority - b.priority.priority)
        .slice(0, 5),
    [articles]
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <PageHeader
        title="Tableau de bord"
        subtitle="Voici l'état de vos achats planifiés"
      />

      <div className="grid grid-cols-1 gap-4.5 xl:grid-cols-[minmax(0,1.5fr)_minmax(290px,1fr)]">
        <Chart02 articles={articles} className="block md:hidden" />
        <Card className="relative hidden min-h-90 overflow-hidden bg-surface p-6.5 md:block">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-heading text-[22px] leading-tight">
                Répartition des
                <br />
                articles par statut
              </h2>
              <p className="mt-2 text-[13px] text-neutral-700">
                {articles.length} articles suivis
              </p>
            </div>
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-neutral-900 text-neutral-100">
              <ChartPie className="size-4.5" strokeWidth={2.75} />
            </div>
          </div>

          <div className="pointer-events-none absolute right-6.5 bottom-5.5 h-54 w-79.5">
            <div className="absolute top-2 right-0 size-46.5 rounded-full bg-accent-300 opacity-95 blur-md" />
            <div className="absolute right-35 bottom-0 size-31.5 rounded-full bg-primary opacity-85 blur-md" />
            <div className="absolute top-0.5 right-47.5 size-24.5 rounded-full bg-neutral-900 opacity-90" />
            <div className="absolute bottom-0 left-0 size-18 rounded-full bg-neutral-400 opacity-90" />
            <div className="absolute top-6.5 right-51.5 w-17 text-center text-[13px] leading-tight font-bold text-neutral-100">
              {countByStatus("En attente")}
              <br />
              <span className="text-[11px] font-medium opacity-75">
                en attente
              </span>
            </div>
            <div className="absolute right-40.5 bottom-10 w-20 text-center text-[13px] leading-tight font-bold text-accent-900">
              {countByStatus("En cours")}
              <br />
              <span className="text-[11px] font-medium opacity-75">
                en cours
              </span>
            </div>
            <div className="absolute top-18.5 right-11.5 w-24 text-center text-[13px] leading-tight font-bold text-accent-800">
              {countByStatus("Bouclé")}
              <br />
              <span className="text-[11px] font-medium opacity-75">
                bouclés
              </span>
            </div>
            <div className="absolute bottom-3.5 left-2 w-14 text-center text-[13px] leading-tight font-bold text-neutral-900">
              {countByStatus("Annulé")}
              <br />
              <span className="text-[11px] font-medium opacity-75">
                annulés
              </span>
            </div>
          </div>

          <div className="absolute bottom-6.5 left-7 flex flex-col gap-2.5">
            {STATUS_LEGEND.map((s) => (
              <div
                key={s.key}
                className="flex items-center gap-2.5 text-[13px]"
              >
                <span className={cn("h-2.5 w-6.5 rounded-full", s.swatch)} />
                {s.label}
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col gap-4 bg-neutral-900 p-6 text-neutral-100">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-xl text-neutral-100">
              Articles prioritaires
            </h2>
            <span className="text-xs text-neutral-400">Top 5</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {topPriority.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-[18px] bg-neutral-100/7 px-3.5 py-2.75"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-neutral-900">
                  {a.priority.priority}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                  {a.name}
                </span>
                <span className="shrink-0 text-xs whitespace-nowrap text-neutral-400">
                  {format(a.estimateDate, "d MMM", { locale: fr })}
                </span>
              </div>
            ))}
            {topPriority.length === 0 && (
              <p className="py-6 text-center text-sm text-neutral-400">
                Aucun article pour l'instant.
              </p>
            )}
          </div>
          <Button
            variant="outline"
            className="mt-auto self-start border-neutral-100/28 bg-transparent text-neutral-100 hover:bg-neutral-100/12"
            onClick={() => navigate("/articles")}
          >
            Voir tous les articles
            <ArrowRight className="size-3.5" />
          </Button>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4.5 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1.4fr]">
        <Card className="p-6.5">
          <p className="text-sm text-neutral-700">Coût total planifié</p>
          <h3 className="mt-1.5 text-[30px] leading-tight">
            {fmtPrice(totalCost)}
          </h3>
          <div className="mt-3.5 flex items-center gap-2 text-xs text-accent-700">
            Somme des articles non annulés
          </div>
        </Card>

        <Card className="p-6.5">
          <p className="text-sm text-neutral-700">Budget engagé</p>
          <h3 className="mt-1.5 text-[30px] leading-tight">
            {fmtPrice(engaged)}
          </h3>
          <div className="mt-3.5 h-3 overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.max(engagedPct, 3)}%` }}
            />
          </div>
          <p className="mt-2.5 text-xs text-neutral-700">
            {engagedPct}% du coût total
          </p>
        </Card>

        <Card className="p-6.5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-[19px]">Avancement par action</h3>
            <button
              type="button"
              onClick={() => navigate("/actions")}
              className="cursor-pointer border-0 bg-transparent font-heading text-[13px] text-accent-700"
            >
              Tout voir
            </button>
          </div>
          <div className="flex flex-col gap-3.5">
            {actions.map((action) => {
              const p = progressFor(action.articles)
              return (
                <div key={action.id} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[13px] font-semibold">
                      {action.name}
                    </span>
                    <span className="text-xs text-neutral-700">
                      {p.done}/{p.total} · {p.pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-neutral-200">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        progressColor(p.pct)
                      )}
                      style={{ width: `${Math.max(p.pct, 2)}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {actions.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aucune action pour l'instant.
              </p>
            )}
          </div>
        </Card>
      </div>
    </motion.div>
  )
}

export default Dashboard
