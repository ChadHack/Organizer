"use client"
import type { Article } from "@/api/interfaces/article.interface"
import { useArticleStore } from "@/api/stores/article.store"
import { statusColumns } from "@/components/shadcn-space/radix/blocks/kanban-application-01/data"
import KanbanColumn from "@/components/shadcn-space/radix/blocks/kanban-application-01/kanban-column"
import type { KanbanStatus } from "@/components/shadcn-space/radix/blocks/kanban-application-01/types"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { useEffect, useMemo, useState } from "react"

const KanbanApplication = () => {
  const { articles, fetchArticles, updateArticle } = useArticleStore()
  const [activeArticle, setActiveArticle] = useState<Article | null>(null)

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const columns = useMemo(
    () =>
      statusColumns.map((col) => ({
        ...col,
        articles: articles.filter((article) => article.status === col.id),
      })),
    [articles]
  )

  const findStatus = (id: string): KanbanStatus | null => {
    const byColumn = statusColumns.find((col) => col.id === id)
    if (byColumn) return byColumn.id
    return articles.find((article) => article.id === id)?.status ?? null
  }

  const handleDragStart = (event: DragStartEvent) => {
    const article = articles.find((a) => a.id === event.active.id) ?? null
    setActiveArticle(article)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveArticle(null)
    if (!over) return

    const article = articles.find((a) => a.id === active.id)
    const targetStatus = findStatus(over.id as string)
    if (!article || !targetStatus || article.status === targetStatus) return

    updateArticle(article.id, { status: targetStatus })
  }

  return (
    <div className="mx-auto h-full w-full max-w-7xl rounded-none ring-0">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="custom-scrollbar flex h-full w-full min-w-3xl items-stretch gap-4 overflow-x-auto">
          {columns.map((column) => (
            <KanbanColumn key={column.id} column={column} />
          ))}
        </div>
        <DragOverlay>
          {activeArticle ? (
            <div className="flex w-72 rotate-2 items-start gap-2 rounded-xl bg-card p-3 shadow-md">
              <p className="text-sm font-medium wrap-break-word text-card-foreground">
                {activeArticle.name}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

export default KanbanApplication
