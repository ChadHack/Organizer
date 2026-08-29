"use client"

import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
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
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnVisibilityState,
  flexRender,
  type RowData,
  type RowSelectionState,
  type SortingState,
  useTable,
} from "@tanstack/react-table"
import { ChevronDown, X } from "lucide-react"
import { motion, useInView, type Variants } from "motion/react"
import {
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { dataTableFeatures, type DataTableFeatures } from "./table-features"
export interface ColumnFilter {
  columnId: string
  label: string
  options: string[]
}

/** Quand fourni, le DataTable délègue la pagination au serveur. */
export interface ServerPaginationConfig {
  /** Nombre total d'éléments côté serveur */
  total: number
  /** Page courante (1-indexed) */
  page: number
  /** Nombre d'éléments par page */
  limit: number
  /** Nombre de pages total (fourni par le backend) */
  totalPages: number
  /** Le backend confirme qu'il existe une page suivante */
  hasNextPage: boolean
  /** Le backend confirme qu'il existe une page précédente */
  hasPrevPage: boolean
  /** Appelé quand l'utilisateur change de page */
  onPageChange: (page: number) => void
}

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  columnFilters?: ColumnFilter[]
  defaultSort?: { id: string; desc: boolean }
  getRowId?: (row: TData) => string
  onSelectedRowIdsChange?: (ids: string[]) => void
  /** Appelé à chaque changement du jeu de lignes filtré (recherche + columnFilters),
   * avant pagination — permet au parent (ex: export Excel/PDF) de rester synchronisé
   * avec exactement ce que l'utilisateur voit dans le tableau. */
  onFilteredDataChange?: (data: TData[]) => void
  selectedIdsScope?: "filtered" | "all"
  tableId?: string
  /** Pagination serveur : désactive la pagination client et délègue au parent */
  serverPagination?: ServerPaginationConfig
  /** Quand fourni, délègue la recherche au parent (server-side). */
  onServerSearch?: (value: string) => void
  /** Valeur contrôlée du champ de recherche (utilisé avec onServerSearch). */
  serverSearchValue?: string
  /** Désactive l'auto-avance de page quand data est vide (utile quand le filtrage est fait en amont). */
  disableAutoAdvance?: boolean
}

function getPageRange(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const items: (number | "ellipsis")[] = [1]
  if (current > 4) items.push("ellipsis")
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) items.push(i)
  if (current < total - 3) items.push("ellipsis")
  items.push(total)
  return items
}

export function ServerPaginationBar({
  serverPagination,
}: {
  serverPagination: ServerPaginationConfig | undefined
}) {
  if (!serverPagination || serverPagination.totalPages <= 1) return null
  const pageRange = getPageRange(
    serverPagination.page,
    serverPagination.totalPages
  )
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-2">
      <div className="text-sm text-muted-foreground">
        Page {serverPagination.page} / {serverPagination.totalPages} &mdash;{" "}
        {serverPagination.total} résultat(s)
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            serverPagination.onPageChange(serverPagination.page - 1)
          }
          disabled={!serverPagination.hasPrevPage}
        >
          Précédent
        </Button>
        {pageRange.map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="px-1 text-muted-foreground"
            >
              …
            </span>
          ) : (
            <Button
              key={item}
              variant={item === serverPagination.page ? "default" : "outline"}
              size="sm"
              className="w-9"
              onClick={() => serverPagination.onPageChange(item as number)}
            >
              {item}
            </Button>
          )
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            serverPagination.onPageChange(serverPagination.page + 1)
          }
          disabled={!serverPagination.hasNextPage}
        >
          Suivant
        </Button>
      </div>
    </div>
  )
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

export function DataTable<TData extends RowData>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Rechercher...",
  columnFilters: columnFilterConfig = [],
  defaultSort,
  getRowId,
  onSelectedRowIdsChange,
  onFilteredDataChange,
  // selectedIdsScope = "filtered",
  tableId,
  serverPagination,
  onServerSearch,
  serverSearchValue,
  disableAutoAdvance = false,
}: DataTableProps<TData>) {
  const storageKey = tableId ? `uat:filters:${tableId}` : null
  const visibilityStorageKey = tableId ? `uat:visibility:${tableId}` : null
  const searchStorageKey = tableId ? `uat:search:${tableId}` : null

  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  const [sorting, setSorting] = useState<SortingState>(
    defaultSort ? [defaultSort] : []
  )
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(() => {
    if (!storageKey) return []
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? (JSON.parse(saved) as ColumnFiltersState) : []
    } catch {
      return []
    }
  })
  const [columnVisibility, setColumnVisibility] =
    useState<ColumnVisibilityState>(() => {
      if (!visibilityStorageKey) return {}
      try {
        const saved = localStorage.getItem(visibilityStorageKey)
        return saved ? (JSON.parse(saved) as ColumnVisibilityState) : {}
      } catch {
        return {}
      }
    })
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [filterInputs, setFilterInputs] = useState<Record<string, string>>({})

  const handleColumnFiltersChange = useCallback(
    (updater: SetStateAction<ColumnFiltersState>) => {
      setColumnFilters((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater
        if (storageKey) {
          try {
            if (next.length === 0) {
              localStorage.removeItem(storageKey)
            } else {
              localStorage.setItem(storageKey, JSON.stringify(next))
            }
          } catch (err) {
            console.warn("Could not persist filters to localStorage:", err)
          }
        }
        return next
      })
    },
    [storageKey]
  )

  const handleColumnVisibilityChange = useCallback(
    (updater: SetStateAction<ColumnVisibilityState>) => {
      setColumnVisibility((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater
        if (visibilityStorageKey) {
          try {
            if (Object.keys(next).length === 0) {
              localStorage.removeItem(visibilityStorageKey)
            } else {
              localStorage.setItem(visibilityStorageKey, JSON.stringify(next))
            }
          } catch (err) {
            console.warn(
              "Could not persist column visibility to localStorage:",
              err
            )
          }
        }
        return next
      })
    },
    [visibilityStorageKey]
  )

  // Stable ref so the auto-advance effect can always call the latest onPageChange
  // without adding the whole serverPagination object to effect deps.
  const spRef = useRef(serverPagination)
  const onServerSearchRef = useRef(onServerSearch)

  useEffect(() => {
    spRef.current = serverPagination
    onServerSearchRef.current = onServerSearch
  }, [serverPagination, onServerSearch])

  // Extract onPageChange for clearAllFilters (stable if parent memoises it)
  const serverPaginationOnPageChange = serverPagination?.onPageChange

  const table = useTable({
    features: dataTableFeatures,
    data,
    columns,
    ...(getRowId
      ? {
          getRowId: (originalRow: TData) => getRowId(originalRow),
        }
      : {}),
    onSortingChange: setSorting,
    onColumnFiltersChange: handleColumnFiltersChange,
    // En mode server-pagination, la donnée reçue est déjà la page courante :
    // on désactive le paginateur client plutôt que de le retirer de la table.
    ...(serverPagination
      ? { manualPagination: true, rowCount: serverPagination.total }
      : { initialState: { pagination: { pageIndex: 0, pageSize: 10 } } }),
    onColumnVisibilityChange: handleColumnVisibilityChange,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  // Lignes filtrées (recherche + columnFilters), avant pagination : c'est
  // exactement le périmètre que l'utilisateur voit défiler à travers les pages.
  const filteredRows = table.getFilteredRowModel().rows

  useEffect(() => {
    onFilteredDataChange?.(filteredRows.map((row) => row.original))
  }, [filteredRows, onFilteredDataChange])

  const handleFilterChange = useCallback(
    (columnId: string, value: string | null) => {
      if (!value) {
        table.getColumn(columnId)?.setFilterValue(undefined)
      } else {
        table.getColumn(columnId)?.setFilterValue(value)
      }
    },
    [table]
  )

  const clearAllFilters = useCallback(() => {
    table.resetColumnFilters()
    // Reset to page 1 so the user sees unfiltered results from the start
    serverPaginationOnPageChange?.(1)
  }, [table, serverPaginationOnPageChange])

  const activeFiltersCount = columnFilters.length

  // When server pagination is active and the *raw* current page comes back empty
  // (e.g. the last item on it was deleted) while the server confirms more pages
  // exist, automatically advance to the next page. This never triggers when a
  // column filter is applied — in that case an empty result is a legitimate
  // "no match" state, not a stale/empty page to skip.
  // Capped at MAX_AUTO_ADVANCE pages to avoid spamming requests.
  const MAX_AUTO_ADVANCE = 3
  const visitedEmptyPagesRef = useRef(new Set<number>())
  const advanceCountRef = useRef(0)

  useEffect(() => {
    const sp = spRef.current

    // Exclure le filtre de recherche textuelle (client-side) : seul un filtre de
    // colonne (combobox) réellement appliqué doit bloquer l'auto-avance.
    const hasActiveColumnFilter = columnFilters.some((f) => f.id !== searchKey)

    if (!sp || hasActiveColumnFilter || disableAutoAdvance) {
      visitedEmptyPagesRef.current.clear()
      advanceCountRef.current = 0
      return
    }

    if (
      data.length === 0 &&
      sp.hasNextPage &&
      !visitedEmptyPagesRef.current.has(sp.page) &&
      advanceCountRef.current < MAX_AUTO_ADVANCE
    ) {
      visitedEmptyPagesRef.current.add(sp.page)
      advanceCountRef.current += 1
      sp.onPageChange(sp.page + 1)
    } else if (data.length > 0) {
      // Landed on a non-empty page: reset so a future empty page is handled fresh.
      visitedEmptyPagesRef.current.clear()
      advanceCountRef.current = 0
    }
    // spRef is excluded intentionally (it's a mutable ref, not a dep)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnFilters, data, searchKey])

  useEffect(() => {
    if (!onSelectedRowIdsChange) return
    const ids = Object.keys(rowSelection).filter(
      (id) => rowSelection[id as keyof typeof rowSelection]
    )
    onSelectedRowIdsChange(ids)
  }, [rowSelection, onSelectedRowIdsChange])

  useEffect(() => {
    if (!searchStorageKey) return
    try {
      if (serverSearchValue) {
        localStorage.setItem(searchStorageKey, serverSearchValue)
      } else {
        localStorage.removeItem(searchStorageKey)
      }
    } catch {
      // ignore
    }
  }, [searchStorageKey, serverSearchValue])

  // Restore persisted server search on mount
  useEffect(() => {
    if (!searchStorageKey || !onServerSearchRef.current) return
    try {
      const saved = localStorage.getItem(searchStorageKey)
      if (saved) onServerSearchRef.current(saved)
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Contrôles de pagination ─────────────────────────────────────────────────
  const serverCurrentPage = serverPagination?.page ?? 1

  const clientCurrentPage = table.state.pagination.pageIndex + 1
  const clientTotalPages = table.getPageCount()

  const currentPage = serverPagination ? serverCurrentPage : clientCurrentPage
  // totalPages vient directement du backend (plus précis que Math.ceil)
  const totalPages = serverPagination
    ? serverPagination.totalPages
    : clientTotalPages

  const pageRange = useMemo(
    () => getPageRange(currentPage, totalPages),
    [currentPage, totalPages]
  )

  const handlePrev = useCallback(() => {
    if (serverPagination) {
      serverPagination.onPageChange(serverCurrentPage - 1)
    } else {
      table.previousPage()
    }
  }, [serverPagination, serverCurrentPage, table])

  const handleNext = useCallback(() => {
    if (serverPagination) {
      serverPagination.onPageChange(serverCurrentPage + 1)
    } else {
      table.nextPage()
    }
  }, [serverPagination, serverCurrentPage, table])

  const handleGoTo = useCallback(
    (page: number) => {
      if (serverPagination) {
        serverPagination.onPageChange(page)
      } else {
        table.setPageIndex(page - 1)
      }
    },
    [serverPagination, table]
  )

  // hasPrevPage / hasNextPage viennent du backend — plus fiables que les calculs locaux
  const canPrev = serverPagination
    ? serverPagination.hasPrevPage
    : table.getCanPreviousPage()
  const canNext = serverPagination
    ? serverPagination.hasNextPage
    : table.getCanNextPage()

  // Total affiché : côté serveur si disponible, sinon longueur locale
  const displayTotal = serverPagination?.total ?? data.length

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-4 py-4">
        {searchKey && (
          <Input
            placeholder={searchPlaceholder}
            value={
              onServerSearch
                ? (serverSearchValue ?? "")
                : ((table.getColumn(searchKey)?.getFilterValue() as string) ??
                  "")
            }
            onChange={(event) => {
              if (onServerSearch) {
                onServerSearch(event.target.value)
              } else {
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
            }}
            className="max-w-sm"
          />
        )}

        {columnFilterConfig.map((filter) => {
          const currentValue =
            (table.getColumn(filter.columnId)?.getFilterValue() as string) ??
            null
          const search = filterInputs[filter.columnId] ?? ""
          const uniqueOptions = [
            ...new Set(filter.options.filter((o) => o?.trim())),
          ]
          const visibleOptions = search
            ? uniqueOptions.filter((o) =>
                o.toLowerCase().includes(search.toLowerCase())
              )
            : uniqueOptions
          return (
            <Combobox
              key={filter.columnId}
              value={currentValue}
              onValueChange={(val) => {
                handleFilterChange(filter.columnId, val)
                setFilterInputs((prev) => ({
                  ...prev,
                  [filter.columnId]: "",
                }))
              }}
              onInputValueChange={(val) =>
                setFilterInputs((prev) => ({
                  ...prev,
                  [filter.columnId]: val ?? "",
                }))
              }
            >
              <ComboboxInput
                placeholder={filter.label}
                showTrigger
                showClear={!!currentValue}
                className="w-45"
              />
              <ComboboxContent>
                <ComboboxList>
                  {visibleOptions.length === 0 ? (
                    <p className="w-full justify-center py-2 text-center text-sm text-muted-foreground">
                      Aucun résultat.
                    </p>
                  ) : (
                    visibleOptions.map((option) => (
                      <ComboboxItem key={option} value={option}>
                        {option}
                      </ComboboxItem>
                    ))
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          )
        })}

        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            onClick={clearAllFilters}
            className="h-8 px-2 lg:px-3"
          >
            Réinitialiser
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Colonnes <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableCaption>Total : {displayTotal}</TableCaption>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onContextMenu={(event) => {
                    const actionsTrigger =
                      event.currentTarget.querySelector<HTMLButtonElement>(
                        '[data-slot="row-actions-trigger"]'
                      )
                    if (actionsTrigger) {
                      event.preventDefault()
                      actionsTrigger.click()
                    }
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
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
                              La liste est vide, aucune donnée trouvée.
                            </EmptyDescription>
                          </motion.div>
                        </EmptyHeader>
                      </Empty>
                    </motion.div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 py-4">
        <div className="text-sm text-muted-foreground">
          {serverPagination ? (
            <>
              Page {serverCurrentPage} / {serverPagination.totalPages} &mdash;{" "}
              {serverPagination.total} résultat(s)
            </>
          ) : (
            <>
              {table.getFilteredSelectedRowModel().rows.length} sur{" "}
              {table.getFilteredRowModel().rows.length} ligne(s)
              sélectionnée(s).
            </>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={!canPrev}
            >
              Précédent
            </Button>

            {pageRange.map((item, index) =>
              item === "ellipsis" ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-1 text-muted-foreground"
                >
                  …
                </span>
              ) : (
                <Button
                  key={item}
                  variant={item === currentPage ? "default" : "outline"}
                  size="sm"
                  className="w-9"
                  onClick={() => handleGoTo(item as number)}
                >
                  {item}
                </Button>
              )
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={!canNext}
            >
              Suivant
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
