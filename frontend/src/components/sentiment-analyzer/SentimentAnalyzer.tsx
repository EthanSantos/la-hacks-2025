'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSentiment } from '@/hooks/useSentiment';
import SentimentResult from './SentimentResult';
import { Send, InfoIcon, BarChart } from 'lucide-react';

export default function SentimentAnalyzer() {
  const {
    message,
    setMessage,
    result,
    error,
    isAnalyzing,
    analyzeSentiment
  } = useSentiment();

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (result) {
      setIsModalOpen(true);
    }
  }, [result]);

  const handleAnalyze = () => {
    if (message.trim()) {
      analyzeSentiment();
    }
  };

  return (
    <>
      <Card className="w-full h-full flex flex-col shadow-sm">
        <CardHeader className="flex-shrink-0 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BarChart className="h-5 w-5 mr-2 text-primary" />
              <CardTitle>Sentiment Analyzer</CardTitle>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <InfoIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">Analyze text to determine its emotional tone on a scale from -100 (very negative) to +100 (very positive)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription>
            Enter a message to analyze its emotional tone and sentiment
          </CardDescription>
        </CardHeader>

        {/* Removed overflow-auto from this className */}
        <CardContent className="flex flex-col px-6 space-y-4 flex-1">
          <Textarea
            className="min-h-[125px] resize-none flex-1 focus-visible:ring-primary"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message to analyze..."
          />

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex-shrink-0 pt-0 px-6 pb-6">
          <Button
            onClick={handleAnalyze}
            className="w-full"
            disabled={isAnalyzing || !message.trim()}
          >
            {isAnalyzing ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent rounded-full" />
                Analyzing...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                Analyze Sentiment
                <Send className="ml-2 h-4 w-4" />
              </span>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[1100px] p-6 rounded-xl" style={{ maxHeight: "85vh" }}>
          <DialogHeader className="mb-4">
            <DialogTitle>Sentiment Analysis Result</DialogTitle>
            <DialogDescription>
              Analysis of emotional tone and sentiment score
            </DialogDescription>
          </DialogHeader>

          {result && <SentimentResult result={result} />}

        </DialogContent>
      </Dialog>
    </>
  );
}