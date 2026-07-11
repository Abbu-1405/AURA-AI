import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Type, 
  Palette, 
  Grid, 
  Layers, 
  Eye, 
  EyeOff, 
  Info, 
  ArrowRight,
  Maximize2
} from 'lucide-react';
import { CreativeDirectorReport } from '../types';

interface BeforeAfterViewerProps {
  uploadedImage: string;
  report: CreativeDirectorReport;
}

export default function BeforeAfterViewer({ uploadedImage, report }: BeforeAfterViewerProps) {
  const [activeOverlay, setActiveOverlay] = useState<string | null>(null);
  const [showOverlays, setShowOverlays] = useState(true);
  const [activeTab, setActiveTab] = useState<'side-by-side' | 'before' | 'after'>('side-by-side');

  // Interactive Overlays definitions
  const overlays = [
    {
      id: 'typography',
      name: '01 / Typography Grid',
      icon: Type,
      color: '#C9A227',
      classes: 'top-[12%] left-[10%] w-[80%] h-[22%]',
      title: 'Typography Hierachy Audit',
      problems: report.typography.problems[0] || 'Hierarchy requires adjustment for readability.',
      solution: report.typography.exactChanges[0] || 'Enhance contrast and adjust letter spacing.',
      desc: 'AI recommends refining the font scaling hierarchy to prioritize title emphasis.'
    },
    {
      id: 'color',
      name: '02 / Color Accents',
      icon: Palette,
      color: '#3B82F6',
      classes: 'top-[42%] right-[8%] w-[45%] h-[18%]',
      title: 'Contrast & Harmony Overlay',
      problems: 'Insufficient background contrast and element isolation.',
      solution: `Apply recommended palette tones: ${report.color.improvedPalette.map(c => c.hex).slice(0, 3).join(', ')}.`,
      desc: 'Use high-contrast borders and accents to anchor visual flow.'
    },
    {
      id: 'spatial',
      name: '03 / Spatial Alignment',
      icon: Grid,
      color: '#10B981',
      classes: 'bottom-[12%] left-[20%] w-[60%] h-[18%]',
      title: 'Spatial Architecture & Scaling',
      problems: report.sizePositioning.whatShouldMove[0] || 'Primary focus element positioning lacks emphasis.',
      solution: report.sizePositioning.whatShouldIncrease[0] || 'Scale primary CTA to define actionable areas.',
      desc: 'Readjust sizing margins and scale up vital touch targets.'
    },
    {
      id: 'backdrop',
      name: '04 / Backdrop Depth',
      icon: Layers,
      color: '#EC4899',
      classes: 'inset-[3%] border-4 border-dashed rounded-none pointer-events-none',
      title: 'Backdrop Environment & Gradients',
      problems: 'Flat backdrop limits visual layering.',
      solution: report.background.betterBackgroundIdeas[0] || 'Integrate radial gradients or blur assets.',
      desc: report.background.blurSuggestions
    }
  ];

  return (
    <div className="bg-[#121212] border border-white/5 rounded-none p-4 space-y-4 shadow-xl">
      
      {/* Viewer Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-1.5 bg-[#C9A227] animate-pulse rounded-full"></span>
          <span className="font-mono text-[9px] tracking-widest text-[#C9A227] uppercase">
            BEFORE & AFTER HIERARCHY MAP
          </span>
        </div>

        {/* View Selection Controls */}
        <div className="flex items-center space-x-4">
          {/* Main Tabs */}
          <div className="flex bg-[#1A1A1A] border border-white/10 p-0.5 rounded-none font-mono text-[8px] tracking-wider uppercase">
            <button
              onClick={() => setActiveTab('side-by-side')}
              className={`px-2.5 py-1 rounded-none transition-all cursor-pointer ${
                activeTab === 'side-by-side' 
                  ? 'bg-[#C9A227] text-[#050505] font-bold' 
                  : 'text-[#666666] hover:text-white'
              }`}
            >
              Side-by-Side
            </button>
            <button
              onClick={() => setActiveTab('before')}
              className={`px-2.5 py-1 rounded-none transition-all cursor-pointer ${
                activeTab === 'before' 
                  ? 'bg-[#C9A227] text-[#050505] font-bold' 
                  : 'text-[#666666] hover:text-white'
              }`}
            >
              Before
            </button>
            <button
              onClick={() => setActiveTab('after')}
              className={`px-2.5 py-1 rounded-none transition-all cursor-pointer ${
                activeTab === 'after' 
                  ? 'bg-[#C9A227] text-[#050505] font-bold' 
                  : 'text-[#666666] hover:text-white'
              }`}
            >
              After (AI Map)
            </button>
          </div>

          {/* Toggle All Overlays Button (only visible in After or Side-by-Side) */}
          {activeTab !== 'before' && (
            <button
              onClick={() => setShowOverlays(!showOverlays)}
              className="flex items-center space-x-1.5 font-mono text-[8px] text-[#A3A3A3] hover:text-white uppercase tracking-widest bg-white/5 border border-white/10 py-1 px-2 cursor-pointer transition-all"
            >
              {showOverlays ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5 text-[#C9A227]" />}
              <span>{showOverlays ? 'Hide Maps' : 'Show Maps'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Comparative Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[340px] relative">
        
        {/* PANEL 1: BEFORE / ORIGINAL */}
        {(activeTab === 'side-by-side' || activeTab === 'before') && (
          <div className={`${activeTab === 'side-by-side' ? 'lg:col-span-6' : 'lg:col-span-12'} flex flex-col relative`}>
            {/* Label */}
            <div className="absolute top-3 left-3 z-10 bg-black/80 border border-white/10 px-2.5 py-1 font-mono text-[8px] tracking-widest text-[#A3A3A3] uppercase">
              Before / Original Design
            </div>
            
            {/* Image Box */}
            <div className="bg-black/40 border border-white/5 flex items-center justify-center p-4 min-h-[280px] max-h-[360px] h-full overflow-hidden relative">
              <img 
                src={uploadedImage} 
                alt="Before critique" 
                className="max-h-[260px] max-w-full object-contain filter brightness-[0.75]" 
              />
            </div>
          </div>
        )}

        {/* PANEL 2: AFTER / AI MARKUP OVERLAYS */}
        {(activeTab === 'side-by-side' || activeTab === 'after') && (
          <div className={`${activeTab === 'side-by-side' ? 'lg:col-span-6' : 'lg:col-span-12'} flex flex-col relative`}>
            {/* Label */}
            <div className="absolute top-3 left-3 z-10 bg-black/80 border border-[#C9A227]/30 px-2.5 py-1 font-mono text-[8px] tracking-widest text-[#C9A227] uppercase flex items-center space-x-1.5">
              <span className="w-1 h-1 bg-[#C9A227] rounded-full animate-ping"></span>
              <span>After / Interactive AI Overlay Map</span>
            </div>

            {/* Image Box with Overlay Markups */}
            <div className="bg-black/40 border border-white/5 flex items-center justify-center p-4 min-h-[280px] max-h-[360px] h-full overflow-hidden relative">
              <div className="relative max-h-[260px] max-w-full flex items-center justify-center">
                <img 
                  src={uploadedImage} 
                  alt="After critique markup" 
                  className="max-h-[260px] max-w-full object-contain transition-all duration-300 filter brightness-[0.6] blur-[1px]" 
                />

                {/* Overlaid Vector Zones */}
                {showOverlays && overlays.map((o) => {
                  const isFocused = activeOverlay === o.id;
                  const isBackdrop = o.id === 'backdrop';

                  return (
                    <div
                      key={o.id}
                      onClick={() => setActiveOverlay(isFocused ? null : o.id)}
                      className={`absolute transition-all duration-300 cursor-pointer ${o.classes} ${
                        isFocused 
                          ? 'bg-black/20 ring-1 ring-white/10 shadow-[0_0_20px_rgba(201,162,39,0.15)]' 
                          : 'hover:bg-white/5'
                      }`}
                      style={{
                        pointerEvents: isBackdrop ? 'none' : 'auto',
                      }}
                    >
                      {!isBackdrop && (
                        <>
                          {/* Dotted border outline */}
                          <div 
                            className="absolute inset-0 border border-dashed transition-colors"
                            style={{ 
                              borderColor: isFocused ? '#C9A227' : `${o.color}40`,
                            }}
                          />

                          {/* Pulsing focal node badge */}
                          <div 
                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center"
                          >
                            <div className="relative">
                              <span 
                                className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping"
                                style={{ backgroundColor: isFocused ? '#C9A227' : o.color }}
                              />
                              <div 
                                className="relative w-7 h-7 flex items-center justify-center border text-[9px] font-mono font-bold transition-all duration-300 bg-[#050505]"
                                style={{ 
                                  borderColor: isFocused ? '#C9A227' : o.color,
                                  color: isFocused ? '#C9A227' : '#F5F5F5'
                                }}
                              >
                                {o.id === 'typography' && '01'}
                                {o.id === 'color' && '02'}
                                {o.id === 'spatial' && '03'}
                              </div>
                            </div>
                          </div>

                          {/* Top-left small label tab */}
                          <div 
                            className="absolute -top-2 left-1 px-1.5 py-0.5 text-[7px] font-mono tracking-widest uppercase text-white bg-[#121212] border"
                            style={{ borderColor: isFocused ? '#C9A227' : `${o.color}40` }}
                          >
                            {o.id.toUpperCase()}
                          </div>
                        </>
                      )}

                      {/* Backdrop custom subtle border */}
                      {isBackdrop && (
                        <div 
                          className="absolute inset-0 border border-dashed animate-pulse"
                          style={{ borderColor: `${o.color}25`, animationDuration: '4s' }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Active Highlight Description Drawer or Card */}
      <AnimatePresence>
        {showOverlays && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
            {overlays.filter(o => o.id !== 'backdrop').map((o) => {
              const isSelected = activeOverlay === o.id;
              const Icon = o.icon;

              return (
                <button
                  key={o.id}
                  onClick={() => setActiveOverlay(isSelected ? null : o.id)}
                  className={`p-3 text-left border rounded-none transition-all flex items-start space-x-3 cursor-pointer ${
                    isSelected 
                      ? 'bg-[#1A1A1A] border-[#C9A227] shadow-[0_0_15px_rgba(201,162,39,0.08)]' 
                      : 'bg-[#151515] border-white/5 hover:border-white/20'
                  }`}
                >
                  <div 
                    className="w-7 h-7 rounded-none border flex items-center justify-center flex-shrink-0"
                    style={{ 
                      borderColor: isSelected ? '#C9A227' : `${o.color}40`,
                      color: isSelected ? '#C9A227' : o.color 
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-[8px] text-[#666666] tracking-wider uppercase block">
                      {o.name}
                    </span>
                    <span className="font-display font-medium text-xs text-[#F5F5F5] tracking-wide block truncate">
                      {o.title}
                    </span>
                    
                    {/* Expandable suggestion details */}
                    <div className="mt-1.5 space-y-1">
                      <p className="text-[10px] text-[#A3A3A3] font-light leading-snug line-clamp-2">
                        {isSelected ? o.solution : o.problems}
                      </p>
                      {isSelected && (
                        <motion.p 
                          initial={{ opacity: 0, y: 2 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-[9px] text-[#C9A227]/80 font-mono tracking-wide leading-relaxed pt-1"
                        >
                          Insight: {o.desc}
                        </motion.p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Quick Instruction Notice */}
      {showOverlays && (
        <div className="bg-[#1A1A1A]/80 border border-white/5 p-2 flex items-center justify-between font-mono text-[8px] text-[#666666] tracking-wider uppercase">
          <div className="flex items-center space-x-1.5">
            <Info className="w-3 h-3 text-[#C9A227]" />
            <span>Interactive: Click the hotspots on image or labels below to reveal exact AI adjustments</span>
          </div>
          <span className="hidden md:inline">AURA AI VISUAL ENGINE v4.1</span>
        </div>
      )}
    </div>
  );
}
