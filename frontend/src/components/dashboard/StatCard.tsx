'use client';

import { useMemo } from 'react';
import ChatLog from "@/components/chat-log/Chat";
import SentimentAnalyzer from "@/components/sentiment-analyzer/SentimentAnalyzer";
import { useLiveMessages } from '@/hooks/useLiveMessages';
import { Card, CardContent } from '@/components/ui/card';

// StatsCard Component
interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  className?: string;
}

export default function StatsCard({ title, value, description, className }: StatsCardProps) {
  return (
    <Card className={`${className || ''}`}>
      <CardContent className="pt-3 lg:pt-6 px-3 lg:px-6 pb-3 lg:pb-6">
        <div className="text-xs lg:text-sm font-medium text-gray-500">{title}</div>
        <div className="text-lg lg:text-2xl font-bold mt-1">{value}</div>
        {description && (
          <div className="text-xs text-gray-500 mt-1">{description}</div>
        )}
      </CardContent>
    </Card>
  );
}