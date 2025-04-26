import { useState, useEffect } from 'react';
import { robloxApi } from '@/lib/api/roblox';

/**
 * Custom hook to fetch a Roblox user's avatar headshot URL.
 * @param userId The Roblox user ID (number or string).
 * @returns An object containing the avatar URL, loading state, and error state.
 */
export function useAvatarHeadshot(userId: number | string | null | undefined) {
    const [url, setUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Clear previous state and fetch if userId is valid
        if (userId === null || userId === undefined || String(userId).trim() === '' || Number(userId) <= 0) {
            setUrl(null);
            setLoading(false);
            setError(null);
            return; // Don't fetch for invalid or missing IDs
        }

        const fetchAvatar = async () => {
            setLoading(true);
            setError(null);
            setUrl(null); // Clear previous URL while fetching

            try {
                // Call the updated getAvatarHeadshotUrl method from the new API client
                const imageUrl = await robloxApi.getAvatarHeadshotUrl(userId);
                setUrl(imageUrl); // Set the fetched URL (will be null if not found or error)
            } catch (err: any) {
                console.error(`Error in useAvatarHeadshot for user ${userId}:`, err);
                setError(err.message || "Failed to fetch avatar");
                setUrl(null); // Ensure URL is null on error
            } finally {
                setLoading(false);
            }
        };

        fetchAvatar();

    }, [userId]);

    return {
        url,
        loading,
        error,
    };
}
