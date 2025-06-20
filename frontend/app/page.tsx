'use client';

import StatsCard from '@/components/dashboard/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MessageVolumeChart from '@/components/dashboard/MessageVolumeChart';

// Mock dashboard data (replace with live hooks when API ready)
const MOCK_DATA = {
  totalMessages: 5678,
  averageSentiment: 23.4,
  safetyScore: 94.2,
  uniquePlayers: 250,
  positive: 40,
  neutral: 30,
  negative: 30,
  changes: {
    totalMessages: 5,
    averageSentiment: 1.2,
    safetyScore: -0.8,
    uniquePlayers: 3,
  }
};

export default function DashboardPage() {
  // Using mock data until API endpoints are finalised
  const metrics = MOCK_DATA;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="container mx-auto flex-1 flex flex-col p-4 lg:p-6 overflow-hidden">
        {/* Header */}
        <div className="mb-3 flex-shrink-0">
          <h1 className="text-xl lg:text-2xl font-bold">Welcome back, Bloom Admin!</h1>
          <p className="text-gray-600 text-xs lg:text-sm">Overview of system performance and key metrics</p>
        </div>

        {/* Main content area */}
        <div className="flex flex-col gap-6 flex-1 overflow-hidden min-h-0">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
            <StatsCard title="Total Messages" value={metrics.totalMessages} change={metrics.changes.totalMessages} />
            <StatsCard title="Avg. Sentiment" value={metrics.averageSentiment.toFixed(1)} change={metrics.changes.averageSentiment} description="Rolling average" />
            <StatsCard title="Safety Score" value={`${metrics.safetyScore}%`} change={metrics.changes.safetyScore} />
            <StatsCard title="Unique Players" value={metrics.uniquePlayers} change={metrics.changes.uniquePlayers} />
          </div>

          {/* Message Volume Chart */}
          <MessageVolumeChart />
        </div>
      </div>
    </div>
  );
}