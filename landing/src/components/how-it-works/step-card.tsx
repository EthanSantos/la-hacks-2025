"use client";

import { ReactNode, memo } from "react";

interface StepCardProps {
  content: ReactNode;
}

export const StepCard = memo(function StepCard({ content }: StepCardProps) {
  return (
    <div className="relative backdrop-blur-lg rounded-xl lg:rounded-2xl border border-neutral-700/50 bg-neutral-800/30 p-4 h-[380px] overflow-hidden w-[400px]">
      <div className="flex items-center justify-center h-full w-full">
        <div className="w-full min-w-[300px]">
          {content}
        </div>
      </div>
    </div>
  );
});
