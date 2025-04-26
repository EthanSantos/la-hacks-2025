import { useState } from 'react';
import { sentimentApi } from '@/lib/api/sentiment';
import { Message } from '@/types/sentiment';

export function useLiveMessages() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const data = await sentimentApi.getLiveMessages(50);
            setMessages(data);
            setError('');
        } catch (err) {
            setError('Failed to load messages');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return {
        messages,
        error,
        loading,
        fetchMessages       
    };
}