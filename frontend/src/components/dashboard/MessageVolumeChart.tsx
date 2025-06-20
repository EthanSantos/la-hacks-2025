import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

// Mock hourly message volume data (replace with live data later)
const MOCK_VOLUME = [
  { hour: '12a', positive: 40, neutral: 45, negative: 15 },
  { hour: '1a', positive: 30, neutral: 35, negative: 15 },
  { hour: '2a', positive: 22, neutral: 28, negative: 15 },
  { hour: '3a', positive: 18, neutral: 22, negative: 10 },
  { hour: '4a', positive: 15, neutral: 20, negative: 10 },
  { hour: '5a', positive: 25, neutral: 30, negative: 15 },
  { hour: '6a', positive: 45, neutral: 50, negative: 15 },
  { hour: '7a', positive: 60, neutral: 65, negative: 15 },
  { hour: '8a', positive: 75, neutral: 80, negative: 25 },
  { hour: '9a', positive: 90, neutral: 95, negative: 35 },
  { hour: '10a', positive: 110, neutral: 120, negative: 30 },
  { hour: '11a', positive: 130, neutral: 140, negative: 30 },
];

// Prepare chart data with totals to use single-colour bars
const CHART_DATA = MOCK_VOLUME.map((item) => ({
  hour: item.hour,
  total: item.positive + item.neutral + item.negative,
}));

export default function MessageVolumeChart() {
  return (
    <Card className="w-full flex-1 flex flex-col min-h-0">
      <CardHeader>
        <CardTitle className="text-base lg:text-lg">Message Volume Analysis</CardTitle>
        <CardDescription className="text-xs lg:text-sm">Messages per hour (mock data)</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={CHART_DATA} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
            <Bar dataKey="total" fill="#009982" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
} 