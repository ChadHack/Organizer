import KanbanApplication from "@/components/shadcn-space/radix/blocks/kanban-application-01"
import { PageHeader } from "@/components/page-header"
import { motion } from "motion/react"

const Monitoring = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex h-full min-h-0 flex-col gap-6"
    >
      <PageHeader
        title="Suivi de mise en œuvre"
        subtitle="Glissez un article d'une colonne à l'autre"
      />
      <div className="min-h-0 flex-1">
        <KanbanApplication />
      </div>
    </motion.div>
  )
}
export default Monitoring
