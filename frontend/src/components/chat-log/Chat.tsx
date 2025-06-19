'use client';

import { useEffect, useCallback } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLiveMessages } from '@/hooks/useLiveMessages';
import MessageItem from '@/components/chat-log/MessageItem';

export default function ChatLog({ title = "Live Chat Log" }) {
    const {
        messages,
        error,
        loading,
        fetchMessages
    } = useLiveMessages();
    
    // Handle manual refresh
    const handleRefresh = useCallback(() => {
        console.log('Manual refresh triggered');
        fetchMessages(true); // Force refresh
    }, [fetchMessages]);
    
    // Initial fetch and polling
    useEffect(() => {
        console.log('Setting up initial fetch and polling');
        
        // Fetch immediately on mount
        fetchMessages(true);

        // Set up polling
        const interval = setInterval(() => {
            console.log('Polling fetch triggered');
            fetchMessages(false); // Regular polling, not forced
        }, 10000); // Poll every 10 seconds

        // Clean up interval on unmount
        return () => {
            console.log('Cleaning up polling interval');
            clearInterval(interval);
        };
    }, [fetchMessages]);

    return (
        <div className="h-full flex flex-col overflow-hidden border border-gray-200 rounded-lg bg-white">
            <div className="p-3 lg:p-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg lg:text-xl font-semibold">{title}</h2>
                    <div className="flex items-center gap-2 lg:gap-4">
                        {error && <p className="text-red-500 text-xs lg:text-sm">{error}</p>}
                        <Button 
                            variant="outline" 
                            onClick={handleRefresh} 
                            disabled={loading}
                            size="sm"
                            className="text-xs"
                        >
                            {loading ? 'Refreshing...' : 'Refresh'}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
                <div className="p-3 lg:p-4 space-y-3 lg:space-y-4">
                    {loading && messages.length === 0 ? (
                        <div className="text-center text-gray-500 text-sm">Loading messages...</div>
                    ) : messages.length === 0 ? (
                        <div className="text-center text-gray-500 text-sm">No messages found</div>
                    ) : (
                        messages.map((msg) => (
                            <MessageItem key={msg.message_id} msg={msg} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}