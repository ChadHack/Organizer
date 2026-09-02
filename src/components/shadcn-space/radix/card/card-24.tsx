"use client"

import type { Article } from "@/api/interfaces/article.interface"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { Separator } from "@/components/ui/separator"
import { cn, fmtPrice } from "@/lib/utils"
import DuplicateArticle from "@/screens/Articles/actions/duplicate-article"
import UpdateArticle from "@/screens/Articles/actions/update-article"
import { UpdatePriority } from "@/screens/Articles/actions/update-priority"
import { getArticleActionGroups } from "@/screens/Articles/article-actions"
import { ARTICLE_STATUS_CONFIG } from "@/screens/Articles/article-status"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { ExternalLink, Flag, Layers, Package, Tag } from "lucide-react"
import { motion, useInView } from "motion/react"
import { Fragment, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

export interface ArticleCardProps {
  article: Article
  ctaLabel?: string
  onCtaClick?: () => void
}

const contentVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
}

const MotionButton = motion.create(Button)
const MotionSeparator = motion.create(Separator)

export const ArticleCard = ({
  article,
  ctaLabel = "Voir",
  onCtaClick,
}: ArticleCardProps) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })
  const navigate = useNavigate()
  const [showPriorityDialog, setShowPriorityDialog] = useState(false)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
  const actionGroups = getArticleActionGroups(
    article,
    navigate,
    () => setShowPriorityDialog(true),
    () => setShowUpdateDialog(true),
    () => setShowDuplicateDialog(true)
  )

  const month = format(article.estimateDate, "MMM", {
    locale: fr,
  }).toUpperCase()
  const day = format(article.estimateDate, "d", { locale: fr })

  const cta = (
    <MotionButton
      size="sm"
      className="cursor-pointer rounded-full md:hidden lg:flex lg:items-center"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={article.link ? undefined : onCtaClick}
      disabled={!article.link && !onCtaClick}
    >
      <ExternalLink className="size-4" />
      {ctaLabel}
    </MotionButton>
  )

  return (
    <div className="h-full p-6">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full w-full"
          >
            <Link to={`/articles/${article.id}`} className="block h-full">
              <Card className="group h-full gap-0 overflow-hidden rounded-2xl border-border p-0">
                <div className="relative h-40 w-full overflow-hidden bg-muted">
                  {article.image ? (
                    <img
                      src={article.image}
                      alt={article.name}
                      className="h-full w-full object-cover transition-transform duration-600 ease-out group-hover:scale-108"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="size-10 text-muted-foreground" />
                    </div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 16,
                      delay: 0.25,
                    }}
                    className="absolute top-3 left-3 flex w-13 flex-col items-center overflow-hidden rounded-lg bg-card"
                  >
                    <span className="w-full bg-primary py-0.5 text-center text-[10px] font-semibold tracking-wide text-primary-foreground">
                      {month}
                    </span>
                    <span className="py-1 text-lg leading-none font-bold text-foreground">
                      {day}
                    </span>
                  </motion.div>
                </div>

                <CardContent className="flex flex-1 flex-col p-5">
                  <motion.div
                    variants={contentVariants}
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                    className="flex flex-1 flex-col gap-4"
                  >
                    <motion.div
                      variants={itemVariants}
                      className="flex flex-col gap-2"
                    >
                      <Badge
                        className={cn(
                          "w-fit rounded-full",
                          ARTICLE_STATUS_CONFIG[article.status].badgeClassName
                        )}
                      >
                        {article.status}
                      </Badge>
                      <p className="line-clamp-1 text-base font-semibold text-foreground">
                        {article.name}
                      </p>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {article.description}
                      </p>
                    </motion.div>

                    <motion.div
                      variants={itemVariants}
                      className="flex flex-col gap-1.5"
                    >
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Tag className="size-4 shrink-0" />
                        <span>
                          {article.price !== undefined
                            ? fmtPrice(article.price)
                            : "Prix non défini"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="size-4 shrink-0" />
                        <span className="line-clamp-1">
                          {article.quantity} unité
                          {article.quantity > 1 ? "s" : ""}
                        </span>
                      </div>
                    </motion.div>

                    <MotionSeparator variants={itemVariants} className="mt-auto" />

                    <motion.div
                      variants={itemVariants}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Flag className="size-3.5 shrink-0" />
                          Priorité {article.priority.priority}
                        </span>
                        {article.action && (
                          <>
                            <span aria-hidden>·</span>
                            <span className="inline-flex items-center gap-1 truncate">
                              <Layers className="size-3.5 shrink-0" />
                              {article.action.name}
                            </span>
                          </>
                        )}
                      </div>

                      {article.link ? (
                        <a href={article.link} target="_blank" rel="noreferrer">
                          {cta}
                        </a>
                      ) : (
                        cta
                      )}
                    </motion.div>
                  </motion.div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {actionGroups.map((group, groupIndex) => (
            <Fragment key={group.heading ?? `group-${groupIndex}`}>
              {groupIndex > 0 && <ContextMenuSeparator />}
              {group.heading && (
                <ContextMenuLabel>{group.heading}</ContextMenuLabel>
              )}
              {group.actions.map((action) => {
                const Icon = action.icon
                return (
                  <ContextMenuItem
                    key={action.key}
                    disabled={action.disabled}
                    variant={action.variant}
                    onSelect={() => action.onSelect?.()}
                  >
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                    <span>{action.label}</span>
                  </ContextMenuItem>
                )
              })}
            </Fragment>
          ))}
        </ContextMenuContent>
      </ContextMenu>
      <UpdatePriority
        article={article}
        open={showPriorityDialog}
        setOpen={setShowPriorityDialog}
      />
      <UpdateArticle
        article={article}
        open={showUpdateDialog}
        setOpen={setShowUpdateDialog}
      />
      <DuplicateArticle
        article={article}
        open={showDuplicateDialog}
        setOpen={setShowDuplicateDialog}
      />
    </div>
  )
}
