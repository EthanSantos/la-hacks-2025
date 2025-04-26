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
        <div className="flex flex-col gap-2 p-4 rounded-lg bg-white shadow-sm hover:bg-gray-50 transition-colors border border-gray-100">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {/* Avatar with animated loading state */}
                    {loading ? (
                        <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
                    ) : showAvatar ? (
                        <img
                            src={avatarUrl}
                            alt={`${msg.player_name}'s avatar`}
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200" 
                            onError={handleImageError}
                        />
                    ) : (
                        // Fallback avatar with initials and consistent color
                        <div className={`w-10 h-10 rounded-full ${avatarDetails.color} flex items-center justify-center text-white font-medium text-sm`}>
                            {avatarDetails.initials}
                        </div>
                    )}

                    <div className="flex flex-col">
                        <span className="font-semibold text-gray-800">{msg.player_name}</span>
                        <span className="text-xs text-gray-500">{formattedTime}</span>
                    </div>
                </div>
                
                <div
                    className={`${getSentimentColor(msg.sentiment_score)} text-white text-xs font-bold px-3 py-1 rounded-full`}
                >
                    {msg.sentiment_score > 0 ? '+' : ''}{msg.sentiment_score}
                </div>
            </div>
            
            <div className="mt-1 text-gray-700 pl-13">{msg.message}</div>
        </div>
    );
}