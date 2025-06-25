"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { PlusIcon } from "lucide-react";
import Container from "@/components/layout/container";

const faqData = [
  {
    question: "How does Bloom protect children's privacy in gaming communities?",
    answer:
      "Bloom is designed to be COPPA-compliant and exceed standard requirements. Our architecture uses zero-storage real-time processing, meaning messages are analyzed instantly and immediately discarded—never stored on our servers. For users under 13, we're implementing additional safeguards including automatic PII scrubbing, enhanced parental notifications, and stricter data minimization protocols. Our commitment is to never use children's data for AI training or commercial purposes.",
  },
  {
    question: "What personal data does Bloom collect and how is it used?",
    answer:
      "Bloom is designed around radical data minimization principles. Our system will collect only essential identifiers (user ID, timestamp) for moderation context. Message content is processed in real-time and immediately deleted—we retain zero chat content. Our AI models are built to analyze behavioral patterns without storing personal information. We're committed to never collecting names, ages, locations, or device information.",
  },
  {
    question: "What privacy and compliance standards does Bloom target?",
    answer:
      "Bloom is architected to achieve major privacy standards including COPPA for children's protection, CCPA for California users, and GDPR-ready principles for projected future international expansion. Our development roadmap includes SOC 2 Type II certification and regular privacy audits. Our zero-storage architecture is designed to automatically satisfy 'right to be forgotten' principles since no personal data persists.",
  },
  {
    question: "Can parents access their child's moderation data and analytics?",
    answer:
      "Yes, but with privacy-first design principles. Parents will be able to access safety summaries (positive behavior scores, moderation actions taken) without seeing actual message content, which is deleted immediately. We're developing family-friendly dashboards that will show community health metrics and their child's positive contributions. Unlike platforms that store chat logs, Bloom is designed to give parents transparency without compromising their child's conversational privacy.",
  },
  {
    question: "How does Bloom's AI training protect user privacy?",
    answer:
      "Bloom's AI models are designed to train exclusively on synthetic and publicly available datasets—never on real user conversations. Our 'privacy-by-design' AI architecture ensures user messages will only influence real-time decisions, not model improvement. This approach eliminates the risk of personal conversations being incorporated into AI systems. We're implementing differential privacy techniques and federated learning principles where applicable.",
  },
];

export function FAQSection() {
  return (
    <section className="w-full max-w-6xl mx-auto px-4 py-16 md:py-24">
      <Container>
        <div className="flex flex-col items-center text-center mb-16 md:mb-20">
          <div className="mb-8">
            <span 
              className="text-sm uppercase tracking-wide font-medium"
              style={{ 
                fontFamily: 'var(--font-uncut-sans)',
                color: '#0c9a88',
                textShadow: '0 0 10px rgba(12, 154, 136, 0.5)'
              }}
            >
              PRIVACY FIRST
            </span>
          </div>
          <h2 
            className="text-3xl md:text-5xl font-semibold tracking-tight mb-8"
            style={{ 
              fontFamily: 'var(--font-clash-grotesk)',
              background: 'linear-gradient(to right bottom, rgb(255, 255, 255) 30%, rgba(255, 255, 255, 0.55))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Data Privacy & Security
          </h2>
          <p 
            className="text-gray-400 text-lg md:text-xl max-w-3xl"
            style={{ fontFamily: 'var(--font-uncut-sans)' }}
          >
            Your privacy matters. Here's how Bloom protects gaming communities with industry-leading data security and transparency.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Accordion
            type="single"
            collapsible
            className="space-y-4"
            defaultValue="question-0"
          >
            {faqData.map(({ question, answer }, index) => (
              <AccordionItem
                key={question}
                value={`question-${index}`}
                className="bg-neutral-800/30 backdrop-blur-lg py-1 px-6 rounded-xl border border-neutral-700/50 hover:border-neutral-600/50 transition-colors"
              >
                <AccordionPrimitive.Header className="flex">
                  <AccordionPrimitive.Trigger
                    className={cn(
                      "flex flex-1 items-center justify-between py-6 font-semibold tracking-tight transition-all hover:text-[#0c9a88] [&[data-state=open]>svg]:rotate-45 [&[data-state=open]]:text-[#0c9a88]",
                      "text-start text-lg text-white"
                    )}
                    style={{ fontFamily: 'var(--font-clash-grotesk)' }}
                  >
                    {question}
                    <PlusIcon className="h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200" />
                  </AccordionPrimitive.Trigger>
                </AccordionPrimitive.Header>
                <AccordionContent 
                  className="text-gray-300 text-base leading-relaxed pb-6"
                  style={{ fontFamily: 'var(--font-uncut-sans)' }}
                >
                  {answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Container>
    </section>
  );
}