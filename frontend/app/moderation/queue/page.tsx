"use client"

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IconClock, IconCheck, IconX, IconAlertTriangle } from "@tabler/icons-react"
import { FlaggedMessage } from '@/types/sentiment';
import { moderationApi } from '@/lib/api/sentiment';

export default function ModerationQueuePage() {
  const [queueItems, setQueueItems] = useState<FlaggedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingActions, setProcessingActions] = useState<Set<string>>(new Set());
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchQueueItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const messages = await moderationApi.getFlaggedMessages(100);
      setQueueItems(messages);
    } catch (err) {
      console.error('Failed to fetch flagged messages:', err);
      setError('Failed to load queued messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueItems();
  }, []);

  const handleAction = async (messageId: string, action: string) => {
    try {
      setProcessingActions(prev => new Set(prev).add(messageId));
      
      // Find the message to get the AI-generated reason
      const message = queueItems.find(item => item.message_id === messageId);
      
      // For approve action, we don't need a reason
      // For ban action, we use the AI-generated reason
      let request: { action: string; reason?: string } = { action };
      
      if (action === 'ban' && message?.moderation_reason) {
        request = { action, reason: message.moderation_reason };
      }
      
      const result = await moderationApi.reviewMessage(messageId, request);
      
      // Only remove the message if the API call was successful
      if (result && result.success) {
        // Remove the message from the queue immediately
        setQueueItems(prev => 
          prev.filter(item => item.message_id !== messageId)
        );
        setSuccessMessage(`Player ${action}ed successfully!`);
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        console.error('API returned failure:', result);
        setError(`Failed to ${action} message: API returned failure`);
      }
    } catch (err) {
      console.error('Action failed:', err);
      setError(`Failed to ${action} message: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    }
  };

  const getSeverityColor = (sentimentScore: number) => {
    if (sentimentScore < -0.5) return "bg-red-100 text-red-800"
    if (sentimentScore < 0) return "bg-yellow-100 text-yellow-800"
    return "bg-green-100 text-green-800"
  }

  const getSeverityLabel = (sentimentScore: number) => {
    if (sentimentScore < -0.5) return "high"
    if (sentimentScore < 0) return "medium"
    return "low"
  }

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="container mx-auto p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Moderation Queue</h1>
              <p className="text-muted-foreground">
                Review and moderate flagged messages
              </p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                  <div className="flex gap-2">
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header - Fixed at top */}
      <div className="container mx-auto p-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Moderation Queue</h1>
            <p className="text-muted-foreground">
              Review and moderate flagged messages
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchQueueItems}
              disabled={loading}
            >
              Refresh
            </Button>
            <Badge variant="secondary" className="flex items-center gap-1">
              <IconClock className="h-4 w-4" />
              {queueItems.length} items pending
            </Badge>
          </div>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50 mt-4">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => setError(null)}
              >
                Dismiss
              </Button>
            </CardContent>
          </Card>
        )}

        {successMessage && (
          <Card className="border-green-200 bg-green-50 mt-4">
            <CardContent className="pt-6">
              <p className="text-green-600">{successMessage}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => setSuccessMessage(null)}
              >
                Dismiss
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {queueItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <IconCheck className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Queue is empty!</h3>
              <p className="text-muted-foreground text-center">
                All flagged messages have been reviewed. Great job!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {queueItems.map((item) => {
              const isProcessing = processingActions.has(item.message_id);
              
              return (
                <Card key={item.message_id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">User:</span>
                          <span className="font-medium">{item.player_name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">{formatTimestamp(item.created_at)}</span>
                      </div>
                      <Badge className={getSeverityColor(item.sentiment_score)}>
                        {getSeverityLabel(item.sentiment_score)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-1">Flagged Message:</p>
                        <p className="text-sm bg-muted p-3 rounded-md">{item.message}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Category:</span>
                        <Badge variant="outline">{item.moderation_action || 'flagged'}</Badge>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          className="flex items-center gap-1"
                          onClick={() => handleAction(item.message_id, 'ban')}
                          disabled={isProcessing}
                        >
                          <IconX className="h-4 w-4" />
                          {isProcessing ? 'Processing...' : 'Ban'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex items-center gap-1"
                          onClick={() => handleAction(item.message_id, 'approve')}
                          disabled={isProcessing}
                        >
                          <IconCheck className="h-4 w-4" />
                          {isProcessing ? 'Processing...' : 'Dismiss'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
} 