import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Stage 1: Show logo symbol
    const timer1 = setTimeout(() => setStep(1), 800);
    // Stage 2: Show name & tagline
    const timer2 = setTimeout(() => setStep(2), 1600);
    // Stage 3: Fade out and complete
    const timer3 = setTimeout(() => {
      onComplete();
    }, 2800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#050505] z-50 flex flex-col items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        <div className="flex flex-col items-center max-w-xs text-center space-y-6">
          {/* Broken Aura Frame Symbol */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex items-center justify-center w-20 h-20"
          >
            {/* The main golden Diamond Symbol ◇ representing unfinished ideas */}
            <div className="absolute inset-0 border-2 border-dashed border-[#C9A227]/40 rounded-sm rotate-45 transform scale-90 border-gold-glow"></div>
            <div className="absolute inset-2 border border-[#C9A227] rotate-45 flex items-center justify-center bg-[#121212] shadow-[0_0_15px_rgba(201,162,39,0.2)]">
              <span className="text-[#C9A227] font-display text-2xl font-light select-none -rotate-45 leading-none">◇</span>
            </div>
          </motion.div>

          {/* Aura AI Branding */}
          {step >= 1 && (
            <div className="space-y-2">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="font-display text-4xl font-light tracking-[0.25em] text-[#F5F5F5] uppercase"
              >
                Aura AI
              </motion.h1>
              
              {step >= 2 && (
                <motion.p
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="font-mono text-[10px] tracking-[0.4em] text-[#C9A227] uppercase"
                >
                  Your AI Creative Director
                </motion.p>
              )}
            </div>
          )}
        </div>
      </AnimatePresence>

      {/* Elegant minimalist ambient bottom meter */}
      <div className="absolute bottom-12 left-12 right-12 flex justify-between items-center text-[#A3A3A3] font-mono text-[9px] tracking-widest opacity-40">
        <span>AURA CORE V1.0</span>
        <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#C9A227] to-transparent"></div>
        <span>PREMIUM CREATIVE STUDIO</span>
      </div>
    </div>
  );
}
