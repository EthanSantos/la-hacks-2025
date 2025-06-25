"use client";

import { useState, useCallback, memo } from "react";
import Container from "@/components/layout/container";
import { ChatDemo } from "./chat-demo";
import { BloomAnalysis } from "./bloom-analysis";

export const DemoSection = memo(function DemoSection() {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(-1);

  const handleMessageComplete = useCallback((messageIndex: number) => {
    // Ensure the analysis component gets triggered with proper index
    setCurrentMessageIndex(messageIndex);
  }, []);

  return (
    <section className="w-full max-w-6xl mx-auto px-4 py-16 md:py-24">
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
            POWERED BY BLOOM
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
          See Bloom in Action
        </h2>
        <p 
          className="text-center text-gray-400 text-lg md:text-xl mb-16 md:mb-20 max-w-2xl mx-auto"
          style={{ fontFamily: 'var(--font-uncut-sans)' }}
        >
          Experience how Bloom transforms gaming communities in real-time.
        </p>
      </Container>

      {/* Demo Grid */}
      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-start">
        {/* Chat Interface */}
        <Container delay={0.7}>
          <div className="space-y-4 flex flex-col items-center">
            <h3 className="text-xl font-semibold text-white text-center" style={{ fontFamily: 'var(--font-clash-grotesk)' }}>
              Live Gaming Chat
            </h3>
            <ChatDemo onMessageComplete={handleMessageComplete} />
          </div>
        </Container>

        {/* Bloom Analysis */}
        <Container delay={0.8}>
          <div className="space-y-4 flex flex-col items-center">
            <h3 className="text-xl font-semibold text-white text-center" style={{ fontFamily: 'var(--font-clash-grotesk)' }}>
              Real-time AI Moderation
            </h3>
            <BloomAnalysis triggerAnalysis={currentMessageIndex} />
          </div>
        </Container>
      </div>
    </section>
  );
});