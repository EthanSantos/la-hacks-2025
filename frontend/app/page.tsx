'use client';

import { useEffect, useState } from 'react';
import ChatLog from '@/components/chat-log/Chat';
import SentimentAnalyzer from "@/components/sentiment-analyzer/SentimentAnalyzer";
import { useLiveMessages } from '@/hooks/useLiveMessages';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@supabase/supabase-js';
import SideNavbar from '@/components/Navbar'; // Import the new SideNavbar component

// Supabase client initialization
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// StatsCard Component
interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  isLoading?: boolean;
}

function StatsCard({ title, value, description, isLoading = false }: StatsCardProps) {
  return (
    <Card className="bg-white">
      <CardContent className="p-3">
        <div className="text-sm font-medium text-gray-500">{title}</div>
        <div className="text-xl font-bold">
          {isLoading ? (
            <span className="text-gray-300">Loading...</span>
          ) : (
            value
          )}
        </div>
        {description && (
          <div className="text-xs text-gray-500">{description}</div>
        )}
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const { messages, fetchMessages } = useLiveMessages();
  const [stats, setStats] = useState({
    totalMessages: 0,
    uniquePlayers: 0,
    avgSentiment: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch stats function
  const fetchStats = async () => {
    try {
      const [messagesResponse, playersResponse] = await Promise.all([
        supabase.from('messages').select('*', { count: 'exact', head: true }),
        supabase.from('players').select('*', { count: 'exact', head: true })
      ]);

      if (messagesResponse.error) {
        console.error('Error fetching message count:', messagesResponse.error);
      }

      if (playersResponse.error) {
        console.error('Error fetching player count:', playersResponse.error);
      }

      let avgSentiment = 0;
      if (messages && messages.length > 0) {
        const totalSentiment = messages.reduce((sum, msg) => sum + msg.sentiment_score, 0);
        avgSentiment = totalSentiment / messages.length;
      }

      setStats({
        totalMessages: messagesResponse.count || 0,
        uniquePlayers: playersResponse.count || 0,
        avgSentiment: avgSentiment,
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!messages || messages.length === 0) {
      fetchMessages(true);
    }
    fetchStats();
  }, [fetchMessages]);

  useEffect(() => {
    if (messages && messages.length > 0 && !isLoading) {
      const totalSentiment = messages.reduce((sum, msg) => sum + msg.sentiment_score, 0);
      const avgSentiment = totalSentiment / messages.length;

      setStats(prevStats => ({
        ...prevStats,
        avgSentiment: avgSentiment
      }));
    }
  }, [messages, isLoading]);

  useEffect(() => {
    const messagesSubscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchStats();
      })
      .subscribe();

    const playersSubscription = supabase
      .channel('public:players')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
      supabase.removeChannel(playersSubscription);
    };
  }, []);

  const formatSentiment = (value: number) => {
    return value.toFixed(2);
  };

  const getSentimentDescription = (value: number) => {
    if (value >= 0.5) return "Positive";
    if (value >= 0) return "Neutral";
    if (value >= -0.5) return "Slightly Negative";
    return "Negative";
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Side Navbar */}
      <SideNavbar />
      
      {/* Content container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="container mx-auto flex-1 flex flex-col p-6 overflow-hidden">
          {/* Header */}
          <div className="mb-4 flex-shrink-0">
            <h1 className="text-2xl font-bold">Sentiment Analysis Dashboard</h1>
            <p className="text-gray-600 text-sm">Monitor chat messages and analyze sentiment in real-time</p>
          </div>

          {/* Main content area */}
          <div className="grid grid-cols-3 gap-4 flex-1 overflow-hidden">
            {/* Left column - Chat container */}
            <div className="col-span-2 overflow-hidden">
              <ChatLog title="Live Chat Messages" />
            </div>

            {/* Right column */}
            <div className="col-span-1 flex flex-col gap-4 overflow-auto">
              <div className="flex-1 overflow-hidden flex flex-col">
                <SentimentAnalyzer />
              </div>

              {/* Stats Cards container */}
              <div className="space-y-3 flex-shrink-0">
                <StatsCard
                  title="Total Messages"
                  value={stats.totalMessages}
                  description="All-time message count"
                  isLoading={isLoading}
                />
                <StatsCard
                  title="Unique Players"
                  value={stats.uniquePlayers}
                  description="Total registered players"
                  isLoading={isLoading}
                />
                <StatsCard
                  title="Average Sentiment"
                  value={formatSentiment(stats.avgSentiment)}
                  description={`${getSentimentDescription(stats.avgSentiment)} (visible messages)`}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}