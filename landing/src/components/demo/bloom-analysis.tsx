"use client";

import { useState, useEffect, useRef, memo, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconShield, IconHeart, IconAlertTriangle, IconCheck, IconX } from "@tabler/icons-react";

interface AnalysisResult {
  messageId: number;
  status: "safe" | "toxic" | "positive";
  sentiment: number;
  action: string;
  details: string;
}

interface BloomAnalysisProps {
  triggerAnalysis?: number;
}

const analysisResults: AnalysisResult[] = [
  {
    messageId: 1,
    status: "positive",
    sentiment: 85,
    action: "Approved +2 points",
    details: "Positive sportsmanship detected"
  },
  {
    messageId: 2,
    status: "toxic",
    sentiment: -85,
    action: "Message flagged",
    details: "Toxic language detected • User warned"
  },
  {
    messageId: 3,
    status: "positive",
    sentiment: 92,
    action: "Approved +2 points",
    details: "Friendly team invitation"
  },
  {
    messageId: 4,
    status: "safe",
    sentiment: 20,
    action: "Approved",
    details: "Constructive feedback"
  },
  {
    messageId: 5,
    status: "toxic",
    sentiment: -75,
    action: "Message blocked",
    details: "Harassment detected • Temporary mute"
  },
];

export const BloomAnalysis = memo(function BloomAnalysis({ triggerAnalysis }: BloomAnalysisProps) {
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);
  const mountedRef = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset state when component mounts/remounts
  useEffect(() => {
    mountedRef.current = true;
    
    // Reset state on mount to ensure clean slate
    setCurrentAnalysis(null);
    setAnalysisHistory([]);
    
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Trigger analysis when new message completes
  useEffect(() => {
    if (!mountedRef.current) return;
    
    if (triggerAnalysis !== undefined && triggerAnalysis >= 0) {
      // Clear any existing timeout
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      const analysis = analysisResults[triggerAnalysis % analysisResults.length];
      setCurrentAnalysis(analysis);
      
      // Move to history after showing - increased to match longer message timing
      timeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setAnalysisHistory(prev => [analysis, ...prev].slice(0, 5));
          setCurrentAnalysis(null);
        }
      }, 3500);
    }
  }, [triggerAnalysis]);

  // Memoize status icon computation
  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case "safe":
        return <IconShield className="w-4 h-4 text-blue-400" />;
      case "positive":
        return <IconHeart className="w-4 h-4 text-green-400" />;
      case "toxic":
        return <IconAlertTriangle className="w-4 h-4 text-red-400" />;
      default:
        return <IconCheck className="w-4 h-4 text-gray-400" />;
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "safe":
        return "text-blue-400";
      case "positive":
        return "text-green-400";
      case "toxic":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  }, []);

  return (
    <div className="relative w-full max-w-md">
      <div className="relative rounded-xl lg:rounded-[24px] border border-neutral-700 bg-neutral-800/50 backdrop-blur-lg p-2 md:p-4">
        <div className="absolute top-1/4 left-1/2 -z-10 w-3/4 h-1/4 bg-gradient-to-r from-green-500/20 to-blue-500/20 -translate-x-1/2 -translate-y-1/2 blur-[3rem]"></div>
        
        <div className="rounded-lg lg:rounded-[20px] border border-neutral-700 bg-black/90 overflow-hidden">
          {/* Header */}
          <div className="border-b border-neutral-700 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="font-medium text-sm text-white">Bloom AI Analysis</span>
              <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                Real-time
              </span>
            </div>
          </div>

          {/* Current Analysis */}
          <div className="p-4 h-64 flex flex-col" style={{ contain: "layout" }}>
            <AnimatePresence>
              {currentAnalysis && (
                <motion.div
                  initial={{ opacity: 0, transform: "scale(0.95)" }}
                  animate={{ opacity: 1, transform: "scale(1)" }}
                  exit={{ opacity: 0, transform: "scale(0.95)" }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="mb-4 p-3 bg-neutral-800/50 rounded-lg border border-neutral-600 ring-1 ring-green-400/20"
                  style={{ willChange: "transform, opacity" }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(currentAnalysis.status)}
                    <span className={`font-medium text-sm ${getStatusColor(currentAnalysis.status)}`}>
                      {currentAnalysis.action}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{currentAnalysis.details}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Sentiment:</span>
                    <div className="flex-1 bg-neutral-700 rounded-full h-1.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.abs(currentAnalysis.sentiment)}%` }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className={`h-full rounded-full ${
                          currentAnalysis.sentiment > 50 ? 'bg-green-400' :
                          currentAnalysis.sentiment >= -20 && currentAnalysis.sentiment <= 20 ? 'bg-yellow-400' : 'bg-red-400'
                        }`}
                        style={{ willChange: "width" }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{currentAnalysis.sentiment > 0 ? '+' : ''}{currentAnalysis.sentiment}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Analysis History */}
            <div className="mb-4">
              <h4 className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Recent Analysis</h4>
              <div className="space-y-2 max-h-28 overflow-y-auto">
                {analysisHistory.map((analysis, index) => (
                  <motion.div
                    key={analysis.messageId}
                    initial={{ opacity: 0, transform: "translateX(20px)" }}
                    animate={{ opacity: 1, transform: "translateX(0)" }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="flex items-center gap-2 p-2 bg-neutral-900/50 rounded text-xs"
                    style={{ willChange: "transform, opacity" }}
                  >
                    {getStatusIcon(analysis.status)}
                    <span className={`flex-1 ${getStatusColor(analysis.status)}`}>
                      {analysis.action}
                    </span>
                    <span className="text-gray-500">{analysis.sentiment > 0 ? '+' : ''}{analysis.sentiment}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Stats Footer */}
            <div className="mt-4 pt-3 border-t border-neutral-700 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-green-400">94.2%</div>
                <div className="text-xs text-gray-500">Safety Score</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-blue-400">847</div>
                <div className="text-xs text-gray-500">Messages</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-yellow-400">125ms</div>
                <div className="text-xs text-gray-500">Avg Response</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});