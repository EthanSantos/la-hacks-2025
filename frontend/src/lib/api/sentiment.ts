import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

import { Player, Message, SentimentAnalysisRequest, SentimentAnalysisResponse, TopPlayer } from '@/types/sentiment';

class SentimentAnalysisClient {
    private client: AxiosInstance;

    constructor(
        baseURL: string = "https://la-hacks-api.vercel.app/api",
        apiKey?: string
    ) {
        // Create axios instance with base configuration
        this.client = axios.create({
            baseURL,
            headers: apiKey
                ? { 'X-API-Key': apiKey }
                : {}
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
     * Analyze sentiment of a single message
     * @param data Sentiment analysis request data
     * @returns Sentiment analysis response
     */
    async analyzeSentiment(data: SentimentAnalysisRequest): Promise<SentimentAnalysisResponse> {
        // Generate message_id if not provided
        const requestData = {
            ...data,
            message_id: data.message_id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
}

// Create and export a singleton instance
export const sentimentApi = new SentimentAnalysisClient(
    process.env.NEXT_PUBLIC_API_BASE_URL,
    process.env.NEXT_PUBLIC_ROBLOX_API_KEY
);

// Export the class for custom instantiation if needed
export { SentimentAnalysisClient };