"use client";

import Link from "next/link";

export function CTASection() {
  return (
    <section className="w-full max-w-6xl mx-auto px-4 py-16 md:py-24">
      <div className="flex flex-col items-center text-center">
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
          Ready to Transform Your Community?
        </h2>
        <p 
          className="text-gray-400 text-lg md:text-xl max-w-3xl mb-12"
          style={{ fontFamily: 'var(--font-uncut-sans)' }}
        >
          Take the first step towards building a thriving, safe community that players love.
        </p>
        
        {/* CTA Button */}
        <Link 
          href="https://bloom-ai-dashboard.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center px-3 md:px-4 py-2 rounded-lg font-medium text-white transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/25 hover:scale-105 text-sm md:text-base"
          style={{ 
            background: '#0a786b',
            fontFamily: 'var(--font-uncut-sans)',
          }}
        >
          GET STARTED NOW
        </Link>
      </div>
    </section>
  );
}