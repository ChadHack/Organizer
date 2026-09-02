"use client"

import { cn } from "@/lib/utils"
import { motion, type Transition } from "motion/react"
import { useSyncExternalStore, type JSX } from "react"

type TextShimmerWaveProps = {
  children: string
  as?: React.ElementType
  className?: string
  duration?: number
  zDistance?: number
  xDistance?: number
  yDistance?: number
  spread?: number
  scaleDistance?: number
  rotateYDistance?: number
  transition?: Transition
}

function subscribeToDarkMode(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  })
  return () => observer.disconnect()
}

function getIsDarkSnapshot() {
  return document.documentElement.classList.contains("dark")
}

function getIsDarkServerSnapshot() {
  return false
}

// motion.create() must not be called during render (it would recreate the
// component — and reset its animation state — on every render); cache one
// instance per tag at module scope instead.
const motionComponentCache = new Map<keyof JSX.IntrinsicElements, unknown>()

function getMotionComponent<Tag extends keyof JSX.IntrinsicElements>(
  tag: Tag
) {
  if (!motionComponentCache.has(tag)) {
    motionComponentCache.set(tag, motion.create<unknown, Tag>(tag))
  }
  return motionComponentCache.get(tag) as ReturnType<
    typeof motion.create<unknown, Tag>
  >
}

function TextShimmerWave({
  children,
  as: Component = "p",
  className,
  duration = 1,
  zDistance = 10,
  xDistance = 2,
  yDistance = -2,
  spread = 1,
  scaleDistance = 1.1,
  rotateYDistance = 10,
  transition,
}: TextShimmerWaveProps) {
  // getMotionComponent memoizes by tag at module scope, so the component
  // identity below is stable across renders despite the lint rule's warning.
  const MotionComponent = getMotionComponent(
    Component as keyof JSX.IntrinsicElements
  )

  // Track dark mode based on <html> class
  const isDark = useSyncExternalStore(
    subscribeToDarkMode,
    getIsDarkSnapshot,
    getIsDarkServerSnapshot
  )

  // Colors based on theme
  const baseColor = isDark ? "#71717a" : "#a1a1aa"
  const gradientColor = isDark ? "#ffffff" : "#000000"

  return (
    // MotionComponent is cached per-tag at module scope by getMotionComponent
    // above (not created here), despite what this heuristic lint rule assumes.
    // eslint-disable-next-line react-hooks/static-components
    <MotionComponent
      className={cn("relative inline-block perspective-normal", className)}
      style={{ color: baseColor }}
    >
      {children.split("").map((char, i) => {
        const delay = (i * duration * (1 / spread)) / children.length

        return (
          <motion.span
            key={`${char}-${i}-${isDark}`} // remounts span when theme changes
            className="inline-block text-xl whitespace-pre transform-3d sm:text-5xl"
            initial={{
              translateZ: 0,
              scale: 1,
              rotateY: 0,
              color: baseColor,
            }}
            animate={{
              translateZ: [0, zDistance, 0],
              translateX: [0, xDistance, 0],
              translateY: [0, yDistance, 0],
              scale: [1, scaleDistance, 1],
              rotateY: [0, rotateYDistance, 0],
              color: [baseColor, gradientColor, baseColor],
            }}
            transition={{
              duration,
              repeat: Infinity,
              repeatDelay: (children.length * 0.05) / spread,
              delay,
              ease: "easeInOut",
              ...transition,
            }}
          >
            {char}
          </motion.span>
        )
      })}
    </MotionComponent>
  )
}

export function TextShimmerMotion({ text }: { text: string }) {
  return (
    <TextShimmerWave
      duration={1}
      spread={1}
      zDistance={1}
      scaleDistance={1.1}
      rotateYDistance={20}
    >
      {text}
    </TextShimmerWave>
  )
}
