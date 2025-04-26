export interface Player {
    player_id: number;
    player_name: string;
    last_seen: string;
}

export interface Message {
    id: number;
    message_id: string;
    player_id: number;
    player_name: string;
    message: string;
    sentiment_score: number;
    created_at: string;
}

export interface SentimentAnalysisRequest {
    message: string;
    player_id?: number;
    player_name?: string;
    message_id?: string;
}

export interface SentimentAnalysisResponse {
    player_id: number;
    player_name: string;
    message_id: string;
    message: string;
    sentiment_score: number;
}

export interface SentimentResult {
    player_id: number;
    player_name: string;
    message: string;
    sentiment_score: number;
    message_id?: string;
}