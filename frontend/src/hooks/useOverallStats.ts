import { useEffect, useState, useCallback } from 'react';
import { sentimentApi } from '@/lib/api/sentiment';
import type { OverallStats } from '@/types/sentiment';

export function useOverallStats(autoRefresh: boolean = true, refreshIntervalMs: number = 60000) {
  const [data, setData] = useState<OverallStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const stats = await sentimentApi.getAllTimeOverallStats();
      setData(stats);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch overall stats:', err);
      setError('Failed to load overall statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    if (autoRefresh) {
      const interval = setInterval(fetchStats, refreshIntervalMs);
      return () => clearInterval(interval);
    }
  }, [fetchStats, autoRefresh, refreshIntervalMs]);

  return { data, loading, error, refetch: fetchStats };
} 