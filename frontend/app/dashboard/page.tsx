'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLiveMessages } from '@/hooks/useLiveMessages';

export default function Dashboard() {
  const {
    messages,
    error,
    loading,
    fetchMessages
  } = useLiveMessages(); // use the custom hook
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Scroll to bottom on initial load and when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Initial fetch and polling
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, []);

  const getSentimentColor = (score: number) => {
    if (score >= 75) return 'bg-green-500';
    if (score >= 25) return 'bg-green-300';
    if (score > -25) return 'bg-gray-300';
    if (score > -75) return 'bg-red-300';
    return 'bg-red-500';
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Live Chat Log</h1>
        <Button variant="outline" onClick={fetchMessages} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>

      <Card className="h-[calc(100vh-200px)] flex flex-col">
        <CardHeader className="border-b p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Messages</h2>
            {error && <p className="text-red-500">{error}</p>}
          </div>
        </CardHeader>

        <ScrollArea className="flex-1 overflow-y-auto" ref={scrollAreaRef}>
          <CardContent className="space-y-4 p-4">
            {loading && messages.length === 0 ? (
              <div className="text-center text-gray-500">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500">No messages found</div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.message_id}
                    className="flex flex-col gap-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{msg.player_name}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div
                        className={`${getSentimentColor(msg.sentiment_score)} text-white text-xs font-bold px-2 py-1 rounded`}
                      >
                        {msg.sentiment_score}
                      </div>
                    </div>
                    <p className="text-sm break-words">{msg.message}</p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </CardContent>
        </ScrollArea>
      </Card>
    </div>
  );
}