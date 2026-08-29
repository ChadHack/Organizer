import { cn } from "@/lib/utils"

export function StepperIndicator({
  steps,
  currentStep,
}: {
  steps: string[]
  currentStep: number
}) {
  return (
    <div className="flex items-center">
      {steps.map((label, index) => {
        const isCompleted = index < currentStep
        const isActive = index === currentStep
        return (
          <div key={label} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                  isCompleted &&
                    "border-primary bg-primary text-primary-foreground",
                  isActive && "border-primary text-primary",
                  !isActive &&
                    !isCompleted &&
                    "border-border text-muted-foreground"
                )}
              >
                {index + 1}
              </div>
              <span
                className={cn(
                  "text-sm font-normal",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="mx-3 h-px w-8 bg-border" />
            )}
          </div>
        )
      })}
    </div>
  )
}
