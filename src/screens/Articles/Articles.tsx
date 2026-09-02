import type { Article } from "@/api/interfaces/article.interface"
import { useArticleStore } from "@/api/stores/article.store"
import { useAuthStore } from "@/api/stores/auth.store"
import { DataTableSkeleton } from "@/components/data-tables/data-table-skeleton"
import { DataTable } from "@/components/data-tables/data-tables"
import { PageHeader } from "@/components/page-header"
import { ArticleCardSkeleton } from "@/components/shadcn-space/radix/card/article-card-skeleton"
import { ArticleCard } from "@/components/shadcn-space/radix/card/card-24"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { cn, fmtPrice } from "@/lib/utils"
import groupBy from "lodash/groupBy"
import {
  Download,
  FileSpreadsheet,
  FileText,
  LayoutGrid,
  Plus,
  Star,
  TableIcon,
  X,
  type LucideIcon,
} from "lucide-react"
import { AnimatePresence, motion, useInView, type Variants } from "motion/react"
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { toast } from "sonner"
import NewArticle from "./actions/new-article"
import { articleColumns } from "./columns"

export type AnimatedTabItem = {
  value: string
  label: string
  icon?: LucideIcon
  badge?: number | string
  disabled?: boolean
  content: ReactNode
}
const EASE = [0.16, 1, 0.3, 1] as const
const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
}
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE },
  },
}

const panelVariants: Variants = {
  enter: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? 24 : -24,
    scale: 0.97,
    filter: "blur(6px)",
  }),
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.045,
      delayChildren: 0.05,
      type: "spring",
      stiffness: 300,
      damping: 28,
      mass: 0.9,
    },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? -24 : 24,
    scale: 0.97,
    filter: "blur(6px)",
    transition: { duration: 0.15, ease: "easeIn" },
  }),
}

interface AnimatedTabsProps {
  tabs: AnimatedTabItem[]
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  listClassName?: string
  contentClassName?: string
  indicatorId?: string
}

export function AnimatedTabs({
  tabs,
  defaultValue,
  value: controlledValue,
  onValueChange,
  className,
  listClassName,
  contentClassName,
  indicatorId = "animated-tabs-indicator",
}: AnimatedTabsProps) {
  const [internalValue, setInternalValue] = useState(
    defaultValue ?? tabs[0]?.value
  )
  const value = controlledValue ?? internalValue
  const [direction, setDirection] = useState(1)

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.value === value),
    [tabs, value]
  )

  const handleChange = (next: string) => {
    const prevIndex = tabs.findIndex((tab) => tab.value === value)
    const nextIndex = tabs.findIndex((tab) => tab.value === next)
    setDirection(nextIndex > prevIndex ? 1 : -1)
    if (controlledValue === undefined) setInternalValue(next)
    onValueChange?.(next)
  }

  return (
    <Tabs
      value={value}
      onValueChange={handleChange}
      className={cn("w-full gap-4", className)}
    >
      <TabsList
        className={cn(
          "no-scrollbar h-auto! w-full gap-1 overflow-x-auto rounded-full bg-neutral-200 p-1.5 sm:w-fit",
          listClassName
        )}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = tab.value === value
          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              disabled={tab.disabled}
              className={cn(
                "relative z-0 h-9 shrink-0 cursor-pointer gap-1.5 rounded-full border-none bg-transparent px-4 font-heading text-sm shadow-none transition-colors outline-none after:hidden data-active:bg-transparent data-active:shadow-none",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground dark:hover:text-black"
              )}
            >
              {isActive && (
                <motion.span
                  layoutId={indicatorId}
                  className="absolute inset-0 -z-10 rounded-full bg-card shadow-sm"
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 34,
                    mass: 0.9,
                  }}
                />
              )}
              <motion.span
                key={isActive ? "active" : "inactive"}
                initial={isActive ? { scale: 0.85 } : false}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                className="flex items-center gap-1.5"
              >
                {Icon && <Icon className="size-4" />}
                <span>{tab.label}</span>
              </motion.span>
              {tab.badge !== undefined && (
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={tab.badge}
                    initial={{ opacity: 0, scale: 0.5, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: 6 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    className={cn(
                      "flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted-foreground/15 text-muted-foreground"
                    )}
                  >
                    {tab.badge}
                  </motion.span>
                </AnimatePresence>
              )}
            </TabsTrigger>
          )
        })}
      </TabsList>

      <motion.div
        layout
        transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
        className={cn("relative overflow-hidden", contentClassName)}
      >
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          {activeTab && (
            <motion.div
              key={activeTab.value}
              custom={direction}
              role="tabpanel"
              variants={panelVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {activeTab.content}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Tabs>
  )
}

function TableData({
  data,
  loading,
  actions,
}: {
  data: Article[]
  loading: boolean
  actions: string[]
}) {
  const [exporting, setExporting] = useState(false)
  // Reflète en permanence les lignes affichées dans le tableau (recherche +
  // columnFilters). Initialisé à `data` pour que l'export fonctionne avant
  // même le premier rendu du DataTable (aucun filtre = toutes les données).
  const [filteredData, setFilteredData] = useState<Article[]>(data)

  const handleExport = async (format: "excel" | "pdf") => {
    if (filteredData.length === 0) {
      toast.warning("Aucun article à extraire")
      return
    }
    setExporting(true)
    try {
      // Chargé à la demande : exceljs et jspdf ne pèsent que sur le clic
      // "Extraire", pas sur le chargement initial de l'écran Articles.
      const { exportArticlesToExcel, exportArticlesToPdf } =
        await import("./export-articles")
      if (format === "excel") {
        await exportArticlesToExcel(filteredData)
      } else {
        await exportArticlesToPdf(filteredData)
      }
      toast.success("Extraction terminée")
    } catch {
      toast.error("Échec de l'extraction")
    } finally {
      setExporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste des articles</CardTitle>
        <CardDescription>Liste exhaustive de tous les articles</CardDescription>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="cursor-pointer transition-all"
                disabled={exporting}
              >
                <div className="shiny inline-block bg-[linear-gradient(120deg,rgba(255,255,255,0)_40%,rgba(255,255,255,0.8)_50%,rgba(255,255,255,0)_60%)] bg-clip-text bg-position-[200%_100%] text-base font-medium text-white/70 dark:bg-[linear-gradient(120deg,rgba(0,0,0,0)_40%,rgba(0,0,0,0.8)_50%,rgba(0,0,0,0)_60%)] dark:text-background/60">
                  <Download className="m-2 inline" />
                  {exporting ? "Extraction..." : "Extraire"}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={exporting}
                onClick={() => handleExport("excel")}
              >
                <FileSpreadsheet className="text-green-400" />
                <span>Excel (.xlsx)</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={exporting}
                onClick={() => handleExport("pdf")}
              >
                <FileText className="text-red-400" />
                <span>PDF (.pdf)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent>
        {loading ? (
          <DataTableSkeleton
            columns={articleColumns.length}
            rows={data.length}
          />
        ) : (
          <DataTable
            tableId="articles"
            columns={articleColumns}
            data={data}
            searchKey="name"
            searchPlaceholder="Filtrer par nom.."
            onFilteredDataChange={setFilteredData}
            columnFilters={[
              { columnId: "action", label: "Actions", options: actions },
              {
                columnId: "priority",
                label: "Priorité",
                options: ["1", "2", "3", "4", "5"],
              },
            ]}
          />
        )}
      </CardContent>
    </Card>
  )
}

const PRIORITY_OPTIONS = ["1", "2", "3", "4", "5"]

function CardData({
  data,
  loading,
  actions,
}: {
  data: Article[]
  loading: boolean
  actions: string[]
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState<string | null>(null)
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null)
  const [filterInputs, setFilterInputs] = useState<Record<string, string>>({})

  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase()
    return data.filter((a) => {
      const matchesName = query ? a.name.toLowerCase().includes(query) : true
      const matchesAction = actionFilter
        ? a.action?.name === actionFilter
        : true
      const matchesPriority = priorityFilter
        ? String(a.priority?.priority) === priorityFilter
        : true
      return matchesName && matchesAction && matchesPriority
    })
  }, [data, search, actionFilter, priorityFilter])

  const hasActiveFilters = !!search || !!actionFilter || !!priorityFilter

  const uniqueActions = [...new Set(actions.filter((o) => o?.trim()))]
  const actionSearch = filterInputs.action ?? ""
  const visibleActions = actionSearch
    ? uniqueActions.filter((o) =>
        o.toLowerCase().includes(actionSearch.toLowerCase())
      )
    : uniqueActions

  const prioritySearch = filterInputs.priority ?? ""
  const visiblePriorities = prioritySearch
    ? PRIORITY_OPTIONS.filter((o) => o.includes(prioritySearch))
    : PRIORITY_OPTIONS

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <Input
          placeholder="Filtrer par nom.."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />

        <Combobox
          value={actionFilter}
          onValueChange={(val) => {
            setActionFilter(val)
            setFilterInputs((prev) => ({ ...prev, action: "" }))
          }}
          onInputValueChange={(val) =>
            setFilterInputs((prev) => ({ ...prev, action: val ?? "" }))
          }
        >
          <ComboboxInput
            placeholder="Actions"
            showTrigger
            showClear={!!actionFilter}
            className="w-45"
          />
          <ComboboxContent>
            <ComboboxList>
              {visibleActions.length === 0 ? (
                <p className="w-full justify-center py-2 text-center text-sm text-muted-foreground">
                  Aucun résultat.
                </p>
              ) : (
                visibleActions.map((option) => (
                  <ComboboxItem key={option} value={option}>
                    {option}
                  </ComboboxItem>
                ))
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>

        <Combobox
          value={priorityFilter}
          onValueChange={(val) => {
            setPriorityFilter(val)
            setFilterInputs((prev) => ({ ...prev, priority: "" }))
          }}
          onInputValueChange={(val) =>
            setFilterInputs((prev) => ({ ...prev, priority: val ?? "" }))
          }
        >
          <ComboboxInput
            placeholder="Priorité"
            showTrigger
            showClear={!!priorityFilter}
            className="w-45"
          />
          <ComboboxContent>
            <ComboboxList>
              {visiblePriorities.length === 0 ? (
                <p className="w-full justify-center py-2 text-center text-sm text-muted-foreground">
                  Aucun résultat.
                </p>
              ) : (
                visiblePriorities.map((option) => (
                  <ComboboxItem key={option} value={option}>
                    {option}
                  </ComboboxItem>
                ))
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearch("")
              setActionFilter(null)
              setPriorityFilter(null)
            }}
            className="h-8 px-2 lg:px-3"
          >
            Réinitialiser
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {filteredData.length > 0 ? (
        <div className="grid md:grid-cols-3 lg:grid-cols-4">
          {filteredData.map((a) =>
            loading ? (
              <ArticleCardSkeleton key={a.id} />
            ) : (
              <ArticleCard key={a.id} article={a} />
            )
          )}
        </div>
      ) : (
        <div
          ref={ref}
          className="flex w-full items-center justify-center px-4 py-10 sm:py-16"
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "show" : "hidden"}
            className="flex w-92 max-w-full flex-col items-center gap-6"
          >
            <Empty className="gap-4 border-none p-0">
              <EmptyHeader className="gap-4">
                <motion.div variants={itemVariants}>
                  <EmptyMedia variant="default" className="mb-0">
                    <EmptyStateIllustration />
                  </EmptyMedia>
                </motion.div>
                <motion.div
                  variants={itemVariants}
                  className="flex flex-col items-center gap-0.5"
                >
                  <EmptyTitle className="text-lg font-medium text-destructive">
                    Vide
                  </EmptyTitle>
                  <EmptyDescription className="text-center">
                    {hasActiveFilters
                      ? "Aucun article ne correspond aux filtres sélectionnés."
                      : "La liste est vide, aucune donnée trouvée."}
                  </EmptyDescription>
                </motion.div>
              </EmptyHeader>
            </Empty>
          </motion.div>
        </div>
      )}
    </div>
  )
}

const Articles = () => {
  const { articles, loading, fetchArticlesByUser } = useArticleStore()
  const user = useAuthStore((state) => state.user)
  const [showNewArticleDialog, setShowNewArticleDialog] = useState(false)

  useEffect(() => {
    if (user) fetchArticlesByUser(user.id)
  }, [fetchArticlesByUser, user])

  const articleByPriority = groupBy(articles, "priority.priority")
  const articleByAction = groupBy(articles, "action.name")

  const tabs: AnimatedTabItem[] = [
    {
      value: "tableData",
      label: "Liste",
      icon: TableIcon,
      content: (
        <TableData
          data={articles}
          loading={loading}
          actions={Object.keys(articleByAction)}
        />
      ),
    },
    {
      value: "cardData",
      label: "Carte",
      icon: LayoutGrid,
      content: (
        <CardData
          data={articles}
          loading={loading}
          actions={Object.keys(articleByAction)}
        />
      ),
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <PageHeader
        title="Articles"
        subtitle="Articles priorisés, rattachés à une action"
        action={
          <Button
            className="bg-neutral-900 text-neutral-100 hover:bg-neutral-800"
            onClick={() => setShowNewArticleDialog(true)}
          >
            <Plus className="size-4" />
            Nouvel article
          </Button>
        }
      />

      {articles.length > 0 && (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((level) => {
            const count = articleByPriority[String(level)]?.length ?? 0
            const amount =
              articleByPriority[String(level)]?.reduce(
                (total, a) => total + (a.price ?? 0),
                0
              ) ?? 0
            const strong = level <= 2
            return (
              <Card key={level} className="p-4.5">
                <div className="flex items-start justify-between gap-2.5">
                  <div>
                    <p className="text-[13px] text-muted-foreground">
                      Priorité {level}
                    </p>
                    <p className="mt-1.5 font-heading text-2xl leading-none">
                      {count}
                    </p>
                    <p className="mt-1.5 font-heading text-sm leading-none text-primary">
                      {fmtPrice(amount)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "grid size-8.5 shrink-0 place-items-center rounded-full",
                      strong
                        ? "bg-accent-200 text-accent-700"
                        : "bg-neutral-200 text-neutral-600"
                    )}
                  >
                    <Star className="size-3.5" />
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <AnimatedTabs tabs={tabs} defaultValue="tableData" />

      <NewArticle
        open={showNewArticleDialog}
        setOpen={setShowNewArticleDialog}
      />
    </motion.div>
  )
}
export default Articles
