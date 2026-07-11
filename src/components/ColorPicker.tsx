import React, { useState, useEffect, useRef, MouseEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, Copy, Check, Eye, Trash2, Plus, Sparkles, X, LayoutGrid, 
  History, Palette, RefreshCw, FileCode, Code, CheckCircle, ChevronRight, FileText
} from 'lucide-react';
import { 
  rgbToHex, rgbToHsl, rgbToHsv, rgbToCmyk, getColorName, hexToRgb 
} from '../utils/colorUtils';

interface PickedColor {
  hex: string;
  rgb: string;
  hsl: string;
  hsv: string;
  cmyk: string;
  name: string;
  timestamp: string;
}

interface CustomPalette {
  id: string;
  name: string;
  colors: string[]; // hex strings
}

export default function ColorPicker() {
  const [image, setImage] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [activeColor, setActiveColor] = useState<PickedColor | null>(null);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [pickerError, setPickerError] = useState<string | null>(null);
  
  // Magnifying Loupe state
  const [loupePos, setLoupePos] = useState({ x: 0, y: 0, display: false });
  const [loupeColor, setLoupeColor] = useState('#000000');
  
  // History & Custom Palettes
  const [history, setHistory] = useState<PickedColor[]>([]);
  const [customPalettes, setCustomPalettes] = useState<CustomPalette[]>([]);
  const [activePaletteId, setActivePaletteId] = useState<string | null>(null);
  const [newPaletteName, setNewPaletteName] = useState('');
  
  // Export trigger
  const [exportFormat, setExportFormat] = useState<'css' | 'tailwind' | 'json' | 'csv' | null>(null);

  // Canvas ref for pixel extraction
  const imageRef = useRef<HTMLImageElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize data from LocalStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('aura_picker_history');
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)); } catch (e) { console.error(e); }
    }

    const savedPalettes = localStorage.getItem('aura_picker_palettes');
    if (savedPalettes) {
      try {
        const parsed = JSON.parse(savedPalettes);
        setCustomPalettes(parsed);
        if (parsed.length > 0) setActivePaletteId(parsed[0].id);
      } catch (e) { console.error(e); }
    } else {
      // Seed default custom palette
      const defaultPalette: CustomPalette = {
        id: 'palette-default',
        name: 'Aura Studio Collection 1',
        colors: ['#C9A227', '#121212', '#F5F5F5']
      };
      setCustomPalettes([defaultPalette]);
      setActivePaletteId(defaultPalette.id);
    }
  }, []);

  // Save history to storage
  const updateHistory = (newHistory: PickedColor[]) => {
    setHistory(newHistory);
    localStorage.setItem('aura_picker_history', JSON.stringify(newHistory));
  };

  // Save palettes to storage
  const updatePalettes = (newPalettes: CustomPalette[]) => {
    setCustomPalettes(newPalettes);
    localStorage.setItem('aura_picker_palettes', JSON.stringify(newPalettes));
  };

  // Process selected image file
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImage(event.target.result as string);
          setActiveColor(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Setup offscreen canvas once image loads
  const handleImageLoad = () => {
    if (!imageRef.current) return;
    const img = imageRef.current;
    
    setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0);
      offscreenCanvasRef.current = canvas;
    }
  };

  // Extract pixel color under cursor coordinates
  const extractPixelColor = (e: MouseEvent<HTMLDivElement>): { r: number; g: number; b: number } | null => {
    if (!offscreenCanvasRef.current || !imageRef.current) return null;
    
    const imgElement = imageRef.current;
    const rect = imgElement.getBoundingClientRect();
    
    // Relative position inside visible image bounds (0.0 to 1.0)
    const relativeX = (e.clientX - rect.left) / rect.width;
    const relativeY = (e.clientY - rect.top) / rect.height;
    
    // Map relative values to real natural canvas resolution
    const actualX = Math.floor(relativeX * imageSize.width);
    const actualY = Math.floor(relativeY * imageSize.height);
    
    const ctx = offscreenCanvasRef.current.getContext('2d');
    if (!ctx) return null;
    
    try {
      const pixel = ctx.getImageData(actualX, actualY, 1, 1).data;
      return { r: pixel[0], g: pixel[1], b: pixel[2] };
    } catch (err) {
      console.error("Canvas pixel extraction failed", err);
      return null;
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const pixel = extractPixelColor(e);
    if (pixel) {
      const hex = rgbToHex(pixel.r, pixel.g, pixel.b);
      setLoupeColor(hex);
      setLoupePos({ x, y, display: true });
    }
  };

  const handleMouseLeave = () => {
    setLoupePos(prev => ({ ...prev, display: false }));
  };

  const handleImageClick = (e: MouseEvent<HTMLDivElement>) => {
    const pixel = extractPixelColor(e);
    if (pixel) {
      const hex = rgbToHex(pixel.r, pixel.g, pixel.b);
      selectColor(pixel.r, pixel.g, pixel.b, hex);
    }
  };

  // Complete selection metadata mapping
  const selectColor = (r: number, g: number, b: number, hex: string) => {
    const hslVal = rgbToHsl(r, g, b);
    const hsvVal = rgbToHsv(r, g, b);
    const cmykVal = rgbToCmyk(r, g, b);
    const name = getColorName(r, g, b);
    
    const newColor: PickedColor = {
      hex,
      rgb: `rgb(${r}, ${g}, ${b})`,
      hsl: `hsl(${hslVal.h}, ${hslVal.s}%, ${hslVal.l}%)`,
      hsv: `hsv(${hsvVal.h}, ${hsvVal.s}%, ${hsvVal.v}%)`,
      cmyk: `cmyk(${cmykVal.c}%, ${cmykVal.m}%, ${cmykVal.y}%, ${cmykVal.k}%)`,
      name,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    
    setActiveColor(newColor);

    // Save to history (Keep last 20)
    const filteredHistory = history.filter(item => item.hex !== hex);
    const updatedHistory = [newColor, ...filteredHistory].slice(0, 20);
    updateHistory(updatedHistory);
  };

  // Mode 2: Screen Color EyeDropper API Execution
  const triggerScreenEyeDropper = async () => {
    setPickerError(null);
    console.log("Initializing Native Browser EyeDropper API...");

    // 1. Verify we are running in a secure context (HTTPS or localhost)
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      const secureMsg = "Screen Color Picker requires a secure context (HTTPS or localhost) to run. If you are using AI Studio's preview iframe, try opening the application in a new tab.";
      console.error(secureMsg);
      setPickerError(secureMsg);
      return;
    }

    // 2. Detect whether the browser supports EyeDropper
    if (!('EyeDropper' in window)) {
      const unsupportedMsg = "Screen Color Picker is not supported in your current browser.";
      console.warn(unsupportedMsg);
      setPickerError(unsupportedMsg);
      return;
    }
    
    try {
      // @ts-ignore
      const eyeDropper = new window.EyeDropper();
      console.log("EyeDropper initialized successfully. Launching screen selection overlay...");
      
      // Open EyeDropper and wait for selection
      const result = await eyeDropper.open();
      
      if (result && result.sRGBHex) {
        const hex = result.sRGBHex;
        console.log(`Color extracted successfully: ${hex}`);
        
        const rgbValues = hexToRgb(hex);
        if (rgbValues) {
          selectColor(rgbValues.r, rgbValues.g, rgbValues.b, hex);
        } else {
          // Robust fallback parsing
          const r = parseInt(hex.slice(1, 3), 16) || 0;
          const g = parseInt(hex.slice(3, 5), 16) || 0;
          const b = parseInt(hex.slice(5, 7), 16) || 0;
          selectColor(r, g, b, hex);
        }
      }
    } catch (err: any) {
      // 3. Handle user cancellation gracefully or other failures
      if (err instanceof Error && err.name === 'AbortError') {
        console.log("EyeDropper selection cancelled by user (ESC pressed or closed).");
      } else if (err?.message && (err.message.includes('canceled') || err.message.includes('abort'))) {
        console.log("EyeDropper selection cancelled by user.");
      } else {
        const errMsg = `EyeDropper error: ${err instanceof Error ? err.name + ': ' + err.message : String(err)}`;
        console.error(errMsg, err);
        setPickerError(errMsg);
      }
    }
  };

  // Clipboard copies
  const handleCopy = (text: string, format: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 1500);
  };

  // Custom Palette builders
  const addActiveColorToPalette = () => {
    if (!activeColor || !activePaletteId) return;
    
    const updated = customPalettes.map(p => {
      if (p.id === activePaletteId) {
        // Prevent duplicate hex colors in same palette
        if (p.colors.includes(activeColor.hex)) return p;
        return {
          ...p,
          colors: [...p.colors, activeColor.hex]
        };
      }
      return p;
    });
    
    updatePalettes(updated);
  };

  const removeColorFromPalette = (paletteId: string, hexToRemove: string) => {
    const updated = customPalettes.map(p => {
      if (p.id === paletteId) {
        return {
          ...p,
          colors: p.colors.filter(c => c !== hexToRemove)
        };
      }
      return p;
    });
    updatePalettes(updated);
  };

  const createNewPalette = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPaletteName.trim()) return;
    
    const newPal: CustomPalette = {
      id: `palette-${Math.random().toString()}`,
      name: newPaletteName.trim(),
      colors: activeColor ? [activeColor.hex] : []
    };
    
    const updated = [...customPalettes, newPal];
    updatePalettes(updated);
    setActivePaletteId(newPal.id);
    setNewPaletteName('');
  };

  const deletePalette = (id: string) => {
    if (customPalettes.length <= 1) {
      alert("You must retain at least one custom palette.");
      return;
    }
    const updated = customPalettes.filter(p => p.id !== id);
    updatePalettes(updated);
    setActivePaletteId(updated[0].id);
  };

  // Export palette helper templates
  const getSelectedPaletteColors = (): string[] => {
    const palette = customPalettes.find(p => p.id === activePaletteId);
    return palette ? palette.colors : [];
  };

  const getSelectedPaletteName = (): string => {
    const palette = customPalettes.find(p => p.id === activePaletteId);
    return palette ? palette.name : 'Aura Palette';
  };

  const generateExportCode = (): string => {
    const hexes = getSelectedPaletteColors();
    const pName = getSelectedPaletteName();
    
    switch (exportFormat) {
      case 'json':
        return JSON.stringify({ name: pName, colors: hexes }, null, 2);
      
      case 'css':
        let css = `/* CSS Root Variables - ${pName} */\n:root {\n`;
        hexes.forEach((hex, idx) => {
          css += `  --color-${idx + 1}: ${hex};\n`;
        });
        css += `}`;
        return css;
      
      case 'tailwind':
        let tw = `// Tailwind Color Extension - ${pName}\ncolors: {\n  custom: {\n`;
        hexes.forEach((hex, idx) => {
          tw += `    color${idx + 1}: '${hex}',\n`;
        });
        tw += `  }\n}`;
        return tw;
      
      case 'csv':
        return `Index,Hex Code\n` + hexes.map((hex, idx) => `${idx + 1},${hex}`).join('\n');
      
      default:
        return '';
    }
  };

  const handleReset = () => {
    setImage(null);
    setActiveColor(null);
  };

  return (
    <div className="space-y-8 h-full flex flex-col min-h-0" id="color-picker-workspace">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="font-mono text-[9px] tracking-[0.4em] text-[#C9A227] uppercase block">
            Aura Suite Engine
          </span>
          <h2 className="font-display text-2xl font-light text-white tracking-wide mt-1">
            PROFESSIONAL COLOR PICKER
          </h2>
          <p className="text-xs text-[#888888] font-light leading-relaxed mt-0.5">
            Grab pixel colors interactively from uploaded compositions, or directly from any visible pixel on your screen.
          </p>
        </div>
        
        <div className="flex gap-2">
          {/* EyeDropper Screen Button */}
          <button 
            onClick={triggerScreenEyeDropper}
            className="font-mono text-[10px] tracking-wider uppercase text-[#C9A227] hover:text-white bg-[#C9A227]/5 hover:bg-[#C9A227]/20 border border-[#C9A227]/40 py-2 px-4 rounded-none transition-colors flex items-center space-x-2 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Pick Screen Color</span>
          </button>
          
          {image && (
            <button 
              onClick={handleReset}
              className="font-mono text-[10px] tracking-wider uppercase text-red-400 hover:text-red-300 hover:bg-red-950/10 border border-red-950/40 py-2 px-4 rounded-none transition-colors cursor-pointer"
            >
              Reset Picker
            </button>
          )}
        </div>
      </div>

      {/* ERROR BANNER FOR EYEDROPPER SUPPORT / SECURE CONTEXT */}
      <AnimatePresence>
        {pickerError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-950/20 border border-red-500/30 p-4 flex items-start justify-between space-x-3 rounded-none overflow-hidden mb-6"
          >
            <div className="flex items-start space-x-2.5">
              <span className="text-red-400 font-mono text-[10px] bg-red-950/50 border border-red-500/30 px-1.5 py-0.5 mt-0.5">ALERT</span>
              <div className="space-y-1">
                <p className="text-xs text-white font-medium">{pickerError}</p>
                <p className="text-[10px] text-[#888888] font-mono">
                  Note: Screen EyeDropper API requires desktop browsers like Chrome or Edge and a secure context (HTTPS/Localhost).
                </p>
              </div>
            </div>
            <button
              onClick={() => setPickerError(null)}
              className="p-1 text-[#888888] hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">
        
        {/* Left Column: Interactive Image Stage OR File Uploader (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col min-h-0 space-y-4">
          {!image ? (
            <div className="bg-[#121212] border-2 border-dashed border-white/10 hover:border-[#C9A227]/40 p-8 rounded-none flex-1 flex flex-col justify-center relative group transition-colors min-h-[350px]">
              {/* Corner accents */}
              <div className="absolute top-2 right-2 border-t border-r border-white/10 group-hover:border-[#C9A227] w-4 h-4 transition-colors"></div>
              <div className="absolute bottom-2 left-2 border-b border-l border-white/10 group-hover:border-[#C9A227] w-4 h-4 transition-colors"></div>

              <input 
                type="file" 
                id="picker-file"
                onChange={handleFileChange}
                accept="image/*"
                className="hidden" 
              />
              <label 
                htmlFor="picker-file" 
                className="cursor-pointer block space-y-6 py-8 text-center"
              >
                <div className="w-16 h-16 rounded-none border border-white/10 group-hover:border-[#C9A227]/40 flex items-center justify-center bg-[#1A1A1A] mx-auto transition-colors shadow-inner">
                  <Upload className="w-6 h-6 text-[#A3A3A3] group-hover:text-[#C9A227] transition-colors" />
                </div>
                <div className="space-y-2">
                  <p className="text-white text-base font-light tracking-wide">
                    Upload canvas asset to enable interactive Loupe Picker
                  </p>
                  <p className="text-[#666666] font-mono text-[9px] tracking-widest uppercase">
                    or click "Pick Screen Color" above to sample directly from your monitor
                  </p>
                </div>
              </label>
            </div>
          ) : (
            <div className="bg-[#121212] border border-white/5 p-4 rounded-none flex-1 flex flex-col min-h-0 relative select-none">
              <span className="font-mono text-[8px] text-[#888888] tracking-widest uppercase block mb-3">
                Interactive Loupe Canvas Stage
              </span>
              
              {/* Image Stage Wrapper with cursor loupe magnifier simulation */}
              <div 
                className="flex-1 bg-black border border-white/10 overflow-hidden relative flex items-center justify-center cursor-none min-h-[300px]"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onClick={handleImageClick}
              >
                <img 
                  ref={imageRef}
                  src={image} 
                  alt="Pick Stage" 
                  onLoad={handleImageLoad}
                  className="max-w-full max-h-[420px] object-contain pointer-events-none"
                />

                {/* MAGNIFIED LOUPE CURSOR PORTAL */}
                <AnimatePresence>
                  {loupePos.display && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      className="absolute w-20 h-20 rounded-full border-2 border-white pointer-events-none overflow-hidden shadow-2xl flex items-center justify-center"
                      style={{ 
                        left: loupePos.x - 40, 
                        top: loupePos.y - 40,
                        borderColor: loupeColor,
                        boxShadow: `0 0 15px ${loupeColor}50`
                      }}
                    >
                      {/* Loupe Color Background and crosshair indicator */}
                      <div className="w-full h-full relative" style={{ backgroundColor: loupeColor }}>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-4 h-4 border border-white/40 rounded-full" />
                          <div className="absolute w-6 h-0.5 bg-white/40" />
                          <div className="absolute w-0.5 h-6 bg-white/40" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="font-mono text-[8px] text-[#666666] uppercase mt-2.5 flex items-center justify-between">
                <span>Target Dimensions: {imageSize.width} × {imageSize.height} PX</span>
                <span>Hover to magnify • Click to extract</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Selection details, history log & Palette builders (5 Cols) */}
        <div className="lg:col-span-5 space-y-6 flex flex-col min-h-0 overflow-y-auto custom-scrollbar pr-1">
          
          {/* Selected Color Cards Panel */}
          <div className="bg-[#121212] border border-white/5 p-5 rounded-none space-y-5">
            <div className="font-mono text-[9px] text-[#C9A227] tracking-widest uppercase border-b border-white/10 pb-2 flex items-center justify-between">
              <span>Active Chromatic Lock</span>
              {activeColor && (
                <span className="font-mono text-[8px] bg-[#C9A227]/10 text-[#C9A227] px-2 py-0.5 uppercase tracking-wide">
                  Locked at {activeColor.timestamp}
                </span>
              )}
            </div>

            {activeColor ? (
              <div className="space-y-4">
                {/* Big Color Card Block */}
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 border border-white/10 shadow-lg shrink-0" style={{ backgroundColor: activeColor.hex }} />
                  <div className="space-y-1">
                    <h4 className="font-display text-lg font-bold text-white tracking-wide">
                      {activeColor.name}
                    </h4>
                    <p className="font-mono text-xs text-[#C9A227] uppercase">
                      {activeColor.hex}
                    </p>
                  </div>
                </div>

                {/* Rich copy values details list */}
                <div className="space-y-1.5 text-xs font-mono">
                  {[
                    { label: 'HEX', val: activeColor.hex },
                    { label: 'RGB', val: activeColor.rgb },
                    { label: 'HSL', val: activeColor.hsl },
                    { label: 'HSV', val: activeColor.hsv },
                    { label: 'CMYK', val: activeColor.cmyk }
                  ].map((item) => (
                    <div key={item.label} className="bg-[#161616] border border-white/5 px-3 py-2 flex items-center justify-between hover:border-white/10 group transition-all">
                      <span className="text-[#666666] text-[10px]">{item.label}</span>
                      <span className="text-[#A3A3A3] text-[11px] truncate max-w-[180px]">{item.val}</span>
                      <button
                        onClick={() => handleCopy(item.val, item.label)}
                        className="p-1 text-[#666666] hover:text-[#C9A227] cursor-pointer"
                      >
                        {copiedFormat === item.label ? <CheckCircle className="w-3.5 h-3.5 text-[#C9A227]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Save to Palette builder row */}
                {activePaletteId && (
                  <button
                    onClick={addActiveColorToPalette}
                    className="w-full py-2 bg-[#C9A227] hover:bg-[#B8911C] text-black font-mono text-[9px] tracking-widest font-semibold uppercase rounded-none transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add to {getSelectedPaletteName()}</span>
                  </button>
                )}

              </div>
            ) : (
              <div className="py-8 text-center text-[#555555] font-mono text-xs border border-dashed border-white/5">
                Click on the loupe stage or "Pick Screen Color" to lock a color sample.
              </div>
            )}
          </div>

          {/* Custom Palette Builder Panel */}
          <div className="bg-[#121212] border border-white/5 p-5 rounded-none space-y-4">
            <div className="font-mono text-[9px] text-[#C9A227] tracking-widest uppercase border-b border-white/10 pb-2 flex justify-between items-center">
              <span>Custom Palette Creator</span>
              <span className="text-[#888888] font-mono text-[8px]">
                {getSelectedPaletteColors().length} COLORS SAVED
              </span>
            </div>

            {/* Create/Switch Palette form */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <select
                  value={activePaletteId || ''}
                  onChange={(e) => setActivePaletteId(e.target.value)}
                  className="flex-1 bg-[#1A1A1A] border border-white/10 text-xs text-[#E5E5E5] font-mono p-2 rounded-none outline-none focus:border-[#C9A227]/40"
                >
                  {customPalettes.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {activePaletteId && (
                  <button
                    onClick={() => deletePalette(activePaletteId)}
                    className="p-2 bg-red-950/10 hover:bg-red-900/20 border border-red-950/40 text-red-400 rounded-none cursor-pointer"
                    title="Delete Palette"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <form onSubmit={createNewPalette} className="flex gap-2">
                <input
                  type="text"
                  placeholder="New palette name..."
                  value={newPaletteName}
                  onChange={(e) => setNewPaletteName(e.target.value)}
                  className="flex-1 bg-[#1A1A1A] border border-white/5 text-xs font-mono p-2 rounded-none text-white placeholder-[#444444] outline-none"
                />
                <button
                  type="submit"
                  className="p-2.5 bg-white/5 border border-white/10 hover:border-[#C9A227]/40 text-[#C9A227] rounded-none cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Palette visual colors list with quick deletion options */}
            <div className="flex flex-wrap gap-2 pt-2">
              {getSelectedPaletteColors().map((hex, index) => {
                const rgb = hexToRgb(hex);
                return (
                  <div 
                    key={index} 
                    className="group/item relative w-9 h-9 border border-white/10 cursor-pointer shadow-md"
                    style={{ backgroundColor: hex }}
                    onClick={() => {
                      if (rgb) selectColor(rgb.r, rgb.g, rgb.b, hex);
                    }}
                  >
                    {/* Quick Delete overlay */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (activePaletteId) removeColorFromPalette(activePaletteId, hex);
                      }}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center p-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                );
              })}
              {getSelectedPaletteColors().length === 0 && (
                <span className="text-[#555555] font-mono text-[10px] uppercase">
                  Empty suite palette. Add colors above.
                </span>
              )}
            </div>

            {/* Code Export Triggers */}
            {getSelectedPaletteColors().length > 0 && (
              <div className="grid grid-cols-4 gap-1.5 pt-3 border-t border-white/5 text-[9px] font-mono uppercase tracking-wider text-center">
                <button onClick={() => setExportFormat('json')} className="py-1.5 bg-white/5 hover:bg-[#C9A227]/10 hover:text-[#C9A227] transition-all">
                  JSON
                </button>
                <button onClick={() => setExportFormat('css')} className="py-1.5 bg-white/5 hover:bg-[#C9A227]/10 hover:text-[#C9A227] transition-all">
                  CSS
                </button>
                <button onClick={() => setExportFormat('tailwind')} className="py-1.5 bg-white/5 hover:bg-[#C9A227]/10 hover:text-[#C9A227] transition-all">
                  T-WIND
                </button>
                <button onClick={() => setExportFormat('csv')} className="py-1.5 bg-white/5 hover:bg-[#C9A227]/10 hover:text-[#C9A227] transition-all">
                  CSV
                </button>
              </div>
            )}

          </div>

          {/* Picked Colors History Log Panel */}
          <div className="bg-[#121212] border border-white/5 p-5 rounded-none space-y-4">
            <div className="font-mono text-[9px] text-[#C9A227] tracking-widest uppercase border-b border-white/10 pb-2 flex justify-between items-center">
              <span>Aura Chromatic Log History</span>
              {history.length > 0 && (
                <button
                  onClick={() => updateHistory([])}
                  className="text-[#666666] hover:text-red-400 transition-colors flex items-center space-x-1 font-mono text-[8px]"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>WIPE</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-5 gap-2 max-h-36 overflow-y-auto custom-scrollbar">
              {history.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const rgb = hexToRgb(item.hex);
                    if (rgb) selectColor(rgb.r, rgb.g, rgb.b, item.hex);
                  }}
                  className={`relative aspect-square border hover:border-[#C9A227] transition-all cursor-pointer ${
                    activeColor?.hex === item.hex ? 'border-[#C9A227] ring-1 ring-[#C9A227]' : 'border-white/10'
                  }`}
                  style={{ backgroundColor: item.hex }}
                  title={`${item.name} (${item.hex})`}
                />
              ))}
              {history.length === 0 && (
                <div className="col-span-5 py-4 text-center text-[#555555] font-mono text-[10px] uppercase">
                  No logged history logs in session.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* EXPORT OVERLAY MODAL */}
      <AnimatePresence>
        {exportFormat && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40 bg-black/75 backdrop-blur-xs"
              onClick={() => setExportFormat(null)}
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-4 top-10 bottom-10 md:inset-x-12 md:top-20 md:bottom-20 z-50 bg-[#121212] border border-white/10 p-6 flex flex-col justify-between max-w-lg mx-auto shadow-2xl rounded-none"
            >
              <div className="flex justify-between items-center pb-3 border-b border-white/10 flex-shrink-0">
                <div>
                  <h4 className="font-display text-sm font-semibold uppercase tracking-widest text-white">
                    Exporter Console Output
                  </h4>
                  <p className="font-mono text-[8px] text-[#C9A227] tracking-widest uppercase">
                    Palette format: {exportFormat.toUpperCase()} config
                  </p>
                </div>
                <button 
                  onClick={() => setExportFormat(null)}
                  className="p-1 text-[#666666] hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Code viewer */}
              <div className="flex-1 my-4 bg-black border border-white/5 overflow-hidden flex flex-col p-1">
                <pre className="flex-1 overflow-auto p-4 font-mono text-[11px] text-emerald-400 leading-relaxed select-all">
                  {generateExportCode()}
                </pre>
              </div>

              {/* Modal footer controls */}
              <div className="flex items-center justify-between border-t border-white/10 pt-4 flex-shrink-0">
                <button
                  onClick={() => handleCopy(generateExportCode(), exportFormat.toUpperCase())}
                  className="py-2 px-5 bg-[#C9A227] hover:bg-[#B8911C] text-black font-mono text-[10px] tracking-widest font-semibold uppercase rounded-none cursor-pointer"
                >
                  Copy Clipboard Code
                </button>
                <button
                  onClick={() => setExportFormat(null)}
                  className="py-2 px-4 border border-white/10 hover:border-white/25 text-white font-mono text-[10px] tracking-widest uppercase rounded-none cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
