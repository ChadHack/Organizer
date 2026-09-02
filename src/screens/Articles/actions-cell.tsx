import type { Article } from "@/api/interfaces/article.interface"
import { RowActionsMenu } from "@/components/data-tables/row-actions-menu"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import DuplicateArticle from "./actions/duplicate-article"
import UpdateArticle from "./actions/update-article"
import { UpdatePriority } from "./actions/update-priority"
import { getArticleActionGroups } from "./article-actions"

export function ActionsCell({ article }: { article: Article }) {
  const navigate = useNavigate()
  const [showPriorityDialog, setShowPriorityDialog] = useState(false)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)

  return (
    <>
      <RowActionsMenu
        groups={getArticleActionGroups(
          article,
          navigate,
          () => setShowPriorityDialog(true),
          () => setShowUpdateDialog(true),
          () => setShowDuplicateDialog(true)
        )}
      />
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
    </>
  )
}
