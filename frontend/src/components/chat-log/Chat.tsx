'use client';

import React from 'react';
import { useEffect, useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Filter, Smile, Meh, Frown, MessageCircle, Search } from 'lucide-react';
import { useLiveMessages } from '@/hooks/useLiveMessages';
import MessageItem from '@/components/chat-log/MessageItem';

export default function ChatLog({ title = "Live Chat Log" }) {
    const { messages, error, loading, fetchMessages } = useLiveMessages();

    const [search, setSearch] = useState('');

    // Manual refresh handler
    const handleRefresh = useCallback(() => {
        fetchMessages(true);
    }, [fetchMessages]);

    // Polling
    useEffect(() => {
        fetchMessages(true);
        const interval = setInterval(() => fetchMessages(false), 10000);
        return () => clearInterval(interval);
    }, [fetchMessages]);

    const filteredMessages = useMemo(() => {
        if (!search.trim()) return messages;
        const query = search.toLowerCase();
        return messages.filter(m =>
            m.message.toLowerCase().includes(query) ||
            m.player_name.toLowerCase().includes(query) ||
            m.player_id?.toString().includes(query)
        );
    }, [messages, search]);

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