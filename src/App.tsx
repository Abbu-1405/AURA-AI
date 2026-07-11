import React, { useState, useEffect, DragEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, Image as ImageIcon, Sparkles, RefreshCw, Type, Palette, 
  Maximize2, Grid, Layers, Check, Copy, ArrowLeft, History, 
  User, LogOut, ChevronRight, AlertCircle, X, Download, Ruler, BookOpen
} from 'lucide-react';

import { DesignStyle, CreativeDirectorReport } from './types';
import SplashScreen from './components/SplashScreen';
import StyleSelector from './components/StyleSelector';
import AnalysisLoader from './components/AnalysisLoader';
import DesignChat from './components/DesignChat';
import AuthModal from './components/AuthModal';
import BeforeAfterViewer from './components/BeforeAfterViewer';
import ColorExtractor from './components/ColorExtractor';
import ColorPicker from './components/ColorPicker';
import FontPairingPreview from './components/FontPairingPreview';
import { generateReportPDF } from './utils/pdfGenerator';
import DesignInspector, { PickedColor } from './components/DesignInspector';
import AuraAnalysisWorkspace from './components/AuraAnalysisWorkspace';
import RatioVisualizer from './components/RatioVisualizer';
import RatiosLibrary from './components/RatiosLibrary';

interface HistoryItem {
  id: string;
  image: string; // base64
  style: DesignStyle;
  report: CreativeDirectorReport;
  timestamp: string;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [activeSuiteTab, setActiveSuiteTab] = useState<'critique' | 'extractor' | 'picker' | 'ratio-visualizer' | 'ratios-library'>('critique');
  const [isFontPairingOpen, setIsFontPairingOpen] = useState(false);
  
  // Standard Ratios shared states for Visualizer
  const [visualizerWidth, setVisualizerWidth] = useState<number | undefined>(undefined);
  const [visualizerHeight, setVisualizerHeight] = useState<number | undefined>(undefined);
  const [visualizerUnit, setVisualizerUnit] = useState<string | undefined>(undefined);

  const handleOpenInVisualizer = (width: number, height: number, unit: string) => {
    setVisualizerWidth(width);
    setVisualizerHeight(height);
    setVisualizerUnit(unit);
    setActiveSuiteTab('ratio-visualizer');
  };

  const handleClearVisualizerParams = () => {
    setVisualizerWidth(undefined);
    setVisualizerHeight(undefined);
    setVisualizerUnit(undefined);
  };
  
  // Workspace States
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<DesignStyle>('Minimal');
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<CreativeDirectorReport | null>(null);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  
  // New Interactive Color Workspace States
  const [activePickedColor, setActivePickedColor] = useState<PickedColor | null>(null);
  const [recentColors, setRecentColors] = useState<PickedColor[]>([]);

  const handleColorPicked = (color: PickedColor) => {
    setActivePickedColor(color);
    setRecentColors(prev => {
      const exists = prev.some(c => c.hex.toLowerCase() === color.hex.toLowerCase());
      if (exists) {
        const filtered = prev.filter(c => c.hex.toLowerCase() !== color.hex.toLowerCase());
        return [color, ...filtered].slice(0, 12);
      }
      return [color, ...prev].slice(0, 12);
    });
  };

  const handleClearRecentColors = () => {
    setRecentColors([]);
    setActivePickedColor(null);
  };

  // Interactive Element Inspector States
  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  const [isInspectModeActive, setIsInspectModeActive] = useState<boolean>(true);
  
  // History list
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);

  // Load user session & history from localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem('aura_user_email');
    if (savedEmail) {
      setUserEmail(savedEmail);
    }

    const savedHistory = localStorage.getItem('aura_analysis_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse analysis history:", e);
      }
    }
  }, []);

  const handleLoginSuccess = (email: string) => {
    setUserEmail(email);
    localStorage.setItem('aura_user_email', email);
  };

  const handleLogout = () => {
    setUserEmail(null);
    localStorage.removeItem('aura_user_email');
  };

  // Convert uploaded image file to base64
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Aura AI accepts image file formats only (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setUploadedImage(e.target.result as string);
        // Clear previous report if loading a new image
        setReport(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop event handlers
  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
       setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Run the AI Design Evaluation
  const handleAnalyze = async () => {
    if (!uploadedImage) return;

    setLoading(true);
    setReport(null);

    try {
      const response = await fetch('/api/analyze-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: uploadedImage,
          style: selectedStyle
        })
      });

      if (!response.ok) {
        throw new Error('Analysis server error');
      }

      const data = await response.json();
      if (data.success && data.report) {
        setReport(data.report);

        // Smooth scroll to the critique results studio once rendered
        setTimeout(() => {
          const el = document.getElementById('results-studio');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);

        // Append to history list
        const newItem: HistoryItem = {
          id: Math.random().toString(),
          image: uploadedImage,
          style: selectedStyle,
          report: data.report,
          timestamp: new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        };

        const updatedHistory = [newItem, ...history].slice(0, 10); // Keep last 10 entries
        setHistory(updatedHistory);
        localStorage.setItem('aura_analysis_history', JSON.stringify(updatedHistory));
      } else {
        throw new Error('Invalid analysis output');
      }
    } catch (error) {
      console.error("Aura AI: Evaluation failed:", error);
      alert("Aura AI encountered an evaluation issue. Check your connection or API configuration.");
    } finally {
      setLoading(false);
    }
  };

  // Copy hex to clipboard helper
  const copyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  // Load from history click
  const handleLoadHistoryItem = (item: HistoryItem) => {
    setUploadedImage(item.image);
    setSelectedStyle(item.style);
    setReport(item.report);
    setShowHistoryPanel(false);
  };

  // Clear workspace
  const handleResetWorkspace = () => {
    setUploadedImage(null);
    setReport(null);
    setActivePickedColor(null);
    setRecentColors([]);
    setActiveElementId(null);
    setIsInspectModeActive(true);
  };

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const handleDownloadPDF = async () => {
    if (!report) return;
    setIsDownloadingPdf(true);
    try {
      await generateReportPDF(report, uploadedImage);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to compile and download PDF. Please try again.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Show splash on startup
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen w-full bg-[#050505] text-[#F5F5F5] flex flex-col font-sans selection:bg-[#C9A227]/30 selection:text-white p-4 md:p-6 border-4 md:border-8 border-[#1A1A1A] overflow-y-auto">
      
      {/* Premium Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#050505]/95 backdrop-blur border-b border-white/10 px-2 pb-4 mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={handleResetWorkspace}>
          {/* Brand Symbol ◇ */}
          <div className="w-8 h-8 border border-[#C9A227] rotate-45 flex items-center justify-center bg-[#121212] shadow-[0_0_10px_rgba(201,162,39,0.15)]">
            <span className="text-[#C9A227] font-display text-base -rotate-45 font-light">◇</span>
          </div>
          <div>
            <h1 className="font-display text-lg font-light tracking-[0.2em] uppercase text-[#F5F5F5]">
              Aura AI
            </h1>
            <p className="font-mono text-[8px] tracking-[0.3em] text-[#C9A227] uppercase">
              Your AI Creative Director
            </p>
          </div>
        </div>

        {/* Control and optional auth operations */}
        <div className="flex items-center space-x-4">
          {history.length > 0 && (
            <button
              onClick={() => setShowHistoryPanel(!showHistoryPanel)}
              className="flex items-center space-x-1.5 font-mono text-[10px] tracking-wider uppercase text-[#A3A3A3] hover:text-[#C9A227] transition-colors py-1.5 px-3 rounded-none border border-white/10 hover:border-[#C9A227]/20 bg-[#121212] cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span>Studio Logs ({history.length})</span>
            </button>
          )}

          {userEmail ? (
            <div className="flex items-center space-x-3 bg-[#121212] border border-white/10 rounded-none px-3 py-1.5">
              <div className="flex items-center space-x-2">
                <User className="w-3 h-3 text-[#C9A227]" />
                <span className="font-mono text-[9px] text-[#A3A3A3] tracking-wider truncate max-w-[120px]">
                  {userEmail}
                </span>
              </div>
              <button 
                onClick={handleLogout}
                title="Disconnect Suite"
                className="text-[#666666] hover:text-[#C9A227] transition-colors p-0.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthOpen(true)}
              className="font-mono text-[10px] tracking-widest uppercase text-[#C9A227] hover:text-white hover:bg-[#C9A227]/10 border border-[#C9A227]/40 hover:border-[#C9A227] py-1.5 px-4 rounded-none transition-all duration-300 cursor-pointer"
            >
              Suite Access
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full mx-auto p-2 md:p-4 flex flex-col space-y-8 relative overflow-y-auto min-h-0 custom-scrollbar">
        
        {/* Dynamic Studio Logs / History Slide-Over Panel */}
        <AnimatePresence>
          {showHistoryPanel && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-40 bg-black/75 backdrop-blur-xs"
                onClick={() => setShowHistoryPanel(false)}
              />
              {/* Drawer */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[#121212] border-l border-white/10 p-6 shadow-2xl flex flex-col overflow-hidden"
              >
                <div className="flex justify-between items-center pb-4 border-b border-white/10">
                  <div>
                    <h4 className="font-display text-base font-light uppercase tracking-widest text-[#F5F5F5]">
                      Studio History Logs
                    </h4>
                    <p className="font-mono text-[8px] text-[#C9A227] tracking-widest uppercase">
                      Past Evaluated Compositions
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowHistoryPanel(false)}
                    className="p-1 text-[#666666] hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleLoadHistoryItem(item)}
                      className="w-full text-left p-3 rounded-none bg-[#1A1A1A] hover:bg-[#252525] border border-white/5 hover:border-[#C9A227]/30 transition-all flex items-center space-x-4 cursor-pointer"
                    >
                      <div className="w-16 h-16 rounded-none overflow-hidden bg-black border border-white/10 flex-shrink-0 flex items-center justify-center">
                        <img src={item.image} alt="Log preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-[9px] text-[#C9A227] uppercase tracking-widest bg-[#C9A227]/10 px-1.5 py-0.5 rounded-none">
                            {item.style}
                          </span>
                          <span className="font-mono text-[8px] text-[#666666]">
                            {item.timestamp}
                          </span>
                        </div>
                        <h5 className="text-xs text-[#F5F5F5] font-light truncate mt-1">
                          {item.report.overallVerdict}
                        </h5>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#444444]" />
                    </button>
                  ))}
                </div>

                <div className="pt-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      setHistory([]);
                      localStorage.removeItem('aura_analysis_history');
                    }}
                    className="w-full py-2 border border-red-900/20 text-red-500/80 hover:text-red-400 hover:bg-red-950/10 rounded-none font-mono text-[9px] tracking-widest uppercase transition-colors text-center cursor-pointer"
                  >
                    Wipe Studio Logs
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Navigation Tabs for Aura Suite */}
        <div className="flex border-b border-white/10 pb-2 mb-4 space-x-6 shrink-0 select-none overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveSuiteTab('critique')}
            className={`font-mono text-xs tracking-widest uppercase pb-1.5 cursor-pointer transition-all flex items-center space-x-2 shrink-0 ${
              activeSuiteTab === 'critique' 
                ? 'text-[#C9A227] border-b-2 border-[#C9A227] font-semibold' 
                : 'text-[#888888] hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Design Critique</span>
          </button>
          <button
            onClick={() => setActiveSuiteTab('extractor')}
            className={`font-mono text-xs tracking-widest uppercase pb-1.5 cursor-pointer transition-all flex items-center space-x-2 shrink-0 ${
              activeSuiteTab === 'extractor' 
                ? 'text-[#C9A227] border-b-2 border-[#C9A227] font-semibold' 
                : 'text-[#888888] hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Color Extractor</span>
          </button>
          <button
            onClick={() => setActiveSuiteTab('picker')}
            className={`font-mono text-xs tracking-widest uppercase pb-1.5 cursor-pointer transition-all flex items-center space-x-2 shrink-0 ${
              activeSuiteTab === 'picker' 
                ? 'text-[#C9A227] border-b-2 border-[#C9A227] font-semibold' 
                : 'text-[#888888] hover:text-white'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Color Picker</span>
          </button>
          <button
            onClick={() => setActiveSuiteTab('ratio-visualizer')}
            className={`font-mono text-xs tracking-widest uppercase pb-1.5 cursor-pointer transition-all flex items-center space-x-2 shrink-0 ${
              activeSuiteTab === 'ratio-visualizer' 
                ? 'text-[#C9A227] border-b-2 border-[#C9A227] font-semibold' 
                : 'text-[#888888] hover:text-white'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>Ratio Visualizer</span>
          </button>
          <button
            onClick={() => setActiveSuiteTab('ratios-library')}
            className={`font-mono text-xs tracking-widest uppercase pb-1.5 cursor-pointer transition-all flex items-center space-x-2 shrink-0 ${
              activeSuiteTab === 'ratios-library' 
                ? 'text-[#C9A227] border-b-2 border-[#C9A227] font-semibold' 
                : 'text-[#888888] hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Standard Ratios</span>
          </button>
        </div>

        {/* WORKSPACE FLOW */}
        <AnimatePresence mode="wait">
          {activeSuiteTab === 'extractor' ? (
            <motion.div
              key="extractor"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <ColorExtractor />
            </motion.div>
          ) : activeSuiteTab === 'picker' ? (
            <motion.div
              key="picker"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <ColorPicker />
            </motion.div>
          ) : activeSuiteTab === 'ratio-visualizer' ? (
            <motion.div
              key="ratio-visualizer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <RatioVisualizer 
                initialWidth={visualizerWidth}
                initialHeight={visualizerHeight}
                initialUnit={visualizerUnit}
                onClearInitialValues={handleClearVisualizerParams}
              />
            </motion.div>
          ) : activeSuiteTab === 'ratios-library' ? (
            <motion.div
              key="ratios-library"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <RatiosLibrary onOpenInVisualizer={handleOpenInVisualizer} />
            </motion.div>
          ) : (
            <motion.div
              key="critique"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col min-h-0"
            >
              {/* STEP A: EMPTY STATE (Home Screen & Introductions) */}
              {!uploadedImage && !loading && !report && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-12 py-8"
            >
              {/* Introduction Hero Card */}
              <div className="text-center space-y-4 max-w-2xl mx-auto">
                <span className="font-mono text-xs tracking-[0.4em] text-[#C9A227] uppercase block">
                  ◇ Aura Creative Director Suite ◇
                </span>
                <h2 className="font-display text-4xl md:text-5xl font-light text-[#F5F5F5] tracking-wide leading-tight">
                  Improve your designs with AI-powered creative feedback.
                </h2>
                <p className="font-sans font-light text-[#A3A3A3] text-base leading-relaxed max-w-xl mx-auto">
                  Upload any design — posters, thumbnails, UI screenshots, banners, or logos. Receive clinical, specific creative direction across Typography, Color Theory, Sizing and Background.
                </p>
              </div>

              {/* Drag and Drop File Upload Area */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`max-w-xl mx-auto p-10 rounded-none border-2 border-dashed transition-all duration-300 text-center relative overflow-hidden group ${
                  dragActive 
                    ? 'border-[#C9A227] bg-[#C9A227]/5' 
                    : 'border-white/10 bg-[#121212] hover:border-[#C9A227]/40'
                }`}
              >
                {/* Visual accents representing Broken Frame */}
                <div className="absolute top-2 right-2 border-t border-r border-white/10 group-hover:border-[#C9A227] w-4 h-4 transition-colors"></div>
                <div className="absolute bottom-2 left-2 border-b border-l border-white/10 group-hover:border-[#C9A227] w-4 h-4 transition-colors"></div>

                <input 
                  type="file" 
                  id="design-upload-file"
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden" 
                />
                <label 
                  htmlFor="design-upload-file" 
                  className="cursor-pointer block space-y-6 py-6"
                >
                  <div className="w-16 h-16 rounded-none border border-white/10 group-hover:border-[#C9A227]/40 flex items-center justify-center bg-[#1A1A1A] mx-auto transition-colors shadow-inner">
                    <Upload className="w-6 h-6 text-[#A3A3A3] group-hover:text-[#C9A227] transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[#F5F5F5] text-base font-light tracking-wide">
                      Select design image or drag and drop
                    </p>
                    <p className="text-[#666666] font-mono text-[9px] tracking-widest uppercase">
                      PNG, JPG, WEBP formats supported
                    </p>
                  </div>
                </label>
              </div>

              {/* Core Features Overview (Bento style grid) */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
                <div className="p-5 bg-[#121212] border border-white/5 rounded-none space-y-3">
                  <div className="w-8 h-8 rounded-none bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-[#C9A227]">
                    <Type className="w-4 h-4" />
                  </div>
                  <h4 className="font-display font-light text-[#F5F5F5] tracking-wide">Typography Analysis</h4>
                  <p className="text-xs text-[#A3A3A3] leading-relaxed font-light">
                    Evaluate font choices, weight, leading, tracking and specific alignment hierarchy.
                  </p>
                </div>

                <div className="p-5 bg-[#121212] border border-white/5 rounded-none space-y-3">
                  <div className="w-8 h-8 rounded-none bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-[#C9A227]">
                    <Palette className="w-4 h-4" />
                  </div>
                  <h4 className="font-display font-light text-[#F5F5F5] tracking-wide">Color Theory Review</h4>
                  <p className="text-xs text-[#A3A3A3] leading-relaxed font-light">
                    Check contrast, harmony, emotional psychology, and receive a refined palette.
                  </p>
                </div>

                <div className="p-5 bg-[#121212] border border-white/5 rounded-none space-y-3">
                  <div className="w-8 h-8 rounded-none bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-[#C9A227]">
                    <Grid className="w-4 h-4" />
                  </div>
                  <h4 className="font-display font-light text-[#F5F5F5] tracking-wide">Layout Improvement</h4>
                  <p className="text-xs text-[#A3A3A3] leading-relaxed font-light">
                    Pinpoint positioning tweaks, element sizes, alignments, and optimal negative space.
                  </p>
                </div>

                <div className="p-5 bg-[#121212] border border-white/5 rounded-none space-y-3">
                  <div className="w-8 h-8 rounded-none bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-[#C9A227]">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h4 className="font-display font-light text-[#F5F5F5] tracking-wide">Background Suggestions</h4>
                  <p className="text-xs text-[#A3A3A3] leading-relaxed font-light">
                    Inspect background texture, depth of field, distractions, and gradient overrides.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP B: PREVIEW & STYLE SELECTION (Wizard Setup) */}
          {uploadedImage && !loading && !report && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-4"
            >
              {/* Left Column: Image Preview Card */}
              <div className="lg:col-span-5 flex flex-col space-y-4">
                <div className="space-y-1">
                  <span className="font-mono text-[9px] tracking-[0.3em] text-[#C9A227] uppercase">
                    Step 1 — Target Asset
                  </span>
                  <h3 className="font-display text-lg font-light tracking-wide text-[#F5F5F5]">
                    Selected Design Preview
                  </h3>
                </div>

                {/* Main image container */}
                <div className="bg-[#121212] border border-white/5 rounded-none p-4 flex flex-col items-center justify-center min-h-[300px] max-h-[420px] overflow-hidden relative group">
                  <img 
                    src={uploadedImage} 
                    alt="Target Design" 
                    className="max-h-[340px] max-w-full object-contain rounded-none border border-white/10" 
                  />
                  
                  {/* Overlay replace button */}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
                    <button
                      onClick={handleResetWorkspace}
                      className="px-4 py-2 bg-red-950/40 text-red-400 border border-red-900/40 hover:bg-red-950/80 rounded-none font-mono text-[10px] tracking-wider uppercase transition-all cursor-pointer"
                    >
                      Clear Selection
                    </button>
                    <label 
                      htmlFor="replace-upload-file"
                      className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#252525] border border-white/10 rounded-none font-mono text-[10px] tracking-wider uppercase text-[#F5F5F5] cursor-pointer transition-all"
                    >
                      Replace Image
                      <input 
                        type="file" 
                        id="replace-upload-file"
                        onChange={handleFileChange}
                        accept="image/png, image/jpeg, image/webp"
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column: Style Selection Component */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
                <StyleSelector 
                  selectedStyle={selectedStyle}
                  onChange={(style) => setSelectedStyle(style)}
                />

                {/* Analyze Trigger Panel */}
                <div className="pt-6 border-t border-white/10 flex items-center justify-end space-x-4">
                  <button
                    onClick={handleResetWorkspace}
                    className="font-mono text-[10px] tracking-widest text-[#666666] hover:text-[#A3A3A3] uppercase transition-colors"
                  >
                    Cancel Analysis
                  </button>
                  <button
                    onClick={handleAnalyze}
                    className="flex items-center space-x-3 py-3 px-8 bg-[#C9A227] text-[#050505] hover:bg-[#E5B92D] rounded-none font-display font-light text-xs tracking-[0.2em] uppercase transition-all duration-300 cursor-pointer shadow-[0_4px_20px_rgba(201,162,39,0.2)] hover:shadow-[0_4px_25px_rgba(201,162,39,0.35)]"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Analyze Design</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP C: AI LOADING SEQUENCE */}
          {loading && (
            <motion.div
              key="loading-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12"
            >
              <AnalysisLoader styleSelected={selectedStyle} />
            </motion.div>
          )}

          {/* STEP D: RESULTS STUDIO (Main Display & Assistant Chat) */}
          {report && !loading && (
            <motion.div
              id="results-studio"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="space-y-8 pb-12"
            >
              {/* Back to workspace header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleResetWorkspace}
                    className="p-2 bg-[#121212] border border-white/10 hover:border-[#C9A227] rounded-none text-[#A3A3A3] hover:text-white transition-colors cursor-pointer"
                    title="Evaluate New Design"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <div className="flex items-center space-x-2.5">
                      <span className="font-mono text-[9px] tracking-[0.3em] text-[#C9A227] uppercase">
                        RESULTS STUDIO
                      </span>
                      <span className="font-mono text-[8px] bg-[#C9A227]/10 text-[#C9A227] border border-[#C9A227]/20 px-2 rounded-none uppercase tracking-widest">
                        {report.styleSelected}
                      </span>
                    </div>
                    <h2 className="font-display text-xl font-light text-[#F5F5F5] tracking-wide mt-1">
                      Creative Direction Audit Report
                    </h2>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleDownloadPDF}
                    disabled={isDownloadingPdf}
                    className="flex items-center space-x-2 font-mono text-[9px] tracking-widest text-[#A3A3A3] hover:text-[#C9A227] py-2 px-4 rounded-none border border-white/10 hover:border-[#C9A227]/30 bg-[#121212] uppercase transition-all duration-300 cursor-pointer disabled:opacity-50"
                  >
                    <Download className={`w-3 h-3 text-[#C9A227] ${isDownloadingPdf ? 'animate-bounce' : ''}`} />
                    <span>{isDownloadingPdf ? 'Compiling PDF...' : 'Download PDF'}</span>
                  </button>
                  <button
                    onClick={handleAnalyze}
                    className="flex items-center space-x-2 font-mono text-[9px] tracking-widest text-[#A3A3A3] hover:text-[#C9A227] py-2 px-4 rounded-none border border-white/10 hover:border-[#C9A227]/30 bg-[#121212] uppercase transition-all duration-300 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Re-evaluate</span>
                  </button>
                  <button
                    onClick={handleResetWorkspace}
                    className="flex items-center space-x-2 font-mono text-[9px] tracking-widest text-[#050505] bg-[#C9A227] hover:bg-[#E5B92D] py-2 px-4 rounded-none uppercase transition-all duration-300 cursor-pointer"
                  >
                    <span>Analyze New</span>
                  </button>
                </div>
              </div>

              {/* Split Screen Workspace: Sticky Image Inspector left, and interactive tabbed workbook right */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                {/* LEFT COLUMN: Zoomable, Pannable, and Eyedropper Inspector (Sticky) */}
                <div className="lg:col-span-5 lg:sticky lg:top-24 h-[550px] lg:h-[calc(100vh-220px)] min-h-[450px]">
                  <DesignInspector 
                    imageUrl={uploadedImage!} 
                    onColorPicked={handleColorPicked} 
                    elements={report.elements || []}
                    activeElementId={activeElementId}
                    onSelectElement={setActiveElementId}
                    isInspectModeActive={isInspectModeActive}
                    setIsInspectModeActive={setIsInspectModeActive}
                  />
                </div>

                {/* RIGHT COLUMN: Professional Tabbed Audit Workbook */}
                <div className="lg:col-span-7 flex flex-col h-[550px] lg:h-[calc(100vh-220px)] min-h-[450px]">
                  <AuraAnalysisWorkspace 
                    report={report}
                    activePickedColor={activePickedColor}
                    recentColors={recentColors}
                    onSelectColor={setActivePickedColor}
                    onClearRecentColors={handleClearRecentColors}
                    onLaunchSandbox={() => setIsFontPairingOpen(true)}
                    onDownloadPDF={handleDownloadPDF}
                    isDownloadingPdf={isDownloadingPdf}
                    activeElementId={activeElementId}
                    onSelectElement={setActiveElementId}
                    isInspectModeActive={isInspectModeActive}
                    setIsInspectModeActive={setIsInspectModeActive}
                  />
                </div>
              </div>

              {/* REMAINING OUTDATED CODE CONTAINER - HIDDEN */}
              <div className="hidden">
              {/* Beautiful Before & After Comparative Section */}
              <BeforeAfterViewer uploadedImage={uploadedImage!} report={report} />

              {/* REPORT STUDIO WORKSPACE (Grid 12 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* LEFT BLOCK (5 Cols): Creative Director Statement & Chat Assistant */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* Creative Director Overall Verdict Card */}
                  <div className="bg-[#121212] border border-white/5 rounded-none p-5 relative overflow-hidden space-y-3 shadow-xl">
                    {/* Golden Broken Frame corner */}
                    <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none">
                      <div className="absolute top-2 right-2 border-t border-r border-[#C9A227]/30 w-2 h-2"></div>
                    </div>

                    <div className="flex items-center space-x-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C9A227]"></div>
                      <span className="font-mono text-[8px] tracking-[0.4em] text-[#C9A227] uppercase">
                        Creative Director Statement
                      </span>
                    </div>

                    <h4 className="text-sm font-display font-light text-[#F5F5F5] tracking-wide italic leading-relaxed">
                      "{report.overallVerdict}"
                    </h4>

                    <div className="pt-2 flex justify-between items-center text-[8px] font-mono text-[#666666] tracking-widest uppercase">
                      <span>AUDITOR INDENT — SECURE</span>
                      <span>AURA AI CRITIQUE</span>
                    </div>
                  </div>

                  {/* Dynamic assistant Chat Sidebar nested directly below */}
                  <DesignChat report={report} />
                </div>


                {/* RIGHT BLOCK (7 Cols): Segmented Premium Cards (Typography, Color, Layout, Background) */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* OVERALL PORTFOLIO AUDIT SCOREBOARD */}
                  <div className="bg-[#121212] border border-[#C9A227]/30 rounded-none p-6 relative overflow-hidden space-y-6 shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-20">
                      <div className="absolute -top-10 -right-10 w-40 h-40 border border-[#C9A227] rounded-full"></div>
                      <div className="absolute -top-14 -right-14 w-40 h-40 border border-dashed border-[#C9A227] rounded-full animate-spin" style={{ animationDuration: '60s' }}></div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div className="flex items-center space-x-5">
                        {/* Circular Score Dial */}
                        <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center border-2 border-white/5 bg-[#171717] rounded-full">
                          <svg className="absolute w-full h-full -rotate-90">
                            <circle
                              cx="40"
                              cy="40"
                              r="36"
                              className="stroke-white/5"
                              strokeWidth="3"
                              fill="transparent"
                            />
                            <circle
                              cx="40"
                              cy="40"
                              r="36"
                              className="stroke-[#C9A227] transition-all duration-1000 ease-out"
                              strokeWidth="4"
                              fill="transparent"
                              strokeDasharray={`${2 * Math.PI * 36}`}
                              strokeDashoffset={`${2 * Math.PI * 36 * (1 - (report.overallScore || 0) / 100)}`}
                              strokeLinecap="square"
                            />
                          </svg>
                          <div className="text-center z-10">
                            <span className="font-display text-2xl font-light text-[#F5F5F5]">
                              {report.overallScore || 0}
                            </span>
                            <span className="text-[9px] font-mono text-[#666666] block -mt-1">/100</span>
                          </div>
                        </div>

                        <div>
                          <span className="font-mono text-[9px] tracking-[0.35em] text-[#C9A227] uppercase block">
                            Portfolio Audit Grade
                          </span>
                          <h3 className="font-display text-lg font-light text-white tracking-wide mt-1">
                            {(report.overallScore || 0) >= 90 ? 'PROFESSIONAL LEVEL' :
                             (report.overallScore || 0) >= 70 ? 'GOOD EXECUTION' :
                             (report.overallScore || 0) >= 50 ? 'AVERAGE EXECUTION' :
                             (report.overallScore || 0) >= 30 ? 'NEEDS SERIOUS REVISION' : 'CRITICAL DEFICIENCIES'}
                          </h3>
                          <p className="font-mono text-[8px] text-[#888888] tracking-widest uppercase mt-0.5 flex items-center gap-1.5">
                            <AlertCircle className="w-3 h-3 text-[#C9A227]" />
                            <span>Clinical Judge Mode: Unbiased Assessment</span>
                          </p>
                        </div>
                      </div>

                      {/* Summary breakdown bars */}
                      <div className="flex-1 max-w-xs space-y-2.5">
                        {/* Typography */}
                        <div className="space-y-1">
                          <div className="flex justify-between font-mono text-[8px] tracking-wider text-[#A3A3A3] uppercase">
                            <span>Typography (25%)</span>
                            <span className="text-[#C9A227] font-semibold">{report.typography.score}/100</span>
                          </div>
                          <div className="h-1 bg-white/5 rounded-none overflow-hidden">
                            <div className="h-full bg-[#C9A227]" style={{ width: `${report.typography.score}%` }}></div>
                          </div>
                        </div>

                        {/* Colors */}
                        <div className="space-y-1">
                          <div className="flex justify-between font-mono text-[8px] tracking-wider text-[#A3A3A3] uppercase">
                            <span>Colors (25%)</span>
                            <span className="text-[#C9A227] font-semibold">{report.color.score}/100</span>
                          </div>
                          <div className="h-1 bg-white/5 rounded-none overflow-hidden">
                            <div className="h-full bg-[#C9A227]" style={{ width: `${report.color.score}%` }}></div>
                          </div>
                        </div>

                        {/* Size & Position */}
                        <div className="space-y-1">
                          <div className="flex justify-between font-mono text-[8px] tracking-wider text-[#A3A3A3] uppercase">
                            <span>Size & Positioning (30%)</span>
                            <span className="text-[#C9A227] font-semibold">{report.sizePositioning.score}/100</span>
                          </div>
                          <div className="h-1 bg-white/5 rounded-none overflow-hidden">
                            <div className="h-full bg-[#C9A227]" style={{ width: `${report.sizePositioning.score}%` }}></div>
                          </div>
                        </div>

                        {/* Background */}
                        <div className="space-y-1">
                          <div className="flex justify-between font-mono text-[8px] tracking-wider text-[#A3A3A3] uppercase">
                            <span>Background (20%)</span>
                            <span className="text-[#C9A227] font-semibold">{report.background.score}/100</span>
                          </div>
                          <div className="h-1 bg-white/5 rounded-none overflow-hidden">
                            <div className="h-full bg-[#C9A227]" style={{ width: `${report.background.score}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* A. TYPOGRAPHY ANALYSIS CARD */}
                  <div className="bg-[#121212] border border-white/5 rounded-none p-6 relative overflow-hidden space-y-6 shadow-lg group">
                    <div className="absolute top-4 right-4 text-[#C9A227]/20 group-hover:text-[#C9A227]/40 transition-colors">
                      <Type className="w-5 h-5" />
                    </div>

                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[9px] tracking-widest text-[#C9A227] uppercase bg-[#C9A227]/10 px-2 py-0.5 rounded-none">
                          01 / TYPOGRAPHY AUDIT
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 font-mono text-xs">
                        <span className="text-[#666666]">QUALITY SCORE:</span>
                        <span className="text-[#C9A227] font-bold">{report.typography.score}/100</span>
                      </div>
                    </div>

                    {/* Phase 1: ANALYZE */}
                    <div className="space-y-2">
                      <span className="font-mono text-[8px] text-[#C9A227] tracking-widest uppercase block">
                        Phase 1 — Analyze: Detected Hierarchy
                      </span>
                      <div className="p-4 bg-[#181817] border border-white/5 text-sm text-[#E5E5E5] font-light leading-relaxed">
                        {report.typography.observation}
                      </div>
                    </div>

                    {/* Phase 2: SCORE BREAKDOWNS */}
                    <div className="space-y-4 pt-1">
                      <span className="font-mono text-[8px] text-[#C9A227] tracking-widest uppercase block">
                        Phase 2 — Score: Detailed Rubric Breakdowns
                      </span>
                      <div className="grid grid-cols-1 gap-3.5">
                        {Object.entries(report.typography.breakdown || {}).map(([metric, subScore]) => {
                          const explanation = report.typography.breakdownExplanations?.[metric as keyof typeof report.typography.breakdownExplanations] || '';
                          const displayName = metric === 'fontChoice' ? 'Font Choice' :
                                              metric === 'fontPairing' ? 'Font Pairing' :
                                              metric === 'readability' ? 'Readability' :
                                              metric === 'hierarchy' ? 'Hierarchy' :
                                              metric === 'spacing' ? 'Spacing' : metric;
                          return (
                            <div key={metric} className="space-y-1 bg-[#161616] p-3 border border-white/5">
                              <div className="flex justify-between font-mono text-[9px] uppercase tracking-wider">
                                <span className="text-white font-medium">{displayName}</span>
                                <span className="text-[#C9A227]">{subScore}/100</span>
                              </div>
                              <div className="h-1 bg-white/5 rounded-none overflow-hidden">
                                <div className="h-full bg-[#C9A227]" style={{ width: `${subScore}%` }}></div>
                              </div>
                              <p className="text-[10px] text-[#A3A3A3] font-light leading-relaxed pt-0.5">
                                {explanation}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Phase 3: EXPLAIN */}
                    <div className="space-y-3.5 pt-1">
                      <span className="font-mono text-[8px] text-[#C9A227] tracking-widest uppercase block">
                        Phase 3 — Explain: Critical Diagnostics
                      </span>
                      
                      {report.typography.problem && (
                        <div className="space-y-1">
                          <span className="font-mono text-[8px] text-[#666666] tracking-widest uppercase block">Primary Impediment</span>
                          <p className="text-sm text-white font-light flex items-start gap-2">
                            <span className="text-red-500 mt-1 block flex-shrink-0 w-1.5 h-1.5 rounded-full"></span>
                            <span>{report.typography.problem}</span>
                          </p>
                        </div>
                      )}

                      {report.typography.problems && report.typography.problems.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="font-mono text-[8px] text-[#666666] tracking-widest uppercase block">Minor Impediments</span>
                          <ul className="space-y-1">
                            {report.typography.problems.map((prob, i) => (
                              <li key={i} className="text-xs text-[#A3A3A3] font-light flex items-start gap-2">
                                <span className="text-[#C9A227] mt-1.5 block flex-shrink-0 w-1 h-1 rounded-full"></span>
                                <span>{prob}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="space-y-1">
                        <span className="font-mono text-[8px] text-[#666666] tracking-widest uppercase block">Cognitive & Visual Impact</span>
                        <p className="text-xs text-[#A3A3A3] leading-relaxed font-light">
                          {report.typography.reason || report.typography.whyItMatters}
                        </p>
                      </div>
                    </div>

                    {/* Phase 4: IMPROVE */}
                    <div className="space-y-4 pt-1">
                      <span className="font-mono text-[8px] text-[#C9A227] tracking-widest uppercase block">
                        Phase 4 — Improve: Action Plan & Strategy
                      </span>

                      {report.typography.solution && (
                        <div className="space-y-1">
                          <span className="font-mono text-[8px] text-[#666666] tracking-widest uppercase block">AI Strategic Solution</span>
                          <p className="text-xs text-white leading-relaxed font-light">
                            {report.typography.solution}
                          </p>
                        </div>
                      )}

                      <div className="space-y-1">
                        <span className="font-mono text-[8px] text-[#666666] tracking-widest uppercase block">Visual Recommendation Strategy</span>
                        <p className="text-xs text-[#A3A3A3] leading-relaxed font-light">
                          {report.typography.suggestedImprovements}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <span className="font-mono text-[8px] text-[#666666] tracking-widest uppercase block">Recommended Font Direction</span>
                        <div className="flex flex-wrap gap-2 pt-0.5 items-center justify-between">
                          <div className="flex flex-wrap gap-2">
                            {report.typography.recommendedFonts.map((font, i) => (
                              <span key={i} className="font-mono text-[10px] bg-[#1A1A1A] text-[#F5F5F5] border border-white/10 px-2.5 py-1 rounded-none">
                                {font}
                              </span>
                            ))}
                          </div>
                          
                          <button
                            onClick={() => setIsFontPairingOpen(true)}
                            className="font-mono text-[9px] tracking-wider uppercase bg-[#C9A227] hover:bg-[#B8911C] text-black px-3 py-1.5 rounded-none font-semibold flex items-center space-x-1.5 transition-all hover:scale-102 cursor-pointer mt-1 sm:mt-0"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Launch Live Sandbox</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-3 bg-[#1A1A1A] border border-white/10 rounded-none space-y-1.5">
                        <span className="font-mono text-[8px] text-[#C9A227] tracking-widest uppercase block">Exact Settings Changes Required</span>
                        <div className="space-y-1">
                          {report.typography.exactChanges.map((change, i) => (
                            <p key={i} className="text-xs text-[#A3A3A3] font-light flex items-center space-x-2">
                              <span className="text-[#C9A227] text-[10px]">•</span>
                              <span>{change}</span>
                            </p>
                          ))}
                        </div>
                      </div>

                      {/* OCR TEXT EXTRACTION & INDIVIDUAL ELEMENT-LEVEL AUDIT */}
                      {report.typography.individualTexts && report.typography.individualTexts.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-white/10">
                          <div className="space-y-1">
                            <span className="font-mono text-[8px] text-[#C9A227] tracking-widest uppercase block">
                              Phase 1.5 — OCR Text Extraction & Individual Element-Level Audit
                            </span>
                            <p className="text-xs text-[#888888] font-light leading-relaxed">
                              Aura AI extracted every separate text element from your design to audit its individual visual weight, readability, alignment, and style pairings.
                            </p>
                          </div>

                          <div className="space-y-4">
                            {report.typography.individualTexts.map((it, idx) => (
                              <div key={idx} className="bg-[#161616] border border-white/5 p-4 space-y-4 relative overflow-hidden">
                                <div className="absolute top-0 right-0 font-mono text-[8px] text-[#666666] bg-white/5 px-2.5 py-1">
                                  TEXT ITEM #{idx + 1}
                                </div>

                                {/* Text & Role Header */}
                                <div className="space-y-2 pt-2 sm:pt-0">
                                  <div className="inline-block px-3 py-1.5 bg-white/5 border-l-2 border-[#C9A227] font-display text-sm text-white tracking-wide italic select-all">
                                    "{it.text}"
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[9px] uppercase tracking-wider text-[#A3A3A3]">
                                    <span className="text-[#C9A227] font-medium">{it.role}</span>
                                    <span className="text-white/20">|</span>
                                    <span>{it.category}</span>
                                    <span className="text-white/20">|</span>
                                    <span>{it.weight} ({it.size})</span>
                                  </div>
                                </div>

                                {/* Current Status & Issue */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                  <div className="p-3 bg-[#1B1212]/40 border border-red-950/40 space-y-1.5 flex flex-col justify-between">
                                    <div>
                                      <span className="font-mono text-[8px] text-red-400 tracking-widest uppercase block mb-1">
                                        Detected Impediment
                                      </span>
                                      <p className="text-xs text-[#D19A9A] font-light leading-relaxed">
                                        {it.issue}
                                      </p>
                                    </div>
                                    <div className="font-mono text-[8px] text-[#888888] uppercase mt-2 pt-1 border-t border-white/5">
                                      Readability: <span className="text-red-400 font-semibold">{it.readability}</span>
                                    </div>
                                  </div>

                                  {/* Aura Calibration Recommendation */}
                                  <div className="p-3 bg-[#1C1A14] border border-[#C9A227]/10 space-y-2">
                                    <span className="font-mono text-[8px] text-[#C9A227] tracking-widest uppercase block">
                                      Aura Calibration Strategy
                                    </span>
                                    <div className="space-y-1 text-xs">
                                      <div className="flex justify-between border-b border-white/5 pb-0.5">
                                        <span className="text-[#888888]">Google Font:</span>
                                        <span className="text-white font-medium">{it.recommendedFont}</span>
                                      </div>
                                      <div className="flex justify-between border-b border-white/5 pb-0.5">
                                        <span className="text-[#888888]">Styling:</span>
                                        <span className="text-[#F5F5F5] font-light">{it.recommendedStyle}</span>
                                      </div>
                                      <div className="flex justify-between border-b border-white/5 pb-0.5">
                                        <span className="text-[#888888]">Size Tuner:</span>
                                        <span className="text-[#C9A227] font-mono text-[11px]">{it.sizeAdjustment}</span>
                                      </div>
                                      <div className="flex justify-between border-b border-white/5 pb-0.5">
                                        <span className="text-[#888888]">Tracking Tuner:</span>
                                        <span className="text-[#C9A227] font-mono text-[11px]">{it.spacingAdjustment}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-[#888888]">Position Shift:</span>
                                        <span className="text-[#C9A227] font-mono text-[11px]">{it.positionAdjustment}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Justification */}
                                <div className="p-3 bg-white/[0.02] border border-white/5 text-xs text-[#A3A3A3] font-light leading-relaxed">
                                  <span className="font-mono text-[8px] text-[#888888] tracking-widest uppercase block mb-1">
                                    Cognitive & Compositional Reasoning
                                  </span>
                                  {it.reason}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>


                  {/* B. COLOR SYSTEM CARD */}
                  <div className="bg-[#121212] border border-white/5 rounded-none p-6 relative overflow-hidden space-y-6 shadow-lg group">
                    <div className="absolute top-4 right-4 text-[#C9A227]/20 group-hover:text-[#C9A227]/40 transition-colors">
                      <Palette className="w-5 h-5" />
                    </div>

                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[9px] tracking-widest text-[#C9A227] uppercase bg-[#C9A227]/10 px-2 py-0.5 rounded-none">
                          02 / COLOR THEORY & MOOD
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 font-mono text-xs">
                        <span className="text-[#666666]">QUALITY SCORE:</span>
                        <span className="text-[#C9A227] font-bold">{report.color.score}/100</span>
                      </div>
                    </div>

                    {/* Phase 1: ANALYZE */}
                    <div className="space-y-4">
                      <span className="font-mono text-[8px] text-[#C9A227] tracking-widest uppercase block">
                        Phase 1 — Analyze: Detected Colors & Swatches
                      </span>
                      <div className="p-4 bg-[#181817] border border-white/5 text-sm text-[#E5E5E5] font-light leading-relaxed">
                        {report.color.observation}
                      </div>

                      {/* Display Detected Color Palette Side-by-Side with Recommended Color Palette */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Original Palette Detected */}
                        {report.color.currentPalette && report.color.currentPalette.length > 0 && (
                          <div className="space-y-2 bg-[#161616] p-3 border border-white/5">
                            <span className="font-mono text-[8px] text-[#666666] tracking-widest uppercase block">Original Palette Detected</span>
                            <div className="flex flex-col gap-1.5">
                              {report.color.currentPalette.map((col, idx) => (
                                <div key={idx} className="flex items-center space-x-2">
                                  <div className="w-5 h-5 border border-white/10 rounded-none flex-shrink-0" style={{ backgroundColor: col.hex }} />
                                  <div className="min-w-0 text-[10px] font-mono">
                                    <span className="text-[#F5F5F5] uppercase font-semibold">{col.hex}</span>
                                    <span className="text-[#666666] ml-2 font-light italic truncate">{col.name}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommended Palette */}
                        <div className="space-y-2 bg-[#161616] p-3 border border-[#C9A227]/20">
                          <span className="font-mono text-[8px] text-[#C9A227] tracking-widest uppercase block">Recommended Tones</span>
                          <div className="flex flex-col gap-1.5">
                            {report.color.improvedPalette.slice(0, 4).map((col, idx) => (
                              <div key={idx} className="flex items-center space-x-2">
                                <div className="w-5 h-5 border border-white/10 rounded-none flex-shrink-0" style={{ backgroundColor: col.hex }} />
                                <div className="min-w-0 text-[10px] font-mono">
                                  <span className="text-white uppercase font-semibold">{col.hex}</span>
                                  <span className="text-[#888888] ml-2 font-light truncate">{col.name}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Phase 2: SCORE BREAKDOWNS */}
                    <div className="space-y-4 pt-1">
                      <span className="font-mono text-[8px] text-[#C9A227] tracking-widest uppercase block">
                        Phase 2 — Score: Detailed Rubric Breakdowns
                      </span>
                      <div className="grid grid-cols-1 gap-3.5">
                        {Object.entries(report.color.breakdown || {}).map(([metric, subScore]) => {
                          const explanation = report.color.breakdownExplanations?.[metric as keyof typeof report.color.breakdownExplanations] || '';
                          const displayName = metric === 'harmony' ? 'Harmony' :
                                              metric === 'contrast' ? 'Contrast' :
                                              metric === 'readability' ? 'Readability' :
                                              metric === 'moodMatch' ? 'Mood Match' : metric;
                          return (
                            <div key={metric} className="space-y-1 bg-[#161616] p-3 border border-white/5">
                              <div className="flex justify-between font-mono text-[9px] uppercase tracking-wider">
                                <span className="text-white font-medium">{displayName}</span>
                                <span className="text-[#C9A227]">{subScore}/100</span>
                              </div>
                              <div className="h-1 bg-white/5 rounded-none overflow-hidden">
                                <div className="h-full bg-[#C9A227]" style={{ width: `${subScore}%` }}></div>
                              </div>
                              <p className="text-[10px] text-[#A3A3A3] font-light leading-relaxed pt-0.5">
                                {explanation}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Phase 3: EXPLAIN */}
                    <div className="space-y-3.5 pt-1">
                      <span className="font-mono text-[8px] text-[#C9A227] tracking-widest uppercase block">
                        Phase 3 — Explain: Critical Diagnostics
                      </span>

                      {report.color.problem && (
                        <div className="space-y-1">
                          <span className="font-mono text-[8px] text-[#666666] tracking-widest uppercase block">Primary Impediment</span>
                          <p className="text-sm text-white font-light flex items-start gap-2">
                            <span className="text-red-500 mt-1 block flex-shrink-0 w-1.5 h-1.5 rounded-full"></span>
                            <span>{report.color.problem}</span>
                          </p>
                        </div>
                      )}

                      <div className="space-y-1">
                        <span className="font-mono text-[8px] text-[#666666] tracking-widest uppercase block">Chromatic Contrast Analysis</span>
                        <p className="text-xs text-[#A3A3A3] leading-relaxed font-light">
                          {report.color.harmonyAndContrast}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="font-mono text-[8px] text-[#666666] tracking-widest uppercase block">Cognitive & Mood Impact</span>
                        <p className="text-xs text-[#A3A3A3] leading-relaxed font-light">
                          {report.color.reason || "Dull, non-purposeful color usage risks confusing visual priorities and depressing user action."}
                        </p>
                      </div>
                    </div>

                    {/* Phase 4: IMPROVE */}
                    <div className="space-y-4 pt-1">
                      <span className="font-mono text-[8px] text-[#C9A227] tracking-widest uppercase block">
                        Phase 4 — Improve: Swatches & Chromatic Strategy
                      </span>

                      {report.color.solution && (
                        <div className="space-y-1">
                          <span className="font-mono text-[8px] text-[#666666] tracking-widest uppercase block">AI Strategic Solution</span>
                          <p className="text-xs text-white leading-relaxed font-light">
                            {report.color.solution}
                          </p>
                        </div>
                      )}

                      {/* Suggested Improved Color Swatches Grid */}
                      <div className="space-y-2">
                        <span className="font-mono text-[8px] text-[#666666] tracking-widest uppercase block">Suggested Improved Palette (Click to Copy HEX)</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          {report.color.improvedPalette.map((color, i) => (
                            <button
                              key={i}
                              onClick={() => copyHex(color.hex)}
                              className="bg-[#1A1A1A] border border-white/10 hover:border-[#C9A227]/50 rounded-none p-3 text-left flex items-center space-x-3 transition-all duration-300 relative group/chip cursor-pointer"
                            >
                              <div 
                                className="w-8 h-8 rounded-none border border-white/10 flex-shrink-0 relative overflow-hidden"
                                style={{ backgroundColor: color.hex }}
                              />
                              <div className="flex-1 min-w-0">
                                <span className="font-mono text-[9px] text-[#666666] uppercase block">
                                  {color.name}
                                </span>
                                <span className="font-mono text-xs text-[#F5F5F5] font-medium uppercase tracking-wider block">
                                  {color.hex}
                                </span>
                                <span className="text-[10px] text-[#A3A3A3] font-light truncate block leading-tight mt-0.5">
                                  {color.usage}
                                </span>
                              </div>
                              <div className="absolute top-2 right-2 font-mono text-[8px] text-[#C9A227] opacity-0 group-hover/chip:opacity-100 transition-opacity">
                                {copiedHex === color.hex ? 'COPIED' : 'COPY'}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="font-mono text-[8px] text-[#666666] tracking-widest uppercase block">Strategic Integration Reasoning</span>
                        <p className="text-xs text-[#A3A3A3] leading-relaxed font-light">
                          {report.color.whyTheseColorsWork}
                        </p>
                      </div>
                    </div>
                  </div>


                  {/* C. SIZE AND POSITIONING ANALYSIS CARD */}
                  <div className="bg-[#121212] border border-white/5 rounded-none p-6 relative overflow-hidden space-y-6 shadow-lg group">
                    <div className="absolute top-4 right-4 text-[#C9A227]/20 group-hover:text-[#C9A227]/40 transition-colors">
                      <Grid className="w-5 h-5" />
                    </div>

                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[9px] tracking-widest text-[#C9A227] uppercase bg-[#C9A227]/10 px-2 py-0.5 rounded-none">
                          03 / SIZE & POSITIONING AUDIT
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 font-mono text-xs">
                        <span className="text-[#666666]">QUALITY SCORE:</span>
                        <span className="text-[#C9A227] font-bold">{report.sizePositioning.score}/100</span>
                      </div>
                    </div>

                    {/* Phase 1: ANALYZE */}
                    <div className="space-y-2">
                      <span className="font-mono text-[8px] text-[#C9A227] tracking-widest uppercase block">
                        Phase 1 — Analyze: Detected Layout Structure
                      </span>
                      <div className="p-4 bg-[#181817] border border-white/5 text-sm text-[#E5E5E5] font-light leading-relaxed">
                        {report.sizePositioning.observation}
                      </div>
                    </div>

                    {/* Phase 2: SCORE BREAKDOWNS */}
                    <div className="space-y-4 pt-1">
                      <span className="font-mono text-[8px] text-[#C9A227] tracking-widest uppercase block">
                        Phase 2 — Score: Detailed Rubric Breakdowns
                      </span>
                      <div className="grid grid-cols-1 gap-3.5">
                        {Object.entries(report.sizePositioning.breakdown || {}).map(([metric, subScore]) => {
                          const explanation = report.sizePositioning.breakdownExplanations?.[metric as keyof typeof report.sizePositioning.breakdownExplanations] || '';
                          const displayName = metric === 'alignment' ? 'Alignment' :
                                              metric === 'spacing' ? 'Spacing' :
                                              metric === 'visualHierarchy' ? 'Visual Hierarchy' :
                                              metric === 'balance' ? 'Visual Balance' : metric;
                          return (
                            <div key={metric} className="space-y-1 bg-[#161616] p-3 border border-white/5">
                              <div className="flex justify-between font-mono text-[9px] uppercase tracking-wider">
                                <span className="text-white font-medium">{displayName}</span>
                                <span className="text-[#C9A227]">{subScore}/100</span>
                              </div>
                              <div className="h-1 bg-white/5 rounded-none overflow-hidden">
                                <div className="h-full bg-[#C9A227]" style={{ width: `${subScore}%` }}></div>
                              </div>
                              <p className="text-[10px] text-[#A3A3A3] font-light leading-relaxed pt-0.5">
                                {explanation}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Phase 3: EXPLAIN */}
                    <div className="space-y-3.5 pt-1">
                      <span className="font-mono text-[8px] text-[#C9A227] tracking-widest uppercase block">
                        Phase 3 — Explain: Critical Diagnostics
                      </span>

                      {report.sizePositioning.problem && (
                        <div className="space-y-1">
                          <span className="font-mono text-[8px] text-[#666666] tracking-widest uppercase block">Primary Impediment</span>
                          <p className="text-sm text-white font-light flex items-start gap-2">
                            <span className="text-red-500 mt-1 block flex-shrink-0 w-1.5 h-1.5 rounded-full"></span>
                            <span>{report.sizePositioning.problem}</span>
                          </p>
                        </div>
                      )}

                      <div className="space-y-1">
                        <span className="font-mono text-[8px] text-[#666666] tracking-widest uppercase block">Visual Hierarchy Impact</span>
                        <p className="text-xs text-[#A3A3A3] leading-relaxed font-light">
                          {report.sizePositioning.reason || "Disordered placement scatters user focus, reducing CTA retention and professional credibility."}
                        </p>
                      </div>
                    </div>

                    {/* Phase 4: IMPROVE */}
                    <div className="space-y-5 pt-1">
                      <span className="font-mono text-[8px] text-[#C9A227] tracking-widest uppercase block">
                        Phase 4 — Improve: Placement Adjustments & Scaling
                      </span>

                      {report.sizePositioning.solution && (
                        <div className="space-y-1">
                          <span className="font-mono text-[8px] text-[#666666] tracking-widest uppercase block">AI Strategic Solution</span>
                          <p className="text-xs text-white leading-relaxed font-light">
                            {report.sizePositioning.solution}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-[#1A1A1A] border border-white/10 rounded-none space-y-1.5">
                          <span className="font-mono text-[8px] text-[#C9A227] tracking-widest uppercase block">Reposition / Realign</span>
                          <div className="space-y-1">
                            {report.sizePositioning.whatShouldMove.map((item, i) => (
                              <p key={i} className="text-xs text-[#A3A3A3] leading-relaxed font-light">
                                • {item}
                              </p>
                            ))}
                          </div>
                        </div>

                        <div className="p-4 bg-[#1A1A1A] border border-white/10 rounded-none space-y-1.5">
                          <span className="font-mono text-[8px] text-[#C9A227] tracking-widest uppercase block">Scale Up (Emphasis)</span>
                          <div className="space-y-1">
                            {report.sizePositioning.whatShouldIncrease.map((item, i) => (
                              <p key={i} className="text-xs text-[#A3A3A3] leading-relaxed font-light">
                                • {item}
                              </p>
                            ))}
                          </div>
                        </div>

                        <div className="p-4 bg-[#1A1A1A] border border-white/10 rounded-none space-y-1.5">
                          <span className="font-mono text-[8px] text-[#C9A227] tracking-widest uppercase block">Scale Down (Reduce)</span>
                          <div className="space-y-1">
                            {report.sizePositioning.whatShouldDecrease.map((item, i) => (
                              <p key={i} className="text-xs text-[#A3A3A3] leading-relaxed font-light">
                                • {item}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="font-mono text-[8px] text-[#666666] tracking-widest uppercase block">Strategic Placement & Grid Alignments</span>
                        <ul className="space-y-1.5">
                          {report.sizePositioning.layoutImprovements.map((tip, i) => (
                            <li key={i} className="text-xs text-[#F5F5F5] font-light flex items-start space-x-2">
                              <span className="text-[#C9A227] mt-1.5 block w-1 h-1 rounded-full"></span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>


                  {/* D. BACKGROUND ANALYSIS CARD */}
                  <div className="bg-[#121212] border border-white/5 rounded-none p-6 relative overflow-hidden space-y-6 shadow-lg group">
                    <div className="absolute top-4 right-4 text-[#C9A227]/20 group-hover:text-[#C9A227]/40 transition-colors">
                      <Layers className="w-5 h-5" />
                    </div>

                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[9px] tracking-widest text-[#C9A227] uppercase bg-[#C9A227]/10 px-2 py-0.5 rounded-none">
                          04 / BACKGROUND ENVIRONMENT
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 font-mono text-xs">
                        <span className="text-[#666666]">QUALITY SCORE:</span>
                        <span className="text-[#C9A227] font-bold">{report.background.score}/100</span>
                      </div>
                    </div>

                    {/* Phase 1: ANALYZE */}
                    <div className="space-y-2">
                      <span className="font-mono text-[8px] text-[#C9A227] tracking-widest uppercase block">
                        Phase 1 — Analyze: Detected Background Settings
                      </span>
                      <div className="p-4 bg-[#181817] border border-white/5 text-sm text-[#E5E5E5] font-light leading-relaxed">
                        {report.background.observation}
                      </div>
                    </div>

                    {/* Phase 2: SCORE BREAKDOWNS */}
                    <div className="space-y-4 pt-1">
                      <span className="font-mono text-[8px] text-[#C9A227] tracking-widest uppercase block">
                        Phase 2 — Score: Detailed Rubric Breakdowns
                      </span>
                      <div className="grid grid-cols-1 gap-3.5">
                        {Object.entries(report.background.breakdown || {}).map(([metric, subScore]) => {
                          const explanation = report.background.breakdownExplanations?.[metric as keyof typeof report.background.breakdownExplanations] || '';
                          const displayName = metric === 'cleanliness' ? 'Cleanliness' :
                                              metric === 'compatibility' ? 'Compatibility' :
                                              metric === 'distractionControl' ? 'Distraction Control' :
                                              metric === 'depth' ? 'Depth / Dimension' : metric;
                          return (
                            <div key={metric} className="space-y-1 bg-[#161616] p-3 border border-white/5">
                              <div className="flex justify-between font-mono text-[9px] uppercase tracking-wider">
                                <span className="text-white font-medium">{displayName}</span>
                                <span className="text-[#C9A227]">{subScore}/100</span>
                              </div>
                              <div className="h-1 bg-white/5 rounded-none overflow-hidden">
                                <div className="h-full bg-[#C9A227]" style={{ width: `${subScore}%` }}></div>
                              </div>
                              <p className="text-[10px] text-[#A3A3A3] font-light leading-relaxed pt-0.5">
                                {explanation}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Phase 3: EXPLAIN */}
                    <div className="space-y-3.5 pt-1">
                      <span className="font-mono text-[8px] text-[#C9A227] tracking-widest uppercase block">
                        Phase 3 — Explain: Critical Diagnostics
                      </span>

                      {report.background.problem && (
                        <div className="space-y-1">
                          <span className="font-mono text-[8px] text-[#666666] tracking-widest uppercase block">Primary Impediment</span>
                          <p className="text-sm text-white font-light flex items-start gap-2">
                            <span className="text-red-500 mt-1 block flex-shrink-0 w-1.5 h-1.5 rounded-full"></span>
                            <span>{report.background.problem}</span>
                          </p>
                        </div>
                      )}

                      <div className="space-y-1">
                        <span className="font-mono text-[8px] text-[#666666] tracking-widest uppercase block">Compositional Depth & Distraction Impact</span>
                        <p className="text-xs text-[#A3A3A3] leading-relaxed font-light">
                          {report.background.reason || "Flat backdrops suppress layout depth, making front elements look pasted and amateur rather than cohesive."}
                        </p>
                      </div>
                    </div>

                    {/* Phase 4: IMPROVE */}
                    <div className="space-y-4 pt-1">
                      <span className="font-mono text-[8px] text-[#C9A227] tracking-widest uppercase block">
                        Phase 4 — Improve: Environmental Suggestions & Overrides
                      </span>

                      {report.background.solution && (
                        <div className="space-y-1">
                          <span className="font-mono text-[8px] text-[#666666] tracking-widest uppercase block">AI Strategic Solution</span>
                          <p className="text-xs text-white leading-relaxed font-light">
                            {report.background.solution}
                          </p>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <span className="font-mono text-[8px] text-[#666666] tracking-widest uppercase block">Background Directions</span>
                        <ul className="space-y-1">
                          {report.background.betterBackgroundIdeas.map((idea, i) => (
                            <li key={i} className="text-sm text-[#F5F5F5] font-light flex items-start space-x-2">
                              <span className="text-[#C9A227] mt-1.5 block w-1.5 h-1.5 border border-[#C9A227] rotate-45 flex-shrink-0"></span>
                              <span>{idea}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        <div className="space-y-1.5">
                          <span className="font-mono text-[8px] text-[#666666] tracking-widest uppercase block">Color Swatches</span>
                          <div className="flex flex-wrap gap-1.5">
                            {report.background.colors.map((bgc, i) => (
                              <span key={i} className="font-mono text-[9px] bg-[#1A1A1A] border border-white/10 text-[#A3A3A3] px-2 py-1 rounded-none">
                                {bgc}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <span className="font-mono text-[8px] text-[#666666] tracking-widest uppercase block">Recommended Gradients</span>
                          <div className="flex flex-wrap gap-1.5">
                            {report.background.gradients.map((grad, i) => (
                              <span key={i} className="font-mono text-[9px] bg-[#1A1A1A] border border-white/10 text-[#A3A3A3] px-2 py-1 rounded-none">
                                {grad}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        <div className="p-3.5 bg-[#1A1A1A] border border-white/10 rounded-none space-y-1">
                          <span className="font-mono text-[8px] text-[#C9A227] tracking-widest uppercase block">Depth-of-field / Blurs</span>
                          <p className="text-xs text-[#A3A3A3] font-light leading-relaxed">
                            {report.background.blurSuggestions}
                          </p>
                        </div>

                        <div className="p-3.5 bg-[#1A1A1A] border border-white/10 rounded-none space-y-1">
                          <span className="font-mono text-[8px] text-[#C9A227] tracking-widest uppercase block">Tactile Textures</span>
                          <p className="text-xs text-[#A3A3A3] font-light leading-relaxed">
                            {report.background.textureSuggestions}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
              </div> {/* Close remaining outdated hidden container */}
            </motion.div>
          )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Optional luxury credentials modal popup */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onLoginSuccess={handleLoginSuccess}
      />

      <AnimatePresence>
        {isFontPairingOpen && report && (
          <FontPairingPreview 
            report={report}
            onClose={() => setIsFontPairingOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="py-6 px-6 border-t border-white/10 text-center flex flex-col sm:flex-row items-center justify-between text-[#666666] font-mono text-[8px] tracking-[0.25em] uppercase">
        <div className="flex items-center space-x-2">
          <span>◇ AURA DESIGN LABS</span>
          <span>•</span>
          <span>ALL REVIEWS ARE PRIVATELY PERSISTED</span>
        </div>
        <div className="mt-2 sm:mt-0">
          <span>CREATIVE CRITIQUE ENGINE v1.2</span>
        </div>
      </footer>
    </div>
  );
}
