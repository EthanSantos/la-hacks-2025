'use client';

import { Card, CardContent } from '@/components/ui/card';
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';

// StatsCard Component
interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  change?: number; // percentage change, positive or negative
  className?: string;
}

export default function StatsCard({ title, value, description, change, className }: StatsCardProps) {
  const isPositive = (change ?? 0) >= 0;
  return (
    <Card className={`${className || ''}`}>
      <CardContent className="pt-3 lg:pt-6 px-3 lg:px-6 pb-3 lg:pb-6">
        <div className="flex items-center justify-between">
          <div className="text-xs lg:text-sm font-medium text-gray-500">{title}</div>
          {change !== undefined && (
            <div className={`flex items-center text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <IconTrendingUp className="h-3 w-3 mr-0.5" /> : <IconTrendingDown className="h-3 w-3 mr-0.5" />}
              {isPositive ? '+' : ''}{Math.abs(change)}%
            </div>
          )}
        </div>
        <div className="text-lg lg:text-2xl font-bold mt-1">{value}</div>
        {description && <div className="text-xs text-gray-500 mt-1">{description}</div>}
      </CardContent>
    </Card>
  );
}