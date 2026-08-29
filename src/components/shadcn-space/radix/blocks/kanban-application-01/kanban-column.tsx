"use client"
import ArticleCard from "@/components/shadcn-space/radix/blocks/kanban-application-01/article-card"
import type { KanbanColumnData } from "@/components/shadcn-space/radix/blocks/kanban-application-01/types"
import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"

type Props = {
  column: KanbanColumnData
}

const KanbanColumn = ({ column }: Props) => {
  const { setNodeRef } = useDroppable({ id: column.id })
  const Icon = column.icon

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col items-start gap-3 rounded-[28px] bg-surface p-3.5">
      <div className="flex w-full shrink-0 items-center gap-2.5 px-2.5 py-1.5">
        <Icon size={10} className={column.iconClassName} />
        <p className="text-sm font-semibold whitespace-nowrap text-foreground">
          {column.title}
        </p>
        <p className="ml-auto text-xs whitespace-nowrap text-muted-foreground">
          {String(column.articles.length).padStart(2, "0")}
        </p>
      </div>

      <div
        ref={setNodeRef}
        className="custom-scrollbar flex min-h-0 w-full flex-1 flex-col items-start gap-2.5 overflow-y-auto"
      >
        <SortableContext
          items={column.articles.map((article) => article.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </SortableContext>
        {column.articles.length === 0 && (
          <div className="w-full rounded-[20px] border border-dashed border-neutral-400 p-4.5 text-center text-xs text-neutral-600">
            Déposez un article ici
          </div>
        )}
      </div>
    </div>
  )
}

export default KanbanColumn
