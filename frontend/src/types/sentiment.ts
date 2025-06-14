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
    moderation_action?: string;
    moderation_reason?: string;
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
    sentiment_details?: {
        confidence?: number;
        emotion?: string;
        toxicity_score?: number;
    };
    community_intent?: {
        intent_type?: string;
        reason?: string;
    };
    rewards?: {
        points_awarded: number;
        reason: string;
    };
    error?: string;
}

export interface SentimentResult {
    player_id: number;
    player_name: string;
    message: string;
    sentiment_score: number;
    message_id?: string;
    moderation_passed: boolean;
    blocked: boolean;
    moderation_action?: string;
    moderation_reason?: string;
    pii_detected?: boolean;
    content_issues?: boolean;
    sentiment_details?: {
        confidence?: number;
        emotion?: string;
        toxicity_score?: number;
    };
    community_intent?: {
        intent_type?: string;
        reason?: string;
    };
    rewards?: {
        points_awarded: number;
        reason: string;
    };
    error?: string;
}

export interface TopPlayer {
    player_id: number;
    player_name: string;
    total_sentiment_score: number;
    message_count: number;
}

/**
 * Represents a data point for the sentiment trend chart.
 */
export interface SentimentTrendPoint {
    time_bucket: string; // ISO date string representing the start of the interval (day, month, etc.)
    average_sentiment: number;
    message_count: number;
  }
  
  /**
   * Represents a slice in the sentiment distribution chart (e.g., Pie chart).
   */
  export interface SentimentDistributionSlice {
    sentiment_category: 'Positive' | 'Neutral' | 'Negative';
    message_count: number;
    percentage: number;
  }
  
  /**
   * Represents the overall statistics for the analytics dashboard.
   */
  export interface OverallStats {
    total_messages: number;
    average_sentiment: number;
    unique_players: number;
  }
  
  export interface PlayerRank {
    player_id: number;
    player_name: string;
    message_count: number;
    average_sentiment: number;
  }
  