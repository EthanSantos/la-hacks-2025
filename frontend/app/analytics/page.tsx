'use client';

import React, { useState, useEffect } from 'react';

// --- UI Components ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from "@/components/ui/skeleton";
// Import the Chart component from react-google-charts
import { Chart } from "react-google-charts";
// --- Import the SideNavbar ---
import SideNavbar from '@/components/Navbar'; // Adjust path if needed (e.g., '@/components/SideNavbar')

// --- Date Formatting ---
import { format } from 'date-fns';

// --- API Client and Types ---
import { sentimentApi } from '@/lib/api/sentiment'; // Adjust path if needed
import {
  SentimentTrendPoint,
  SentimentDistributionSlice,
  OverallStats
} from '@/types/sentiment'; // Adjust path if needed

// --- Main Analytics Page Component ---
export default function AnalyticsPage() {
  // --- State ---
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [trendData, setTrendData] = useState<(string | number)[][]>([]); // Adjusted for Google Charts
  const [distributionData, setDistributionData] = useState<(string | number)[][]>([]); // Adjusted for Google Charts
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --- Data Fetching ---
  useEffect(() => {
    async function loadAllTimeAnalyticsData() {
      setLoading(true);
      setError(null);
      console.log("Fetching all-time analytics data (hourly trend)...");

      try {
        const [statsRes, trendResRaw, distResRaw] = await Promise.all([
          sentimentApi.getAllTimeOverallStats(),
          sentimentApi.getAllTimeSentimentTrend('hour'),
          sentimentApi.getAllTimeSentimentDistribution()
        ]);

        console.log("Analytics data fetched:", { statsRes, trendResRaw, distResRaw });

        setStats(statsRes);

        // --- Transform Trend Data for Google Line Chart ---
        const formattedTrendData: (string | number)[][] = [
          ['Hour', 'Avg. Sentiment'] // Header row
        ];
        trendResRaw.forEach(point => {
          formattedTrendData.push([
            format(new Date(point.time_bucket), 'ha'), // Format time label
            point.average_sentiment // Sentiment value
          ]);
        });
        setTrendData(formattedTrendData);

        // --- Transform Distribution Data for Google Pie Chart ---
        const formattedDistData: (string | number)[][] = [
          ['Sentiment', 'Count'] // Header row
        ];
        distResRaw.forEach(slice => {
          formattedDistData.push([
            slice.sentiment_category,
            slice.message_count
          ]);
        });
        setDistributionData(formattedDistData);

      } catch (err: any) {
        console.error("Failed to load all-time analytics data:", err);
        setError(err.message || 'An unknown error occurred while fetching analytics data.');
      } finally {
        setLoading(false);
      }
    }

    loadAllTimeAnalyticsData();
  }, []);

  // --- Chart Colors ---
  const pieColors = ['#22c55e', '#64748b', '#ef4444']; // Positive, Neutral, Negative
  const lineChartColor = '#3b82f6'; // Example: Tailwind blue-500

  // --- Render Function ---
  return (
    // --- Outer Layout Container ---
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900"> {/* Use flexbox for layout */}
      {/* --- Sidebar --- */}
      <SideNavbar />

      {/* --- Main Content Area --- */}
      <main className="flex-1 overflow-y-auto"> {/* Allow content to scroll */}
        {/* --- Loading State --- */}
        {loading ? (
          <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8 animate-pulse">
            <Skeleton className="h-10 w-3/4 md:w-1/2 mb-4 rounded-md bg-gray-200 dark:bg-gray-700" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <Skeleton className="h-32 rounded-xl border bg-gray-200 dark:bg-gray-700" />
              <Skeleton className="h-32 rounded-xl border bg-gray-200 dark:bg-gray-700" />
              <Skeleton className="h-32 rounded-xl border bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
              <Skeleton className="h-96 rounded-xl border bg-gray-200 dark:bg-gray-700 lg:col-span-3" />
              <Skeleton className="h-96 rounded-xl border bg-gray-200 dark:bg-gray-700 lg:col-span-2" />
            </div>
          </div>
        ) : error ? (
          // --- Error State ---
          <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-6 text-gray-800 dark:text-gray-100">Community Sentiment (All Time)</h1>
            <Card className="border-destructive bg-destructive/10 text-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                  </svg>
                  Error Loading Analytics
                </CardTitle>
                <CardDescription className="text-destructive/80 pt-1">
                  We encountered a problem retrieving the sentiment data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Please try refreshing the page. If the problem persists, contact support.</p>
                <p className="text-xs text-destructive/70 mt-3">Error details: {error}</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          // --- Success State (Original Content) ---
          <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8 bg-background text-foreground">
            {/* --- Page Header --- */}
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-center md:text-left">
              Community Sentiment (All Time)
            </h1>

            {/* --- Overall Stats --- */}
            {stats ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Stat Card 1: Total Messages */}
                <Card className="border shadow-sm hover:shadow-lg transition-shadow duration-300 rounded-xl overflow-hidden bg-card text-card-foreground">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-medium text-muted-foreground">Total Messages</CardTitle>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-5 w-5 text-muted-foreground"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> {/* Message Icon */}
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats.total_messages.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground pt-1">Total messages analyzed</p>
                  </CardContent>
                </Card>
                {/* Stat Card 2: Avg. Sentiment Score */}
                <Card className="border shadow-sm hover:shadow-lg transition-shadow duration-300 rounded-xl overflow-hidden bg-card text-card-foreground">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-medium text-muted-foreground">Avg. Sentiment Score</CardTitle>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-5 w-5 text-muted-foreground"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-1.4 14.6L7 13l1.4-1.4 2.6 2.6 5.6-5.6L18 10z"></path></svg> {/* Check Circle Icon */}
                  </CardHeader>
                  <CardContent>
                     {/* Adjusted color logic slightly for clarity */}
                    <div className={`text-3xl font-bold ${stats.average_sentiment > 10 ? 'text-green-600 dark:text-green-500' : stats.average_sentiment < -10 ? 'text-red-600 dark:text-red-500' : ''}`}>
                       {stats.average_sentiment !== null ? stats.average_sentiment.toFixed(1) : 'N/A'}
                       <span className="text-base font-normal text-muted-foreground"> / 100</span>
                    </div>
                    <p className="text-xs text-muted-foreground pt-1">Overall average (higher is better)</p>
                  </CardContent>
                </Card>
                {/* Stat Card 3: Unique Players */}
                <Card className="border shadow-sm hover:shadow-lg transition-shadow duration-300 rounded-xl overflow-hidden bg-card text-card-foreground">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-medium text-muted-foreground">Unique Players</CardTitle>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-5 w-5 text-muted-foreground"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> {/* Users Icon */}
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats.unique_players.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground pt-1">Players contributing messages</p>
                  </CardContent>
                </Card>
              </div>
            ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  <Card className="border shadow-sm rounded-xl bg-card text-card-foreground"><CardHeader><CardTitle className="text-base text-muted-foreground">Total Messages</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-muted-foreground">N/A</div></CardContent></Card>
                  <Card className="border shadow-sm rounded-xl bg-card text-card-foreground"><CardHeader><CardTitle className="text-base text-muted-foreground">Avg. Sentiment Score</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-muted-foreground">N/A</div></CardContent></Card>
                  <Card className="border shadow-sm rounded-xl bg-card text-card-foreground"><CardHeader><CardTitle className="text-base text-muted-foreground">Unique Players</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-muted-foreground">N/A</div></CardContent></Card>
               </div>
            )}

            {/* --- Charts Section --- */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
              {/* --- Hourly Sentiment Trend Chart --- */}
              <Card className="border shadow-sm rounded-xl lg:col-span-3 overflow-hidden bg-card text-card-foreground">
                <CardHeader>
                  <CardTitle className="text-xl">Hourly Sentiment Trend</CardTitle>
                  <CardDescription className="text-muted-foreground">Average sentiment score throughout the day (all time).</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px] md:h-[400px] p-1 md:p-2">
                  {trendData.length > 1 ? (
                    <Chart
                      chartType="LineChart"
                      width="100%"
                      height="100%"
                      data={trendData}
                      options={{
                        legend: { position: 'none' },
                        hAxis: {
                          title: 'Hour of Day',
                          textStyle: { color: 'hsl(var(--muted-foreground))', fontSize: 11 },
                          titleTextStyle: { color: 'hsl(var(--muted-foreground))', fontSize: 12, italic: false },
                          gridlines: { color: 'transparent' },
                          slantedText: false,
                          showTextEvery: Math.ceil(trendData.length / 12), // Show fewer labels
                        },
                        vAxis: {
                          title: 'Avg. Sentiment Score',
                          minValue: -100,
                          maxValue: 100,
                          textStyle: { color: 'hsl(var(--muted-foreground))', fontSize: 11 },
                          titleTextStyle: { color: 'hsl(var(--muted-foreground))', fontSize: 12, italic: false },
                          gridlines: { color: 'hsl(var(--border))', count: 5 },
                          baselineColor: 'hsl(var(--muted-foreground))',
                        },
                        colors: [lineChartColor],
                        chartArea: { width: '85%', height: '75%' },
                        tooltip: {
                          textStyle: { color: '#333' },
                          showColorCode: true,
                          isHtml: true,
                        },
                        pointSize: 4,
                        lineWidth: 2,
                        series: { 0: { areaOpacity: 0.15 } },
                        backgroundColor: 'transparent',
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-4 text-center">No hourly trend data available to display.</div>
                  )}
                </CardContent>
              </Card>

              {/* --- Sentiment Distribution Chart --- */}
              <Card className="border shadow-sm rounded-xl lg:col-span-2 overflow-hidden bg-card text-card-foreground">
                <CardHeader>
                  <CardTitle className="text-xl">Sentiment Distribution</CardTitle>
                  <CardDescription className="text-muted-foreground">Breakdown of messages by category.</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px] md:h-[400px] p-1 md:p-2 flex flex-col items-center justify-center">
                  {distributionData.length > 1 && stats ? (
                    <Chart
                      chartType="PieChart"
                      width="100%"
                      height="100%"
                      data={distributionData}
                      options={{
                          pieHole: 0.4,
                          is3D: false,
                          colors: pieColors, // Keep direct assignment
                          legend: {
                              position: 'bottom',
                              alignment: 'center',
                              textStyle: { color: 'hsl(var(--muted-foreground))', fontSize: 13 }
                          },
                          tooltip: {
                              text: 'percentage',
                              textStyle: { color: '#333' },
                              showColorCode: true,
                          },
                          pieSliceTextStyle: {
                              color: 'white',
                              fontSize: 12,
                          },
                          pieSliceBorderColor: 'hsl(var(--card))',
                          chartArea: { width: '90%', height: '80%' },
                          backgroundColor: 'transparent',
                          // Simplified slice color mapping - relies on data order matching pieColors order
                          slices: distributionData.slice(1).reduce((acc, _item, index) => {
                              acc[index] = { color: pieColors[index % pieColors.length] }; // Cycle through colors
                              return acc;
                          }, {} as { [key: number]: { color: string } })
                          // If order is not guaranteed (Positive, Neutral, Negative), the previous complex mapping is safer:
                          /*
                          slices: distributionData.slice(1).reduce((acc, item, index) => {
                              const category = item[0] as SentimentDistributionSlice['sentiment_category'];
                              let color;
                              if (category === 'Positive') color = pieColors[0];
                              else if (category === 'Neutral') color = pieColors[1];
                              else if (category === 'Negative') color = pieColors[2];
                              else color = '#94a3b8'; // Fallback grey
                              acc[index] = { color: color };
                              return acc;
                          }, {} as { [key: number]: { color: string } })
                          */
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-4 text-center">No distribution data available to display.</div>
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