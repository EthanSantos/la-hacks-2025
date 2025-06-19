'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAvatarHeadshot } from '@/hooks/useAvatarHeadshot';
import type { Message } from '@/types/sentiment';
import { createClient } from '@supabase/supabase-js';
import { 
  User, 
  MessageSquare, 
  TrendingUp, 
  Shield, 
  AlertTriangle, 
  Clock,
  UserX,
  Ban
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface PlayerDetailsDialogProps {
  message: Message | null;
  isOpen: boolean;
  onClose: () => void;
}

interface PlayerStats {
  totalMessages: number;
  averageSentiment: number;
  positiveMessages: number;
  negativeMessages: number;
  neutralMessages: number;
  lastSeen: string;
  firstSeen: string;
}

export default function PlayerDetailsDialog({ message, isOpen, onClose }: PlayerDetailsDialogProps) {
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(false);

  const { url: avatarUrl } = useAvatarHeadshot(message?.player_id?.toString());

  const fetchPlayerStats = async (playerId: number) => {
    setLoading(true);
    try {
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false });

      if (messages && messages.length > 0) {
        const totalMessages = messages.length;
        const avgSentiment = messages.reduce((sum, msg) => sum + (msg.sentiment_score || 0), 0) / totalMessages;
        const positiveMessages = messages.filter(msg => (msg.sentiment_score || 0) > 25).length;
        const negativeMessages = messages.filter(msg => (msg.sentiment_score || 0) < -25).length;
        const neutralMessages = totalMessages - positiveMessages - negativeMessages;

        setPlayerStats({
          totalMessages,
          averageSentiment: Math.round(avgSentiment * 10) / 10,
          positiveMessages,
          negativeMessages,
          neutralMessages,
          lastSeen: messages[0].created_at,
          firstSeen: messages[messages.length - 1].created_at,
        });
      }
    } catch (error) {
      console.error('Failed to fetch player stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && message?.player_id) {
      fetchPlayerStats(message.player_id);
    }
  }, [isOpen, message?.player_id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSentimentColor = (score: number) => {
    if (score > 25) return 'text-green-600';
    if (score < -25) return 'text-red-600';
    return 'text-gray-600';
  };

  const getSentimentBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score > 25) return 'default';
    if (score < -25) return 'destructive';
    return 'secondary';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!message) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Player Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Player Info Section */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="bg-blue-500 text-white text-lg font-medium">
                {getInitials(message.player_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{message.player_name}</h3>
              <p className="text-sm text-gray-600">Player ID: {message.player_id}</p>
              {playerStats && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Badge variant="outline">{playerStats.totalMessages} messages</Badge>
                  <Badge variant={playerStats.averageSentiment > 0 ? 'default' : 'destructive'}>
                    Avg: {playerStats.averageSentiment > 0 ? '+' : ''}{playerStats.averageSentiment}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Selected Message */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4" />
                Selected Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-800">{message.message}</p>
              </div>
              <div className="flex justify-between items-center mt-4 text-sm">
                <span className="text-gray-500 flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDate(message.created_at)}
                </span>
                <Badge variant={getSentimentBadgeVariant(message.sentiment_score)}>
                  Sentiment: {message.sentiment_score > 0 ? '+' : ''}{message.sentiment_score}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Stats and Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Statistics */}
            {playerStats && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-4 w-4" />
                    Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Messages:</span>
                      <span className="font-medium">{playerStats.totalMessages}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Positive:</span>
                      <span className="font-medium text-green-600">{playerStats.positiveMessages}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Neutral:</span>
                      <span className="font-medium text-gray-600">{playerStats.neutralMessages}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Negative:</span>
                      <span className="font-medium text-red-600">{playerStats.negativeMessages}</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-600">First Seen:</span>
                      <p className="font-medium text-xs mt-1">{formatDate(playerStats.firstSeen)}</p>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Last Seen:</span>
                      <p className="font-medium text-xs mt-1">{formatDate(playerStats.lastSeen)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Moderation Actions */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4" />
                  Moderation Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50" 
                  size="sm"
                  onClick={() => console.log('Warn player:', message.player_id)}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Warn Player
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-orange-600 hover:text-orange-700 hover:bg-orange-50" 
                  size="sm"
                  onClick={() => console.log('Kick player:', message.player_id)}
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Kick Player
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full justify-start" 
                  size="sm"
                  onClick={() => console.log('Ban player:', message.player_id)}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Ban Player
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  These actions are currently disabled for demo purposes.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 