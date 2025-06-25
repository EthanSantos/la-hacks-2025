"use client";

import { useState, useEffect } from "react";
import Container from "@/components/layout/container";
import { FeatureCards } from "./feature-cards";
import { ProtectionDemo } from "./feature-demos/protection-demo";
import { RewardsDemo } from "./feature-demos/rewards-demo";
import { ModerationDemo } from "./feature-demos/moderation-demo";
import { AnalyticsDemo } from "./feature-demos/analytics-demo";
import { FlaggingDemo } from "./feature-demos/flagging-demo";
import { MonitoringDemo } from "./feature-demos/monitoring-demo";
import { 
  IconShield, 
  IconTrophy, 
  IconBolt, 
  IconChartLine, 
  IconFlag, 
  IconClock 
} from "@tabler/icons-react";

export interface Feature {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: "emerald" | "blue" | "yellow" | "purple" | "orange" | "indigo";
  demo: {
    type: string;
    stats: Record<string, string | number>;
    [key: string]: any;
  };
}

const features: Feature[] = [
  {
    id: "protection",
    icon: IconShield,
    title: "Smart Content Protection",
    description: "Automatically detects harmful content, personal information sharing, and toxic behavior before it affects your community",
    color: "emerald",
    demo: {
      type: "protection",
      stats: {
        blocked: 1247,
        accuracy: "99.2%",
        responseTime: "< 50ms"
      },
      recentBlocks: [
        { type: "Toxic Language", count: 45, severity: "high" },
        { type: "Personal Info", count: 23, severity: "medium" },
        { type: "Spam", count: 89, severity: "low" }
      ]
    }
  },
  {
    id: "rewards",
    icon: IconTrophy,
    title: "Positive Behavior Rewards",
    description: "Built-in point system and leaderboards that encourage helpful, supportive community interactions",
    color: "blue",
    demo: {
      type: "rewards",
      stats: {
        pointsAwarded: "15,420",
        activeRewards: 8,
        engagement: "+32%"
      },
      leaderboard: [
        { name: "HelperPro99", points: 2840, badge: "Bloom MVP" },
        { name: "KindGamer23", points: 2156, badge: "Bloom MVP" },
        { name: "TeamPlayer", points: 1923, badge: "Bloom MVP" }
      ]
    }
  },
  {
    id: "moderation",
    icon: IconBolt,
    title: "Real-Time Moderation",
    description: "Instant analysis and action on every message, with manual override controls for community managers",
    color: "yellow",
    demo: {
      type: "moderation",
      stats: {
        messagesProcessed: "98,234",
        averageTime: "23ms",
        uptime: "99.9%"
      },
      recentActions: [
        { action: "Auto-approved", messages: 2847, time: "Last minute" },
        { action: "Flagged for review", messages: 12, time: "Last minute" },
        { action: "Auto-blocked", messages: 3, time: "Last minute" }
      ]
    }
  },
  {
    id: "analytics",
    icon: IconChartLine,
    title: "Community Health Analytics",
    description: "Track sentiment trends, identify positive contributors, and get insights to improve your community culture",
    color: "purple",
    demo: {
      type: "analytics",
      stats: {
        sentiment: "+84",
        engagement: "High",
        healthScore: 92
      },
      trends: [
        { metric: "Positive interactions", change: "+18%", trend: "up" },
        { metric: "Toxic behavior", change: "-67%", trend: "down" },
        { metric: "Community participation", change: "+24%", trend: "up" }
      ]
    }
  },
  {
    id: "flagging",
    icon: IconFlag,
    title: "Smart Flagging System",
    description: "Automatically flags concerning content for review while learning from your moderation decisions",
    color: "orange",
    demo: {
      type: "flagging",
      stats: {
        flagged: 156,
        reviewed: 143,
        accuracy: "96.8%"
      },
      queue: [
        { priority: "High", count: 3, type: "Potential harassment" },
        { priority: "Medium", count: 8, type: "Spam detection" },
        { priority: "Low", count: 12, type: "Minor violations" }
      ]
    }
  },
  {
    id: "monitoring",
    icon: IconClock,
    title: "24/7 Protection",
    description: "Continuous monitoring and protection even when human moderators are offline",
    color: "indigo",
    demo: {
      type: "monitoring",
      stats: {
        uptime: "99.99%",
        coverage: "24/7",
        autoActions: "15,234"
      },
      timeline: [
        { time: "2:34 AM", event: "Auto-blocked spam campaign", severity: "high" },
        { time: "1:45 AM", event: "Rewarded positive interaction", severity: "positive" },
        { time: "12:56 AM", event: "Flagged concerning pattern", severity: "medium" }
      ]
    }
  }
];

export function MainFeaturesSection() {
  const [selectedFeature, setSelectedFeature] = useState(0);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    setAnimateIn(false);
    const timer = setTimeout(() => setAnimateIn(true), 100);
    return () => clearTimeout(timer);
  }, [selectedFeature]);

  const renderDemo = () => {
    const feature = features[selectedFeature];
    
    switch (feature.demo.type) {
      case "protection":
        return <ProtectionDemo feature={feature} animateIn={animateIn} />;
      case "rewards":
        return <RewardsDemo feature={feature} animateIn={animateIn} />;
      case "moderation":
        return <ModerationDemo feature={feature} animateIn={animateIn} />;
      case "analytics":
        return <AnalyticsDemo feature={feature} animateIn={animateIn} />;
      case "flagging":
        return <FlaggingDemo feature={feature} animateIn={animateIn} />;
      case "monitoring":
        return <MonitoringDemo feature={feature} animateIn={animateIn} />;
      default:
        return null;
    }
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-16 md:py-24">
      {/* Section Title */}
      <Container>
        <div className="text-center mb-8">
          <span 
            className="text-sm uppercase tracking-wide font-medium"
            style={{ 
              fontFamily: 'var(--font-uncut-sans)',
              color: '#0c9a88',
              textShadow: '0 0 10px rgba(12, 154, 136, 0.5)'
            }}
          >
            COMPLETE PROTECTION
          </span>
        </div>
        <h2 
          className="text-center uppercase font-semibold text-balance text-3xl md:text-5xl mb-8"
          style={{ 
            fontFamily: 'var(--font-clash-grotesk)',
            background: 'linear-gradient(to right bottom, rgb(255, 255, 255) 30%, rgba(255, 255, 255, 0.55))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Everything You Need for a Healthy Community
        </h2>
        <p 
          className="text-center text-gray-400 text-lg md:text-xl mb-16 md:mb-20 max-w-3xl mx-auto"
          style={{ fontFamily: 'var(--font-uncut-sans)' }}
        >
          Advanced AI protection that works 24/7 to keep your community safe, positive, and engaged.
        </p>
      </Container>

      {/* Interactive Feature Display */}
      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Feature Demo - Left Side (2/3) */}
        <Container delay={0.1} className="lg:col-span-2">
          {renderDemo()}
        </Container>

        {/* Feature Cards - Right Side (1/3) */}
        <Container delay={0.2} className="lg:col-span-1">
          <FeatureCards
            features={features}
            selectedFeature={selectedFeature}
            onFeatureSelect={setSelectedFeature}
          />
        </Container>
      </div>
    </section>
  );
}