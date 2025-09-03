// Simplified chart components to avoid version conflicts
import { cn } from "@/lib/utils"

export interface ChartConfig {
  [key: string]: {
    label?: string
    color?: string
    theme?: Record<string, string>
  }
}

export function ChartContainer({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "w-full",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// Export simple tooltip and legend components that work with recharts
export { Tooltip as ChartTooltip, Legend as ChartLegend } from 'recharts';