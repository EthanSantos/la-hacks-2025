'use client';

import { useState, useEffect } from 'react';
import { useAvatarHeadshot } from '@/hooks/useAvatarHeadshot';
import { sentimentApi } from '@/lib/api/sentiment';
import { TopPlayer } from '@/types/sentiment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, MessageSquare, TrendingUp, BarChart2, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SideNavbar from '@/components/Navbar'; // Import the SideNavbar component

const LeaderboardPage = () => {
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchTopPlayers = async () => {
    try {
      setIsLoading(true);
      const data = await sentimentApi.getTopPlayers(10);
      setTopPlayers(data);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch top players:', err);
      setError('Failed to load leaderboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTopPlayers();
    
    const intervalId = setInterval(fetchTopPlayers, 60000); // Refresh every minute
    
    return () => clearInterval(intervalId);
  }, []);

  // calculate total messages and average score
  const totalMessages = topPlayers.reduce((sum, player) => sum + player.message_count, 0);
  const avgScore = topPlayers.length > 0 
    ? Math.round(topPlayers.reduce((sum, player) => sum + player.total_sentiment_score, 0) / topPlayers.length) 
    : 0;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <SideNavbar />
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="py-8 px-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Sentiment Leaderboard
              </h1>
              <p className="text-gray-500">
                Top players ranked by total sentiment score across all messages
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTopPlayers}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Players</CardDescription>
                <CardTitle className="flex items-center">
                  <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
                  {isLoading ? <Skeleton className="h-7 w-20" /> : topPlayers.length}
                </CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Messages</CardDescription>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2 text-blue-500" />
                  {isLoading ? <Skeleton className="h-7 w-20" /> : totalMessages}
                </CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Highest Score</CardDescription>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
                  {isLoading ? (
                    <Skeleton className="h-7 w-20" />
                  ) : (
                    topPlayers.length > 0 ? topPlayers[0].total_sentiment_score : 0
                  )}
                </CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Average Score</CardDescription>
                <CardTitle className="flex items-center">
                  <BarChart2 className="h-4 w-4 mr-2 text-purple-500" />
                  {isLoading ? <Skeleton className="h-7 w-20" /> : avgScore}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Main Leaderboard */}
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Top Players</CardTitle>
                <CardDescription>Players with the highest total sentiment scores</CardDescription>
              </div>
              {lastUpdated && (
                <div className="text-xs text-gray-500">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
              )}
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="text-center py-8 text-red-500">
                  <p>{error}</p>
                  <Button 
                    onClick={fetchTopPlayers} 
                    className="mt-4"
                    variant="outline"
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead>Total Score</TableHead>
                      <TableHead>Messages</TableHead>
                      <TableHead className="text-right">Average Sentiment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array(5).fill(0).map((_, index) => (
                        <TableRow key={`skeleton-${index}`}>
                          <TableCell><Skeleton className="h-6 w-6" /></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <Skeleton className="h-6 w-32" />
                            </div>
                          </TableCell>
                          <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : topPlayers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No player data found
                        </TableCell>
                      </TableRow>
                    ) : (
                      topPlayers.map((player, index) => (
                        <PlayerRow 
                          key={player.player_id} 
                          player={player} 
                          rank={index + 1} 
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

interface PlayerRowProps {
  player: TopPlayer;
  rank: number;
}

const PlayerRow = ({ player, rank }: PlayerRowProps) => {
  const { url: avatarUrl, loading: avatarLoading, error: avatarError } = useAvatarHeadshot(player.player_id);
  
  // Calculate average score per message
  const avgScorePerMessage = player.message_count > 0 
    ? Math.round((player.total_sentiment_score / player.message_count) * 10) / 10
    : 0;

  // top 3 ranks
  const getMedal = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2: return <Trophy className="h-5 w-5 text-gray-400" />;
      case 3: return <Trophy className="h-5 w-5 text-amber-700" />;
      default: return rank;
    }
  };

  const getSentimentColor = (score: number) => {
    if (score >= 500) return 'bg-green-500';
    if (score >= 100) return 'bg-green-400';
    if (score >= 0) return 'bg-green-300';
    if (score > -100) return 'bg-red-300';
    if (score > -500) return 'bg-red-400';
    return 'bg-red-500';
  };

  // Get initials from player name for avatar fallback
  const getInitials = (name: string): string => {
    if (!name) return '?';
    
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <TableRow className={rank <= 3 ? 'bg-gray-50' : ''}>
      <TableCell className="font-medium">
        <div className="flex justify-center items-center h-8 w-8">
          {getMedal(rank)}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          {avatarLoading ? (
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
          ) : avatarUrl && !avatarError ? (
            <img 
              src={avatarUrl} 
              alt={`${player.player_name}'s avatar`}
              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm">
              {getInitials(player.player_name)}
            </div>
          )}
          <span className="font-medium">{player.player_name}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge className={`${getSentimentColor(player.total_sentiment_score)} text-white`}>
          {player.total_sentiment_score > 0 ? '+' : ''}{player.total_sentiment_score}
        </Badge>
      </TableCell>
      <TableCell>{player.message_count}</TableCell>
      <TableCell className="text-right">
        <span className={avgScorePerMessage >= 0 ? 'text-green-600' : 'text-red-600'}>
          {avgScorePerMessage > 0 ? '+' : ''}{avgScorePerMessage}
        </span>
      </TableCell>
    </TableRow>
  );
};

export default LeaderboardPage;