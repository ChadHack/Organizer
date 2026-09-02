"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  CalendarDays,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Workflow,
} from "lucide-react"
import { motion } from "motion/react"
import { useId } from "react"

interface VisualContainerProps {
  children: React.ReactNode
  className?: string
}

interface IntegrationItem {
  id: string
  icon: React.ComponentType<{ className?: string }>
  x: number
  y: number
  path: string
  delay: number
}

// Center is 282, 205
const integrations: IntegrationItem[] = [
  {
    id: "dashboard", // Top-Left
    icon: LayoutDashboard,
    x: 110,
    y: 90,
    path: "M 270 205 V 105 Q 270 90 255 90 H 110",
    delay: 0.1,
  },
  {
    id: "actions", // Top-Right
    icon: Package,
    x: 360,
    y: 70,
    path: "M 294 205 V 85 Q 294 70 309 70 H 360",
    delay: 0.2,
  },
  {
    id: "articles", // Mid-Left
    icon: ShoppingCart,
    x: 160,
    y: 205,
    path: "M 250 205 H 160",
    delay: 0.3,
  },
  {
    id: "mise_en_oeuvre", // Mid-Right
    icon: Workflow,
    x: 480,
    y: 205,
    path: "M 314 205 H 480",
    delay: 0.4,
  },
  {
    id: "planification", // Bottom-Center
    icon: CalendarDays,
    x: 282,
    y: 360,
    path: "M 282 205 V 360",
    delay: 0.6,
  },
  {
    id: "utilisateurs", // Bottom-Right
    icon: Users,
    x: 460,
    y: 340,
    path: "M 314 215 V 325 Q 314 340 329 340 H 460",
    delay: 0.7,
  },
]

const AnimatedPath = ({
  d,
  id,
  delay,
}: {
  d: string
  id: string
  delay: number
}) => {
  return (
    <>
      <path
        d={d}
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        className="text-border"
      />
      <motion.path
        d={d}
        stroke={`url(#${id})`}
        strokeWidth="2"
        fill="none"
        strokeDasharray="40 160"
        initial={{ strokeDashoffset: 200 }}
        animate={{ strokeDashoffset: -200 }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear",
          delay,
        }}
      />
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="transparent" />
          <stop
            offset="50%"
            stopColor="var(--color-primary)"
            stopOpacity="0.5"
          />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
    </>
  )
}

export function Integration() {
  const containerId = useId()

  return (
    <div className="relative h-full w-full">
      {/* SVG Lines */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 564 410"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {integrations.map((integration) => (
          <AnimatedPath
            key={integration.id}
            d={integration.path}
            id={`${containerId}-${integration.id}`}
            delay={integration.delay}
          />
        ))}
      </svg>

      {/* Center Logo */}
      <div className="absolute top-1/2 left-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg border border-border bg-background p-0.5 shadow-md sm:rounded-2xl sm:p-2 sm:shadow-xl">
        <div className="rounded-lg border p-1 sm:rounded-xl sm:p-2.5">
          <img
            src={"/logo.png"}
            alt="logo"
            width={35}
            height={35}
            className="block size-5 object-cover sm:size-9"
          />
        </div>
        <motion.div
          className="absolute inset-0 rounded-lg border-2 border-primary/10 sm:rounded-2xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </div>

      {/* Peripheral Icons */}
      {integrations.map((integration) => {
        const Icon = integration.icon
        return (
          <motion.div
            key={integration.id}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: integration.delay }}
            style={{
              left: `${(integration.x / 564) * 100}%`,
              top: `${(integration.y / 410) * 100}%`,
            }}
            className="absolute z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg border border-border bg-background text-foreground shadow-sm sm:h-12 sm:w-12 sm:rounded-xl md:h-13.5 md:w-13.5"
          >
            <Icon className="h-4 w-4 text-foreground sm:h-6 sm:w-6" />
          </motion.div>
        )
      })}
    </div>
  )
}

export function VisualContainer({ children, className }: VisualContainerProps) {
  return (
    <div
      className={cn(
        "relative flex aspect-564/460 w-full items-center justify-center overflow-hidden rounded-none bg-muted p-8 sm:aspect-564/410 dark:bg-muted/50",
        className
      )}
    >
      {/* Dots Background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--color-foreground) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      {/* Gradient Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-background/60 from-10% via-transparent to-background/60 to-90%" />
      <div className="relative z-10 flex h-full w-full items-center justify-center">
        {children}
      </div>
    </div>
  )
}

const IntegrationCard = ({ visual }: { visual: React.ReactNode }) => {
  return (
    <Card className="mx-auto flex h-full w-full flex-col gap-0 overflow-hidden rounded-2xl border p-0 ring-0">
      <VisualContainer>{visual}</VisualContainer>
      <CardContent className="flex h-full flex-col gap-6 bg-[url('/image.png')] bg-cover bg-center bg-no-repeat p-6 sm:gap-8 sm:p-8" />
    </Card>
  )
}

export function IntegrationCardDemo() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <IntegrationCard visual={<Integration />} />
    </div>
  )
}

export default IntegrationCardDemo
