import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Ruler, Layout, Download, Check, Copy, HelpCircle, AlertCircle, RefreshCw, Maximize2, Minimize2 
} from 'lucide-react';

// Conversion helpers
export const unitLabels: Record<string, string> = {
  px: 'Pixels',
  mm: 'Millimeters',
  cm: 'Centimeters',
  in: 'Inches',
  ft: 'Feet',
  m: 'Meters'
};

export const toInches = (val: number, unit: string): number => {
  switch (unit) {
    case 'px': return val / 96;
    case 'mm': return val / 25.4;
    case 'cm': return val / 2.54;
    case 'in': return val;
    case 'ft': return val * 12;
    case 'm': return val * 39.3700787;
    default: return val;
  }
};

export const fromInches = (inches: number, unit: string): number => {
  switch (unit) {
    case 'px': return inches * 96;
    case 'mm': return inches * 25.4;
    case 'cm': return inches * 2.54;
    case 'in': return inches;
    case 'ft': return inches / 12;
    case 'm': return inches / 39.3700787;
    default: return inches;
  }
};

export function getAspectRatio(width: number, height: number): string {
  if (width <= 0 || height <= 0) return "1:1";
  const ratio = width / height;
  
  const commonRatios = [
    { name: '16:9', val: 16/9 },
    { name: '16:10', val: 16/10 },
    { name: '4:3', val: 4/3 },
    { name: '3:2', val: 3/2 },
    { name: '1:1', val: 1/1 },
    { name: '9:16', val: 9/16 },
    { name: '10:16', val: 10/16 },
    { name: '3:4', val: 3/4 },
    { name: '2:3', val: 2/3 },
    { name: '21:9', val: 21/9 },
    { name: '2.39:1', val: 2.39 },
    { name: '1:√2 (ISO Paper)', val: 1/Math.sqrt(2) },
    { name: '√2:1 (ISO Paper)', val: Math.sqrt(2) }
  ];
  
  for (const r of commonRatios) {
    if (Math.abs(ratio - r.val) < 0.015) {
      return r.name;
    }
  }
  
  const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
  const wRounded = Math.round(width * 100);
  const hRounded = Math.round(height * 100);
  if (wRounded > 0 && hRounded > 0) {
    const divisor = gcd(wRounded, hRounded);
    const simplifiedW = wRounded / divisor;
    const simplifiedH = hRounded / divisor;
    if (simplifiedW < 50 && simplifiedH < 50) {
      return `${simplifiedW}:${simplifiedH}`;
    }
  }
  
  return `${ratio.toFixed(2)}:1`;
}

export function getResolutionClass(wPx: number, hPx: number): string {
  const maxDim = Math.max(wPx, hPx);
  const minDim = Math.min(wPx, hPx);
  
  if (maxDim >= 7680 && minDim >= 4320) return '8K UHD';
  if (maxDim >= 3840 && minDim >= 2160) return '4K UHD';
  if (maxDim >= 2560 && minDim >= 1440) return '2K QHD';
  if (maxDim >= 1920 && minDim >= 1080) return 'Full HD';
  if (maxDim >= 1280 && minDim >= 720) return 'HD';
  if (maxDim >= 960 && minDim >= 540) return 'qHD';
  return 'Custom';
}

interface RatioVisualizerProps {
  initialWidth?: number;
  initialHeight?: number;
  initialUnit?: string;
  onClearInitialValues?: () => void;
}

export default function RatioVisualizer({
  initialWidth,
  initialHeight,
  initialUnit,
  onClearInitialValues
}: RatioVisualizerProps) {
  const [width, setWidth] = useState<string>('1920');
  const [height, setHeight] = useState<string>('1080');
  const [unit, setUnit] = useState<string>('px');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Grid toggles
  const [gridOptions, setGridOptions] = useState({
    safeArea: false,
    ruleOfThirds: false,
    goldenRatio: false,
    centerLines: false,
    bleedArea: false,
  });

  // Handle external loading from the Standard Ratios Library
  useEffect(() => {
    if (initialWidth && initialHeight && initialUnit) {
      setWidth(initialWidth.toString());
      setHeight(initialHeight.toString());
      setUnit(initialUnit);
      if (onClearInitialValues) {
        onClearInitialValues();
      }
    }
  }, [initialWidth, initialHeight, initialUnit, onClearInitialValues]);

  // Numeric width and height parsed safely
  const wNum = parseFloat(width) || 0;
  const hNum = parseFloat(height) || 0;

  // Conversion calculations
  const inchesBase = toInches(wNum, unit);
  const hInchesBase = toInches(hNum, unit);

  // Equivalents list
  const equivalents = Object.keys(unitLabels).map(u => {
    const computedW = fromInches(inchesBase, u);
    const computedH = fromInches(hInchesBase, u);
    
    // Rounding based on unit for cleaner display
    let roundedW = computedW.toFixed(2);
    let roundedH = computedH.toFixed(2);
    
    if (u === 'px') {
      roundedW = Math.round(computedW).toString();
      roundedH = Math.round(computedH).toString();
    } else if (u === 'mm') {
      roundedW = Math.round(computedW).toString();
      roundedH = Math.round(computedH).toString();
    } else if (u === 'cm') {
      roundedW = computedW.toFixed(1);
      roundedH = computedH.toFixed(1);
    }
    
    // Clean trailing .00
    if (roundedW.endsWith('.00')) roundedW = roundedW.slice(0, -3);
    if (roundedH.endsWith('.00')) roundedH = roundedH.slice(0, -3);

    return {
      code: u,
      label: unitLabels[u],
      formatted: `${roundedW} × ${roundedH} ${u}`
    };
  });

  const aspectStr = getAspectRatio(wNum, hNum);
  const pxWidth = Math.round(fromInches(inchesBase, 'px'));
  const pxHeight = Math.round(fromInches(hInchesBase, 'px'));
  const resolutionClass = getResolutionClass(pxWidth, pxHeight);
  const pixelCountStr = (pxWidth * pxHeight).toLocaleString();
  const megapixelCount = ((pxWidth * pxHeight) / 1000000).toFixed(2);
  const orientation = wNum > hNum ? 'Landscape' : wNum < hNum ? 'Portrait' : 'Square';

  // Diagonal calculated in input unit
  const diagonal = Math.sqrt(wNum * wNum + hNum * hNum);
  const diagonalInches = Math.sqrt(inchesBase * inchesBase + hInchesBase * hInchesBase);

  // Generate copy helper
  const handleCopyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const toggleGrid = (option: keyof typeof gridOptions) => {
    setGridOptions(prev => ({ ...prev, [option]: !prev[option] }));
  };

  // Canvas PNG downloader
  const handleDownloadPNG = () => {
    if (pxWidth <= 0 || pxHeight <= 0) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = pxWidth;
    canvas.height = pxHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pxWidth, pxHeight);
    
    // Grid Lines drawing (same logic scaled to high-res PNG)
    if (gridOptions.centerLines) {
      ctx.strokeStyle = 'rgba(201, 162, 39, 0.6)';
      ctx.lineWidth = Math.max(1.5, Math.round(pxWidth / 600));
      ctx.setLineDash([Math.round(pxWidth / 150), Math.round(pxWidth / 150)]);
      
      ctx.beginPath();
      ctx.moveTo(pxWidth / 2, 0); ctx.lineTo(pxWidth / 2, pxHeight);
      ctx.moveTo(0, pxHeight / 2); ctx.lineTo(pxWidth, pxHeight / 2);
      ctx.stroke();
    }
    
    if (gridOptions.ruleOfThirds) {
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.4)';
      ctx.lineWidth = Math.max(1, Math.round(pxWidth / 800));
      ctx.setLineDash([Math.round(pxWidth / 200), Math.round(pxWidth / 200)]);
      
      for (let i = 1; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo((pxWidth / 3) * i, 0); ctx.lineTo((pxWidth / 3) * i, pxHeight);
        ctx.moveTo(0, (pxHeight / 3) * i); ctx.lineTo(pxWidth, (pxHeight / 3) * i);
        ctx.stroke();
      }
    }

    if (gridOptions.safeArea) {
      ctx.strokeStyle = 'rgba(201, 162, 39, 0.7)';
      ctx.lineWidth = Math.max(1.5, Math.round(pxWidth / 500));
      ctx.setLineDash([Math.round(pxWidth / 100), Math.round(pxWidth / 100)]);
      const marginW = pxWidth * 0.1;
      const marginH = pxHeight * 0.1;
      ctx.strokeRect(marginW, marginH, pxWidth - 2 * marginW, pxHeight - 2 * marginH);
    }

    if (gridOptions.goldenRatio) {
      ctx.strokeStyle = 'rgba(201, 162, 39, 0.45)';
      ctx.lineWidth = Math.max(1.5, Math.round(pxWidth / 600));
      ctx.setLineDash([]);
      
      const g1W = pxWidth * 0.382;
      const g2W = pxWidth * 0.618;
      const g1H = pxHeight * 0.382;
      const g2H = pxHeight * 0.618;
      
      ctx.beginPath();
      ctx.moveTo(g1W, 0); ctx.lineTo(g1W, pxHeight);
      ctx.moveTo(g2W, 0); ctx.lineTo(g2W, pxHeight);
      ctx.moveTo(0, g1H); ctx.lineTo(pxWidth, g1H);
      ctx.moveTo(0, g2H); ctx.lineTo(pxWidth, g2H);
      ctx.stroke();
      
      // Draw golden spiral arcs on exported canvas as well
      drawGoldenSpiral(ctx, pxWidth, pxHeight, 'rgba(201, 162, 39, 0.25)');
    }

    if (gridOptions.bleedArea) {
      const bleedPx = Math.round(fromInches(0.125, 'px'));
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.lineWidth = Math.max(1, Math.round(pxWidth / 900));
      ctx.setLineDash([Math.round(pxWidth / 150), Math.round(pxWidth / 150)]);
      ctx.strokeRect(bleedPx, bleedPx, pxWidth - 2 * bleedPx, pxHeight - 2 * bleedPx);
    }
    
    // External bounds line
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = Math.max(2, Math.round(pxWidth / 400));
    ctx.setLineDash([]);
    ctx.strokeRect(0, 0, pxWidth, pxHeight);

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `aura-canvas-${pxWidth}x${pxHeight}.png`;
    link.click();
  };

  // Helper to draw beautiful golden spiral
  const drawGoldenSpiral = (ctx: CanvasRenderingContext2D, w: number, h: number, strokeColor: string) => {
    ctx.save();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = Math.max(1.5, Math.round(w / 500));
    ctx.setLineDash([]);
    
    // Set up points and radiuses for golden spiral sections
    let x = 0;
    let y = 0;
    let size = Math.min(w, h);
    
    // Simple Golden Spiral representation inside the bounding box
    // Iteratively trace arcs matching Fibonacci squares
    let currentW = w;
    let currentH = h;
    let currentX = 0;
    let currentY = 0;
    
    ctx.beginPath();
    // Section 1: Top-Right Arc
    ctx.arc(currentX + currentW * 0.618, currentY + currentH * 0.618, currentW * 0.618, Math.PI, Math.PI * 1.5);
    // Section 2: Bottom-Right Arc
    ctx.arc(currentX + currentW * 0.618, currentY + currentH * 0.382, currentW * 0.382, Math.PI * 1.5, 0);
    // Section 3: Bottom-Left Arc
    ctx.arc(currentX + currentW * 0.382, currentY + currentH * 0.382, currentW * 0.236, 0, Math.PI * 0.5);
    // Section 4: Top-Left Arc
    ctx.arc(currentX + currentW * 0.382, currentY + currentH * 0.618, currentW * 0.146, Math.PI * 0.5, Math.PI);
    
    ctx.stroke();
    ctx.restore();
  };

  // Canvas SVG Downloader
  const handleDownloadSVG = () => {
    if (pxWidth <= 0 || pxHeight <= 0) return;
    
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${pxWidth} ${pxHeight}" width="${pxWidth}" height="${pxHeight}">
  <rect width="100%" height="100%" fill="#ffffff" stroke="#dddddd" stroke-width="2" />\n`;
  
    if (gridOptions.centerLines) {
      svgContent += `  <!-- Center Lines -->
  <line x1="${pxWidth / 2}" y1="0" x2="${pxWidth / 2}" y2="${pxHeight}" stroke="#C9A227" stroke-width="2" stroke-dasharray="6,6" opacity="0.6" />
  <line x1="0" y1="${pxHeight / 2}" x2="${pxWidth}" y2="${pxHeight / 2}" stroke="#C9A227" stroke-width="2" stroke-dasharray="6,6" opacity="0.6" />\n`;
    }
    
    if (gridOptions.ruleOfThirds) {
      svgContent += `  <!-- Rule of Thirds -->
  <line x1="${pxWidth / 3}" y1="0" x2="${pxWidth / 3}" y2="${pxHeight}" stroke="#888888" stroke-width="1.5" stroke-dasharray="5,5" opacity="0.5" />
  <line x1="${(2 * pxWidth) / 3}" y1="0" x2="${(2 * pxWidth) / 3}" y2="${pxHeight}" stroke="#888888" stroke-width="1.5" stroke-dasharray="5,5" opacity="0.5" />
  <line x1="0" y1="${pxHeight / 3}" x2="${pxWidth}" y2="${pxHeight / 3}" stroke="#888888" stroke-width="1.5" stroke-dasharray="5,5" opacity="0.5" />
  <line x1="0" y1="${(2 * pxHeight) / 3}" x2="${pxWidth}" y2="${(2 * pxHeight) / 3}" stroke="#888888" stroke-width="1.5" stroke-dasharray="5,5" opacity="0.5" />\n`;
    }

    if (gridOptions.safeArea) {
      const marginW = pxWidth * 0.1;
      const marginH = pxHeight * 0.1;
      svgContent += `  <!-- Title Safe Area -->
  <rect x="${marginW}" y="${marginH}" width="${pxWidth - 2 * marginW}" height="${pxHeight - 2 * marginH}" fill="none" stroke="#C9A227" stroke-width="2" stroke-dasharray="8,8" opacity="0.75" />\n`;
    }

    if (gridOptions.goldenRatio) {
      const g1W = pxWidth * 0.382;
      const g2W = pxWidth * 0.618;
      const g1H = pxHeight * 0.382;
      const g2H = pxHeight * 0.618;
      svgContent += `  <!-- Golden Ratio Grid -->
  <line x1="${g1W}" y1="0" x2="${g1W}" y2="${pxHeight}" stroke="#C9A227" stroke-width="1.5" opacity="0.5" />
  <line x1="${g2W}" y1="0" x2="${g2W}" y2="${pxHeight}" stroke="#C9A227" stroke-width="1.5" opacity="0.5" />
  <line x1="0" y1="${g1H}" x2="${pxWidth}" y2="${g1H}" stroke="#C9A227" stroke-width="1.5" opacity="0.5" />
  <line x1="0" y1="${g2H}" x2="${pxWidth}" y2="${g2H}" stroke="#C9A227" stroke-width="1.5" opacity="0.5" />\n`;
    }

    if (gridOptions.bleedArea) {
      const bleedPx = Math.round(fromInches(0.125, 'px'));
      svgContent += `  <!-- Bleed Margin Area -->
  <rect x="${bleedPx}" y="${bleedPx}" width="${pxWidth - 2 * bleedPx}" height="${pxHeight - 2 * bleedPx}" fill="none" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.8" />
  <text x="${bleedPx + 15}" y="${bleedPx + 20}" fill="#ef4444" font-family="monospace" font-size="11" font-weight="bold" opacity="0.8">BLEED LIMIT (0.125")</text>\n`;
    }

    svgContent += `</svg>`;
    
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aura-canvas-${pxWidth}x${pxHeight}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Download a Blank template TXT info schema
  const handleDownloadTemplate = () => {
    const textData = `Aura AI Canvas Template Schema
==============================
Width: ${wNum} ${unitLabels[unit]}
Height: ${hNum} ${unitLabels[unit]}
Aspect Ratio: ${aspectStr}
DPI Mode: 96 DPI Digital Conversion

Equivalents across all design units:
------------------------------------
${equivalents.map(eq => `- ${eq.label}: ${eq.formatted}`).join('\n')}

Calculated Visual Properties:
-----------------------------
Orientation: ${orientation}
Megapixels: ${megapixelCount} MP (${pixelCountStr} pixels)
Resolution Category: ${resolutionClass}
Diagonal: ${diagonal.toFixed(2)} ${unit} (${diagonalInches.toFixed(2)} inches)

Prepared by Aura AI - Premium Designer Toolkit.
`;

    const blob = new Blob([textData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `canvas_template_${pxWidth}x${pxHeight}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-6 items-stretch">
      
      {/* Left Column: Interactive Settings Workspace */}
      <div className="lg:col-span-5 flex flex-col space-y-6 bg-[#121212] border border-white/5 p-6 rounded-none shadow-2xl">
        <div className="border-b border-white/10 pb-4">
          <span className="font-mono text-[9px] tracking-[0.35em] text-[#C9A227] uppercase block">
            ◇ Ratio Workspace ◇
          </span>
          <h3 className="font-display text-xl font-light text-white tracking-wide mt-1">
            Canvas Dimension Planner
          </h3>
          <p className="font-mono text-[8px] text-[#888888] tracking-widest uppercase mt-0.5">
            Unit accurate layout planning
          </p>
        </div>

        {/* Numeric Dimension Settings Form */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-mono text-[8px] text-[#888888] tracking-widest uppercase block">
                Width
              </label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-white/10 text-white font-mono text-sm px-3 py-2.5 outline-none focus:border-[#C9A227]/50 focus:bg-[#202020] transition-colors"
                min="1"
                placeholder="1920"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="font-mono text-[8px] text-[#888888] tracking-widest uppercase block">
                Height
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-white/10 text-white font-mono text-sm px-3 py-2.5 outline-none focus:border-[#C9A227]/50 focus:bg-[#202020] transition-colors"
                min="1"
                placeholder="1080"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-[8px] text-[#888888] tracking-widest uppercase block">
              Measurement Unit
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-white/10 text-white font-mono text-xs px-3 py-2.5 outline-none focus:border-[#C9A227]/50 focus:bg-[#202020] transition-all cursor-pointer"
            >
              {Object.keys(unitLabels).map((key) => (
                <option key={key} value={key}>
                  {unitLabels[key]} ({key})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Equivalent Conversions Table */}
        <div className="bg-[#1A1A1A]/50 border border-white/5 p-4 space-y-3">
          <span className="font-mono text-[8px] tracking-widest text-[#C9A227] uppercase block">
            ⬦ Equivalent Measurements
          </span>
          <div className="space-y-2">
            {equivalents.map((eq) => (
              <div 
                key={eq.code} 
                className={`flex items-center justify-between text-xs py-1 px-2 font-mono transition-colors rounded-none ${
                  eq.code === unit ? 'bg-[#C9A227]/10 border border-[#C9A227]/20 text-[#F5F5F5]' : 'text-[#A3A3A3] hover:text-white'
                }`}
              >
                <span className="text-[10px] tracking-wider uppercase">{eq.label}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-medium">{eq.formatted}</span>
                  <button 
                    onClick={() => handleCopyText(eq.formatted.split(' ').slice(0, 3).join(' '), eq.code)}
                    className="p-0.5 text-[#666666] hover:text-[#C9A227] transition-colors cursor-pointer"
                    title={`Copy dimensions in ${eq.label}`}
                  >
                    {copiedField === eq.code ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grids Overlay Checklist Selection */}
        <div className="space-y-3">
          <span className="font-mono text-[8px] tracking-widest text-[#888888] uppercase block">
            ⬦ Visual Grid Overlays
          </span>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(gridOptions).map((opt) => {
              const labelMap: Record<string, string> = {
                safeArea: 'Safe Area (90%)',
                ruleOfThirds: 'Rule of Thirds',
                goldenRatio: 'Golden Ratio Spiral',
                centerLines: 'Center Lines',
                bleedArea: 'Bleed Border (0.125")'
              };
              const active = gridOptions[opt as keyof typeof gridOptions];
              return (
                <button
                  key={opt}
                  onClick={() => toggleGrid(opt as keyof typeof gridOptions)}
                  className={`p-2 font-mono text-[9px] tracking-wider uppercase border text-left flex items-center justify-between transition-all cursor-pointer ${
                    active 
                      ? 'bg-[#C9A227]/10 text-[#C9A227] border-[#C9A227]/40 shadow-[0_0_8px_rgba(201,162,39,0.05)]' 
                      : 'bg-[#1A1A1A] text-[#888888] border-white/5 hover:border-white/10 hover:text-white'
                  }`}
                >
                  <span>{labelMap[opt] || opt}</span>
                  {active && <Check className="w-3 h-3 text-[#C9A227]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons to download canvases */}
        <div className="pt-2 border-t border-white/10 space-y-2">
          <span className="font-mono text-[8px] tracking-widest text-[#888888] uppercase block mb-1">
            ⬦ Export Canvas Template
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleDownloadPNG}
              className="flex items-center justify-center space-x-1 font-mono text-[8px] tracking-widest bg-[#1A1A1A] border border-white/10 hover:border-[#C9A227]/30 hover:text-[#C9A227] py-2 px-1 text-white uppercase transition-colors cursor-pointer text-center font-semibold"
            >
              <Download className="w-3 h-3 shrink-0" />
              <span>PNG Grid</span>
            </button>
            <button
              onClick={handleDownloadSVG}
              className="flex items-center justify-center space-x-1 font-mono text-[8px] tracking-widest bg-[#1A1A1A] border border-white/10 hover:border-[#C9A227]/30 hover:text-[#C9A227] py-2 px-1 text-white uppercase transition-colors cursor-pointer text-center font-semibold"
            >
              <Download className="w-3 h-3 shrink-0" />
              <span>SVG Vector</span>
            </button>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center justify-center space-x-1 font-mono text-[8px] tracking-widest bg-[#C9A227] hover:bg-[#B8911C] py-2 px-1 text-black uppercase transition-colors cursor-pointer text-center font-semibold"
            >
              <Download className="w-3 h-3 shrink-0" />
              <span>TXT Schema</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Dynamic Live Ratio Canvas Preview */}
      <div className="lg:col-span-7 flex flex-col space-y-4">
        
        {/* Dynamic Aspect Ratio Canvas Box */}
        <div className="flex-1 min-h-[350px] bg-[#0A0A0A] border border-white/5 relative flex items-center justify-center p-8 select-none overflow-hidden">
          {/* Grid pattern backdrop representing drafts */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#161616_1px,transparent_1px),linear-gradient(to_bottom,#161616_1px,transparent_1px)] bg-[size:16px_16px] opacity-25 pointer-events-none" />

          {/* Sizable white canvas maintaining aspect ratio cleanly */}
          {wNum > 0 && hNum > 0 ? (
            <div 
              className="relative bg-white border border-neutral-300 shadow-2xl transition-all duration-300"
              style={{
                aspectRatio: `${wNum} / ${hNum}`,
                maxWidth: '92%',
                maxHeight: '92%',
                width: wNum >= hNum ? '100%' : 'auto',
                height: hNum > wNum ? '100%' : 'auto',
              }}
            >
              {/* Overlay Grids based on choices */}
              
              {/* Center cross lines */}
              {gridOptions.centerLines && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Vertical center */}
                  <div className="absolute top-0 bottom-0 left-1/2 w-px border-l border-dashed border-[#C9A227] opacity-75 -translate-x-1/2" />
                  {/* Horizontal center */}
                  <div className="absolute left-0 right-0 top-1/2 h-px border-t border-dashed border-[#C9A227] opacity-75 -translate-y-1/2" />
                </div>
              )}

              {/* Rule of Thirds lines */}
              {gridOptions.ruleOfThirds && (
                <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
                  <div className="border-r border-b border-dashed border-neutral-400 opacity-60" />
                  <div className="border-r border-b border-dashed border-neutral-400 opacity-60" />
                  <div className="border-b border-dashed border-neutral-400 opacity-60" />
                  <div className="border-r border-b border-dashed border-neutral-400 opacity-60" />
                  <div className="border-r border-b border-dashed border-neutral-400 opacity-60" />
                  <div className="border-b border-dashed border-neutral-400 opacity-60" />
                  <div className="border-r border-dashed border-neutral-400 opacity-60" />
                  <div className="border-r border-dashed border-neutral-400 opacity-60" />
                  <div className="border-none" />
                </div>
              )}

              {/* Safe area (Title safe 90% boundary) */}
              {gridOptions.safeArea && (
                <div className="absolute inset-[10%] border border-dashed border-[#C9A227] opacity-80 pointer-events-none flex items-start p-1.5 font-mono text-[8px] text-[#C9A227] tracking-wider select-none">
                  <span>SAFE AREA (90%)</span>
                </div>
              )}

              {/* Bleed margin area placeholder */}
              {gridOptions.bleedArea && (
                <div className="absolute inset-2 border border-dashed border-red-500 opacity-80 pointer-events-none flex items-end justify-end p-1.5 font-mono text-[8px] text-red-500 tracking-wider select-none">
                  <span>BLEED PLACEHOLDER (0.125 in)</span>
                </div>
              )}

              {/* Golden Ratio (grid + spiral line) */}
              {gridOptions.goldenRatio && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {/* Golden grid verticals */}
                  <div className="absolute top-0 bottom-0 left-[38.2%] w-px bg-[#C9A227] opacity-40" />
                  <div className="absolute top-0 bottom-0 left-[61.8%] w-px bg-[#C9A227] opacity-40" />
                  {/* Golden grid horizontals */}
                  <div className="absolute left-0 right-0 top-[38.2%] h-px bg-[#C9A227] opacity-40" />
                  <div className="absolute left-0 right-0 top-[61.8%] h-px bg-[#C9A227] opacity-40" />
                  
                  {/* Fibonacci Arc visualization */}
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full text-[#C9A227] opacity-30 stroke-current fill-none stroke-1.5">
                    <path d="M 0,0 A 61.8,61.8 0 0,1 61.8,61.8" />
                    <path d="M 61.8,61.8 A 38.2,38.2 0 0,1 23.6,100" />
                    <path d="M 23.6,100 A 23.6,23.6 0 0,1 0,76.4" />
                    <path d="M 0,76.4 A 14.6,14.6 0 0,1 14.6,61.8" />
                  </svg>
                </div>
              )}

              {/* Centered Size Readout */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="font-mono text-[10px] bg-black/85 border border-white/15 px-3 py-1.5 text-[#F5F5F5] uppercase tracking-widest leading-none">
                  {wNum} × {hNum} {unit}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center font-mono text-xs text-white/40">
              <AlertCircle className="w-6 h-6 text-[#C9A227] mx-auto mb-2 opacity-60" />
              Please enter valid dimension parameters.
            </div>
          )}

          {/* Quick instructions in absolute corner */}
          <div className="absolute bottom-3 left-4 font-mono text-[8px] tracking-widest text-[#888888] uppercase">
            📐 {aspectStr} • Accurate responsive aspect scale
          </div>
        </div>

        {/* Visual Information HUD Panel */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#121212] border border-white/5 p-4 rounded-none">
          {/* Aspect Ratio block */}
          <div className="space-y-1">
            <span className="font-mono text-[8px] text-[#666666] tracking-widest uppercase block">
              Aspect Ratio
            </span>
            <div className="flex items-center space-x-2">
              <span className="font-display text-sm font-medium text-[#F5F5F5]">{aspectStr}</span>
            </div>
          </div>

          {/* Diagonal Length block */}
          <div className="space-y-1">
            <span className="font-mono text-[8px] text-[#666666] tracking-widest uppercase block">
              Diagonal Length
            </span>
            <div className="flex flex-col">
              <span className="font-display text-xs font-medium text-[#F5F5F5]">
                {diagonal.toFixed(2)} {unit}
              </span>
              <span className="font-mono text-[8px] text-[#888888]">
                ({diagonalInches.toFixed(2)} in)
              </span>
            </div>
          </div>

          {/* Orientation & Icon block */}
          <div className="space-y-1">
            <span className="font-mono text-[8px] text-[#666666] tracking-widest uppercase block">
              Orientation
            </span>
            <div className="flex items-center space-x-1.5">
              <span className="font-display text-xs font-medium text-[#F5F5F5] uppercase tracking-wider">
                {orientation}
              </span>
              <div className="border border-white/20 p-0.5 rounded-none flex items-center justify-center shrink-0">
                {orientation === 'Landscape' ? (
                  <div className="w-4 h-2.5 bg-[#C9A227]/30 border border-[#C9A227]/60" />
                ) : orientation === 'Portrait' ? (
                  <div className="w-2.5 h-4 bg-[#C9A227]/30 border border-[#C9A227]/60" />
                ) : (
                  <div className="w-3.5 h-3.5 bg-[#C9A227]/30 border border-[#C9A227]/60" />
                )}
              </div>
            </div>
          </div>

          {/* Resolution block */}
          <div className="space-y-1">
            <span className="font-mono text-[8px] text-[#666666] tracking-widest uppercase block">
              Classification
            </span>
            <div className="flex flex-col">
              <span className="font-display text-xs font-semibold text-[#C9A227] tracking-wide uppercase">
                {resolutionClass}
              </span>
              <span className="font-mono text-[8px] text-[#888888]">
                {pixelCountStr} px ({megapixelCount} MP)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
