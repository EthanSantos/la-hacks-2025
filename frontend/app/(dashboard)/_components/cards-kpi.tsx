import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react"
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { mockMetrics, mockTrends, TrendDirection } from "@/data/mock-data"

export function CardsKPI() {
  return (
    <div className="grid grid-cols-1 gap-4 @xl/page:grid-cols-2 @5xl/page:grid-cols-4">
      <Card className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs dark:bg-card">
        <CardHeader>
          <CardDescription>Total Messages</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {mockMetrics.totalMessages.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="gap-1">
              {(mockTrends.totalMessages.trend as TrendDirection) === "up" ? (
                <IconTrendingUp className="h-3 w-3" />
              ) : (
                <IconTrendingDown className="h-3 w-3" />
              )}
              {(mockTrends.totalMessages.trend as TrendDirection) === "up" ? "+" : ""}{mockTrends.totalMessages.change}%
            </Badge>
          </CardAction>
        </CardHeader>
      </Card>

      <Card className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs dark:bg-card">
        <CardHeader>
          <CardDescription>Active Users</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {mockMetrics.activeUsers.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="gap-1">
              {(mockTrends.activeUsers.trend as TrendDirection) === "up" ? (
                <IconTrendingUp className="h-3 w-3" />
              ) : (
                <IconTrendingDown className="h-3 w-3" />
              )}
              {(mockTrends.activeUsers.trend as TrendDirection) === "up" ? "+" : ""}{mockTrends.activeUsers.change}%
            </Badge>
          </CardAction>
        </CardHeader>
      </Card>

      <Card className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs dark:bg-card">
        <CardHeader>
          <CardDescription>Safety Score</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {mockMetrics.safetyScore}%
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="gap-1">
              {(mockTrends.safetyScore.trend as TrendDirection) === "up" ? (
                <IconTrendingUp className="h-3 w-3" />
              ) : (
                <IconTrendingDown className="h-3 w-3" />
              )}
              {(mockTrends.safetyScore.trend as TrendDirection) === "up" ? "+" : ""}{mockTrends.safetyScore.change}%
            </Badge>
          </CardAction>
        </CardHeader>
      </Card>

      <Card className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs dark:bg-card">
        <CardHeader>
          <CardDescription>Avg Response Time</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {mockMetrics.avgResponseTime}ms
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="gap-1">
              {(mockTrends.avgResponseTime.trend as TrendDirection) === "down" ? (
                <IconTrendingDown className="h-3 w-3" />
              ) : (
                <IconTrendingUp className="h-3 w-3" />
              )}
              {(mockTrends.avgResponseTime.trend as TrendDirection) === "down" ? "" : "+"}{mockTrends.avgResponseTime.change}%
            </Badge>
          </CardAction>
        </CardHeader>
      </Card>
    </div>
  )
} 