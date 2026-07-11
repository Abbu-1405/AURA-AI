import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface AnalysisLoaderProps {
  styleSelected: string;
}

const STEPS = [
  { id: 1, text: "Analyzing Typography Hierarchy & Readability..." },
  { id: 2, text: "Checking Colors & Chromatic Contrast Harmony..." },
  { id: 3, text: "Reviewing Layout Positioning & Alignment Grid..." },
  { id: 4, text: "Understanding Background Impact & Distractions..." },
  { id: 5, text: "Preparing Creative Director Suggestions..." }
];

export default function AnalysisLoader({ styleSelected }: AnalysisLoaderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Progress increment timer
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 40);

    // Step cycling timer
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1800);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-12 min-h-[400px] text-center space-y-8 bg-[#121212] rounded-none border border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Glowing orbit lines around the broken frame symbol */}
        <div className="absolute inset-0 rounded-full border border-dashed border-[#C9A227]/20 animate-spin" style={{ animationDuration: '20s' }}></div>
        <div className="absolute inset-2 rounded-full border border-gradient-to-tr from-transparent via-[#C9A227]/40 to-transparent animate-spin" style={{ animationDuration: '8s' }}></div>
        
        {/* Solid center diamond */}
        <div className="w-10 h-10 border border-[#C9A227] rotate-45 flex items-center justify-center bg-[#1A1A1A] shadow-[0_0_15px_rgba(201,162,39,0.3)]">
          <span className="text-[#C9A227] font-display text-sm -rotate-45 font-light">◇</span>
        </div>
      </div>

      <div className="space-y-3 max-w-md mx-auto">
        <span className="font-mono text-[9px] tracking-[0.4em] text-[#C9A227] uppercase">
          EVALUATING IN PROGRESS — DIRECTION: {styleSelected.toUpperCase()}
        </span>
        
        {/* Status Text fading */}
        <div className="h-8 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="text-[#F5F5F5] font-light text-base tracking-wide"
            >
              {STEPS[currentStep].text}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Luxury gold progress bar */}
      <div className="w-full max-w-xs space-y-2">
        <div className="w-full h-[2px] bg-white/5 rounded-none overflow-hidden relative">
          <div 
            className="h-full bg-gradient-to-r from-[#8a6e1a] via-[#C9A227] to-[#fce497] transition-all duration-300 rounded-none"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[#666666] font-mono text-[9px] tracking-widest px-1">
          <span>AURA_INTELLECT_ENGINE</span>
          <span>{progress}%</span>
        </div>
      </div>

      {/* Decorative prompt list of visual items checking */}
      <div className="pt-4 border-t border-[#1C1C1C] w-full max-w-sm flex justify-center space-x-6 text-[#666666] font-mono text-[8px] tracking-wider uppercase">
        <span className={currentStep >= 0 ? 'text-[#C9A227]' : ''}>• TYPO</span>
        <span className={currentStep >= 1 ? 'text-[#C9A227]' : ''}>• COLORS</span>
        <span className={currentStep >= 2 ? 'text-[#C9A227]' : ''}>• LAYOUT</span>
        <span className={currentStep >= 3 ? 'text-[#C9A227]' : ''}>• BACKDROP</span>
      </div>
    </div>
  );
}
