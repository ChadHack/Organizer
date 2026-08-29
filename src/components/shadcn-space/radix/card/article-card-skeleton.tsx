import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

export const ArticleCardSkeleton = () => {
  return (
    <div className="p-6">
      <div className="w-full max-w-85">
        <Card className="gap-0 overflow-hidden rounded-2xl border-border p-0">
          <div className="relative h-40 w-full overflow-hidden">
            <Skeleton className="h-full w-full rounded-none" />
            <div className="absolute top-3 left-3 flex w-13 flex-col items-center overflow-hidden rounded-lg bg-card">
              <Skeleton className="h-3.5 w-full rounded-none" />
              <Skeleton className="my-1 h-5 w-6 rounded-sm" />
            </div>
          </div>

          <CardContent className="p-5">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4.5 w-4/5 rounded-sm" />
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-full rounded-sm" />
                  <Skeleton className="h-3.5 w-3/5 rounded-sm" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-4 shrink-0 rounded-sm" />
                  <Skeleton className="h-3.5 w-24 rounded-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="size-4 shrink-0 rounded-sm" />
                  <Skeleton className="h-3.5 w-20 rounded-sm" />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3.5 w-20 rounded-sm" />
                  <Skeleton className="h-3.5 w-16 rounded-sm" />
                </div>
                <Skeleton className="h-7 w-16 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
