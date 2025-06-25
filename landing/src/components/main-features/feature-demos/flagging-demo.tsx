"use client";

import { IconEye } from "@tabler/icons-react";
import { Feature } from "../index";

interface FlaggingDemoProps {
  feature: Feature;
  animateIn: boolean;
}

export function FlaggingDemo({ feature, animateIn }: FlaggingDemoProps) {
  const demo = feature.demo;

  return (
    <div className={`
      bg-neutral-800/50 backdrop-blur-lg rounded-xl lg:rounded-[24px] border border-neutral-700 p-6 md:p-8 min-h-[500px] transition-all duration-500 ease-out
      ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
    `}>
      <div className="absolute top-1/4 left-1/2 -z-10 w-3/4 h-1/4 bg-gradient-to-r from-orange-500/20 to-red-500/20 -translate-x-1/2 -translate-y-1/2 blur-[3rem]"></div>
      
      {/* Feature Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-orange-500/10 border border-orange-500/20 flex-shrink-0">
          <feature.icon className="w-8 h-8 text-orange-500" />
        </div>
        <div>
          <h3 
            className="text-2xl font-bold text-white mb-2"
            style={{ fontFamily: 'var(--font-clash-grotesk)' }}
          >
            {feature.title}
          </h3>
          <p 
            className="text-gray-400 leading-relaxed"
            style={{ fontFamily: 'var(--font-uncut-sans)' }}
          >
            {feature.description}
          </p>
        </div>
      </div>

      {/* Feature Demo */}
      <div className="bg-black/90 rounded-lg border border-neutral-700 p-6">
        
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(demo.stats).map(([key, value]) => (
              <div key={key} className="bg-neutral-900/50 rounded-lg p-4 text-center">
                <div className="text-xl sm:text-2xl font-bold text-white mb-1">{value}</div>
                <div 
                  className="text-xs text-gray-400 capitalize"
                  style={{ fontFamily: 'var(--font-uncut-sans)' }}
                >
                  {key}
                </div>
              </div>
            ))}
          </div>
          
          {/* Review Queue */}
          <div className="space-y-3">
            <h4 
              className="text-sm font-medium text-gray-300"
              style={{ fontFamily: 'var(--font-clash-grotesk)' }}
            >
              Review Queue
            </h4>
            {demo.queue.map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    item.priority === 'High' ? 'bg-red-500' : 
                    item.priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <div>
                    <div 
                      className="text-white text-sm"
                      style={{ fontFamily: 'var(--font-uncut-sans)' }}
                    >
                      {item.type}
                    </div>
                    <div 
                      className="text-xs text-gray-400"
                      style={{ fontFamily: 'var(--font-uncut-sans)' }}
                    >
                      {item.priority} Priority
                    </div>
                  </div>
                </div>
                <span 
                  className="text-gray-300 font-medium"
                  style={{ fontFamily: 'var(--font-uncut-sans)' }}
                >
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}