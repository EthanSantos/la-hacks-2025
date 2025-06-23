'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useAvatarHeadshot } from '@/hooks/useAvatarHeadshot';
import { Message } from '@/types/sentiment';
import PlayerDetailsDialog from '@/components/chat-log/PlayerDetailsDialog';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, UserX, Ban, Flag } from 'lucide-react';

interface MessageItemProps {
    msg: Message;
}

// Helper for badge background
const getSentimentBadgeBg = (score: number) => {
    if (score >= 75) return 'bg-green-600';
    if (score >= 25) return 'bg-green-500';
    if (score > -25) return 'bg-gray-500';
    if (score > -75) return 'bg-red-500';
    return 'bg-red-600';
};

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

// Generate initials from player name
const getInitials = (name: string): string => {
    if (!name) return '?';
    
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }
    
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export default function MessageItem({ msg }: MessageItemProps) {
    // Get the avatar URL using the hook
    const { url: avatarUrl, loading } = useAvatarHeadshot(msg.player_id?.toString());
    const [avatarError, setAvatarError] = useState(false);
    const [showDialog, setShowDialog] = useState(false);
    
    // Generate player avatar details for fallback
    const avatarDetails = useMemo(() => {
        return {
            initials: getInitials(msg.player_name),
            color: "bg-blue-500"
        };
    }, [msg.player_name]);

    // Handle image load error
    const handleImageError = () => {
        setAvatarError(true);
    };

    const showAvatar = avatarUrl && !avatarError && !loading;

    const formattedTime = useMemo(() => {
        try {
            return new Date(msg.created_at).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
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
            <div
                className={`flex flex-col gap-2 p-3 lg:p-4 bg-white border rounded-lg shadow-sm hover:bg-gray-50 cursor-pointer ${
                    msg.flag ? 'border-orange-200 bg-orange-50' : 'border-gray-200'
                }`}
                onClick={handleClick}
            >
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        {loading ? (
                            <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
                        ) : showAvatar ? (
                            <Image
                                src={avatarUrl}
                                alt={`${msg.player_name}'s avatar`}
                                width={36}
                                height={36}
                                className="w-9 h-9 rounded-full object-cover border border-gray-300"
                                onError={handleImageError}
                            />
                        ) : (
                            <div className={`w-9 h-9 rounded-full ${avatarDetails.color} flex items-center justify-center text-white font-medium text-sm`}>
                                {avatarDetails.initials}
                            </div>
                        )}
                        <div>
                            <p className="font-medium text-gray-800 text-sm">{msg.player_name}</p>
                            <p className="text-xs text-gray-500">{formattedTime}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {getModerationBadge(msg.moderation_action, msg.flag)}
                        <span className={`${getSentimentBadgeBg(msg.sentiment_score)} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                            {msg.sentiment_score > 0 ? '+' : ''}{msg.sentiment_score}
                        </span>
                    </div>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                
                {/* Show moderation reason if available */}
                {msg.moderation_reason && (
                    <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                        <span className="font-medium">AI Action:</span> {msg.moderation_reason}
                    </div>
                )}
            </div>
            
            <PlayerDetailsDialog 
                message={msg}
                isOpen={showDialog}
                onClose={() => setShowDialog(false)}
            />
        </>
    );
}