import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SentimentAnalysisResponse } from '@/types/sentiment';

interface SentimentResultProps {
    result: {
        player_id: number;
        player_name: string;
        message_id?: string;
        message: string;
        sentiment_score: number;
    };
}

export default function SentimentResult({ result }: SentimentResultProps) {
    // Determine sentiment category based on score
    const getSentimentCategory = (score: number) => {
        if (score >= 75) return { label: 'Very Positive', color: 'bg-green-500' };
        if (score >= 25) return { label: 'Positive', color: 'bg-green-300' };
        if (score > -25) return { label: 'Neutral', color: 'bg-gray-300' };
        if (score > -75) return { label: 'Negative', color: 'bg-red-300' };
        return { label: 'Very Negative', color: 'bg-red-500' };
    };

    const { label, color } = getSentimentCategory(result.sentiment_score);

    return (
        <Card className="bg-gray-50">
            <CardContent className="pt-6">
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="font-medium">Score:</span>
                        <span className="font-bold">{result.sentiment_score}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="font-medium">Sentiment:</span>
                        <Badge className={color}>{label}</Badge>
                    </div>

                    <div className="mt-4">
                        <span className="font-medium block mb-1">Analyzed message:</span>
                        <p className="text-sm bg-white p-2 rounded border">{result.message}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}