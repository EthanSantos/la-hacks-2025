import { useState, useEffect, useCallback } from 'react';
import { TopPlayer } from '@/types/sentiment';
import { sentimentApi } from '@/lib/api/sentiment';

export interface UseTopPlayersReturn {
  data: TopPlayer[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching and managing top players leaderboard data
 * 
 * @param limit Number of top players to fetch (default: 10)
 * @param autoRefresh Whether to automatically refresh data every minute (default: true)
 * @returns Object containing data, loading state, error state, and refetch function
 */
export const useTopPlayers = (
  limit: number = 10, 
  autoRefresh: boolean = true
): UseTopPlayersReturn => {
  const [data, setData] = useState<TopPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('useTopPlayers: Fetching top players with limit:', limit);
      
      // Use your existing production-ready API client
      const players = await sentimentApi.getTopPlayers(limit);
      
      console.log('useTopPlayers: API response:', players);
      
      setData(players);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch top players';
      setError(errorMessage);
      console.error('useTopPlayers error:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    // Initial fetch
    refetch();

    // Set up auto-refresh interval if enabled
    if (autoRefresh) {
      const intervalId = setInterval(refetch, 60000); // Refresh every minute
      
      return () => clearInterval(intervalId);
    }
  }, [refetch, autoRefresh]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refetch
  };
};

/**
 * Hook variant with no auto-refresh for components that need manual control
 */
export const useTopPlayersManual = (limit: number = 10) => {
  return useTopPlayers(limit, false);
}; 