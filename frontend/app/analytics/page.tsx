'use client';

import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback

// --- UI Components ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from '@/components/ui/button'; // Import Button for Retry
// Import the Chart component from react-google-charts
import { Chart } from "react-google-charts";

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
  ChartBarIcon, // Or use a sentiment-specific icon
  UsersIcon,
  ExclamationTriangleIcon
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

  // --- Chart Options (Extracted for Readability) ---
  const lineChartOptions = {
    curveType: 'function', // Smoother line
    legend: { position: 'none' },
    hAxis: {
      title: 'Hour of Day',
      textStyle: { color: 'hsl(var(--muted-foreground))', fontSize: 11 },
      titleTextStyle: { color: 'hsl(var(--muted-foreground))', fontSize: 12, italic: false, bold: false },
      gridlines: { color: 'transparent' },
      slantedText: false,
      // Dynamically adjust label frequency based on data points, ensuring reasonable spacing
      showTextEvery: Math.max(1, Math.ceil(trendData.length / 12)),
    },
    vAxis: {
      title: 'Avg. Sentiment Score',
      minValue: -100,
      maxValue: 100,
      textStyle: { color: 'hsl(var(--muted-foreground))', fontSize: 11 },
      titleTextStyle: { color: 'hsl(var(--muted-foreground))', fontSize: 12, italic: false, bold: false },
      gridlines: { color: 'hsl(var(--border))', count: 5 }, // Use theme border color
      baselineColor: 'hsl(var(--muted-foreground))', // Use theme muted color
    },
    colors: LINE_CHART_COLOR,
    chartArea: { width: '85%', height: '75%', left: 60, top: 20 }, // Adjust margins if needed
    tooltip: {
      textStyle: { color: '#333' }, // Tooltip text color (often best kept dark for readability)
      showColorCode: true,
      isHtml: true, // Allows for richer HTML tooltips if needed later
    },
    pointSize: 5, // Slightly larger points
    lineWidth: 2,
    series: { 0: { areaOpacity: 0.1 } }, // Subtle area fill
    backgroundColor: 'transparent', // Use card background
    // focusTarget: 'category', // Highlights points/tooltips based on category hover
  };

  const pieChartOptions = {
    pieHole: 0.45, // Slightly larger hole
    is3D: false,
    // Colors assigned based on the guaranteed order (Positive, Neutral, Negative)
    colors: PIE_CHART_COLORS,
    legend: {
      position: 'bottom',
      alignment: 'center',
      textStyle: { color: 'hsl(var(--foreground))', fontSize: 13 }, // Use theme text color
    },
    tooltip: {
      text: 'percentage', // Show percentage on hover
      textStyle: { color: '#333' },
      showColorCode: true,
    },
    pieSliceTextStyle: {
      color: '#FFFFFF', // White text on slices
      fontSize: 12,
      bold: true,
    },
    // Use card background color for slice border for seamless look
    pieSliceBorderColor: 'hsl(var(--card))',
    chartArea: { width: '90%', height: '75%', top: 20 }, // Adjust area
    backgroundColor: 'transparent', // Use card background
     // Slices object is less critical now due to guaranteed data order matching PIE_CHART_COLORS
    // slices: { ... } // Can be removed if data order is solid
  };

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
    <div className="h-full flex flex-col overflow-hidden bg-gray-100 dark:bg-gray-950">

      <main className="flex-1 overflow-y-auto p-3 lg:p-4 md:p-6 lg:p-8">
        {/* --- Page Header --- */}
        <h1 className="text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight mb-4 lg:mb-6 text-gray-900 dark:text-gray-50 text-center sm:text-left">
          Community Sentiment (All Time)
        </h1>

        {/* --- Loading State Placeholder Structure --- */}
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
          <Card className="border-destructive bg-destructive/10 text-destructive max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                <ExclamationTriangleIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                Error Loading Analytics
              </CardTitle>
              <CardDescription className="text-destructive/80 pt-1">
                We encountered a problem retrieving the sentiment data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">Details: {error}</p>
              <Button
                variant="destructive"
                size="sm"
                onClick={loadAllTimeAnalyticsData} // Add Retry button
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : (
          // --- Success State ---
          <div className="space-y-4 lg:space-y-6"> {/* Use space-y for consistent vertical spacing */}
            {/* --- Overall Stats --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 md:gap-6">
              {/* Stat Card 1: Total Messages */}
              <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-lg overflow-hidden bg-card text-card-foreground">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 lg:pt-4 px-4 lg:px-5">
                  <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">Total Messages</CardTitle>
                  <ChatBubbleLeftEllipsisIcon className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pb-3 lg:pb-4 px-4 lg:px-5">
                   {renderStatContent(stats?.total_messages, 'number')}
                  <p className="text-xs text-muted-foreground pt-1">Total messages analyzed</p>
                </CardContent>
              </Card>

              {/* Stat Card 2: Avg. Sentiment Score */}
              <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-lg overflow-hidden bg-card text-card-foreground">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 lg:pt-4 px-4 lg:px-5">
                  <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">Avg. Sentiment Score</CardTitle>
                  <ChartBarIcon className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" /> {/* Example Icon */}
                </CardHeader>
                <CardContent className="pb-3 lg:pb-4 px-4 lg:px-5">
                  {renderStatContent(stats?.average_sentiment, 'score', ' / 100')}
                  <p className="text-xs text-muted-foreground pt-1">Overall average (-100 to +100)</p>
                </CardContent>
              </Card>

              {/* Stat Card 3: Unique Players */}
              <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-lg overflow-hidden bg-card text-card-foreground">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 lg:pt-4 px-4 lg:px-5">
                  <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">Unique Players</CardTitle>
                  <UsersIcon className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pb-3 lg:pb-4 px-4 lg:px-5">
                  {renderStatContent(stats?.unique_players, 'number')}
                  <p className="text-xs text-muted-foreground pt-1">Players contributing messages</p>
                </CardContent>
              </Card>
            </div>

            {/* --- Charts Section --- */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 lg:gap-4 md:gap-6">
              {/* Hourly Sentiment Trend */}
              <Card className="border-border/50 shadow-sm rounded-lg lg:col-span-3 overflow-hidden bg-card text-card-foreground">
                <CardHeader className="pb-2 pt-3 lg:pt-4 px-4 lg:px-5">
                  <CardTitle className="text-base lg:text-lg font-medium">Hourly Sentiment Trend</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">Average sentiment score throughout the day (all time).</CardDescription>
                </CardHeader>
                <CardContent className="h-[250px] lg:h-[300px] md:h-[350px] pb-3 lg:pb-4 px-2 md:px-3">
                  {trendData.length > 1 ? (
                    <Chart
                      chartType="LineChart"
                      width="100%"
                      height="100%"
                      data={trendData}
                      options={lineChartOptions}
                      // Use loader prop for built-in chart loading indicator
                      loader={<div className="flex items-center justify-center h-full text-muted-foreground">Loading Chart...</div>}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-4 text-center">No hourly trend data available.</div>
                  )}
                </CardContent>
              </Card>

              {/* Sentiment Distribution */}
              <Card className="border-border/50 shadow-sm rounded-lg lg:col-span-2 overflow-hidden bg-card text-card-foreground">
                <CardHeader className="pb-2 pt-3 lg:pt-4 px-4 lg:px-5">
                  <CardTitle className="text-base lg:text-lg font-medium">Sentiment Distribution</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">Breakdown of messages by category.</CardDescription>
                </CardHeader>
                <CardContent className="h-[250px] lg:h-[300px] md:h-[350px] pb-3 lg:pb-4 px-2 md:px-3 flex flex-col items-center justify-center">
                  {distributionData.length > 1 && (distributionData.slice(1).reduce((sum, row) => sum + (row[1] as number), 0) > 0) ? ( // Check if there's actual data > 0
                    <Chart
                      chartType="PieChart"
                      width="100%"
                      height="100%"
                      data={distributionData}
                      options={pieChartOptions}
                      loader={<div className="flex items-center justify-center h-full text-muted-foreground">Loading Chart...</div>}
                    />
                  ) : (
                     <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-4 text-center">No sentiment distribution data available.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}