'use client';

import { useState, useMemo } from 'react';
import { useAvatarHeadshot } from '@/hooks/useAvatarHeadshot';
import { Message } from '@/types/sentiment';

interface MessageItemProps {
    msg: Message;
}

// Helper function for sentiment color
const getSentimentColor = (score: number) => {
    if (score >= 75) return 'bg-green-500';
    if (score >= 25) return 'bg-green-300';
    if (score > -25) return 'bg-gray-300';
    if (score > -75) return 'bg-red-300';
    return 'bg-red-500';
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
    
    // Generate player avatar details for fallback
    const avatarDetails = useMemo(() => {
        return {
            initials: getInitials(msg.player_name),
            color: "bg-blue-500"
        };
    }, [msg.player_id, msg.player_name]);

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

    return (
        <div className="flex flex-col gap-1 lg:gap-2 p-3 lg:p-4 rounded-lg bg-white shadow-sm hover:bg-gray-50 transition-colors border border-gray-100">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 lg:gap-3">
                    {/* Avatar with animated loading state */}
                    {loading ? (
                        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gray-200 animate-pulse"></div>
                    ) : showAvatar ? (
                        <img
                            src={avatarUrl}
                            alt={`${msg.player_name}'s avatar`}
                            className="w-8 h-8 lg:w-10 lg:h-10 rounded-full object-cover border-2 border-gray-200" 
                            onError={handleImageError}
                        />
                    ) : (
                        // Fallback avatar with initials and consistent color
                        <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full ${avatarDetails.color} flex items-center justify-center text-white font-medium text-xs lg:text-sm`}>
                            {avatarDetails.initials}
                        </div>
                    )}

                    <div className="flex flex-col">
                        <span className="font-semibold text-gray-800 text-sm lg:text-base">{msg.player_name}</span>
                        <span className="text-xs text-gray-500">{formattedTime}</span>
                    </div>
                </div>
                
                <div
                    className={`${getSentimentColor(msg.sentiment_score)} text-white text-xs font-bold px-2 lg:px-3 py-1 rounded-full`}
                >
                    {msg.sentiment_score > 0 ? '+' : ''}{msg.sentiment_score}
                </div>
            </div>
            
            <div className="mt-1 text-gray-700 pl-10 lg:pl-13 text-sm">{msg.message}</div>
        </div>
    );
}