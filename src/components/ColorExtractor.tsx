import React, { useState, useEffect, DragEvent, ChangeEvent, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, Check, Copy, Download, Grid, List, Search, Sliders, 
  Palette, X, RefreshCw, SlidersHorizontal, Code, FileCode, FileText, ImageIcon
} from 'lucide-react';
import { extractColorsFromImage, ColorDetails } from '../utils/colorUtils';

export default function ColorExtractor() {
  const [image, setImage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [colors, setColors] = useState<ColorDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom Controls
  const [colorCount, setColorCount] = useState<number>(10); // 5, 10, 15, 20, -1 (Auto)
  const [filterType, setFilterType] = useState<string>('all'); // all, dominant, warm, cool, neutral, dark, light, pastel, vibrant, muted
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'strip'>('grid');
  
  // Feedback States
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeExport, setActiveExport] = useState<'json' | 'css' | 'scss' | 'tailwind' | 'csv' | 'txt' | null>(null);

  // Re-run color extraction when image, count, or filter changes
  useEffect(() => {
    if (image) {
      extractPalette();
    }
  }, [image, colorCount, filterType]);

  const extractPalette = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const result = await extractColorsFromImage(image, colorCount, filterType);
      setColors(result);
    } catch (err) {
      console.error("Color Extractor error:", err);
      alert("Failed to analyze image pixels.");
    } finally {
      setLoading(false);
    }
  };

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

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Format unsupported. Please upload PNG, JPG, or WEBP.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // One-click copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleReset = () => {
    setImage(null);
    setColors([]);
    setSearchQuery('');
    setFilterType('all');
    setColorCount(10);
  };

  // Generate dynamic downloads
  const downloadTextFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadJSON = () => {
    const data = JSON.stringify(colors, null, 2);
    downloadTextFile(data, 'aura-palette.json', 'application/json');
  };

  const downloadCSV = () => {
    let csv = 'Color Name,HEX,RGB,HSL,HSV,Coverage %\n';
    colors.forEach(c => {
      csv += `"${c.name}",${c.hex},"${c.rgb}","${c.hsl}","${c.hsv}",${c.coverage}\n`;
    });
    downloadTextFile(csv, 'aura-palette.csv', 'text/csv');
  };

  const downloadCSS = () => {
    const css = generateCSSVariables();
    downloadTextFile(css, 'aura-palette.css', 'text/css');
  };

  // Draw and download premium PNG Palette
  const downloadPNGPalette = () => {
    if (colors.length === 0) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const swatchWidth = 140;
    const swatchHeight = 220;
    const padding = 24;
    const totalSwatches = colors.length;
    
    // Layout in grid if too many colors, or a clean single horizontal strip
    const swatchesPerRow = Math.min(totalSwatches, 10);
    const rows = Math.ceil(totalSwatches / swatchesPerRow);

    const canvasWidth = swatchesPerRow * swatchWidth + (swatchesPerRow + 1) * padding;
    const canvasHeight = rows * swatchHeight + (rows + 1) * padding + 100; // Extra room for branding banner at top

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Draw Dark Luxury Backdrop
    ctx.fillStyle = '#0B0B0B';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw Accent Border
    ctx.strokeStyle = '#1A1A1A';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, canvasWidth - 20, canvasHeight - 20);

    // Header branding
    ctx.fillStyle = '#C9A227';
    ctx.font = '10px monospace';
    ctx.fillText('◇ AURA CREATIVE DIRECTOR SUITE ◇', padding, 40);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('EXTRACTED COLOR PALETTE', padding, 70);

    ctx.fillStyle = '#888888';
    ctx.font = '11px sans-serif';
    ctx.fillText(`Automated Chromatic Fingerprint • ${totalSwatches} Colors Detected`, padding, 92);

    // Draw each color card
    colors.forEach((color, idx) => {
      const colIdx = idx % swatchesPerRow;
      const rowIdx = Math.floor(idx / swatchesPerRow);

      const x = padding + colIdx * (swatchWidth + padding);
      const y = 120 + padding + rowIdx * (swatchHeight + padding);

      // Color Swatch Fill
      ctx.fillStyle = color.hex;
      ctx.fillRect(x, y, swatchWidth, swatchHeight - 90);

      // Card frame
      ctx.strokeStyle = '#252525';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, swatchWidth, swatchHeight);

      // Text box background
      ctx.fillStyle = '#121212';
      ctx.fillRect(x + 1, y + swatchHeight - 90, swatchWidth - 2, 89);

      // Color Name
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px sans-serif';
      const maxNameWidth = swatchWidth - 16;
      let displayName = color.name;
      if (ctx.measureText(displayName).width > maxNameWidth) {
        displayName = displayName.slice(0, 15) + '...';
      }
      ctx.fillText(displayName, x + 10, y + swatchHeight - 70);

      // HEX Code
      ctx.fillStyle = '#C9A227';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(color.hex, x + 10, y + swatchHeight - 48);

      // RGB Info
      ctx.fillStyle = '#888888';
      ctx.font = '9px monospace';
      ctx.fillText(color.rgb, x + 10, y + swatchHeight - 30);

      // Coverage
      ctx.fillStyle = '#666666';
      ctx.font = '9px sans-serif';
      ctx.fillText(`Coverage: ${color.coverage}%`, x + 10, y + swatchHeight - 12);
    });

    // Trigger download
    const link = document.createElement('a');
    link.download = 'aura-color-palette.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Export templates code generators
  const generateJSON = () => JSON.stringify(
    colors.reduce((acc, c, idx) => {
      const key = c.name.toLowerCase().replace(/\s+/g, '-');
      acc[key] = { hex: c.hex, rgb: c.rgb, hsl: c.hsl, coverage: c.coverage };
      return acc;
    }, {} as any), null, 2
  );

  const generateCSSVariables = () => {
    let css = `/* Aura AI Generated Palette CSS Variables */\n:root {\n`;
    colors.forEach((c) => {
      const varName = `--aura-${c.name.toLowerCase().replace(/\s+/g, '-')}`;
      css += `  ${varName}: ${c.hex}; /* Coverage: ${c.coverage}% */\n`;
    });
    css += `}`;
    return css;
  };

  const generateSCSSVariables = () => {
    let scss = `/* Aura AI Generated Palette SCSS Variables */\n`;
    colors.forEach((c) => {
      const varName = `$aura-${c.name.toLowerCase().replace(/\s+/g, '-')}`;
      scss += `${varName}: ${c.hex}; // Coverage: ${c.coverage}%\n`;
    });
    return scss;
  };

  const generateTailwindConfig = () => {
    let tw = `// Tailwind CSS configuration color extension\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        aura: {\n`;
    colors.forEach((c) => {
      const keyName = c.name.toLowerCase().replace(/\s+/g, '');
      tw += `          ${keyName}: '${c.hex}', // ${c.name}\n`;
    });
    tw += `        }\n      }\n    }\n  }\n}`;
    return tw;
  };

  // Filter colors based on search query
  const filteredColors = colors.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.hex.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 h-full flex flex-col min-h-0" id="color-extractor-workspace">
      
      {/* Title & Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="font-mono text-[9px] tracking-[0.4em] text-[#C9A227] uppercase block">
            Aura Suite Engine
          </span>
          <h2 className="font-display text-2xl font-light text-white tracking-wide mt-1">
            STANDALONE COLOR EXTRACTOR
          </h2>
          <p className="text-xs text-[#888888] font-light leading-relaxed mt-0.5">
            Extract pixel-perfect dominant palettes from any image, assets, or screens without calling AI.
          </p>
        </div>
        
        {image && (
          <button 
            onClick={handleReset}
            className="self-start sm:self-center font-mono text-[10px] tracking-wider uppercase text-red-400 hover:text-red-300 hover:bg-red-950/10 border border-red-950/40 py-2 px-4 rounded-none transition-colors cursor-pointer"
          >
            Reset Extractor
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!image ? (
          /* A. EMPTY UPLOAD BOX STATE */
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full py-12"
          >
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`p-10 rounded-none border-2 border-dashed transition-all duration-300 text-center relative overflow-hidden group ${
                dragActive 
                  ? 'border-[#C9A227] bg-[#C9A227]/5' 
                  : 'border-white/10 bg-[#121212] hover:border-[#C9A227]/40'
              }`}
            >
              {/* Visual accents */}
              <div className="absolute top-2 right-2 border-t border-r border-white/10 group-hover:border-[#C9A227] w-4 h-4 transition-colors"></div>
              <div className="absolute bottom-2 left-2 border-b border-l border-white/10 group-hover:border-[#C9A227] w-4 h-4 transition-colors"></div>

              <input 
                type="file" 
                id="extractor-file"
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/webp"
                className="hidden" 
              />
              <label 
                htmlFor="extractor-file" 
                className="cursor-pointer block space-y-6 py-8"
              >
                <div className="w-16 h-16 rounded-none border border-white/10 group-hover:border-[#C9A227]/40 flex items-center justify-center bg-[#1A1A1A] mx-auto transition-colors shadow-inner">
                  <Palette className="w-6 h-6 text-[#A3A3A3] group-hover:text-[#C9A227] transition-colors" />
                </div>
                <div className="space-y-1">
                  <p className="text-white text-base font-light tracking-wide">
                    Upload image to extract color fingerprint
                  </p>
                  <p className="text-[#666666] font-mono text-[9px] tracking-widest uppercase">
                    POSTER, THUMBNAIL, BRANDING ASSETS, LOGO, SCREENSHOT
                  </p>
                </div>
              </label>
            </div>
          </motion.div>
        ) : (
          /* B. DYNAMIC COLOR ANALYSIS COMPOSER STATE */
          <motion.div
            key="analysis"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0"
          >
            {/* Left Col (4 Cols): Image Display & Extractor Settings */}
            <div className="lg:col-span-4 space-y-6 flex flex-col min-h-0">
              
              {/* Image Preview Block */}
              <div className="bg-[#121212] border border-white/5 p-4 rounded-none space-y-3 relative overflow-hidden flex-shrink-0">
                <div className="font-mono text-[8px] text-[#888888] tracking-widest uppercase flex items-center justify-between">
                  <span>Source Media</span>
                  <span className="text-[#C9A227]">STANDALONE ENGINE</span>
                </div>
                <div className="relative aspect-video max-h-56 bg-black border border-white/10 overflow-hidden flex items-center justify-center">
                  <img src={image} alt="Source" className="max-w-full max-h-full object-contain" />
                </div>
              </div>

              {/* Extractor Controls Panel */}
              <div className="bg-[#121212] border border-white/5 p-5 rounded-none space-y-5 flex-1 overflow-y-auto custom-scrollbar">
                <div className="font-mono text-[9px] text-[#C9A227] tracking-widest uppercase border-b border-white/10 pb-2">
                  Extraction Parameters
                </div>

                {/* 1. Color Count Selector */}
                <div className="space-y-2">
                  <label className="font-mono text-[8px] text-[#888888] tracking-widest uppercase block">
                    Target Palette Size
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[5, 10, 15, 20, -1].map((count) => (
                      <button
                        key={count}
                        onClick={() => setColorCount(count)}
                        className={`py-2 text-[10px] font-mono tracking-wider border rounded-none transition-all cursor-pointer ${
                          colorCount === count 
                            ? 'bg-[#C9A227]/20 border-[#C9A227] text-white font-bold' 
                            : 'bg-[#1A1A1A] border-white/5 text-[#888888] hover:text-white hover:border-white/20'
                        }`}
                      >
                        {count === -1 ? 'Auto' : count}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Chromatic Filter */}
                <div className="space-y-2">
                  <label className="font-mono text-[8px] text-[#888888] tracking-widest uppercase block">
                    Chromatic Tonality Filter
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'all', label: 'All Detected' },
                      { id: 'dominant', label: 'Dominant (≥10%)' },
                      { id: 'warm', label: 'Warm Colors' },
                      { id: 'cool', label: 'Cool Colors' },
                      { id: 'neutral', label: 'Neutrals / Grays' },
                      { id: 'dark', label: 'Dark Tones' },
                      { id: 'light', label: 'Light Tones' },
                      { id: 'pastel', label: 'Soft Pastels' },
                      { id: 'vibrant', label: 'Vibrant Highlights' },
                      { id: 'muted', label: 'Muted / Matte' }
                    ].map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => setFilterType(filter.id)}
                        className={`py-1.5 px-2 text-left text-[9px] font-mono tracking-wider border rounded-none transition-all flex items-center justify-between cursor-pointer ${
                          filterType === filter.id 
                            ? 'bg-[#C9A227]/10 border-[#C9A227]/50 text-[#C9A227]' 
                            : 'bg-[#1A1A1A] border-white/5 text-[#888888] hover:text-white hover:border-white/20'
                        }`}
                      >
                        <span>{filter.label}</span>
                        {filterType === filter.id && <Check className="w-2.5 h-2.5" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Global Downloads Panel */}
                <div className="space-y-2.5 pt-2 border-t border-white/10">
                  <label className="font-mono text-[8px] text-[#888888] tracking-widest uppercase block">
                    Download Outputs
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={downloadPNGPalette}
                      className="py-2 bg-[#C9A227] hover:bg-[#B8911C] text-black font-mono text-[9px] tracking-widest font-semibold uppercase transition-all flex items-center justify-center space-x-1.5 rounded-none cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>PNG Palette</span>
                    </button>
                    <button 
                      onClick={downloadJSON}
                      className="py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-[9px] tracking-widest uppercase transition-all flex items-center justify-center space-x-1.5 rounded-none cursor-pointer"
                    >
                      <FileCode className="w-3.5 h-3.5 text-[#C9A227]" />
                      <span>JSON File</span>
                    </button>
                    <button 
                      onClick={downloadCSS}
                      className="py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-[9px] tracking-widest uppercase transition-all flex items-center justify-center space-x-1.5 rounded-none cursor-pointer"
                    >
                      <Code className="w-3.5 h-3.5 text-blue-400" />
                      <span>CSS Root</span>
                    </button>
                    <button 
                      onClick={downloadCSV}
                      className="py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-[9px] tracking-widest uppercase transition-all flex items-center justify-center space-x-1.5 rounded-none cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      <span>CSV Table</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col (8 Cols): Palette Display View & Actions */}
            <div className="lg:col-span-8 flex flex-col min-h-0 space-y-4">
              
              {/* View Selector and Filter search bar */}
              <div className="bg-[#121212] border border-white/5 p-4 rounded-none flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0">
                
                {/* Search Bar */}
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#666666]" />
                  <input
                    type="text"
                    placeholder="Search color by name or #HEX..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-white/5 focus:border-[#C9A227]/40 pl-9 pr-4 py-2 text-xs font-mono rounded-none text-white placeholder-[#555555] outline-none"
                  />
                </div>

                {/* View switcher and fast copy feedback */}
                <div className="flex items-center space-x-4">
                  {copiedText && (
                    <span className="font-mono text-[9px] text-[#C9A227] uppercase tracking-widest animate-pulse">
                      Copied {copiedText}
                    </span>
                  )}

                  <div className="flex bg-[#1A1A1A] p-1 border border-white/10">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-none cursor-pointer ${viewMode === 'grid' ? 'bg-[#C9A227] text-black' : 'text-[#888888] hover:text-white'}`}
                      title="Grid Cards"
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded-none cursor-pointer ${viewMode === 'list' ? 'bg-[#C9A227] text-black' : 'text-[#888888] hover:text-white'}`}
                      title="Detail List"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('strip')}
                      className={`p-1.5 rounded-none cursor-pointer ${viewMode === 'strip' ? 'bg-[#C9A227] text-black' : 'text-[#888888] hover:text-white'}`}
                      title="Visual Palette Strip"
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Loader or dynamic view rendering */}
              {loading ? (
                <div className="flex-1 bg-[#121212] border border-white/5 flex flex-col items-center justify-center p-12">
                  <RefreshCw className="w-10 h-10 text-[#C9A227] animate-spin mb-4" />
                  <p className="font-mono text-xs tracking-widest text-[#888888] uppercase">
                    Analyzing pixel array spectrum...
                  </p>
                </div>
              ) : filteredColors.length === 0 ? (
                <div className="flex-1 bg-[#121212] border border-white/5 flex flex-col items-center justify-center p-12 text-center">
                  <Palette className="w-8 h-8 text-[#444444] mb-3" />
                  <p className="font-mono text-xs text-[#888888] uppercase">
                    No matching colors detected in filtered spectrum.
                  </p>
                  <button 
                    onClick={() => { setSearchQuery(''); setFilterType('all'); }}
                    className="mt-3 font-mono text-[9px] text-[#C9A227] uppercase hover:underline"
                  >
                    Clear Filter
                  </button>
                </div>
              ) : (
                /* Dynamic View Rendering */
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                  
                  {/* MODE A: GRID VIEW CARDS */}
                  {viewMode === 'grid' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {filteredColors.map((color, idx) => (
                        <div key={idx} className="bg-[#121212] border border-white/5 hover:border-[#C9A227]/30 transition-all duration-300 p-4 space-y-4 group rounded-none flex flex-col justify-between">
                          <div className="space-y-3">
                            {/* Color Block Header */}
                            <div className="relative aspect-video w-full rounded-none overflow-hidden" style={{ backgroundColor: color.hex }}>
                              <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-xs font-mono text-[9px] text-[#C9A227] px-1.5 py-0.5 border border-white/5">
                                {color.coverage}%
                              </div>
                            </div>

                            {/* Info */}
                            <div className="space-y-1">
                              <h5 className="font-display text-sm font-semibold text-white tracking-wide">
                                {color.name}
                              </h5>
                              <p className="font-mono text-xs text-[#C9A227] uppercase flex items-center justify-between">
                                <span>{color.hex}</span>
                                <button 
                                  onClick={() => handleCopy(color.hex, 'HEX')}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#666666] hover:text-[#C9A227]"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </p>
                            </div>

                            {/* Color Values breakdown list */}
                            <div className="space-y-1 text-[10px] font-mono text-[#888888] bg-[#161616] p-2 border border-white/5">
                              <div className="flex justify-between hover:text-white cursor-pointer" onClick={() => handleCopy(color.rgb, 'RGB')}>
                                <span>RGB:</span>
                                <span className="text-[#A3A3A3] truncate max-w-[150px]">{color.rgb}</span>
                              </div>
                              <div className="flex justify-between hover:text-white cursor-pointer" onClick={() => handleCopy(color.hsl, 'HSL')}>
                                <span>HSL:</span>
                                <span className="text-[#A3A3A3] truncate max-w-[150px]">{color.hsl}</span>
                              </div>
                              <div className="flex justify-between hover:text-white cursor-pointer" onClick={() => handleCopy(color.hsv, 'HSV')}>
                                <span>HSV:</span>
                                <span className="text-[#A3A3A3] truncate max-w-[150px]">{color.hsv}</span>
                              </div>
                            </div>
                          </div>

                          {/* Quick Color Copy row */}
                          <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-white/5 text-[9px] font-mono uppercase tracking-wider">
                            <button onClick={() => handleCopy(color.hex, 'HEX')} className="py-1 bg-white/5 hover:bg-[#C9A227]/10 text-white hover:text-[#C9A227] transition-all">
                              HEX
                            </button>
                            <button onClick={() => handleCopy(color.rgb, 'RGB')} className="py-1 bg-white/5 hover:bg-[#C9A227]/10 text-white hover:text-[#C9A227] transition-all">
                              RGB
                            </button>
                            <button onClick={() => handleCopy(color.hsl, 'HSL')} className="py-1 bg-white/5 hover:bg-[#C9A227]/10 text-white hover:text-[#C9A227] transition-all">
                              HSL
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* MODE B: DETAIL LIST VIEW */}
                  {viewMode === 'list' && (
                    <div className="bg-[#121212] border border-white/5 divide-y divide-white/5">
                      {filteredColors.map((color, idx) => (
                        <div key={idx} className="p-4 sm:flex items-center justify-between gap-4 hover:bg-[#161616] transition-colors group">
                          
                          {/* Color block with name */}
                          <div className="flex items-center space-x-4 mb-3 sm:mb-0">
                            <div className="w-12 h-12 border border-white/10" style={{ backgroundColor: color.hex }} />
                            <div>
                              <h5 className="font-display text-sm font-semibold text-white">
                                {color.name}
                              </h5>
                              <p className="font-mono text-xs text-[#C9A227] uppercase">
                                {color.hex}
                              </p>
                            </div>
                          </div>

                          {/* Values details */}
                          <div className="grid grid-cols-2 sm:flex items-center gap-x-8 gap-y-2 text-xs font-mono text-[#888888] flex-1 justify-end max-w-xl">
                            <div>
                              <span className="text-[#666666] block text-[8px] uppercase tracking-wider">RGB Values</span>
                              <span className="text-[#E5E5E5] hover:text-white cursor-pointer" onClick={() => handleCopy(color.rgb, 'RGB')}>{color.rgb}</span>
                            </div>
                            <div>
                              <span className="text-[#666666] block text-[8px] uppercase tracking-wider">HSL Spectrum</span>
                              <span className="text-[#E5E5E5] hover:text-white cursor-pointer" onClick={() => handleCopy(color.hsl, 'HSL')}>{color.hsl}</span>
                            </div>
                            <div>
                              <span className="text-[#666666] block text-[8px] uppercase tracking-wider">HSV Spectrum</span>
                              <span className="text-[#E5E5E5] hover:text-white cursor-pointer" onClick={() => handleCopy(color.hsv, 'HSV')}>{color.hsv}</span>
                            </div>
                            <div>
                              <span className="text-[#666666] block text-[8px] uppercase tracking-wider">Coverage</span>
                              <span className="text-[#C9A227] font-bold">{color.coverage}%</span>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="flex items-center space-x-2 pl-4 border-l border-white/5 self-stretch opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleCopy(color.hex, 'HEX')}
                              className="p-1.5 bg-white/5 hover:bg-[#C9A227] hover:text-black transition-colors"
                              title="Copy Color HEX"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>

                        </div>
                      ))}
                    </div>
                  )}

                  {/* MODE C: PALETTE STRIP VIEW */}
                  {viewMode === 'strip' && (
                    <div className="bg-[#121212] border border-white/5 p-5 space-y-6">
                      
                      {/* Interactive block strips */}
                      <div className="h-28 flex border border-white/10 overflow-hidden relative">
                        {filteredColors.map((color, idx) => (
                          <div
                            key={idx}
                            className="h-full flex-1 hover:flex-[1.5] transition-all duration-300 relative group/strip cursor-pointer"
                            style={{ backgroundColor: color.hex }}
                            onClick={() => handleCopy(color.hex, 'HEX')}
                          >
                            {/* Hover Overlay info */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/strip:opacity-100 transition-opacity flex flex-col justify-end p-2.5">
                              <span className="font-mono text-[10px] text-white font-bold truncate block">
                                {color.name}
                              </span>
                              <span className="font-mono text-[9px] text-[#C9A227] block">
                                {color.hex}
                              </span>
                              <span className="font-mono text-[8px] text-[#888888] block">
                                {color.coverage}% coverage
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Technical specifications panel */}
                      <div className="space-y-3">
                        <span className="font-mono text-[8px] text-[#C9A227] tracking-widest uppercase block">
                          Developer Code Exporter Console
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                          <button 
                            onClick={() => setActiveExport('json')}
                            className="py-2.5 bg-[#161616] hover:bg-[#1C1C1C] border border-white/5 text-xs text-[#E5E5E5] font-mono tracking-wider transition-all flex items-center justify-center space-x-2 rounded-none cursor-pointer"
                          >
                            <Code className="w-3.5 h-3.5 text-amber-500" />
                            <span>JSON Config</span>
                          </button>
                          <button 
                            onClick={() => setActiveExport('css')}
                            className="py-2.5 bg-[#161616] hover:bg-[#1C1C1C] border border-white/5 text-xs text-[#E5E5E5] font-mono tracking-wider transition-all flex items-center justify-center space-x-2 rounded-none cursor-pointer"
                          >
                            <FileCode className="w-3.5 h-3.5 text-blue-400" />
                            <span>CSS Variables</span>
                          </button>
                          <button 
                            onClick={() => setActiveExport('scss')}
                            className="py-2.5 bg-[#161616] hover:bg-[#1C1C1C] border border-white/5 text-xs text-[#E5E5E5] font-mono tracking-wider transition-all flex items-center justify-center space-x-2 rounded-none cursor-pointer"
                          >
                            <FileCode className="w-3.5 h-3.5 text-rose-400" />
                            <span>SCSS Variables</span>
                          </button>
                          <button 
                            onClick={() => setActiveExport('tailwind')}
                            className="py-2.5 bg-[#161616] hover:bg-[#1C1C1C] border border-white/5 text-xs text-[#E5E5E5] font-mono tracking-wider transition-all flex items-center justify-center space-x-2 rounded-none cursor-pointer"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Tailwind Config</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CODE EXPORT MODAL DRAW-OVER */}
      <AnimatePresence>
        {activeExport && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40 bg-black/75 backdrop-blur-xs"
              onClick={() => setActiveExport(null)}
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-4 top-10 bottom-10 md:inset-x-12 md:top-20 md:bottom-20 z-50 bg-[#121212] border border-white/10 p-6 flex flex-col justify-between max-w-2xl mx-auto shadow-2xl rounded-none"
            >
              <div className="flex justify-between items-center pb-3 border-b border-white/10 flex-shrink-0">
                <div>
                  <h4 className="font-display text-sm font-semibold uppercase tracking-widest text-white">
                    Exporter Console Output
                  </h4>
                  <p className="font-mono text-[8px] text-[#C9A227] tracking-widest uppercase">
                    Format: {activeExport} configuration code
                  </p>
                </div>
                <button 
                  onClick={() => setActiveExport(null)}
                  className="p-1 text-[#666666] hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Code viewer */}
              <div className="flex-1 my-4 bg-black border border-white/5 overflow-hidden flex flex-col p-1">
                <pre className="flex-1 overflow-auto p-4 font-mono text-[11px] text-emerald-400 leading-relaxed select-all">
                  {activeExport === 'json' && generateJSON()}
                  {activeExport === 'css' && generateCSSVariables()}
                  {activeExport === 'scss' && generateSCSSVariables()}
                  {activeExport === 'tailwind' && generateTailwindConfig()}
                </pre>
              </div>

              {/* Modal footer controls */}
              <div className="flex items-center justify-between border-t border-white/10 pt-4 flex-shrink-0">
                <button
                  onClick={() => {
                    const code = activeExport === 'json' ? generateJSON() :
                                 activeExport === 'css' ? generateCSSVariables() :
                                 activeExport === 'scss' ? generateSCSSVariables() :
                                 generateTailwindConfig();
                    handleCopy(code, activeExport.toUpperCase());
                  }}
                  className="py-2 px-5 bg-[#C9A227] hover:bg-[#B8911C] text-black font-mono text-[10px] tracking-widest font-semibold uppercase rounded-none cursor-pointer"
                >
                  Copy Entire Clipboard Code
                </button>
                <button
                  onClick={() => setActiveExport(null)}
                  className="py-2 px-4 border border-white/10 hover:border-white/25 text-white font-mono text-[10px] tracking-widest uppercase rounded-none cursor-pointer"
                >
                  Dismiss Output
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
