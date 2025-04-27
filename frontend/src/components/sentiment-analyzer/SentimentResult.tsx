import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

// Define the SentimentResult type
export interface SentimentResult {
    player_id: number;
    player_name: string;
    message_id?: string;
    message: string;
    sentiment_score: number;
}

// Create a properly typed props interface
interface SentimentResultProps {
    result: SentimentResult;
}

// Export the component with explicit typing
const SentimentResult: React.FC<SentimentResultProps> = ({ result }) => {
    // Determine sentiment category based on score
    const getSentimentCategory = (score: number) => {
        if (score >= 75) return { label: 'Very Positive', color: 'text-green-600', bgColor: 'bg-green-100', badgeVariant: 'success' };
        if (score >= 25) return { label: 'Positive', color: 'text-green-500', bgColor: 'bg-green-50', badgeVariant: 'secondary' };
        if (score > -25) return { label: 'Neutral', color: 'text-gray-600', bgColor: 'bg-gray-50', badgeVariant: 'outline' };
        if (score > -75) return { label: 'Negative', color: 'text-red-500', bgColor: 'bg-red-50', badgeVariant: 'destructive' };
        return { label: 'Very Negative', color: 'text-red-600', bgColor: 'bg-red-100', badgeVariant: 'destructive' };
    };

    const { label, color, bgColor, badgeVariant } = getSentimentCategory(result.sentiment_score);
    
    // Calculate position for progress (0-100%)
    const progressValue = ((result.sentiment_score + 100) / 200) * 100;

    return (
        <div className="w-full space-y-6">
            {/* Score and info section */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${bgColor} border`} style={{ 
                        borderColor: color === 'text-green-600' ? '#16a34a' : 
                                     color === 'text-green-500' ? '#22c55e' : 
                                     color === 'text-gray-600' ? '#71717a' : 
                                     color === 'text-red-500' ? '#ef4444' : 
                                     '#dc2626' 
                    }}>
                        <h2 className={`text-3xl font-bold ${color}`}>{result.sentiment_score}</h2>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`font-medium ${color}`}>{label}</span>
                            <Badge variant={badgeVariant as any}>{label}</Badge>
                        </div>
                    </div>
                </div>
                
                <div className="text-right">
                    <div className="text-sm text-gray-500">Player: <span className="font-medium">{result.player_name}</span></div>
                    <div className="text-sm text-gray-500">ID: {result.player_id}</div>
                </div>
            </div>
            
            {/* Score gauge */}
            <div className="space-y-1">
                <Progress value={progressValue} className="h-2" />
                <div className="flex justify-between text-xs text-gray-500">
                    <div>-100</div>
                    <div>0</div>
                    <div>+100</div>
                </div>
            </div>
            
            <Separator />
            
            {/* Message section */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <h3 className="font-medium">Analyzed Message</h3>
                </div>
                
                <Card className={`border-l-4 ${bgColor}`} style={{ borderLeftColor: color === 'text-green-600' ? '#16a34a' : 
                                                                    color === 'text-green-500' ? '#22c55e' : 
                                                                    color === 'text-gray-600' ? '#71717a' : 
                                                                    color === 'text-red-500' ? '#ef4444' : 
                                                                    '#dc2626' }}>
                    <CardContent className="p-4">
                        <p>{result.message}</p>
                    </CardContent>
                </Card>
            </div>
            
            {/* Analysis breakdown */}
            <div className="grid grid-cols-2 gap-6">
                <Card>
                    <CardContent className="p-4 space-y-2">
                        <h3 className="font-medium">Sentiment Details</h3>
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                            <span className="text-gray-500">Score:</span>
                            <span className="font-medium">{result.sentiment_score}</span>
                            
                            <span className="text-gray-500">Category:</span>
                            <span className={color}>{label}</span>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-4 space-y-2">
                        <h3 className="font-medium">Interpretation</h3>
                        <p className="text-sm">
                            {result.sentiment_score >= 75 && "Extremely positive tone, expressing strong satisfaction or praise."}
                            {result.sentiment_score >= 25 && result.sentiment_score < 75 && "Generally positive tone, showing approval or contentment."}
                            {result.sentiment_score > -25 && result.sentiment_score < 25 && "Relatively neutral tone without strong emotional indicators."}
                            {result.sentiment_score <= -25 && result.sentiment_score > -75 && "Generally negative tone, expressing disapproval or dissatisfaction."}
                            {result.sentiment_score <= -75 && "Extremely negative tone, showing strong criticism or frustration."}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SentimentResult;