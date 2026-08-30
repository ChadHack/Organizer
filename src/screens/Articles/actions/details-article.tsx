import { useArticleStore } from "@/api/stores/article.store"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { fmtPrice } from "@/lib/utils"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  ArrowLeft,
  CalendarDays,
  Crosshair,
  Edit,
  ExternalLink,
  Flag,
  Layers,
  Package,
  Tag,
  Trash,
} from "lucide-react"
import { motion } from "motion/react"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { getArticleActionGroups } from "../article-actions"
import { ARTICLE_STATUS_CONFIG } from "../article-status"
import UpdateArticle from "./update-article"
import { UpdatePriority } from "./update-priority"

function DetailsSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-14 w-full rounded-xl" />
      <Card className="overflow-hidden p-0">
        <Skeleton className="h-64 w-full rounded-none" />
        <CardContent className="flex flex-col gap-4 p-6">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-7 w-2/5" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </CardContent>
      </Card>
    </div>
  )
}

const ArticleDetails = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { articles, loading, fetchArticles } = useArticleStore()
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [showPriorityDialog, setShowPriorityDialog] = useState(false)

  useEffect(() => {
    if (articles.length === 0) fetchArticles()
  }, [articles.length, fetchArticles])

  const article = articles.find((a) => a.id === id)

  if (loading && !article) {
    return <DetailsSkeleton />
  }

  if (!article) {
    return (
      <Empty className="min-h-[60vh]">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Package />
          </EmptyMedia>
          <EmptyTitle>Article introuvable</EmptyTitle>
          <EmptyDescription>
            Cet article n'existe pas ou a été supprimé.
          </EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" onClick={() => navigate("/articles")}>
          <ArrowLeft className="size-4" />
          Retour aux articles
        </Button>
      </Empty>
    )
  }

  const { icon: StatusIcon, badgeClassName } =
    ARTICLE_STATUS_CONFIG[article.status]
  const month = format(article.estimateDate, "MMM", {
    locale: fr,
  }).toUpperCase()
  const day = format(article.estimateDate, "d", { locale: fr })
  const deleteAction = getArticleActionGroups(
    article,
    navigate,
    () => {},
    () => setShowUpdateDialog(true)
  )
    .flatMap((g) => g.actions)
    .find((a) => a.key === "delete")

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <header className="flex flex-wrap items-start justify-between gap-4 px-1">
        <h1 className="truncate font-heading text-[28px] leading-tight">
          {article.name}
        </h1>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" onClick={() => setShowUpdateDialog(true)}>
            <Edit className="size-4" />
            <span className="hidden md:flex">Modifier</span>
          </Button>
          <Button variant="outline" onClick={() => setShowPriorityDialog(true)}>
            <Crosshair className="size-4" />
            <span className="hidden md:flex">Ordre de priorité</span>
          </Button>
          {deleteAction && (
            <Button
              className="bg-red-800 text-neutral-100 hover:bg-red-900"
              onClick={() => deleteAction.onSelect?.()}
            >
              <Trash className="size-4" />
              <span className="hidden md:flex">Supprimer</span>
            </Button>
          )}
        </div>
      </header>

      <div className="grid gap-4.5 lg:grid-cols-[minmax(0,1fr)_21.25rem]">
        <Card className="gap-0 overflow-hidden p-0">
          {/* <div className="relative h-64 w-full overflow-hidden bg-surface sm:h-80"> */}
          <AspectRatio ratio={21 / 9}>
            {article.image ? (
              <img
                src={article.image}
                alt={article.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="size-16 text-neutral-500" />
              </div>
            )}
            <div className="absolute top-4.5 left-4.5 flex w-14 flex-col items-center overflow-hidden rounded-md bg-card shadow-sm">
              <span className="w-full bg-primary py-0.5 text-center text-[10px] font-semibold tracking-wide text-primary-foreground">
                {month}
              </span>
              <span className="py-1 text-lg leading-none font-bold text-foreground">
                {day}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="absolute top-4.5 right-4.5 border-0 bg-card shadow-sm"
              onClick={() => navigate("/articles")}
            >
              <ArrowLeft className="size-4" />
              Retour aux articles
            </Button>
            {/* </div> */}
          </AspectRatio>

          <CardContent className="flex flex-col gap-4 p-6.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge className={badgeClassName}>
                <StatusIcon className="size-3" />
                {article.status}
              </Badge>
              {article.link && (
                <a href={article.link} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="outline">
                    <ExternalLink className="size-4" />
                    Ouvrir le lien
                  </Button>
                </a>
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {article.name}
              </h2>
              <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">
                {article.description}
              </p>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Quantité</span>
                <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Package className="size-3.5 text-muted-foreground" />
                  {article.quantity} unité{article.quantity > 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Prix</span>
                <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Tag className="size-3.5 text-muted-foreground" />
                  {article.price !== undefined
                    ? fmtPrice(article.price)
                    : "Non défini"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">
                  Date estimée
                </span>
                <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <CalendarDays className="size-3.5 text-muted-foreground" />
                  {format(article.estimateDate, "d MMMM yyyy", { locale: fr })}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Priorité</span>
                <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Flag className="size-3.5 text-muted-foreground" />
                  Priorité {article.priority.priority}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">
                  Action liée
                </span>
                <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Layers className="size-3.5 text-muted-foreground" />
                  {article.action?.name ?? "Aucune"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Lien</span>
                {article.link ? (
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-sm font-medium text-primary hover:underline"
                  >
                    {article.link}
                  </a>
                ) : (
                  <span className="text-sm font-medium text-foreground">
                    Non défini
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="flex flex-col gap-4">
              <h3 className="text-sm font-medium text-foreground">
                Informations système
              </h3>
              <Separator />
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Créé le</span>
                  <span className="font-medium text-foreground">
                    {format(article.createdAt, "d MMM yyyy 'à' HH:mm", {
                      locale: fr,
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Modifié le</span>
                  <span className="font-medium text-foreground">
                    {format(article.updatedAt, "d MMM yyyy 'à' HH:mm", {
                      locale: fr,
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Identifiant</span>
                  <span className="font-mono text-xs text-foreground">
                    {article.id}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {article.action && (
            <Card>
              <CardContent className="flex flex-col gap-3">
                <h3 className="text-sm font-medium text-foreground">
                  Action associée
                </h3>
                <Separator />
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-foreground">
                    {article.action.name}
                  </span>
                  {article.action.description && (
                    <p className="text-sm text-muted-foreground">
                      {article.action.description}
                    </p>
                  )}
                  <Badge variant="outline" className="mt-1 w-fit">
                    {article.action.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <UpdateArticle
        article={article}
        open={showUpdateDialog}
        setOpen={setShowUpdateDialog}
      />
      <UpdatePriority
        article={article}
        open={showPriorityDialog}
        setOpen={setShowPriorityDialog}
      />
    </motion.div>
  )
}

export default ArticleDetails
