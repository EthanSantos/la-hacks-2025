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
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sentiment Analyzer</CardTitle>
        <CardDescription>
          Enter a message to analyze its sentiment score
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message to analyze"
            className="min-h-[100px]"
          />
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {result && <SentimentResult result={result} />}
        </div>
      </CardContent>
      <CardFooter>
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