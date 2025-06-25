"use client";

import { Feature } from "./index";

interface FeatureCardsProps {
  features: Feature[];
  selectedFeature: number;
  onFeatureSelect: (index: number) => void;
}

export function FeatureCards({ features, selectedFeature, onFeatureSelect }: FeatureCardsProps) {
  const getColorClasses = (color: Feature["color"]) => {
    const colors = {
      emerald: {
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
        text: "text-emerald-400",
        icon: "text-emerald-500",
        accent: "bg-emerald-500"
      },
      blue: {
        bg: "bg-blue-500/10",
        border: "border-blue-500/30",
        text: "text-blue-400",
        icon: "text-blue-500",
        accent: "bg-blue-500"
      },
      yellow: {
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/30",
        text: "text-yellow-400",
        icon: "text-yellow-500",
        accent: "bg-yellow-500"
      },
      purple: {
        bg: "bg-purple-500/10",
        border: "border-purple-500/30",
        text: "text-purple-400",
        icon: "text-purple-500",
        accent: "bg-purple-500"
      },
      orange: {
        bg: "bg-orange-500/10",
        border: "border-orange-500/30",
        text: "text-orange-400",
        icon: "text-orange-500",
        accent: "bg-orange-500"
      },
      indigo: {
        bg: "bg-indigo-500/10",
        border: "border-indigo-500/30",
        text: "text-indigo-400",
        icon: "text-indigo-500",
        accent: "bg-indigo-500"
      }
    };
    return colors[color];
  };

  return (
    <div className="h-full min-h-[500px] flex flex-col space-y-2">
      {features.map((feature, index) => {
        const isSelected = selectedFeature === index;
        const colors = getColorClasses(feature.color);
        
        return (
          <button
            key={feature.id}
            onClick={() => onFeatureSelect(index)}
            className={`
              w-full text-left p-4 rounded-xl lg:rounded-[24px] border transition-all duration-300 group backdrop-blur-lg flex-1
              ${isSelected 
                ? `${colors.bg} ${colors.border} border-2 shadow-lg` 
                : 'bg-neutral-800/50 border-neutral-700 hover:border-neutral-600 hover:bg-neutral-800/70'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center transition-all backdrop-blur-sm
                ${isSelected 
                  ? colors.bg 
                  : 'bg-neutral-700/50 group-hover:bg-neutral-600/50'
                }
              `}>
                <feature.icon className={`w-5 h-5 ${isSelected ? colors.icon : 'text-gray-400'}`} />
              </div>
              
              <div className="flex-1">
                <h3 
                  className={`
                    font-semibold transition-colors text-sm
                    ${isSelected ? colors.text : 'text-white'}
                  `}
                  style={{ fontFamily: 'var(--font-clash-grotesk)' }}
                >
                  {feature.title}
                </h3>
              </div>
            </div>
          </button>
        );
      })}

    </div>
  );
}