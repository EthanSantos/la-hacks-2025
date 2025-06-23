'use client';

import { useState, useMemo } from 'react';
import { useAvatarHeadshot } from '@/hooks/useAvatarHeadshot';
import { Message } from '@/types/sentiment';
import PlayerDetailsDialog from '@/components/chat-log/PlayerDetailsDialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertTriangle, UserX, Ban, Flag } from 'lucide-react';

interface MessageItemProps {
    msg: Message;
}

// Helper for moderation action badge
const getModerationBadge = (action?: string, flag?: boolean) => {
    if (flag) {
        return (
            <Badge className="bg-orange-100 text-orange-800 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                <Flag className="h-3 w-3" />
                FLAGGED
            </Badge>
        );
    }
    
    if (!action) return null;
    
    const variants = {
        'warn': {
            className: 'bg-yellow-100 text-yellow-800',
            icon: <AlertTriangle className="h-3 w-3" />,
            text: 'WARNED'
        },
        'kick': {
            className: 'bg-orange-100 text-orange-800',
            icon: <UserX className="h-3 w-3" />,
            text: 'KICKED'
        },
        'ban': {
            className: 'bg-red-100 text-red-800',
            icon: <Ban className="h-3 w-3" />,
            text: 'BANNED'
        }
    };
    
    const variant = variants[action as keyof typeof variants];
    if (!variant) return null;
    
    return (
        <Badge className={`${variant.className} text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1`}>
            {variant.icon}
            {variant.text}
        </Badge>
    );
};

export default function MessageItem({ msg }: MessageItemProps) {
    // Get the avatar URL using the hook
    const { url: avatarUrl, loading: avatarLoading } = useAvatarHeadshot(msg.player_id?.toString());
    const [showDialog, setShowDialog] = useState(false);
    
    // Generate player initials for fallback
    const getInitials = (name: string): string => {
        if (!name) return '?';
        
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) {
            return parts[0].charAt(0).toUpperCase();
        }
        
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    const timeAgo = useMemo(() => {
        try {
            return new Date(msg.created_at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });
        } catch (e) {
            return 'Unknown time';
        }
    }, [msg.created_at]);

    const handleClick = () => {
        setShowDialog(true);
    };

    return (
        <>
            <div className="transition-all duration-600 ease-out opacity-100 max-h-96 py-1 my-1">
                <Card 
                    className={`@container/card shadow-xs overflow-hidden transition-all duration-500 ease-out opacity-100 scale-100 cursor-pointer hover:bg-muted/30 transition-colors ${
                        msg.flag ? 'border-orange-200 bg-orange-50' : ''
                    }`}
                    onClick={handleClick}
                >
                    <CardContent>
                        <div className="flex items-start gap-3">
                            <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-[#009982] ring-offset-2 ring-offset-background">
                                {avatarUrl && !avatarLoading && (
                                    <AvatarImage src={avatarUrl} alt={msg.player_name} />
                                )}
                                <AvatarFallback className="text-xs font-medium">
                                    {avatarLoading ? '...' : getInitials(msg.player_name)}
                                </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="font-medium text-sm">{msg.player_name}</span>
                                    {getModerationBadge(msg.moderation_action, msg.flag)}
                                    <Badge 
                                        variant="outline"
                                        className={`text-xs font-semibold ${
                                            msg.sentiment_score >= 75 ? 'bg-green-500/10 text-green-700 border-green-200 dark:text-green-400 dark:border-green-800' : 
                                            msg.sentiment_score >= 25 ? 'bg-green-300/10 text-green-600 border-green-200 dark:text-green-500 dark:border-green-800' :
                                            msg.sentiment_score > -25 ? 'bg-gray-300/10 text-gray-600 border-gray-200 dark:text-gray-400 dark:border-gray-800' :
                                            msg.sentiment_score > -75 ? 'bg-red-300/10 text-red-600 border-red-200 dark:text-red-500 dark:border-red-800' :
                                            'bg-red-500/10 text-red-700 border-red-200 dark:text-red-400 dark:border-red-800'
                                        }`}
                                    >
                                        {msg.sentiment_score > 0 ? '+' : ''}{msg.sentiment_score}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground ml-auto font-medium">
                                        {timeAgo}
                                    </span>
                                </div>
                                
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm break-words leading-relaxed flex-1 whitespace-pre-wrap">{msg.message}</p>
                                </div>
                                
                                {/* Show moderation reason if available */}
                                {msg.moderation_reason && (
                                    <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded mt-2">
                                        <span className="font-medium">AI Action:</span> {msg.moderation_reason}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <PlayerDetailsDialog 
                message={msg}
                isOpen={showDialog}
                onClose={() => setShowDialog(false)}
            />
        </>
    );
}