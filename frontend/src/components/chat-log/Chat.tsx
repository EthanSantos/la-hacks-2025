'use client';

import React from 'react';
import { useEffect, useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Filter, Smile, Meh, Frown, MessageCircle, Search } from 'lucide-react';
import { useLiveMessages } from '@/hooks/useLiveMessages';
import MessageItem from '@/components/chat-log/MessageItem';
import { supabase } from '@/lib/supabase';

export default function ChatLog({ title = "Live Chat Log" }) {
    const { messages, error, loading, fetchMessages } = useLiveMessages();

    const [filter, setFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');
    const [search, setSearch] = useState('');

    // Manual refresh handler
    const handleRefresh = useCallback(() => {
        fetchMessages(true);
    }, [fetchMessages]);

    const fetchStats = useCallback(async () => {
    }, []);

    // Polling
    useEffect(() => {
        if (!messages || messages.length === 0) {
            fetchMessages(true);
        }
        fetchStats();
    }, [fetchMessages, fetchStats, messages]);

    // Filtered list
    const sentimentFiltered = useMemo(() => {
        switch (filter) {
            case 'positive':
                return messages.filter(m => m.sentiment_score > 25);
            case 'neutral':
                return messages.filter(m => m.sentiment_score >= -25 && m.sentiment_score <= 25);
            case 'negative':
                return messages.filter(m => m.sentiment_score < -25);
            default:
                return messages;
        }
    }, [messages, filter]);

    const filteredMessages = useMemo(() => {
        if (!search.trim()) return sentimentFiltered;
        const query = search.toLowerCase();
        return sentimentFiltered.filter(m =>
            m.message.toLowerCase().includes(query) ||
            m.player_name.toLowerCase().includes(query) ||
            m.player_id?.toString().includes(query)
        );
    }, [sentimentFiltered, search]);

    // Helper to label dates
    const isSameDay = (d1: Date, d2: Date) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

    const getDateLabel = (date: Date) => {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (isSameDay(date, today)) return 'Today';
        if (isSameDay(date, yesterday)) return 'Yesterday';

        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Combine messages with date separators
    const renderMessages = () => {
        const elements: React.ReactNode[] = [];
        let lastDateKey = '';
        filteredMessages.forEach((msg) => {
            const dateObj = new Date(msg.created_at);
            const dateKey = dateObj.toDateString();
            if (dateKey !== lastDateKey) {
                elements.push(
                    <div key={`sep-${dateKey}`} className="sticky top-0 z-10 bg-white/80 backdrop-blur text-xs text-gray-500 py-1 px-2">
                        {getDateLabel(dateObj)}
                    </div>
                );
                lastDateKey = dateKey;
            }
            elements.push(<MessageItem key={msg.message_id} msg={msg} />);
        });
        return elements;
    };

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
    }, [fetchStats]);

    return (
        <div className="h-full flex flex-col overflow-hidden border border-gray-200 rounded-lg bg-white">
            {/* Header */}
            <div className="p-3 lg:p-4 border-b border-gray-200 flex-shrink-0 space-y-2">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg lg:text-xl font-semibold">{title} ({filteredMessages.length})</h2>
                    <div className="flex items-center gap-2 lg:gap-4">
                        {error && <p className="text-red-500 text-xs lg:text-sm">{error}</p>}
                        <Button variant="outline" onClick={handleRefresh} disabled={loading} size="sm" className="text-xs">
                            {loading ? 'Refreshing...' : 'Refresh'}
                        </Button>
                    </div>
                </div>
                {/* Filters & Search */}
                <div className="flex flex-1 gap-3 items-center mt-3">
                    {/* Search with icon */}
                    <div className="relative flex-grow">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Search by player, ID, or text..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="h-9 pl-9 w-full text-sm"
                      />
                    </div>

                    {/* Filter dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-9 w-9">
                          <Filter className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuRadioGroup value={filter} onValueChange={setFilter as any}>
                          <DropdownMenuRadioItem value="all" className="flex items-center gap-2">
                              <MessageCircle className="h-3 w-3" /> All
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="positive" className="flex items-center gap-2">
                              <Smile className="h-3 w-3 text-green-500" /> Positive
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="neutral" className="flex items-center gap-2">
                              <Meh className="h-3 w-3 text-gray-500" /> Neutral
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="negative" className="flex items-center gap-2">
                              <Frown className="h-3 w-3 text-red-500" /> Negative
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto min-h-0">
                <div className="p-3 lg:p-4 space-y-3 lg:space-y-4">
                    {loading && filteredMessages.length === 0 ? (
                        <div className="text-center text-gray-500 text-sm">Loading messages...</div>
                    ) : filteredMessages.length === 0 ? (
                        <div className="text-center text-gray-500 text-sm">No messages found</div>
                    ) : (
                        renderMessages()
                    )}
                </div>
            </div>
        </div>
    );
}