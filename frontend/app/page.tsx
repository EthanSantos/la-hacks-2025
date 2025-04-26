import SentimentAnalyzer from '@/components/sentiment-analyzer/SentimentAnalyzer';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <SentimentAnalyzer />
    </main>
  );
}