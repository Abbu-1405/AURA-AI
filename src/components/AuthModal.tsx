import React, { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { X, Key, Shield, User, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (email: string) => void;
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    // Simulate premium validation
    setTimeout(() => {
      onLoginSuccess(email);
      setLoading(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-[#121212] border border-white/5 rounded-none p-6 relative overflow-hidden shadow-2xl space-y-6"
      >
        {/* Decorative Broken Frame corner */}
        <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none">
          <div className="absolute top-2 right-2 border-t border-r border-[#C9A227] w-3 h-3"></div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#666666] hover:text-[#F5F5F5] transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand identity */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 border border-[#C9A227] rotate-45 flex items-center justify-center bg-[#1A1A1A] shadow-[0_0_15px_rgba(201,162,39,0.1)]">
            <span className="text-[#C9A227] font-display text-sm -rotate-45">◇</span>
          </div>
          <h3 className="font-display text-xl font-light tracking-widest uppercase text-[#F5F5F5] pt-1">
            {isSignUp ? "Request Suite Access" : "Creative Studio Sign In"}
          </h3>
          <p className="text-xs text-[#A3A3A3] font-light max-w-xs mx-auto">
            {isSignUp 
              ? "Join the private tier of premium design reviews and automated version tracking." 
              : "Optional connection to persist your evaluated thumbnail and poster histories."}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="font-mono text-[8px] text-[#A3A3A3] tracking-widest uppercase block">
              Professional Email Address
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-[#444444]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="creative@studio.com"
                className="w-full bg-[#1A1A1A] border border-white/10 focus:border-[#C9A227] rounded-none px-3 py-2 pl-9 text-sm text-[#F5F5F5] placeholder-[#444444] focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-[8px] text-[#A3A3A3] tracking-widest uppercase block">
              Passphrase (Optional)
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-2.5 w-4 h-4 text-[#444444]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#1A1A1A] border border-white/10 focus:border-[#C9A227] rounded-none px-3 py-2 pl-9 text-sm text-[#F5F5F5] placeholder-[#444444] focus:outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#C9A227] hover:bg-[#E5B92D] text-[#050505] font-display font-light text-sm tracking-widest uppercase rounded-none transition-all cursor-pointer flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span className="animate-pulse">Authenticating...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{isSignUp ? "Submit Registration" : "Unlock Portal"}</span>
              </>
            )}
          </button>
        </form>

        {/* Mode switcher */}
        <div className="text-center pt-2">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="font-mono text-[9px] text-[#666666] hover:text-[#C9A227] tracking-wider uppercase transition-colors"
          >
            {isSignUp 
              ? "Already have suite credentials? Sign In" 
              : "Don't have suite credentials? Register Free"}
          </button>
        </div>

        {/* Security badges */}
        <div className="flex justify-center items-center space-x-4 pt-4 border-t border-[#1C1C1C] text-[#444444] font-mono text-[8px] tracking-widest uppercase">
          <div className="flex items-center space-x-1">
            <Shield className="w-3 h-3" />
            <span>Secure Vault</span>
          </div>
          <span>•</span>
          <span>Offline Storage Ready</span>
        </div>
      </motion.div>
    </div>
  );
}
