'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSentiment } from '@/hooks/useSentiment';
import SentimentResult from './SentimentResult';

export default function SentimentAnalyzer() {
  const {
    message,
    setMessage,
    result,
    error,
    isAnalyzing,
    analyzeSentiment
  } = useSentiment();

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Sentiment Analyzer</CardTitle>
        <CardDescription>
          Enter a message to analyze its sentiment score
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col p-3 space-y-4 flex-1 overflow-auto" style={{ height: 0 }}>
        <Textarea
          className="min-h-[100px] resize-none"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your message to analyze"
        />

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && <SentimentResult result={result} />}
      </CardContent>

      <CardFooter className="flex-shrink-0">
        <Button
          onClick={analyzeSentiment}
          className="w-full"
          disabled={isAnalyzing}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Sentiment'}
        </Button>
      </CardFooter>
    </Card>
  );
}