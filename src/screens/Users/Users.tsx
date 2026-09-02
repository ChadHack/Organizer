import { useUserStore } from "@/api/stores/user.store"
import { DataTableSkeleton } from "@/components/data-tables/data-table-skeleton"
import { DataTable } from "@/components/data-tables/data-tables"
import { PageHeader } from "@/components/page-header"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { motion } from "motion/react"
import { useEffect } from "react"
import { userColumns } from "./columns"

const Users = () => {
  const { users, loading, fetchUsers } = useUserStore()

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative space-y-6"
    >
      <PageHeader
        title="Utilisateurs"
        subtitle="Utilisateurs de l'application"
      />

      <Card>
        <CardHeader>
          <CardTitle>Liste des utilisateurs</CardTitle>
          <CardDescription>
            Liste exhaustive de tous les utilisateurs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <DataTableSkeleton
              columns={userColumns.length}
              rows={users.length}
            />
          ) : (
            <DataTable
              tableId="users"
              columns={userColumns}
              data={users}
              searchKey="name"
              searchPlaceholder="Filtrer par nom.."
              columnFilters={[
                {
                  columnId: "status",
                  label: "Status",
                  options: ["Actif", "Inactif"],
                },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
export default Users
