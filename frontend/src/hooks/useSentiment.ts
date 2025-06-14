import { useState, useEffect } from 'react';
import { sentimentApi } from '@/lib/api/sentiment';
import { SentimentResult } from '@/types/sentiment';

export function useSentiment() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<SentimentResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [moderationPending, setModerationPending] = useState(false);

    // Poll for moderation results
    const pollModerationStatus = async (messageId: string) => {
        const maxAttempts = 10; // Poll for up to 10 seconds
        let attempts = 0;

        const poll = async () => {
            try {
                const message = await sentimentApi.checkModerationStatus(messageId);
                
                if (message && (message.moderation_action || attempts >= maxAttempts)) {
                    // Moderation completed or timeout reached
                    setModerationPending(false);
                    
                    if (message.moderation_action) {
                        // Update result with moderation data
                        setResult(prev => prev ? {
                            ...prev,
                            moderation_passed: !['DELETE_MESSAGE', 'BAN', 'KICK'].includes(message.moderation_action || ''),
                            blocked: ['DELETE_MESSAGE', 'BAN', 'KICK'].includes(message.moderation_action || ''),
                            moderation_action: message.moderation_action,
                            moderation_reason: message.moderation_reason
                        } : null);
                        
                        // Log moderation completion
                        console.log('Moderation completed:', {
                            action: message.moderation_action,
                            reason: message.moderation_reason
                        });
                    } else {
                        // No moderation issues found
                        setResult(prev => prev ? {
                            ...prev,
                            moderation_passed: true,
                            blocked: false
                        } : null);
                        
                        console.log('Moderation completed: No issues found');
                    }
                    return;
                }
                
                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(poll, 1000); // Poll every second
                } else {
                    setModerationPending(false); // Timeout
                }
            } catch (error) {
                console.error('Polling error:', error);
                setModerationPending(false);
            }
        };

        setTimeout(poll, 2000); // Start polling after 2 seconds
    };

    const analyzeSentiment = async (message: string, playerName?: string, playerId?: number) => {
        if (!message.trim()) {
            setError('Please enter a message to analyze');
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await sentimentApi.analyzeSentiment({
                message: message.trim(),
                player_name: playerName,
                player_id: playerId
            });

            // Convert API response to result format
            const sentimentResult: SentimentResult = {
                player_id: data.player_id,
                player_name: data.player_name,
                message: data.message,
                sentiment_score: data.sentiment_score,
                message_id: data.message_id,
                moderation_passed: true, // Default to true since moderation is running in background
                blocked: false, // Default to false since moderation is running in background
                moderation_action: undefined,
                moderation_reason: undefined,
                sentiment_details: data.sentiment_details,
                community_intent: data.community_intent,
                rewards: data.rewards,
                error: data.error
            };

            setResult(sentimentResult);
            setModerationPending(true);

            // Start polling for moderation results
            if (data.message_id) {
                pollModerationStatus(data.message_id);
            }
        } catch (err) {
            console.error('Sentiment analysis failed:', err);
            setError('Failed to analyze sentiment. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const moderateMessage = async (message: string, playerName?: string, playerId?: number) => {
        if (!message.trim()) {
            setError('Please enter a message to moderate');
            return null;
        }

        setIsLoading(true);
        setError(null);

        try {
            const data = await sentimentApi.moderateMessage({
                message: message.trim(),
                player_name: playerName,
                player_id: playerId
            });

            return data;
        } catch (err) {
            console.error('Message moderation failed:', err);
            setError('Failed to moderate message. Please try again.');
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isLoading,
        result,
        error,
        moderationPending,
        analyzeSentiment,
        moderateMessage
    };
} 