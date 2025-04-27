import { useState } from 'react';
import { sentimentApi } from '@/lib/api/sentiment';
import { SentimentResult } from '@/types/sentiment';

export function useSentiment() {
    const [message, setMessage] = useState('');
    const [result, setResult] = useState<SentimentResult | null>(null);
    const [error, setError] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const analyzeSentiment = async () => {
        if (!message.trim()) {
            setError('Please enter a message');
            return;
        }

        setIsAnalyzing(true);
        setError('');

        try {

            const data = await sentimentApi.analyzeSentiment({
                message,
                player_id: 156, // builderman id :)
                player_name: "Admin",
                message_id: Date.now().toString() // same as os.time() on roblox lmao
            });

            setResult(data);
        } catch (err) {
            setError('Failed to analyze sentiment. Please try again.');
            console.error(err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return {
        message,
        setMessage,
        result,
        error,
        isAnalyzing,
        analyzeSentiment
    };
}