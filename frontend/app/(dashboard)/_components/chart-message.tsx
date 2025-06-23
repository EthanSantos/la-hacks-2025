"use client"

import * as React from "react"
import { IconTrendingUp } from "@tabler/icons-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { mockMessageVolumeData } from "@/data/mock-data"

const chartConfig = {
  approved: {
    label: "Approved",
    color: "hsl(157 61% 48%)", // Green
  },
  flagged: {
    label: "Flagged", 
    color: "hsl(45 100% 68%)", // Yellow
  },
  violations: {
    label: "Violations",
    color: "hsl(356 88% 60%)", // Red
  },
} satisfies ChartConfig

export function ChartMessage() {
  const [activeChart, setActiveChart] = React.useState<keyof typeof chartConfig>("approved")
  
  const totals = React.useMemo(() => ({
    approved: mockMessageVolumeData.reduce((acc, curr) => acc + curr.approved, 0),
    flagged: mockMessageVolumeData.reduce((acc, curr) => acc + curr.flagged, 0),
    violations: mockMessageVolumeData.reduce((acc, curr) => acc + curr.violations, 0),
  }), [])

  const totalMessages = totals.approved + totals.flagged + totals.violations
  const approvedPercentage = (totals.approved / totalMessages * 100).toFixed(1)

  // To convert 24-hour format to 12-hour format with AM/PM
  const formatTime = (hour: string) => {
    const hourNum = parseInt(hour)
    if (hourNum === 0) return "12AM"
    if (hourNum < 12) return `${hourNum}AM`
    if (hourNum === 12) return "12PM"
    return `${hourNum - 12}PM`
  }

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-6">
          <CardTitle className="font-clash text-lg font-medium">Message Volume Analysis</CardTitle>
          <CardDescription>
            Hourly message processing breakdown - Last 24 hours
          </CardDescription>
        </div>
        <div className="flex">
          {(["approved", "flagged", "violations"] as const).map((key) => {
            const chart = key as keyof typeof chartConfig
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-4 py-3 text-left even:border-l sm:border-t-0 sm:border-l sm:px-6 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-muted-foreground text-xs">
                  {chartConfig[chart].label}
                </span>
                <span className="text-lg leading-none font-bold sm:text-2xl">
                  {totals[key].toLocaleString()}
                </span>
              </button>
            )
          })}
        </div>
      </CardHeader>
      <CardContent className="sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[280px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={mockMessageVolumeData}
            margin={{
              left: 12,
              right: 12,
              bottom: 20,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="hour"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              minTickGap={32}
              tickFormatter={(value) => formatTime(value)}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  labelFormatter={(value) => formatTime(value)}
                />
              }
            />
            <Bar 
              dataKey={activeChart} 
              fill={`var(--color-${activeChart})`}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm pt-4 pb-6">
        <div className="flex gap-2 font-medium leading-relaxed">
          Community health trending positive <IconTrendingUp className="size-4" />
        </div>
        <div className="text-muted-foreground leading-relaxed">
          {approvedPercentage}% of messages approved automatically
        </div>
      </CardFooter>
    </Card>
  )
} 