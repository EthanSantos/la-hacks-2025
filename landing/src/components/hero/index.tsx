import Particles from "@/components/particles";
import Container from "@/components/layout/container";
import Image from "next/image";
import Link from "next/link";
import { DemoSection } from "@/components/demo";
import { MainFeaturesSection } from "@/components/main-features";
import { HowItWorksSection } from "@/components/how-it-works";
import { SectionBadge } from "@/components/section-badge";
import { FAQSection } from "@/components/faq";
import { CTASection } from "@/components/cta";

export const Hero = () => (
  <main 
    className="relative flex flex-col items-center px-4 pt-32 md:pt-48 pb-24 md:pb-32 dark bg-background"
    style={{
      background: `radial-gradient(ellipse at top, rgba(16, 185, 129, 0.15) 0%, transparent 50%),
                   var(--background)`
    }}
  >
    <Particles 
      className="fixed inset-0" 
      quantity={100}
      staticity={30}
      ease={50}
    />
    <div className="relative z-10 flex flex-col items-center gap-10 w-full max-w-7xl min-h-[calc(100vh-200px)]">
      <SectionBadge />
      <h1 className="text-center uppercase font-semibold text-balance">
        <span className="hero-text-blur-in inline-block motion-delay-500">
          KEEP YOUR GAMING
        </span>
        <br />
        <span className="hero-text-blur-in motion-delay-700 inline-block">
          COMMUNITY
        </span>
        <br />
        <span className="hero-text-blur-in motion-delay-[900ms] inline-block">
          SAFE & POSITIVE
        </span>
      </h1>
      <p className="text-center text-gray-400 font-normal text-balance md:text-xl max-w-3xl hero-text-blur-in motion-delay-1500">
        AI-powered moderation and sentiment analysis for game experiences.
        <br />
        Detect toxicity, protect player data, and reward positive behavior—all in real-time.
      </p>
      
      {/* Hero CTA Button */}
      <Link 
        href="https://bloom-ai-dashboard.vercel.app/"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-emerald-500 text-white px-3 md:px-4 py-2 rounded-lg font-medium hover:bg-emerald-600 transition-colors text-sm md:text-base hero-text-blur-in motion-delay-[2300ms]"
        style={{ 
          background: '#0a786b',
          color: 'white',
          WebkitTextFillColor: 'white'
        } as React.CSSProperties}
      >
        GET STARTED
      </Link>
      
      {/* Dashboard Image */}
      <Container delay={2.3} className="w-full mb-16 md:mb-24">
        <div className="relative mx-auto max-w-6xl rounded-xl lg:rounded-[32px] border p-2 backdrop-blur-lg border-neutral-700 bg-neutral-800/50 md:p-4 mt-6">
          <div className="absolute top-1/4 left-1/2 -z-10 gradient w-3/4 -translate-x-1/2 h-1/4 -translate-y-1/2 inset-0 blur-[10rem]"></div>
          
          <div className="rounded-lg lg:rounded-[24px] border p-2 border-neutral-700 bg-black">
            <Image
              src="/images/bloom-dashboard-hd.png"
              alt="Bloom Dashboard"
              width={1920}
              height={1080}
              className="rounded-lg lg:rounded-[20px] w-full h-auto"
              priority
            />
          </div>
        </div>
      </Container>

      {/* Demo Section */}
      <DemoSection />

      {/* Main Features Section */}
      <MainFeaturesSection />

      {/* How It Works Section */}
      <HowItWorksSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* CTA Section */}
      <CTASection />
    </div>
  </main>
);