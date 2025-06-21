'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
    AlertTriangle, 
    UserX, 
    Ban, 
    CheckCircle, 
    Clock, 
    MessageSquare,
    Shield,
    RefreshCcw
} from 'lucide-react';
import { FlaggedMessage } from '@/types/sentiment';
import { moderationApi } from '@/lib/api/sentiment';
import { useAvatarHeadshot } from '@/hooks/useAvatarHeadshot';

interface ReviewDialogProps {
    message: FlaggedMessage;
    isOpen: boolean;
    onClose: () => void;
    onReview: (action: string, reason?: string) => void;
}

function ReviewDialog({ message, isOpen, onClose, onReview }: ReviewDialogProps) {
    const [action, setAction] = useState<string>('');
    const [reason, setReason] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!action) return;
        
        setIsSubmitting(true);
        try {
            await onReview(action, reason);
            setAction('');
            setReason('');
            onClose();
        } catch (error) {
            console.error('Review failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getActionIcon = (actionType: string) => {
        switch (actionType) {
            case 'approve': return <CheckCircle className="h-4 w-4" />;
            case 'warn': return <AlertTriangle className="h-4 w-4" />;
            case 'kick': return <UserX className="h-4 w-4" />;
            case 'ban': return <Ban className="h-4 w-4" />;
            default: return null;
        }
    };

    const getActionColor = (actionType: string) => {
        switch (actionType) {
            case 'approve': return 'bg-green-500 hover:bg-green-600';
            case 'warn': return 'bg-yellow-500 hover:bg-yellow-600';
            case 'kick': return 'bg-orange-500 hover:bg-orange-600';
            case 'ban': return 'bg-red-500 hover:bg-red-600';
            default: return 'bg-gray-500 hover:bg-gray-600';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-full sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Review Flagged Message
                    </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                    {/* Message Preview */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Message Content</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="p-3 bg-gray-50 rounded-lg border">
                                <p className="text-gray-800">{message.message}</p>
                            </div>
                            <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                                <span>By: {message.player_name} (ID: {message.player_id})</span>
                                <span>Sentiment: {message.sentiment_score > 0 ? '+' : ''}{message.sentiment_score}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* AI Recommendation */}
                    {message.moderation_action && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm">AI Recommendation</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                        {message.moderation_action.toUpperCase()}
                                    </Badge>
                                    <span className="text-sm text-gray-600">
                                        {message.moderation_reason}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Action Selection */}
                    <div className="space-y-3">
                        <Label>Select Action</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {['approve', 'warn', 'kick', 'ban'].map((actionType) => (
                                <Button
                                    key={actionType}
                                    variant={action === actionType ? "default" : "outline"}
                                    className={`justify-start ${action === actionType ? getActionColor(actionType) : ''}`}
                                    onClick={() => setAction(actionType)}
                                >
                                    {getActionIcon(actionType)}
                                    <span className="ml-2 capitalize">{actionType}</span>
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Reason Input */}
                    {action && action !== 'approve' && (
                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason (Required)</Label>
                            <Textarea
                                id="reason"
                                placeholder="Enter reason for this action..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={3}
                            />
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSubmit}
                            disabled={!action || (action !== 'approve' && !reason) || isSubmitting}
                            className={action ? getActionColor(action) : ''}
                        >
                            {isSubmitting ? 'Processing...' : `Confirm ${action}`}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function FlaggedMessagesPage() {
    const [flaggedMessages, setFlaggedMessages] = useState<FlaggedMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMessage, setSelectedMessage] = useState<FlaggedMessage | null>(null);
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

    const fetchFlaggedMessages = async () => {
        try {
            setLoading(true);
            setError(null);
            const messages = await moderationApi.getFlaggedMessages(100);
            setFlaggedMessages(messages);
        } catch (err) {
            console.error('Failed to fetch flagged messages:', err);
            setError('Failed to load flagged messages');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFlaggedMessages();
    }, []);

    const handleReview = async (action: string, reason?: string) => {
        if (!selectedMessage) return;

        try {
            await moderationApi.reviewMessage(selectedMessage.message_id, { action, reason });
            
            // Remove the message from the list
            setFlaggedMessages(prev => 
                prev.filter(msg => msg.message_id !== selectedMessage.message_id)
            );
            
            // Show success feedback
            console.log(`Message reviewed: ${action}${reason ? ` - ${reason}` : ''}`);
        } catch (err) {
            console.error('Review failed:', err);
            throw err;
        }
    };

    const getActionBadge = (action?: string) => {
        if (!action) return null;
        
        const variants = {
            'warn': 'bg-yellow-100 text-yellow-800',
            'kick': 'bg-orange-100 text-orange-800',
            'ban': 'bg-red-100 text-red-800',
        };
        
        return (
            <Badge className={variants[action as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
                {action.toUpperCase()}
            </Badge>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="space-y-4">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-32 w-full" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <AlertTriangle className="h-6 w-6 text-orange-500" />
                        Flagged Messages
                    </h1>
                    <Button onClick={fetchFlaggedMessages} variant="outline" size="sm">
                        <RefreshCcw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
                <p className="text-gray-600">
                    Review messages flagged by AI for potential violations
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <Card className="mb-6 border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <p className="text-red-600">{error}</p>
                    </CardContent>
                </Card>
            )}

            {/* Messages List */}
            {flaggedMessages.length === 0 ? (
                <Card>
                    <CardContent className="pt-6 text-center">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                        <h3 className="text-lg font-semibold mb-2">No Flagged Messages</h3>
                        <p className="text-gray-600">All messages have been reviewed or no violations detected.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {flaggedMessages.map((message) => (
                        <Card key={message.message_id} className="hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                                            {message.player_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-medium">{message.player_name}</h3>
                                            <p className="text-sm text-gray-500">ID: {message.player_id}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getActionBadge(message.moderation_action)}
                                        <Badge variant="outline" className="text-xs">
                                            {message.sentiment_score > 0 ? '+' : ''}{message.sentiment_score}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <p className="text-gray-800">{message.message}</p>
                                </div>

                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatDate(message.created_at)}
                                        </span>
                                        {message.moderation_reason && (
                                            <span className="flex items-center gap-1">
                                                <MessageSquare className="h-3 w-3" />
                                                {message.moderation_reason}
                                            </span>
                                        )}
                                    </div>
                                    <Button
                                        onClick={() => {
                                            setSelectedMessage(message);
                                            setReviewDialogOpen(true);
                                        }}
                                        size="sm"
                                    >
                                        Review
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Review Dialog */}
            {selectedMessage && (
                <ReviewDialog
                    message={selectedMessage}
                    isOpen={reviewDialogOpen}
                    onClose={() => {
                        setReviewDialogOpen(false);
                        setSelectedMessage(null);
                    }}
                    onReview={handleReview}
                />
            )}
        </div>
    );
} 