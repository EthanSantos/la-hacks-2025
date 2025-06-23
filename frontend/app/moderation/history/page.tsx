"use client"

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconSearch, IconFilter, IconDownload, IconCheck, IconX, IconAlertTriangle, IconEye, IconHistory } from "@tabler/icons-react"
import { Message } from '@/types/sentiment';
import { moderationApi } from '@/lib/api/sentiment';

export default function ModerationHistoryPage() {
  const [historyItems, setHistoryItems] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('7days');

  const fetchHistoryItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const messages = await moderationApi.getReviewedMessages(100);
      // Filter to only show messages that have been moderated (have moderation_action)
      const moderatedMessages = messages.filter(msg => msg.moderation_action);
      setHistoryItems(moderatedMessages);
    } catch (err) {
      console.error('Failed to fetch reviewed messages:', err);
      setError('Failed to load moderation history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryItems();
  }, []);

  const getActionColor = (action: string) => {
    switch (action) {
      case "approve":
        return "bg-green-100 text-green-800"
      case "warn":
        return "bg-yellow-100 text-yellow-800"
      case "kick":
        return "bg-orange-100 text-orange-800"
      case "ban":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "approve":
        return <IconCheck className="h-4 w-4" />
      case "warn":
        return <IconAlertTriangle className="h-4 w-4" />
      case "kick":
        return <IconX className="h-4 w-4" />
      case "ban":
        return <IconX className="h-4 w-4" />
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredItems = historyItems.filter(item => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      item.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.player_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Action filter
    const matchesAction = actionFilter === 'all' || item.moderation_action === actionFilter;
    
    // Date filter
    const itemDate = new Date(item.created_at);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let matchesDate = true;
    switch (dateFilter) {
      case 'today':
        matchesDate = daysDiff === 0;
        break;
      case '7days':
        matchesDate = daysDiff <= 7;
        break;
      case '30days':
        matchesDate = daysDiff <= 30;
        break;
      case '90days':
        matchesDate = daysDiff <= 90;
        break;
    }
    
    return matchesSearch && matchesAction && matchesDate;
  });

  if (loading) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Moderation History</h1>
              <p className="text-muted-foreground">
                View past moderation actions and decisions
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                  <div className="flex gap-2">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Moderation History</h1>
            <p className="text-muted-foreground">
              View past moderation actions and decisions
            </p>
          </div>
          <Button variant="outline" className="flex items-center gap-1">
            <IconDownload className="h-4 w-4" />
            Export
          </Button>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search messages..." 
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Action</label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All actions</SelectItem>
                    <SelectItem value="approve">Approved</SelectItem>
                    <SelectItem value="warn">Warned</SelectItem>
                    <SelectItem value="kick">Kicked</SelectItem>
                    <SelectItem value="ban">Banned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Last 7 days" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="7days">Last 7 days</SelectItem>
                    <SelectItem value="30days">Last 30 days</SelectItem>
                    <SelectItem value="90days">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Results</label>
                <div className="text-sm text-muted-foreground pt-2">
                  {filteredItems.length} of {historyItems.length} items
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History List */}
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <IconHistory className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Moderation History</h3>
              <p className="text-muted-foreground text-center">
                {historyItems.length === 0 
                  ? "No moderation actions have been performed yet."
                  : "No items match your current filters."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <Card key={item.message_id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={getActionColor(item.moderation_action || '')}>
                        <div className="flex items-center gap-1">
                          {getActionIcon(item.moderation_action || '')}
                          {item.moderation_action?.toUpperCase()}
                        </div>
                      </Badge>
                      <span className="text-sm text-muted-foreground">by {item.player_name}</span>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">{formatDate(item.created_at)}</span>
                    </div>
                    <Button size="sm" variant="outline" className="flex items-center gap-1">
                      <IconEye className="h-4 w-4" />
                      View Details
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-1">User: {item.player_name} (ID: {item.player_id})</p>
                      <p className="text-sm bg-muted p-3 rounded-md">{item.message}</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Sentiment:</span>
                        <Badge variant="outline">{item.sentiment_score > 0 ? '+' : ''}{item.sentiment_score}</Badge>
                      </div>
                      {item.moderation_reason && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Reason:</span>
                          <span className="text-sm">{item.moderation_reason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredItems.length} of {historyItems.length} results
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Previous</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      </div>
    </div>
  )
} 