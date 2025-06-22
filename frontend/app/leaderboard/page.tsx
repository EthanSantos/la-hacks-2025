"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, MessageSquare, TrendingUp, BarChart2, RefreshCcw } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { sentimentApi } from "@/lib/api/sentiment"
import TopLeaders from "@/components/leaderboard/top-leaders"
import { TopPlayer } from "@/types/sentiment"
import { useEffect } from "react"

export default function LeaderboardPage() {
  const [limit, setLimit] = useState(10)
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Use the same approach as the working old leaderboard
  const fetchTopPlayers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await sentimentApi.getTopPlayers(limit)
      setTopPlayers(data)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to fetch top players:', err)
      setError('Failed to load leaderboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTopPlayers()
    
    const intervalId = setInterval(fetchTopPlayers, 60000) // Refresh every minute
    
    return () => clearInterval(intervalId)
  }, [limit])

  // Calculate statistics from real API data
  const totalMessages = topPlayers.reduce((sum, player) => sum + player.message_count, 0)
  const avgScore = topPlayers.length > 0 
    ? Math.round(topPlayers.reduce((sum, player) => sum + player.total_sentiment_score, 0) / topPlayers.length) 
    : 0
  const highestScore = topPlayers.length > 0 ? topPlayers[0].total_sentiment_score : 0

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-4 lg:p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-500" />
                Leaderboard
              </h1>
              <Button onClick={fetchTopPlayers} variant="outline" size="sm" disabled={loading}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            <p className="text-gray-600">
              Top players ranked by sentiment score and community contribution
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Players</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : topPlayers.length}</div>
                <p className="text-xs text-muted-foreground">Active contributors</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : totalMessages}</div>
                <p className="text-xs text-muted-foreground">Messages analyzed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : highestScore}</div>
                <p className="text-xs text-muted-foreground">Best performer</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <BarChart2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : avgScore}</div>
                <p className="text-xs text-muted-foreground">Community average</p>
              </CardContent>
            </Card>
          </div>

          {/* Error State */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-red-600">{error}</p>
                <Button onClick={fetchTopPlayers} className="mt-2" variant="outline" size="sm">
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Top Leaders Component */}
          <TopLeaders 
            players={topPlayers}
            loading={loading}
            onLimitChange={setLimit}
            currentLimit={limit}
          />
        </div>
      </main>
    </div>
  )
}