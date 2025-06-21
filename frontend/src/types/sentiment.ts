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
    flag?: boolean;
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
    moderation_passed: boolean;
    blocked: boolean;
    moderation_action?: string;
    moderation_reason?: string;
    sentiment_details?: {
        positive_score: number;
        negative_score: number;
        neutral_score: number;
        overall_sentiment: string;
    };
    community_intent?: {
        intent: string;
        confidence: number;
        suggestions: string[];
    };
    rewards?: {
        points: number;
        badges: string[];
        level_up: boolean;
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
  
export interface SentimentTrendData {
    date: string;
    positive_count: number;
    negative_count: number;
    neutral_count: number;
    total_messages: number;
    average_sentiment: number;
}

export interface SentimentDistributionData {
    category: string;
    count: number;
    percentage: number;
}

export interface OverallStatsData {
    total_messages: number;
    unique_players: number;
    average_sentiment: number;
    positive_percentage: number;
    negative_percentage: number;
    neutral_percentage: number;
}

export interface ModerationActionRequest {
    player_id: number;
    action: string; // "warn", "kick", "ban"
    reason: string;
    game_id?: number;
}

export interface ModerationActionResponse {
    success: boolean;
    action: string;
    player_id: number;
    reason: string;
    error?: string;
    roblox_response?: any;
}

export interface FlaggedMessage {
    message_id: string;
    player_id: number;
    player_name: string;
    message: string;
    sentiment_score: number;
    created_at: string;
    moderation_action?: string;
    moderation_reason?: string;
    flag: boolean;
}

export interface MessageReviewRequest {
    action: string; // "approve", "warn", "kick", "ban"
    reason?: string;
}

export interface MessageReviewResponse {
    success: boolean;
    message_id: string;
    action: string;
    reason?: string;
}
  