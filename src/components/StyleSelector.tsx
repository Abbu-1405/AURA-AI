import React from 'react';
import { DesignStyle } from '../types';
import { Sparkles, Layers, Briefcase, Eye, Palette, Heart, Compass } from 'lucide-react';

interface StyleSelectorProps {
  selectedStyle: DesignStyle;
  onChange: (style: DesignStyle) => void;
}

interface StyleOption {
  id: DesignStyle;
  title: string;
  tagline: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'Minimal',
    title: 'Minimal',
    tagline: 'Absolute Restraint & Space',
    description: 'Eliminates friction. Emphasizes negative space, high contrast, structural grids, and pristine typography.',
    icon: Eye,
  },
  {
    id: 'Luxury',
    title: 'Luxury',
    tagline: 'Heritage & Prestige Elegance',
    description: 'Sophisticated editorial styling. Warm champagne golds, high-contrast fine serifs, and asymmetrical layouts.',
    icon: Sparkles,
  },
  {
    id: 'Professional',
    title: 'Professional',
    tagline: 'Precision & Corporate Authority',
    description: 'Trustworthy and robust. Strict visual hierarchy, clean grotesque families, and high readability alignments.',
    icon: Briefcase,
  },
  {
    id: 'Modern',
    title: 'Modern',
    tagline: 'Sleek Digital-First Edge',
    description: 'Vibrant, clean tech aesthetics. Bento box grids, rounded card forms, and extra-bold headlines.',
    icon: Layers,
  },
  {
    id: 'Colorful',
    title: 'Colorful',
    tagline: 'Vibrant Energy & Chromatic Balance',
    description: 'Controlled spectrum design. High-vibrancy glowing borders, dark contrast rooms, and bold geometric structures.',
    icon: Palette,
  },
  {
    id: 'Elegant',
    title: 'Elegant',
    tagline: 'Organic Poise & Lightness',
    description: 'Poetic, gentle flow. Soft warm tones, italicized serifs, delicate borders, and luxurious visual timing.',
    icon: Heart,
  },
  {
    id: 'Creative',
    title: 'Creative',
    tagline: 'Expressive Grid Breakers',
    description: 'Art-studio spirit. Overlapping layers, rotated coordinates, hybrid font families, and constructivist elements.',
    icon: Compass,
  },
];

export default function StyleSelector({ selectedStyle, onChange }: StyleSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center md:text-left">
        <span className="font-mono text-[10px] tracking-[0.3em] text-[#C9A227] uppercase">
          Step 2 — Design Direction
        </span>
        <h3 className="font-display text-2xl font-light text-[#F5F5F5] tracking-wide">
          What direction do you want for this design?
        </h3>
        <p className="text-sm text-[#A3A3A3] max-w-xl font-light">
          Aura AI will evaluate your composition against the specific rules of your chosen style, adjusting the typographic recommendations and palette to match.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {STYLE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedStyle === option.id;

          return (
            <button
              key={option.id}
              onClick={() => onChange(option.id)}
              className={`group text-left p-5 rounded-none border transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-48 cursor-pointer ${
                isSelected
                  ? 'bg-[#1A1A1A] border-[#C9A227] shadow-[0_0_20px_rgba(201,162,39,0.1)]'
                  : 'bg-[#121212] border-white/5 hover:bg-[#151515] hover:border-white/20'
              }`}
            >
              {/* Broken Frame motif for selected style */}
              {isSelected && (
                <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none">
                  <div className="absolute top-2 right-2 border-t border-r border-[#C9A227] w-3 h-3"></div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-none ${isSelected ? 'bg-[#C9A227]/10 text-[#C9A227]' : 'bg-[#1A1A1A] text-[#A3A3A3] group-hover:text-[#F5F5F5]'} transition-colors`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[9px] tracking-widest text-[#666666]">
                    {option.id.toUpperCase()}
                  </span>
                </div>

                <div>
                  <h4 className={`text-base font-display font-light tracking-wide ${isSelected ? 'text-[#C9A227]' : 'text-[#F5F5F5]'}`}>
                    {option.title}
                  </h4>
                  <p className="font-mono text-[9px] tracking-wider text-[#A3A3A3]/70 uppercase mt-0.5">
                    {option.tagline}
                  </p>
                </div>
              </div>

              <p className="text-xs text-[#A3A3A3] leading-relaxed line-clamp-2 mt-4 font-light">
                {option.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
