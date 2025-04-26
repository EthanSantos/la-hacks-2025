import { useState, useCallback, useRef, useEffect } from 'react';
import { sentimentApi } from '@/lib/api/sentiment';
import { Message } from '@/types/sentiment';

export function useLiveMessages() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const lastFetchTimeRef = useRef<number>(0); // Track the last fetch time to implement a cooldown
    const isFetchingRef = useRef<boolean>(false); // Track if there's a fetch in progress to prevent parallel requests
    const latestMessageIdRef = useRef<string | number | null>(null);     // Store the latest message ID to implement incremental fetching
    
    // Memoized messages array reference to avoid dependency issues
    const messagesRef = useRef<Message[]>([]);
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);
    
    const fetchMessages = useCallback(async (force = true) => {
        console.log("Fetch triggered, force:", force);
        
        // Skip if a fetch is already in progress
        if (isFetchingRef.current) {
            console.log("Fetch skipped: already fetching");
            return;
        }
        
        const now = Date.now();
        if (!force && now - lastFetchTimeRef.current < 5000) {
            console.log("Fetch skipped: cooldown period");
            return;
        }
        
        isFetchingRef.current = true;
        
        try {
            setLoading(true);
            console.log("Performing fetch");
            const data = await sentimentApi.getLiveMessages(20);
            console.log("Fetch successful, messages:", data.length);
            
            setMessages(data);

            if (data.length > 0) {
                latestMessageIdRef.current = data[0].message_id;
            }
            
            setError(null);
        } catch (err) {
            console.error("Fetch error:", err);
            setError('Failed to load messages');
        } finally {
            setLoading(false);
            lastFetchTimeRef.current = Date.now();
            isFetchingRef.current = false;
        }
    }, []);

    return {
        messages,
        error,
        loading,
        fetchMessages       
    };
}