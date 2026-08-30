"use client"

import type { Article } from "@/api/interfaces/article.interface"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { fmtPrice } from "@/lib/utils"
import groupBy from "lodash/groupBy"
import { Label, Pie, PieChart } from "recharts"

const STATUS_COLORS: Record<Article["status"], string> = {
  "En attente": "var(--color-neutral-900)",
  "En cours": "var(--color-primary)",
  Bouclé: "var(--color-accent-2-600)",
  Annulé: "var(--color-neutral-500)",
}

const chartConfig = {
  count: {
    label: "Articles",
  },
  "En attente": {
    label: "En attente",
  },
  "En cours": {
    label: "En cours",
  },
  Bouclé: {
    label: "Bouclé",
  },
  Annulé: {
    label: "Annulé",
  },
} satisfies ChartConfig

export default function Chart02({
  articles,
  className,
}: {
  articles: Article[]
  className?: string
}) {
  const articlesByStatus = groupBy(articles, "status")

  const chartData = Object.entries(articlesByStatus).map(([status, items]) => ({
    status,
    count: items.length,
    cost: items.reduce((total, item) => total + (item.price ?? 0), 0),
    fill: STATUS_COLORS[status as Article["status"]],
  }))

  return (
    <Card
      className={`mx-auto h-full w-full max-w-96 gap-6 py-6 shadow-xs ${className}`}
    >
      <CardHeader className="px-6">
        <CardTitle>
          <h4 className="text-lg font-medium">
            Répartition des articles par statut
          </h4>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-8 px-6">
        <ChartContainer config={chartConfig} className="aspect-square max-h-50">
          <PieChart
            margin={{
              top: -20,
            }}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="status"
              innerRadius={65}
              strokeWidth={50}
              startAngle={90}
              endAngle={-270}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 10}
                          className="fill-muted-foreground text-sm"
                        >
                          Total
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 15}
                          className="fill-foreground text-xl font-medium"
                        >
                          {articles.length}
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="flex flex-col gap-3">
          {chartData.map((item) => (
            <div
              key={item.status}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-4 w-1 rounded-full"
                  style={{ backgroundColor: item.fill }}
                />
                <h6 className="text-sm leading-tight font-normal">
                  {item.status}
                </h6>
              </div>
              <div className="flex items-center gap-1.5">
                {/* <span className="text-xs text-muted-foreground">
                  {item.count} article{item.count > 1 ? "s" : ""}
                </span> */}
                <h6 className="text-sm font-medium">{fmtPrice(item.cost)}</h6>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
