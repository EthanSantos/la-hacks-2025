'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSentiment } from '@/hooks/useSentiment';
import SentimentResult from './SentimentResult';
import { Send, InfoIcon, BarChart2, Loader2 } from 'lucide-react';

export default function SentimentAnalyzer() {
  const {
    result,
    error,
    isLoading,
    moderationPending,
    analyzeSentiment
  } = useSentiment();

  const [message, setMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (result) {
      setIsModalOpen(true);
    }
  }, [result]);

  const handleAnalyze = () => {
    if (message.trim()) {
      analyzeSentiment(message.trim(), "Admin", 156);
    }
  };

  return (
    <>
      <Card className="w-full h-full flex flex-col">
        <CardHeader className="flex-shrink-0 pb-2 lg:pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BarChart2 className="h-4 w-4 lg:h-5 lg:w-5 mr-2 text-primary" />
              <CardTitle className="text-base lg:text-lg">Sentiment Analyzer</CardTitle>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 lg:h-8 lg:w-8">
                    <InfoIcon className="h-3 w-3 lg:h-4 lg:w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">Analyze text to determine its emotional tone on a scale from -100 (very negative) to +100 (very positive)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription className="text-xs lg:text-sm">
            Enter a message to analyze its emotional tone and sentiment
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col px-4 lg:px-6 pb-6 space-y-3 lg:space-y-4">
          <Textarea
            className="min-h-[80px] lg:min-h-[70px] resize-none focus-visible:ring-primary text-sm"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message to analyze..."
          />

          {error && (
            <Alert variant="destructive" className="text-xs">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleAnalyze}
            className="w-full text-sm mt-2"
            disabled={isLoading || !message.trim()}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="h-3 w-3 lg:h-4 lg:w-4 mr-2 animate-spin" />
                Analyzing...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                Analyze Sentiment
                <Send className="ml-2 h-3 w-3 lg:h-4 lg:w-4" />
              </span>
            )}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[1400px] p-0 rounded-xl" style={{ maxHeight: "90vh" }}>
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="text-xl font-semibold">
              Analysis Results
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 overflow-y-auto" style={{ maxHeight: "calc(90vh - 120px)" }}>
            {result && <SentimentResult result={result} moderationPending={moderationPending} />}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}