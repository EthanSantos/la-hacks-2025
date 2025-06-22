"use client"

import { useState, useEffect } from "react"
import { Trophy, Medal, Award } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { TopPlayer } from "@/types/sentiment"
import { Dispatch, SetStateAction } from "react"
import { useAvatarHeadshot } from "@/hooks/useAvatarHeadshot"

interface TopLeadersProps {
  players: TopPlayer[]
  loading: boolean
  onLimitChange: Dispatch<SetStateAction<number>>
  currentLimit: number
}

// Custom Avatar component that fetches Roblox avatar with mapping
const RobloxAvatar = ({ playerId, username, className }: { playerId: number, username: string, className: string }) => {
  const { url: avatarUrl, loading: isLoading } = useAvatarHeadshot(playerId)

  return (
    <Avatar className={className}>
      {!isLoading && avatarUrl && <AvatarImage src={avatarUrl} alt={`${username}'s avatar`} />}
      <AvatarFallback className={`${className.includes('h-20') || className.includes('h-24') ? 'text-lg sm:text-xl' : 'text-sm sm:text-lg'} font-bold`}>
        {username.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )
}

export default function TopLeaders({ players, loading, onLimitChange, currentLimit }: TopLeadersProps) {
  const [animateIn, setAnimateIn] = useState(false)

  useEffect(() => {
    setAnimateIn(false)
    const timer = setTimeout(() => setAnimateIn(true), 100)
    return () => clearTimeout(timer)
  }, [players])

  // Add rank to players and convert API data to display format
  const data = players.map((player, index) => ({
    ...player,
    rank: index + 1,
    username: player.player_name,
    score: player.total_sentiment_score,
    positiveActions: player.message_count, // Using message count as positive actions indicator
  }))
  
  const topThree = data.slice(0, 3)
  const remaining = data.slice(3)

  // Debug logging
  console.log('TopLeaders Debug:', {
    totalPlayers: players.length,
    dataLength: data.length,
    topThreeLength: topThree.length,
    remainingLength: remaining.length,
    currentLimit,
    data: data.map(p => ({ rank: p.rank, username: p.username, score: p.score }))
  })

  const getPodiumHeight = (position: number) => {
    const heights = { 1: "h-32", 2: "h-24", 3: "h-20" }
    return heights[position as keyof typeof heights]
  }

  const getPositionIcon = (position: number) => {
    const iconClass = "h-6 w-6"
    switch(position) {
      case 1: return <Trophy className={`${iconClass} text-yellow-500`} />
      case 2: return <Medal className={`${iconClass} text-gray-400`} />
      case 3: return <Award className={`${iconClass} text-amber-600`} />
      default: return null
    }
  }

  const getPodiumColors = (position: number) => {
    const colors = {
      1: {
        border: "border-yellow-500/30",
        bg: "bg-gradient-to-t from-yellow-500/5 to-card shadow-xs",
        avatar: "ring-yellow-500",
        text: "text-yellow-500"
      },
      2: {
        border: "border-gray-400/30", 
        bg: "bg-gradient-to-t from-gray-400/5 to-card shadow-xs",
        avatar: "ring-gray-400",
        text: "text-gray-400"
      },
      3: {
        border: "border-amber-600/30",
        bg: "bg-gradient-to-t from-amber-600/5 to-card shadow-xs", 
        avatar: "ring-amber-600",
        text: "text-amber-600"
      }
    }
    return colors[position as keyof typeof colors]
  }

  const LoadingSkeleton = ({ position }: { position: number }) => (
    <div className="text-center flex-1 min-w-0 max-w-[160px] sm:max-w-[180px] md:max-w-[200px]">
      <div className="mb-4">
        <Skeleton className={`${position === 1 ? 'h-20 w-20 sm:h-24 sm:w-24' : 'h-16 w-16 sm:h-20 sm:w-20'} mx-auto mb-3 rounded-full`} />
        <Skeleton className={`h-6 w-24 mx-auto mb-2`} />
        <Skeleton className="h-4 w-16 mx-auto mb-2" />
        <Skeleton className="h-6 w-20 mx-auto" />
      </div>
      <Skeleton className={getPodiumHeight(position)} />
    </div>
  )

  const PodiumPlayer = ({ player, position, delay }: { player: any, position: number, delay: string }) => (
    <div className={`text-center flex-1 min-w-0 ${position === 1 ? 'max-w-[180px] sm:max-w-[200px] md:max-w-[220px]' : 'max-w-[160px] sm:max-w-[180px] md:max-w-[200px]'}`}>
      <div className={`mb-4 transform transition-all duration-500 ${animateIn ? 'scale-100 translate-y-0' : 'scale-90 translate-y-2'}`}
           style={{ transitionDelay: delay }}>
        <RobloxAvatar 
          playerId={player?.player_id}
          username={player?.username}
          className={`${position === 1 ? 'h-20 w-20 sm:h-24 sm:w-24' : 'h-16 w-16 sm:h-20 sm:w-20'} mx-auto mb-3 ring-4 ${getPodiumColors(position).avatar} ring-offset-2 ring-offset-background`}
        />
        <h3 className={`${position === 1 ? 'font-bold text-lg sm:text-xl' : 'font-semibold text-sm sm:text-lg'} truncate px-1`} title={player?.username}>
          {player?.username}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-2">{player?.positiveActions} messages</p>
        <div className="flex items-center justify-center gap-2">
          <Badge 
            variant={position === 1 ? "default" : "secondary"} 
            className={`text-xs sm:text-sm font-bold pointer-events-none ${
              position === 1 ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' : ''
            }`}
          >
            {player?.score.toLocaleString()} pts
          </Badge>
        </div>
      </div>
      <Card className={`${getPodiumHeight(position)} ${getPodiumColors(position).border} ${getPodiumColors(position).bg} transform transition-all duration-500 ${animateIn ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
            style={{ transitionDelay: `${parseInt(delay) + 100}ms` }}>
        <CardContent className="h-full flex items-center justify-center">
          <div className="text-center">
            {getPositionIcon(position)}
            <p className={`${position === 1 ? 'text-4xl' : 'text-3xl'} font-bold mt-2 ${getPodiumColors(position).text}`}>
              {position}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Limit Selector */}
      <div className="flex justify-center">
        <Select value={currentLimit.toString()} onValueChange={(value) => onLimitChange(parseInt(value))}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Number of players" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">Top 5 Players</SelectItem>
            <SelectItem value="10">Top 10 Players</SelectItem>
            <SelectItem value="20">Top 20 Players</SelectItem>
            <SelectItem value="50">Top 50 Players</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Podium Section */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-medium mb-2">
            Top Contributors
            <span className="text-base font-normal text-muted-foreground ml-2">
              Bloom
            </span>
          </h2>
        </div>

        <div className="flex justify-center items-end gap-2 sm:gap-4 md:gap-8 mb-8 px-2">
          {/* Second Place */}
          {loading ? (
            <LoadingSkeleton position={2} />
          ) : topThree[1] ? (
            <PodiumPlayer player={topThree[1]} position={2} delay="100ms" />
          ) : null}

          {/* First Place */}
          {loading ? (
            <LoadingSkeleton position={1} />
          ) : topThree[0] ? (
            <PodiumPlayer player={topThree[0]} position={1} delay="300ms" />
          ) : null}

          {/* Third Place */}
          {loading ? (
            <LoadingSkeleton position={3} />
          ) : topThree[2] ? (
            <PodiumPlayer player={topThree[2]} position={3} delay="500ms" />
          ) : null}
        </div>
      </div>

      {/* Remaining Players List */}
      {loading ? (
        <div className="space-y-4">
          <h3 className="text-xl font-medium text-center">Community Leaders</h3>
          <div className="grid gap-3">
            {Array.from({ length: Math.max(0, currentLimit - 3) }).map((_, index) => (
              <Card key={index} className="shadow-xs">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-6 w-32 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : remaining.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-xl font-medium text-center">Community Leaders</h3>
          
          <div className="grid gap-3">
            {remaining.map((player, index) => (
              <Card 
                key={player.player_id}
                className={`shadow-xs transform transition-all duration-200 focus:outline-none ${animateIn ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}`}
                style={{ transitionDelay: `${700 + index * 100}ms` }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-muted-foreground min-w-[40px]">
                      {player.rank}
                    </div>
                    
                    <RobloxAvatar 
                      playerId={player.player_id}
                      username={player.username}
                      className="h-12 w-12"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold truncate">{player.username}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {player.positiveActions.toLocaleString()} messages
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-md font-bold pointer-events-none">
                          {player.score.toLocaleString()} pts
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : data.length > 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            <p className="text-lg font-medium mb-2">No additional players</p>
            <p className="text-sm">
              Only the top 3 players are available.
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            <p className="text-lg font-medium mb-2">No players found</p>
            <p className="text-sm">
              No leaderboard data available from the API.
            </p>
          </div>
        </div>
      )}
    </div>
  )
} 