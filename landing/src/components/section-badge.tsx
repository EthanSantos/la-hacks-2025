"use client";

import Image from "next/image";

interface SectionBadgeProps {
  badgeText?: string;
  delay?: number;
  className?: string;
}

export function SectionBadge({ 
  badgeText = "Built by gamers, for gamers",
  delay = 2300,
  className = ""
}: SectionBadgeProps) {
  return (
    <span 
      className={`inline-flex items-center justify-center gap-2 text-sm text-white px-3 py-1.5 rounded-full bg-gradient-to-b from-neutral-700/80 to-neutral-800/80 border border-neutral-600/50 backdrop-blur-sm hero-text-blur-in motion-delay-[${delay}ms] ${className}`}
      style={{ fontFamily: 'var(--font-uncut-sans)', fontWeight: 500 }}
    >
      <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 flex items-center justify-center relative">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40 flex items-center justify-center animate-ping">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40 flex items-center justify-center animate-ping"></div>
        </div>
        <div className="w-3 h-3 flex items-center justify-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Image
            src="/icons/flower.svg"
            alt="Bloom"
            width={12}
            height={12}
            className="w-3 h-3"
          />
        </div>
      </div>
      {badgeText}
    </span>
  );
}