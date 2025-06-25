"use client";

import { IconShield, IconHeart, IconAlertTriangle } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, memo, useCallback } from "react";

interface AnalysisNotification {
  id: number;
  message: string;
  sentiment: number;
  status: "positive";
  action: string;
  details: string;
}

export const AnalyzeCard = memo(function AnalyzeCard() {
  const [notifications, setNotifications] = useState<AnalysisNotification[]>([
    {
      id: Date.now(),
      message: "Great teamwork everyone! GG", 
      sentiment: 85, 
      status: "positive" as const,
      action: "Approved +2 points",
      details: "Positive sportsmanship detected"
    }
  ]);

  const sampleMessages = [
    { 
      message: "Great teamwork everyone! GG", 
      sentiment: 85, 
      status: "positive" as const,
      action: "Approved +2 points",
      details: "Positive sportsmanship detected"
    },
    { 
      message: "Can someone help me with this level?", 
      sentiment: 45, 
      status: "positive" as const,
      action: "Approved +2 points",
      details: "Constructive team communication"
    },
    { 
      message: "Thanks for the assist! Really appreciate it", 
      sentiment: 92, 
      status: "positive" as const,
      action: "Approved +2 points",
      details: "Gratitude and team support"
    },
    { 
      message: "Nice strategy! Let's try that again", 
      sentiment: 78, 
      status: "positive" as const,
      action: "Approved +2 points",
      details: "Positive team communication"
    },
    { 
      message: "Well played everyone, good game!", 
      sentiment: 88, 
      status: "positive" as const,
      action: "Approved +2 points",
      details: "Good sportsmanship displayed"
    },
    { 
      message: "Anyone want to team up for the next round?", 
      sentiment: 65, 
      status: "positive" as const,
      action: "Approved +2 points",
      details: "Friendly team invitation"
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      const message = sampleMessages[Math.floor(Math.random() * sampleMessages.length)];
      const notification: AnalysisNotification = {
        id: Date.now(),
        ...message
      };

      setNotifications(prev => [notification, ...prev].slice(0, 3));
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "positive":
        return <IconHeart className="w-4 h-4 text-green-400" />;
      case "toxic":
        return <IconAlertTriangle className="w-4 h-4 text-red-400" />;
      case "safe":
        return <IconShield className="w-4 h-4 text-blue-400" />;
      default:
        return <IconShield className="w-4 h-4 text-blue-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "positive":
        return "text-green-400";
      case "toxic":
        return "text-red-400";
      case "safe":
        return "text-blue-400";
      default:
        return "text-blue-400";
    }
  };

  return (
    <div className="w-full h-[300px] flex flex-col overflow-hidden">
      <div className="flex-1 flex items-center justify-center">
        <div className="h-[180px] w-full relative mt-8 min-w-[300px]">
        <AnimatePresence mode="popLayout">
          {notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, transform: "translateY(-60px) scale(0.95)" }}
              animate={{ 
                opacity: index === 0 ? 1 : index === 1 ? 0.8 : 0.6,
                transform: `translateY(${index * 20}px) scale(${1 - (index * 0.05)}) translateZ(${(notifications.length - index) * 10}px)`
              }}
              exit={{ opacity: 0, transform: "translateY(-20px) scale(0.9)" }}
              transition={{ 
                type: "tween", 
                duration: 0.3,
                ease: "easeOut"
              }}
              className="absolute top-0 left-0 right-0 p-3 bg-neutral-900/95 rounded-lg border border-neutral-600"
              style={{
                zIndex: notifications.length - index,
                willChange: "transform, opacity",
                backfaceVisibility: "hidden",
                filter: `drop-shadow(0 ${index * 2}px ${8 + index * 4}px rgba(0,0,0,0.2))`
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(notification.status)}
                <span className={`font-medium text-sm ${getStatusColor(notification.status)}`}>
                  {notification.action}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-2">{notification.details}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Sentiment:</span>
                <div className="flex-1 bg-neutral-700 rounded-full h-1.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.abs(notification.sentiment)}%` }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className={`h-full rounded-full ${
                      notification.sentiment > 50 ? 'bg-green-400' :
                      notification.sentiment >= -20 && notification.sentiment <= 20 ? 'bg-yellow-400' : 'bg-red-400'
                    }`}
                  />
                </div>
                <span className="text-xs text-gray-400">{notification.sentiment > 0 ? '+' : ''}{notification.sentiment}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        </div>
      </div>
    </div>
  );
});