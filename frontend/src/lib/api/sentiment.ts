import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

import { Player, Message, SentimentAnalysisRequest, SentimentAnalysisResponse, TopPlayer, OverallStats, SentimentTrendPoint, SentimentDistributionSlice } from '@/types/sentiment';
import { getApiUrl } from '@/config/api';

class SentimentAnalysisClient {
    private client: AxiosInstance;

    constructor(apiKey?: string) {
        // Create axios instance with base configuration
        this.client = axios.create({
            baseURL: `${getApiUrl()}/api`,
            headers: apiKey ? { 'X-API-Key': apiKey } : {}
        });

        // Add request interceptor for logging (optional)
        this.client.interceptors.request.use(config => {
            console.log('API Request:', config.method?.toUpperCase(), config.url);
            return config;
        }, error => {
            console.error('API Request Error:', error);
            return Promise.reject(error);
        });

        // Add response interceptor for logging (optional)
        this.client.interceptors.response.use(response => {
            console.log('API Response:', response.status, response.data);
            return response;
        }, error => {
            console.error('API Response Error:', error.response?.data || error.message);
            return Promise.reject(error);
        });
    }

    /**
     * Analyze sentiment of a single message (returns immediately, moderation runs in background)
     * @param data Sentiment analysis request data
     * @returns Sentiment analysis response (moderation data may be pending)
     */
    async analyzeSentiment(data: SentimentAnalysisRequest): Promise<SentimentAnalysisResponse> {
        // Generate message_id if not provided
        const requestData = {
            ...data,
            message_id: data.message_id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
            player_id: data.player_id || Math.floor(Math.random() * 1000),
            player_name: data.player_name || `Player${Math.floor(Math.random() * 1000)}`
        };

        try {
            const response = await this.client.post<SentimentAnalysisResponse>('/analyze', requestData);
            return response.data;
        } catch (error) {
            console.error('Sentiment Analysis Error:', error);
            throw error;
        }
    }

    /**
     * Check moderation status for a specific message
     * @param messageId The message ID to check
     * @returns Message with updated moderation status
     */
    async checkModerationStatus(messageId: string): Promise<Message | null> {
        try {
            const messages = await this.getMessages();
            return messages.find(msg => msg.message_id === messageId) || null;
        } catch (error) {
            console.error('Check Moderation Status Error:', error);
            return null;
        }
    }

    /**
     * Moderate a message only (no sentiment analysis)
     * @param data Sentiment analysis request data
     * @returns Moderation result
     */
    async moderateMessage(data: SentimentAnalysisRequest): Promise<{
        passed: boolean;
        action?: string;
        reason?: string;
        pii_detected: boolean;
        content_issues: boolean;
        error?: string;
    }> {
        const requestData = {
            ...data,
            message_id: data.message_id || `mod_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
            player_id: data.player_id || Math.floor(Math.random() * 1000),
            player_name: data.player_name || `Player${Math.floor(Math.random() * 1000)}`
        };

        try {
            const response = await this.client.post('/moderate', requestData);
            return response.data;
        } catch (error) {
            console.error('Message Moderation Error:', error);
            throw error;
        }
    }

    /**
     * Fetch all players
     * @returns Array of players
     */
    async getPlayers(): Promise<Player[]> {
        try {
            const response = await this.client.get<Player[]>('/players');
            return response.data;
        } catch (error) {
            console.error('Fetch Players Error:', error);
            throw error;
        }
    }

    /**
     * Fetch messages with optional filtering
     * @param params Optional parameters to filter messages
     * @returns Array of messages
     */
    async getMessages(params?: {
        player_id?: number,
        limit?: number
    }): Promise<Message[]> {
        try {
            const response = await this.client.get<Message[]>('/messages', { params });
            return response.data;
        } catch (error) {
            console.error('Fetch Messages Error:', error);
            throw error;
        }
    }

    /**
     * Fetch live messages
     * @param limit Number of live messages to fetch (default 20)
     * @returns Array of live messages
     */
    async getLiveMessages(limit: number = 20): Promise<Message[]> {
        try {
            const response = await this.client.get<Message[]>('/live', {
                params: { limit }
            });
            return response.data;
        } catch (error) {
            console.error('Fetch Live Messages Error:', error);
            throw error;
        }
    }

    /**
     * Fetch top players by sentiment score
     * @param limit Number of top players to fetch (default 10)
     * @returns Array of top players with sentiment scores
     */
    async getTopPlayers(limit: number = 10): Promise<TopPlayer[]> {
        try {
            const response = await this.client.get<TopPlayer[]>('/top-players', {
                params: { limit }
            });
            return response.data;
        } catch (error) {
            console.error('Fetch Top Players Error:', error);
            throw error;
        }
    }

    /**
     * Fetch overall analytics statistics (all time).
     * @returns Object containing total messages, average sentiment, unique players.
     */
    async getAllTimeOverallStats(): Promise<OverallStats> {
        const response = await this.client.get<OverallStats>('/analytics/all-time/overall-stats');
        return response.data;
    }

    /**
     * Fetch sentiment trend data (all time).
     * @param interval The time interval to group by ('day', 'week', 'month', 'year'). Defaults to 'month'.
     * @returns Array of sentiment trend points.
     */
    async getAllTimeSentimentTrend(interval: string = 'month'): Promise<SentimentTrendPoint[]> {
        const response = await this.client.get<SentimentTrendPoint[]>('/analytics/all-time/sentiment-trend', {
            params: { interval }
        });
        return response.data;
    }

    /**
     * Fetch sentiment distribution data (all time).
     * @param positiveThreshold Score above which is considered positive.
     * @param negativeThreshold Score below which is considered negative.
     * @returns Array representing the distribution slices (Positive, Neutral, Negative).
     */
    async getAllTimeSentimentDistribution(positiveThreshold?: number, negativeThreshold?: number): Promise<SentimentDistributionSlice[]> {
        const params: Record<string, number> = {};
        if (positiveThreshold !== undefined) params.positive_threshold = positiveThreshold;
        if (negativeThreshold !== undefined) params.negative_threshold = negativeThreshold;

        const response = await this.client.get<SentimentDistributionSlice[]>('/analytics/all-time/sentiment-distribution', { params });
        return response.data;
    }
}

// Create and export a singleton instance
export const sentimentApi = new SentimentAnalysisClient(
    process.env.NEXT_PUBLIC_ROBLOX_API_KEY
);

// Export the class for custom instantiation if needed
export { SentimentAnalysisClient };