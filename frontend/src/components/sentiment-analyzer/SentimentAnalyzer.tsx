'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  useEffect(() => {
    if (result) {
      setIsModalOpen(true);
    }
  }, [result]);
  
  const handleAnalyze = () => {
    analyzeSentiment();
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Card className="w-full h-full flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle>Sentiment Analyzer</CardTitle>
          <CardDescription>
            Enter a message to analyze its sentiment score
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col p-6 space-y-4 flex-1 overflow-auto">
          <Textarea
            className="min-h-[100px] resize-none flex-1"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message to analyze"
          />

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex-shrink-0">
          <Button
            onClick={handleAnalyze}
            className="w-full"
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Sentiment'}
          </Button>
        </CardFooter>
      </Card>
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sentiment Analysis Result</DialogTitle>
          </DialogHeader>
          
          <div className="py-2"> 
             {result && <SentimentResult result={result} />}
          </div>
          
          <DialogFooter>
            <Button type="button" onClick={handleCloseModal}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}