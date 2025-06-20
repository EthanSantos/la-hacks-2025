'use client';

import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback

// --- UI Components ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from '@/components/ui/button'; // Import Button for Retry
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
// Import the Chart component from react-google-charts
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  ReferenceLine,
  Area,
} from 'recharts';
import { ChartContainer } from '@/components/ui/chart';

// --- Date Formatting ---
import { format } from 'date-fns';

// --- API Client and Types ---
import { sentimentApi } from '@/lib/api/sentiment'; // Adjust path if needed
import {
  SentimentTrendPoint,
  SentimentDistributionSlice,
  OverallStats
} from '@/types/sentiment'; // Adjust path if needed

// --- Icons (Example using heroicons - install `@heroicons/react` if needed) ---
import {
  ChatBubbleLeftEllipsisIcon,
  ChartBarIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';


// --- Chart Colors & Options ---
const PIE_CHART_COLORS = ['#22c55e', '#64748b', '#ef4444']; // Positive, Neutral, Negative (Tailwind green-500, slate-500, red-500)
const LINE_CHART_COLOR = ['#3b82f6']; // Tailwind blue-500

// --- Main Analytics Page Component ---
export default function AnalyticsPage() {
  // --- State ---
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [trendData, setTrendData] = useState<(string | number)[][]>([]);
  const [distributionData, setDistributionData] = useState<(string | number)[][]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --- Data Fetching ---
  const loadAllTimeAnalyticsData = useCallback(async () => { // Wrap in useCallback
    setLoading(true);
    setError(null);
    console.log("Fetching all-time analytics data (hourly trend)...");

    try {
      const [statsRes, trendResRaw, distResRaw] = await Promise.all([
        sentimentApi.getAllTimeOverallStats(),
        sentimentApi.getAllTimeSentimentTrend('hour'), // Fetch hourly data
        sentimentApi.getAllTimeSentimentDistribution()
      ]);

      console.log("Analytics data fetched:", { statsRes, trendResRaw, distResRaw });

      // --- Set Stats ---
      setStats(statsRes);

      // --- Transform Trend Data ---
      const formattedTrendData: (string | number)[][] = [['Hour', 'Avg. Sentiment']];
      if (trendResRaw && trendResRaw.length > 0) {
        trendResRaw.forEach(point => {
          formattedTrendData.push([
            format(new Date(point.time_bucket), 'ha'), // e.g., "12AM", "1PM"
            point.average_sentiment ?? 0 // Use 0 if null
          ]);
        });
      }
      setTrendData(formattedTrendData);

      // --- Transform Distribution Data ---
      const formattedDistData: (string | number)[][] = [['Sentiment', 'Count']];
       if (distResRaw && distResRaw.length > 0) {
         // Ensure a consistent order for colors (Positive, Neutral, Negative)
         const orderedSlices: Record<string, number> = {'Positive': 0, 'Neutral': 0, 'Negative': 0};
         distResRaw.forEach(slice => {
           if (slice.sentiment_category in orderedSlices) {
             orderedSlices[slice.sentiment_category] = slice.message_count;
           }
         });
         Object.entries(orderedSlices).forEach(([category, count]) => {
            formattedDistData.push([category, count]);
         })
       }
      setDistributionData(formattedDistData);

    } catch (err: any) {
      console.error("Failed to load all-time analytics data:", err);
      setError(err.message || 'An unknown error occurred while fetching analytics data.');
    } finally {
      setLoading(false);
    }
  }, []); // Add empty dependency array for useCallback

  useEffect(() => {
    loadAllTimeAnalyticsData();
  }, [loadAllTimeAnalyticsData]); // Call fetch function

  // Recharts data sets (memoized)
  const trendChartData = React.useMemo(
    () => trendData.slice(1).map((r) => ({ hour: r[0] as string, avg: r[1] as number })),
    [trendData]
  );

  const distributionChartData = React.useMemo(
    () => distributionData.slice(1).map((r) => ({ sentiment: r[0] as string, count: r[1] as number })),
    [distributionData]
  );

  // --- Render Helper for Stat Card Content ---
  const renderStatContent = (value: number | undefined | null, formatType: 'number' | 'decimal' | 'score', unit?: string) => {
     if (loading) {
        return <Skeleton className="h-8 w-3/4 mt-1 bg-muted/50" />;
     }
      if (value === undefined || value === null) {
        return <div className="text-3xl font-bold text-muted-foreground">N/A</div>;
      }

      let displayValue: string;
      let colorClass = '';

      switch (formatType) {
          case 'number':
              displayValue = value.toLocaleString();
              break;
          case 'decimal':
              displayValue = value.toFixed(1);
              break;
          case 'score':
              displayValue = value.toFixed(1);
               // More nuanced coloring for score
               if (value > 20) colorClass = 'text-green-600 dark:text-green-500';
               else if (value > -20) colorClass = 'text-gray-700 dark:text-gray-300'; // Neutral range
               else colorClass = 'text-red-600 dark:text-red-500';
              break;
          default:
              displayValue = String(value);
      }


      return (
          <div className={`text-3xl font-bold ${formatType === 'score' ? colorClass : ''}`}>
              {displayValue}
              {unit && <span className="text-base font-normal text-muted-foreground">{unit}</span>}
          </div>
      );
  };


  // --- Render Function ---
  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <div className="container mx-auto flex-1 flex flex-col p-4 lg:p-6 overflow-hidden">
        {/* Header (matches moderation page) */}
        <div className="mb-3 flex-shrink-0 flex justify-between items-center">
          <h1 className="text-xl lg:text-2xl font-bold">Analytics Dashboard</h1>

          {/* Refresh Action */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={loadAllTimeAnalyticsData} disabled={loading}>
                <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="sr-only">Refresh</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Refresh data</TooltipContent>
          </Tooltip>
        </div>

        {/* Main Scrollable Area */}
        <ScrollArea className="flex-1 overflow-hidden">
          <div className="space-y-6">
            {/* --- Loading & Error Handling --- */}
            {loading ? (
              <div className="space-y-4 lg:space-y-6 animate-pulse">
                {/* Stats Skeletons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 md:gap-6">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="border-transparent shadow-sm bg-card">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 lg:h-5 w-1/3 bg-muted/50" />
                        <Skeleton className="h-4 lg:h-5 w-5 rounded-sm bg-muted/50" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-6 lg:h-8 w-3/4 mt-1 bg-muted/50" />
                        <Skeleton className="h-3 lg:h-4 w-1/2 mt-2 bg-muted/40" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
                 {/* Chart Skeletons */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 lg:gap-4 md:gap-6">
                    {/* Line Chart Skeleton */}
                    <Card className="border-transparent shadow-sm lg:col-span-3 bg-card">
                        <CardHeader>
                           <Skeleton className="h-5 lg:h-6 w-1/2 bg-muted/50" />
                           <Skeleton className="h-3 lg:h-4 w-3/4 mt-2 bg-muted/40" />
                        </CardHeader>
                        <CardContent className="h-[250px] lg:h-[300px] md:h-[350px] flex items-center justify-center">
                            <Skeleton className="h-full w-full bg-muted/30" />
                        </CardContent>
                    </Card>
                     {/* Pie Chart Skeleton */}
                     <Card className="border-transparent shadow-sm lg:col-span-2 bg-card">
                         <CardHeader>
                             <Skeleton className="h-5 lg:h-6 w-1/2 bg-muted/50" />
                             <Skeleton className="h-3 lg:h-4 w-3/4 mt-2 bg-muted/40" />
                         </CardHeader>
                        <CardContent className="h-[250px] lg:h-[300px] md:h-[350px] flex items-center justify-center">
                            <Skeleton className="h-3/4 w-3/4 rounded-full bg-muted/30" />
                        </CardContent>
                     </Card>
                </div>
              </div>
            ) : error ? (
              // --- Error State ---
              <Alert variant="destructive" className="max-w-2xl mx-auto">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <AlertTitle>Error Loading Analytics</AlertTitle>
                <AlertDescription className="mb-3">
                  We encountered a problem retrieving the sentiment data. Details: {error}
                </AlertDescription>
                <Button size="sm" onClick={loadAllTimeAnalyticsData}>Try Again</Button>
              </Alert>
            ) : (
              <>
                {/* --- Stats Grid --- */}
                <div className="grid gap-3 lg:gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {/* Total Messages */}
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Card className="group cursor-pointer transition-shadow hover:shadow-md">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                          <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                          <ChatBubbleLeftEllipsisIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="pt-0">
                          {renderStatContent(stats?.total_messages, 'number')}
                        </CardContent>
                      </Card>
                    </HoverCardTrigger>
                    <HoverCardContent side="bottom" className="w-56 text-xs text-muted-foreground">Total number of messages analyzed across your entire community.</HoverCardContent>
                  </HoverCard>

                  {/* Avg Sentiment */}
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Card className="group cursor-pointer transition-shadow hover:shadow-md">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                          <CardTitle className="text-sm font-medium">Avg. Sentiment</CardTitle>
                          <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="pt-0 space-y-2">
                          {renderStatContent(stats?.average_sentiment, 'score')}
                          {/* Progress bar scaled from -100..100 to 0..100 */}
                          <Progress value={((stats?.average_sentiment ?? 0) + 100) / 2} />
                        </CardContent>
                      </Card>
                    </HoverCardTrigger>
                    <HoverCardContent side="bottom" className="w-56 text-xs text-muted-foreground">A measure of positivity vs. negativity (-100 to +100). Higher is better.</HoverCardContent>
                  </HoverCard>

                  {/* Unique Players */}
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Card className="group cursor-pointer transition-shadow hover:shadow-md">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                          <CardTitle className="text-sm font-medium">Unique Players</CardTitle>
                          <UsersIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="pt-0">
                          {renderStatContent(stats?.unique_players, 'number')}
                        </CardContent>
                      </Card>
                    </HoverCardTrigger>
                    <HoverCardContent side="bottom" className="w-56 text-xs text-muted-foreground">Number of distinct players that have sent at least one message.</HoverCardContent>
                  </HoverCard>

                  {/* Sentiment Badge Stat */}
                  <Card className="flex flex-col items-center justify-center border-dashed border-2 border-muted-foreground/30 text-sm text-muted-foreground">
                    <p className="mb-1">Overall Sentiment</p>
                    {stats && (
                      <Badge
                        className={
                          stats.average_sentiment > 20
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : stats.average_sentiment < -20
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-gray-500 hover:bg-gray-600 text-white'
                        }
                      >
                        {stats.average_sentiment > 20 ? 'Positive' : stats.average_sentiment < -20 ? 'Negative' : 'Neutral'}
                      </Badge>
                    )}
                  </Card>
                </div>

                {/* --- Charts Grid --- */}
                <div className="grid gap-3 lg:gap-4 xl:grid-cols-3">
                  {/* Line Chart Card (takes 2 cols on XL) */}
                  <Card className="xl:col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base lg:text-lg">Hourly Sentiment Trend</CardTitle>
                      <CardDescription className="text-xs lg:text-sm">Average sentiment score throughout the day.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[280px] lg:h-[320px] p-2">
                      {trendChartData.length ? (
                        <ChartContainer className="w-full h-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={LINE_CHART_COLOR[0]} stopOpacity={0.3} />
                                  <stop offset="95%" stopColor={LINE_CHART_COLOR[0]} stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E180" vertical={false} />
                              <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                              <YAxis domain={[-100, 100]} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} tickCount={5} />
                              <RechartsTooltip wrapperClassName="text-xs" />
                              <Area type="monotone" dataKey="avg" stroke="none" fill="url(#sentimentGradient)" />
                              <Line type="monotone" dataKey="avg" stroke={LINE_CHART_COLOR[0]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 4 }} />
                              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 2" />
                              <ReferenceLine y={50} stroke="#94A3B8" strokeDasharray="3 3" />
                              <ReferenceLine y={-50} stroke="#94A3B8" strokeDasharray="3 3" />
                            </LineChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No data available.</div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Pie Chart Card */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Sentiment Distribution</CardTitle>
                      <CardDescription className="text-xs">Breakdown of messages by sentiment.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[280px] lg:h-[320px] p-2 flex items-center justify-center">
                      {distributionChartData.length ? (
                        <ChartContainer className="w-full h-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <RechartsTooltip wrapperClassName="text-xs" />
                              <Legend verticalAlign="bottom" height={36} />
                              <Pie
                                data={distributionChartData}
                                dataKey="count"
                                nameKey="sentiment"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                innerRadius={40}
                                paddingAngle={4}
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              >
                                {distributionChartData.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      ) : (
                        <div className="text-sm text-muted-foreground">No data available.</div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}