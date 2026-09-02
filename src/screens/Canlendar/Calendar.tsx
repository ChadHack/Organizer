import { useArticleStore } from "@/api/stores/article.store"
import { useAuthStore } from "@/api/stores/auth.store"
import { FullCalendar } from "@/components/calendar"
import { PageHeader } from "@/components/page-header"
import { motion } from "motion/react"
import { useEffect, useMemo } from "react"
import { articlesToEvents } from "../Articles/actions/article-calendar"

const Calendar = () => {
  const { articles, fetchArticlesByUser } = useArticleStore()
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    if (user) fetchArticlesByUser(user.id)
  }, [fetchArticlesByUser, user])

  const events = useMemo(() => articlesToEvents(articles), [articles])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <PageHeader
        title="Planification"
        subtitle="Dates estimées des achats sur le calendrier"
      />

      <div className="mx-auto">
        <FullCalendar className="min-h-130 flex-1" events={events} />
      </div>
    </motion.div>
  )
}
export default Calendar
