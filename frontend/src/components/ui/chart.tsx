import * as React from 'react'
import { cn } from '@/lib/utils'

export function ChartContainer({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('relative w-full h-full', className)} {...props}>
      {children}
    </div>
  )
}

// Placeholder stubs to satisfy imports if needed later
export function ChartTooltip({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function ChartTooltipContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export type ChartConfig = Record<string, unknown> 