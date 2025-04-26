'use client';

import { useEffect, useCallback } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLiveMessages } from '@/hooks/useLiveMessages';
import MessageItem from '@/components/chat-log/MessageItem';

export default function Dashboard() {
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
        }, 10000); // Poll every 10 seconds ( we can decrease during demo day )

        return () => {
            console.log('Cleaning up polling interval');
            clearInterval(interval);
        };
    }, [fetchMessages]);

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Live Chat Log</h1>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        onClick={handleRefresh} 
                        disabled={loading}
                    >
                        {loading ? 'Refreshing...' : 'Refresh Data'}
                    </Button>
                </div>
            </div>

            <Card className="h-[calc(100vh-200px)] flex flex-col">
                <CardHeader className="border-b p-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Messages</h2>
                        {error && <p className="text-red-500">{error}</p>}
                    </div>
                </CardHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading && messages.length === 0 ? (
                        <div className="text-center text-gray-500">Loading messages...</div>
                    ) : messages.length === 0 ? (
                        <div className="text-center text-gray-500">No messages found</div>
                    ) : (
                        <>
                            {messages.map((msg) => (
                                <MessageItem key={msg.message_id} msg={msg} />
                            ))}
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
}