import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Sparkles, Copy, Check, Type, Sliders, RefreshCw, Layers, ExternalLink, Code, CheckCircle2 
} from 'lucide-react';
import { CreativeDirectorReport } from '../types';

interface FontPairingPreviewProps {
  report: CreativeDirectorReport;
  onClose: () => void;
}

// Curated high-end fallback google fonts for a luxury/modern feel
const POPULAR_GOOGLE_FONTS = [
  'Space Grotesk',
  'Outfit',
  'Inter',
  'Plus Jakarta Sans',
  'Playfair Display',
  'Cormorant Garamond',
  'Syne',
  'Cabin',
  'Clash Display',
  'Cabinet Grotesk',
  'Satoshi',
  'General Sans',
  'Cinzel',
  'Montserrat',
  'DM Sans',
  'JetBrains Mono',
  'Fira Code'
];

export default function FontPairingPreview({ report, onClose }: FontPairingPreviewProps) {
  // Extract recommendations from report
  const recommendedFromReport = report?.typography?.recommendedFonts || [];
  const individualFonts = report?.typography?.individualTexts?.map(t => t.recommendedFont) || [];
  
  // Combine and deduplicate
  const uniqueRecommendedFonts = Array.from(new Set([
    ...recommendedFromReport,
    ...individualFonts,
    'Inter', // always include Inter as base
    'Space Grotesk'
  ])).filter(Boolean);

  // States for chosen fonts
  const [headingFont, setHeadingFont] = useState<string>(uniqueRecommendedFonts[0] || 'Space Grotesk');
  const [bodyFont, setBodyFont] = useState<string>(uniqueRecommendedFonts[1] || uniqueRecommendedFonts[0] || 'Inter');

  // Custom Editable Texts
  const [headingText, setHeadingText] = useState('Elevate Your Digital Aura');
  const [bodyText, setBodyText] = useState('Design is not just what it looks like and feels like. Design is how it works. By fine-tuning our typography, structural hierarchy, and letter-spacing tracking, we calibrate a frictionless visual experience.');

  // Layout Presets
  // 'hero' | 'product' | 'article' | 'bento'
  const [layoutPreset, setLayoutPreset] = useState<'hero' | 'product' | 'article' | 'bento'>('hero');

  // Tuning Parameters
  const [headingSize, setHeadingSize] = useState<number>(48);
  const [headingWeight, setHeadingWeight] = useState<string>('700');
  const [headingLineHeight, setHeadingLineHeight] = useState<number>(1.1);
  const [headingSpacing, setHeadingSpacing] = useState<number>(-1.5); // px / em representation

  const [bodySize, setBodySize] = useState<number>(14);
  const [bodyWeight, setBodyWeight] = useState<string>('400');
  const [bodyLineHeight, setBodyLineHeight] = useState<number>(1.6);
  const [bodySpacing, setBodySpacing] = useState<number>(0.2);

  // Copy Feedback
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  // Success applied feedback state
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);

  // Dynamically load Google Fonts on demand by injecting link tags
  useEffect(() => {
    const fontsToLoad = Array.from(new Set([headingFont, bodyFont])).filter(Boolean);
    const fontQuery = fontsToLoad.map(f => `family=${f.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800`).join('&');
    const url = `https://fonts.googleapis.com/css2?${fontQuery}&display=swap`;

    // Check if link already exists
    let linkElement = document.getElementById('google-fonts-preview-dynamic') as HTMLLinkElement;
    if (linkElement) {
      linkElement.href = url;
    } else {
      linkElement = document.createElement('link');
      linkElement.id = 'google-fonts-preview-dynamic';
      linkElement.rel = 'stylesheet';
      linkElement.href = url;
      document.head.appendChild(linkElement);
    }
  }, [headingFont, bodyFont]);

  // Reset Tuning parameters to ideal defaults for selected fonts
  const handleResetTuning = () => {
    setHeadingSize(48);
    setHeadingWeight('700');
    setHeadingLineHeight(1.1);
    setHeadingSpacing(-1.5);
    
    setBodySize(14);
    setBodyWeight('400');
    setBodyLineHeight(1.6);
    setBodySpacing(0.2);
  };

  const handleCopyCode = (format: 'link' | 'css' | 'tailwind') => {
    let copyText = '';
    const hFontEscaped = headingFont.replace(/\s+/g, '+');
    const bFontEscaped = bodyFont.replace(/\s+/g, '+');

    if (format === 'link') {
      copyText = `<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=${hFontEscaped}:wght@400;700&family=${bFontEscaped}:wght@400;600&display=swap" rel="stylesheet">`;
    } else if (format === 'css') {
      copyText = `/* Font Family Pairing Variables */\n:root {\n  --font-heading: '${headingFont}', sans-serif;\n  --font-body: '${bodyFont}', sans-serif;\n}\n\n/* Element CSS Rules */\nh1, .display-heading {\n  font-family: var(--font-heading);\n  font-weight: ${headingWeight};\n  font-size: ${headingSize}px;\n  line-height: ${headingLineHeight};\n  letter-spacing: ${headingSpacing}px;\n}\n\np, .body-text {\n  font-family: var(--font-body);\n  font-weight: ${bodyWeight};\n  font-size: ${bodySize}px;\n  line-height: ${bodyLineHeight};\n  letter-spacing: ${bodySpacing}px;\n}`;
    } else if (format === 'tailwind') {
      copyText = `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      fontFamily: {\n        heading: ['"${headingFont}"', 'sans-serif'],\n        body: ['"${bodyFont}"', 'sans-serif'],\n      },\n    },\n  },\n}`;
    }

    navigator.clipboard.writeText(copyText);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
      {/* Dark Luxury Blur Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
      />

      {/* Main Dialog Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 15 }}
        transition={{ duration: 0.3 }}
        className="relative bg-[#0F0F0F] border border-white/10 w-full max-w-6xl h-[90vh] md:h-[85vh] flex flex-col justify-between shadow-2xl rounded-none z-55 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between flex-shrink-0 bg-[#121212]">
          <div className="space-y-1">
            <span className="font-mono text-[9px] tracking-[0.4em] text-[#C9A227] uppercase block">
              Typography Sandbox
            </span>
            <h3 className="font-display text-lg font-light text-white uppercase tracking-wider flex items-center gap-2">
              <Type className="w-4 h-4 text-[#C9A227]" />
              Interactive Font Pairing Engine
            </h3>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1.5 bg-white/5 border border-white/10 text-[#888888] hover:text-white rounded-none transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Workspace Splitting */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* LEFT COLUMN: Controls & Tuners (5 Cols) */}
          <div className="lg:col-span-5 border-r border-white/10 p-6 overflow-y-auto custom-scrollbar space-y-6 bg-[#0B0B0B]">
            
            {/* 1. RECOMMENDED PAIR SELECTORS */}
            <div className="space-y-3.5">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[9px] text-[#C9A227] tracking-widest uppercase block">
                  Aura Recommended Font Pairings
                </span>
                <span className="text-[10px] text-[#888888] font-mono">
                  From Audit Results
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Heading Font Select */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#888888] font-mono uppercase tracking-wider block">
                    Heading Family
                  </label>
                  <select
                    value={headingFont}
                    onChange={(e) => setHeadingFont(e.target.value)}
                    className="w-full bg-[#121212] border border-white/10 text-xs text-[#E5E5E5] font-mono p-2.5 rounded-none outline-none focus:border-[#C9A227]/40"
                  >
                    <optgroup label="Aura Recommendations">
                      {uniqueRecommendedFonts.map(f => (
                        <option key={`h-rec-${f}`} value={f}>{f} (Rec)</option>
                      ))}
                    </optgroup>
                    <optgroup label="Popular Families">
                      {POPULAR_GOOGLE_FONTS.filter(f => !uniqueRecommendedFonts.includes(f)).map(f => (
                        <option key={`h-pop-${f}`} value={f}>{f}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Body Font Select */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#888888] font-mono uppercase tracking-wider block">
                    Body Family
                  </label>
                  <select
                    value={bodyFont}
                    onChange={(e) => setBodyFont(e.target.value)}
                    className="w-full bg-[#121212] border border-white/10 text-xs text-[#E5E5E5] font-mono p-2.5 rounded-none outline-none focus:border-[#C9A227]/40"
                  >
                    <optgroup label="Aura Recommendations">
                      {uniqueRecommendedFonts.map(f => (
                        <option key={`b-rec-${f}`} value={f}>{f} (Rec)</option>
                      ))}
                    </optgroup>
                    <optgroup label="Popular Families">
                      {POPULAR_GOOGLE_FONTS.filter(f => !uniqueRecommendedFonts.includes(f)).map(f => (
                        <option key={`b-pop-${f}`} value={f}>{f}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Fast swap shortcut button */}
              <button
                onClick={() => {
                  const h = headingFont;
                  setHeadingFont(bodyFont);
                  setBodyFont(h);
                }}
                className="w-full py-1.5 border border-white/5 bg-[#121212] hover:bg-white/5 font-mono text-[9px] uppercase text-[#A3A3A3] hover:text-white transition-all text-center rounded-none cursor-pointer"
              >
                ⇄ Reverse Heading & Body Fonts
              </button>
            </div>

            {/* 2. HEADING CALIBRATION TUNERS */}
            <div className="space-y-4 pt-3 border-t border-white/5">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[9px] text-[#C9A227] tracking-widest uppercase block">
                  Heading Tuners
                </span>
                <span className="text-[10px] text-[#888888] font-mono uppercase">
                  {headingFont}
                </span>
              </div>

              <div className="space-y-3.5 bg-[#121212] p-3.5 border border-white/5">
                {/* Heading Text Input */}
                <div className="space-y-1">
                  <span className="text-[9px] text-[#666666] font-mono uppercase">Demo Headline Content</span>
                  <input
                    type="text"
                    value={headingText}
                    onChange={(e) => setHeadingText(e.target.value)}
                    className="w-full bg-[#181818] border border-white/5 text-xs px-2.5 py-1.5 rounded-none text-white outline-none focus:border-[#C9A227]/30"
                  />
                </div>

                {/* Font Size */}
                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-[9px] text-[#888888]">
                    <span>Size</span>
                    <span className="text-white">{headingSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="18"
                    max="80"
                    value={headingSize}
                    onChange={(e) => setHeadingSize(Number(e.target.value))}
                    className="w-full accent-[#C9A227] cursor-pointer"
                  />
                </div>

                {/* Line Height */}
                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-[9px] text-[#888888]">
                    <span>Line Height</span>
                    <span className="text-white">{headingLineHeight}</span>
                  </div>
                  <input
                    type="range"
                    min="0.8"
                    max="1.8"
                    step="0.05"
                    value={headingLineHeight}
                    onChange={(e) => setHeadingLineHeight(Number(e.target.value))}
                    className="w-full accent-[#C9A227] cursor-pointer"
                  />
                </div>

                {/* Spacing / Tracking */}
                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-[9px] text-[#888888]">
                    <span>Letter Spacing</span>
                    <span className="text-white">{headingSpacing}px</span>
                  </div>
                  <input
                    type="range"
                    min="-4"
                    max="8"
                    step="0.5"
                    value={headingSpacing}
                    onChange={(e) => setHeadingSpacing(Number(e.target.value))}
                    className="w-full accent-[#C9A227] cursor-pointer"
                  />
                </div>

                {/* Weight Options */}
                <div className="space-y-1">
                  <span className="text-[9px] text-[#666666] font-mono uppercase block">Font Weight</span>
                  <div className="grid grid-cols-4 gap-1">
                    {['400', '500', '700', '800'].map(w => (
                      <button
                        key={w}
                        onClick={() => setHeadingWeight(w)}
                        className={`py-1 text-[9px] font-mono rounded-none border transition-all cursor-pointer ${
                          headingWeight === w 
                            ? 'bg-[#C9A227] border-[#C9A227] text-black font-bold' 
                            : 'bg-[#181818] border-white/5 text-[#888888] hover:text-white'
                        }`}
                      >
                        {w === '400' ? 'Regular' : w === '500' ? 'Medium' : w === '700' ? 'Bold' : 'Extra'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. BODY CALIBRATION TUNERS */}
            <div className="space-y-4 pt-3 border-t border-white/5">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[9px] text-[#C9A227] tracking-widest uppercase block">
                  Body Tuners
                </span>
                <span className="text-[10px] text-[#888888] font-mono uppercase">
                  {bodyFont}
                </span>
              </div>

              <div className="space-y-3.5 bg-[#121212] p-3.5 border border-white/5">
                {/* Body Text Area */}
                <div className="space-y-1">
                  <span className="text-[9px] text-[#666666] font-mono uppercase">Demo Body Paragraph Content</span>
                  <textarea
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    rows={2}
                    className="w-full bg-[#181818] border border-white/5 text-xs px-2.5 py-1.5 rounded-none text-[#A3A3A3] focus:text-white outline-none focus:border-[#C9A227]/30 resize-none custom-scrollbar"
                  />
                </div>

                {/* Font Size */}
                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-[9px] text-[#888888]">
                    <span>Size</span>
                    <span className="text-white">{bodySize}px</span>
                  </div>
                  <input
                    type="range"
                    min="11"
                    max="22"
                    value={bodySize}
                    onChange={(e) => setBodySize(Number(e.target.value))}
                    className="w-full accent-[#C9A227] cursor-pointer"
                  />
                </div>

                {/* Line Height */}
                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-[9px] text-[#888888]">
                    <span>Line Height</span>
                    <span className="text-white">{bodyLineHeight}</span>
                  </div>
                  <input
                    type="range"
                    min="1.2"
                    max="2.2"
                    step="0.05"
                    value={bodyLineHeight}
                    onChange={(e) => setBodyLineHeight(Number(e.target.value))}
                    className="w-full accent-[#C9A227] cursor-pointer"
                  />
                </div>

                {/* Letter Spacing */}
                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-[9px] text-[#888888]">
                    <span>Letter Spacing</span>
                    <span className="text-white">{bodySpacing}px</span>
                  </div>
                  <input
                    type="range"
                    min="-0.5"
                    max="3"
                    step="0.1"
                    value={bodySpacing}
                    onChange={(e) => setBodySpacing(Number(e.target.value))}
                    className="w-full accent-[#C9A227] cursor-pointer"
                  />
                </div>

                {/* Weight Options */}
                <div className="space-y-1">
                  <span className="text-[9px] text-[#666666] font-mono uppercase block">Font Weight</span>
                  <div className="grid grid-cols-3 gap-1">
                    {['300', '400', '500'].map(w => (
                      <button
                        key={w}
                        onClick={() => setBodyWeight(w)}
                        className={`py-1 text-[9px] font-mono rounded-none border transition-all cursor-pointer ${
                          bodyWeight === w 
                            ? 'bg-[#C9A227] border-[#C9A227] text-black font-bold' 
                            : 'bg-[#181818] border-white/5 text-[#888888] hover:text-white'
                        }`}
                      >
                        {w === '300' ? 'Light' : w === '400' ? 'Regular' : 'Medium'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Clear/Reset calibration tuning controls */}
            <button
              onClick={handleResetTuning}
              className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 font-mono text-[10px] text-white uppercase tracking-widest transition-colors rounded-none cursor-pointer"
            >
              Reset Tuner Dimensions
            </button>
          </div>

          {/* RIGHT COLUMN: Live Rendering Stage & Presets (7 Cols) */}
          <div className="lg:col-span-7 p-6 flex flex-col justify-between overflow-y-auto custom-scrollbar bg-[#0F0F0F] space-y-6">
            
            {/* Template Presets selector tabs */}
            <div className="space-y-2.5">
              <span className="font-mono text-[9px] text-[#C9A227] tracking-widest uppercase block">
                Preview Stage Layout Templates
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'hero', label: 'Graphic Poster' },
                  { id: 'product', label: 'Product Banner' },
                  { id: 'article', label: 'Editorial Column' },
                  { id: 'bento', label: 'Bento Accent' }
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setLayoutPreset(p.id as any)}
                    className={`py-2 px-1 text-center font-mono text-[9px] uppercase tracking-wider border rounded-none transition-all cursor-pointer ${
                      layoutPreset === p.id 
                        ? 'bg-[#C9A227]/10 border-[#C9A227] text-white' 
                        : 'bg-white/5 border-white/5 text-[#888888] hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* LIVE PREVIEW CANVAS WINDOW */}
            <div className="flex-1 min-h-[300px] border border-white/10 bg-[#0B0B0B] p-8 flex items-center justify-center relative overflow-hidden group">
              <div className="absolute top-2.5 left-3 font-mono text-[8px] text-[#555555] uppercase tracking-widest">
                Spectral Calibration Stage ({layoutPreset.toUpperCase()})
              </div>

              {/* DYNAMIC LAYOUT PRESET DRAWERS */}
              <div className="w-full max-w-xl text-white transition-all duration-300">
                {layoutPreset === 'hero' && (
                  <div className="text-center space-y-5">
                    <h1 
                      style={{ 
                        fontFamily: `"${headingFont}", sans-serif`,
                        fontSize: `${headingSize}px`,
                        fontWeight: headingWeight,
                        lineHeight: headingLineHeight,
                        letterSpacing: `${headingSpacing}px`
                      }}
                      className="tracking-tight"
                    >
                      {headingText}
                    </h1>
                    <div className="w-12 h-0.5 bg-[#C9A227] mx-auto opacity-70"></div>
                    <p 
                      style={{ 
                        fontFamily: `"${bodyFont}", sans-serif`,
                        fontSize: `${bodySize}px`,
                        fontWeight: bodyWeight,
                        lineHeight: bodyLineHeight,
                        letterSpacing: `${bodySpacing}px`
                      }}
                      className="text-[#888888] max-w-md mx-auto"
                    >
                      {bodyText}
                    </p>
                  </div>
                )}

                {layoutPreset === 'product' && (
                  <div className="text-left space-y-4">
                    <span className="font-mono text-[10px] tracking-[0.3em] text-[#C9A227] uppercase">
                      Introducing the Signature Pair
                    </span>
                    <h1 
                      style={{ 
                        fontFamily: `"${headingFont}", sans-serif`,
                        fontSize: `${headingSize}px`,
                        fontWeight: headingWeight,
                        lineHeight: headingLineHeight,
                        letterSpacing: `${headingSpacing}px`
                      }}
                    >
                      {headingText}
                    </h1>
                    <p 
                      style={{ 
                        fontFamily: `"${bodyFont}", sans-serif`,
                        fontSize: `${bodySize}px`,
                        fontWeight: bodyWeight,
                        lineHeight: bodyLineHeight,
                        letterSpacing: `${bodySpacing}px`
                      }}
                      className="text-[#A3A3A3] border-l border-white/10 pl-4 py-1"
                    >
                      {bodyText}
                    </p>
                  </div>
                )}

                {layoutPreset === 'article' && (
                  <div className="text-left space-y-6">
                    <h1 
                      style={{ 
                        fontFamily: `"${headingFont}", sans-serif`,
                        fontSize: `${headingSize * 0.8}px`, // Slightly scaled down for article column
                        fontWeight: headingWeight,
                        lineHeight: headingLineHeight,
                        letterSpacing: `${headingSpacing}px`
                      }}
                      className="text-[#E5E5E5]"
                    >
                      {headingText}
                    </h1>
                    <div className="flex items-center space-x-3 text-[10px] font-mono text-[#666666] border-b border-white/5 pb-2">
                      <span>WRITTEN BY AURA CALIBRATOR</span>
                      <span>•</span>
                      <span>JULY 2026</span>
                    </div>
                    <p 
                      style={{ 
                        fontFamily: `"${bodyFont}", sans-serif`,
                        fontSize: `${bodySize}px`,
                        fontWeight: bodyWeight,
                        lineHeight: bodyLineHeight,
                        letterSpacing: `${bodySpacing}px`
                      }}
                      className="text-[#888888] indent-6 leading-relaxed text-justify"
                    >
                      {bodyText}
                    </p>
                  </div>
                )}

                {layoutPreset === 'bento' && (
                  <div className="bg-[#121212] border border-white/10 p-6 space-y-4 relative">
                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#C9A227] animate-pulse"></div>
                    <h1 
                      style={{ 
                        fontFamily: `"${headingFont}", sans-serif`,
                        fontSize: `${headingSize * 0.7}px`,
                        fontWeight: headingWeight,
                        lineHeight: headingLineHeight,
                        letterSpacing: `${headingSpacing}px`
                      }}
                      className="text-white"
                    >
                      {headingText}
                    </h1>
                    <p 
                      style={{ 
                        fontFamily: `"${bodyFont}", sans-serif`,
                        fontSize: `${bodySize}px`,
                        fontWeight: bodyWeight,
                        lineHeight: bodyLineHeight,
                        letterSpacing: `${bodySpacing}px`
                      }}
                      className="text-[#888888]"
                    >
                      {bodyText}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* INTEGRATION CODE EXPORTER PANEL */}
            <div className="bg-[#121212] border border-white/5 p-4 space-y-3">
              <span className="font-mono text-[9px] text-[#C9A227] tracking-widest uppercase block border-b border-white/10 pb-1.5">
                Typography Code Integration Exporter
              </span>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleCopyCode('link')}
                  className="py-2.5 bg-white/5 hover:bg-[#1A1A1A] border border-white/5 text-[10px] text-white font-mono tracking-wider transition-all flex items-center justify-center space-x-2 rounded-none cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
                  <span>{copiedFormat === 'link' ? 'Copied!' : 'HTML Link'}</span>
                </button>
                <button
                  onClick={() => handleCopyCode('css')}
                  className="py-2.5 bg-white/5 hover:bg-[#1A1A1A] border border-white/5 text-[10px] text-white font-mono tracking-wider transition-all flex items-center justify-center space-x-2 rounded-none cursor-pointer"
                >
                  <Code className="w-3.5 h-3.5 text-blue-400" />
                  <span>{copiedFormat === 'css' ? 'Copied!' : 'CSS Rules'}</span>
                </button>
                <button
                  onClick={() => handleCopyCode('tailwind')}
                  className="py-2.5 bg-white/5 hover:bg-[#1A1A1A] border border-white/5 text-[10px] text-white font-mono tracking-wider transition-all flex items-center justify-center space-x-2 rounded-none cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{copiedFormat === 'tailwind' ? 'Copied!' : 'Tailwind'}</span>
                </button>
              </div>
            </div>

          </div>
          
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#121212] flex items-center justify-between flex-shrink-0 relative">
          <AnimatePresence>
            {showSuccessNotification && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute inset-0 bg-[#0F0F0F] border-t border-[#C9A227] px-6 flex items-center justify-between z-10"
              >
                <div className="flex items-center space-x-2 text-white">
                  <CheckCircle2 className="w-4 h-4 text-[#C9A227]" />
                  <span className="font-mono text-xs">
                    Calibration pair <span className="text-[#C9A227] font-semibold">{headingFont} + {bodyFont}</span> applied successfully!
                  </span>
                </div>
                <span className="font-mono text-[9px] text-[#888888]">
                  Integration codes copied to clipboard.
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-xs text-[#888888] font-mono">
            Active Selected: <span className="text-white">{headingFont}</span> + <span className="text-white">{bodyFont}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="py-2 px-5 bg-white/5 hover:bg-white/10 border border-white/10 font-mono text-[10px] tracking-widest text-white uppercase rounded-none transition-colors cursor-pointer"
            >
              Dismiss Sandbox
            </button>
            <button
              onClick={() => {
                setShowSuccessNotification(true);
                // Copy the CSS code automatically for them as a quality-of-life bonus!
                const hFontEscaped = headingFont.replace(/\s+/g, '+');
                const bFontEscaped = bodyFont.replace(/\s+/g, '+');
                const cssText = `/* Applied Font Pairing */\n--font-heading: '${headingFont}', sans-serif;\n--font-body: '${bodyFont}', sans-serif;`;
                navigator.clipboard.writeText(cssText);
                setTimeout(() => {
                  setShowSuccessNotification(false);
                  onClose();
                }, 2000);
              }}
              className="py-2 px-5 bg-[#C9A227] hover:bg-[#B8911C] text-black font-mono text-[10px] tracking-widest font-semibold uppercase rounded-none transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Apply Calibration Pairing</span>
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
