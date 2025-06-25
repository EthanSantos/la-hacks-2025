"use client";

import Container from "@/components/layout/container";
import { StepCard } from "./step-card";
import TerminalDemo from "./terminal-demo";
import { AnalyzeCard } from "./analyze-card";
import { ProtectCard } from "./protect-card";

export function HowItWorksSection() {
  const stepData = [
    {
      number: 1,
      title: "CONNECT",
      description: "Integrate Bloom's API instantly across multiple platforms with simple configuration and immediate activation.",
    },
    {
      number: 2,
      title: "ANALYZE", 
      description: "Real-time AI analysis detects sentiment and toxicity in messages.",
    },
    {
      number: 3,
      title: "PROTECT",
      description: "Automated 24/7 moderation with custom action rules to maintain safe community environments.",
    }
  ];

  const stepComponents = [
    <TerminalDemo />,
    <AnalyzeCard />,
    <ProtectCard />
  ];

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
            EFFORTLESS SETUP
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
          How It Works
        </h2>
        <p 
          className="text-center text-gray-400 text-lg md:text-xl mb-16 md:mb-20 max-w-3xl mx-auto"
          style={{ fontFamily: 'var(--font-uncut-sans)' }}
        >
          Seamless setup, instant community protection.
          <br />
          Simple integration in three easy steps.
        </p>
      </Container>

      {/* Steps */}
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-1 xl:grid-cols-3 gap-12 xl:gap-8">
          {stepComponents.map((component, index) => (
            <div key={index} className="flex flex-col items-center space-y-6">
              <StepCard content={component} />
              
              {/* Step Info */}
              <div className="text-center space-y-2">
                <div 
                  className="text-sm font-medium text-gray-400 tracking-wide"
                  style={{ fontFamily: 'var(--font-uncut-sans)' }}
                >
                  STEP {stepData[index].number}
                </div>
                <h3 
                  className="text-xl font-bold text-white"
                  style={{ fontFamily: 'var(--font-clash-grotesk)' }}
                >
                  {stepData[index].title}
                </h3>
                <p 
                  className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed"
                  style={{ fontFamily: 'var(--font-uncut-sans)' }}
                >
                  {stepData[index].description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}