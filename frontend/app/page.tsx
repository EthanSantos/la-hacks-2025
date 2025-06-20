'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, MessageSquare, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="container mx-auto flex-1 flex flex-col p-4 lg:p-6 overflow-hidden">
        {/* Header */}
        <div className="mb-3 flex-shrink-0">
          <h1 className="text-xl lg:text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-600 text-xs lg:text-sm">Overview of system performance and key metrics</p>
        </div>

        {/* Main content area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 flex-1 overflow-hidden min-h-0">
          {/* Left column - Stats Cards */}
          <div className="space-y-4 lg:space-y-6">
            <div className="grid grid-cols-2 gap-3 lg:gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm lg:text-base flex items-center">
                    <Users className="h-4 w-4 lg:h-5 lg:w-5 mr-2 text-blue-500" />
                    Active Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl lg:text-3xl font-bold">1,234</div>
                  <p className="text-xs text-gray-500 mt-1">+12% from last week</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm lg:text-base flex items-center">
                    <MessageSquare className="h-4 w-4 lg:h-5 lg:w-5 mr-2 text-green-500" />
                    Messages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl lg:text-3xl font-bold">5,678</div>
                  <p className="text-xs text-gray-500 mt-1">+8% from last week</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base lg:text-lg">System Status</CardTitle>
                <CardDescription className="text-xs lg:text-sm">Current system performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">API Response Time</span>
                  <span className="text-sm font-medium text-green-600">45ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database Connections</span>
                  <span className="text-sm font-medium text-blue-600">24/50</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Memory Usage</span>
                  <span className="text-sm font-medium text-orange-600">67%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">CPU Load</span>
                  <span className="text-sm font-medium text-green-600">23%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Charts and Info */}
          <div className="space-y-4 lg:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base lg:text-lg flex items-center">
                  <BarChart3 className="h-4 w-4 lg:h-5 lg:w-5 mr-2 text-purple-500" />
                  Recent Activity
                </CardTitle>
                <CardDescription className="text-xs lg:text-sm">System activity over the last 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-32 lg:h-40 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <p className="text-sm text-gray-500">Chart placeholder - Activity data will be displayed here</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base lg:text-lg flex items-center">
                  <TrendingUp className="h-4 w-4 lg:h-5 lg:w-5 mr-2 text-green-500" />
                  Quick Actions
                </CardTitle>
                <CardDescription className="text-xs lg:text-sm">Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium text-sm">View Moderation Dashboard</h4>
                  <p className="text-xs text-gray-500 mt-1">Access sentiment analysis and chat monitoring</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium text-sm">Check Analytics</h4>
                  <p className="text-xs text-gray-500 mt-1">Review community sentiment trends</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium text-sm">Leaderboard</h4>
                  <p className="text-xs text-gray-500 mt-1">View top performing players</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}