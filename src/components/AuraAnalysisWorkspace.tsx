import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Type, Palette, Grid, Layers, AlertCircle, Copy, Check, 
  ChevronDown, ChevronUp, Download, Send, MessageSquare, ExternalLink, 
  HelpCircle, Maximize2, ChevronRight, Sliders, Play, Compass, RefreshCw,
  CheckSquare
} from 'lucide-react';
import { CreativeDirectorReport, DetectedElement, RedesignConcept, ElementColorItem } from '../types';
import DesignChat from './DesignChat';
import { PickedColor } from './DesignInspector';
import { rgbToHex, rgbToHsl, rgbToHsv, rgbToCmyk, getColorName } from '../utils/colorUtils';

interface AuraAnalysisWorkspaceProps {
  report: CreativeDirectorReport;
  activePickedColor: PickedColor | null;
  recentColors: PickedColor[];
  onSelectColor: (color: PickedColor) => void;
  onClearRecentColors: () => void;
  onLaunchSandbox: () => void;
  onDownloadPDF: () => void;
  isDownloadingPdf: boolean;
  activeElementId: string | null;
  onSelectElement: (id: string | null) => void;
  isInspectModeActive: boolean;
  setIsInspectModeActive: (active: boolean) => void;
}

export default function AuraAnalysisWorkspace({
  report,
  activePickedColor,
  recentColors,
  onSelectColor,
  onClearRecentColors,
  onLaunchSandbox,
  onDownloadPDF,
  isDownloadingPdf,
  activeElementId,
  onSelectElement,
  isInspectModeActive,
  setIsInspectModeActive
}: AuraAnalysisWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'overall' | 'inspector' | 'redesign' | 'tools'>('overall');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedConceptId, setSelectedConceptId] = useState<string>(
    report.redesignConcepts && report.redesignConcepts.length > 0 
      ? report.redesignConcepts[0].id 
      : 'concept-luxury'
  );

  // Inspector Accordions State
  const [openInspectorSections, setOpenInspectorSections] = useState({
    typography: true,
    color: true,
    positioning: true
  });

  const toggleInspectorSection = (sec: 'typography' | 'color' | 'positioning') => {
    setOpenInspectorSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  // Clipboard helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 1500);
  };

  // Convert a single hex color into detailed picked properties
  const parseHexToPickedColor = (hex: string): PickedColor => {
    // Basic cleanup
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 0;

    const hslVal = rgbToHsl(r, g, b);
    const hsvVal = rgbToHsv(r, g, b);
    const cmykVal = rgbToCmyk(r, g, b);
    const name = getColorName(r, g, b);

    return {
      hex: `#${cleanHex}`,
      rgb: `rgb(${r}, ${g}, ${b})`,
      hsl: `hsl(${hslVal.h}, ${hslVal.s}%, ${hslVal.l}%)`,
      hsv: `hsv(${hsvVal.h}, ${hsvVal.s}%, ${hsvVal.v}%)`,
      cmyk: `cmyk(${cmykVal.c}%, ${cmykVal.m}%, ${cmykVal.y}%, ${cmykVal.k}%)`,
      name,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const handleSelectSuggestedColor = (hex: string) => {
    const colorObj = parseHexToPickedColor(hex);
    onSelectColor(colorObj);
  };

  const handleExportPalette = (format: 'json' | 'css' | 'tailwind') => {
    let content = "";
    const colorsToExport = recentColors.length > 0 ? recentColors : report.color.improvedPalette.map(c => ({
      hex: c.hex,
      name: c.name
    }));

    if (format === 'json') {
      content = JSON.stringify(colorsToExport, null, 2);
    } else if (format === 'css') {
      content = ":root {\n" + colorsToExport.map((c, i) => `  --color-picked-${i + 1}: ${c.hex}; /* ${c.name} */`).join('\n') + "\n}";
    } else if (format === 'tailwind') {
      content = "colors: {\n" + colorsToExport.map((c, i) => `  'picked-${i + 1}': '${c.hex}', // ${c.name}`).join('\n') + "\n}";
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aura-palette-${format}.${format === 'json' ? 'json' : format === 'css' ? 'css' : 'js'}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Build granular scores for Level 1 Radar-style Categories
  const categoryScores = [
    { name: 'Typography', score: report.typography.score, icon: Type, desc: 'Font pairing, tracking, & reading flow.', summary: report.typography.solution },
    { name: 'Color Theory', score: report.color.score, icon: Palette, desc: 'Contrast ratio & aesthetic coordination.', summary: report.color.solution },
    { name: 'Layout', score: report.sizePositioning.score, icon: Grid, desc: 'Grid alignment & structural logic.', summary: report.sizePositioning.solution || 'Ensure consistent grid offsets.' },
    { name: 'Spacing', score: Math.max(30, report.sizePositioning.score - 5), icon: Sliders, desc: 'Negative space, paddings, & margin rhythm.', summary: 'Layout margins are slightly dense; introduce larger gaps.' },
    { name: 'Background', score: report.background.score, icon: Layers, desc: 'Environmental backdrop depth & textures.', summary: report.background.solution },
    { name: 'Visual Hierarchy', score: Math.min(100, report.sizePositioning.score + 6), icon: Compass, desc: 'Focal point priority & size variations.', summary: 'Slight scale adjustments will enhance item prioritization.' },
    { name: 'Accessibility', score: Math.round((report.typography.score + report.color.score) / 2), icon: AlertCircle, desc: 'Contrast safety thresholds & legibility.', summary: 'The design meets basic readability requirements but requires contrast polishing.' },
    { name: 'Consistency', score: Math.round((report.typography.score + report.sizePositioning.score) / 2), icon: CheckSquare, desc: 'Component styling & spacing repetition.', summary: 'Style signatures repetition maintains reasonable cohesion.' }
  ];

  // Selected element for Level 2 Inspector
  const selectedElement = report.elements?.find(e => e.id === activeElementId);

  // Selected redesign concept for Level 3 Redesign Preview
  const selectedConcept = report.redesignConcepts?.find(c => c.id === selectedConceptId) || report.redesignConcepts?.[0];

  return (
    <div className="flex flex-col h-full space-y-4">
      
      {/* Segmented Premium Workspace Navigation */}
      <div className="flex bg-[#121212] border border-white/10 p-1 rounded-none font-mono text-[9px] tracking-[0.2em] uppercase select-none overflow-x-auto shrink-0 custom-scrollbar">
        <button
          id="tab-btn-overall"
          onClick={() => setActiveTab('overall')}
          className={`flex-1 min-w-[90px] py-3 text-center transition-all cursor-pointer ${
            activeTab === 'overall'
              ? 'bg-[#C9A227] text-black font-semibold'
              : 'text-[#888888] hover:text-white hover:bg-white/5'
          }`}
        >
          Level 1: Overall
        </button>
        <button
          id="tab-btn-inspector"
          onClick={() => {
            setActiveTab('inspector');
            setIsInspectModeActive(true);
          }}
          className={`flex-1 min-w-[100px] py-3 text-center transition-all cursor-pointer ${
            activeTab === 'inspector'
              ? 'bg-[#C9A227] text-black font-semibold'
              : 'text-[#888888] hover:text-white hover:bg-white/5'
          }`}
        >
          Level 2: Inspector
        </button>
        <button
          id="tab-btn-redesign"
          onClick={() => {
            setActiveTab('redesign');
            setIsInspectModeActive(false);
          }}
          className={`flex-1 min-w-[105px] py-3 text-center transition-all cursor-pointer ${
            activeTab === 'redesign'
              ? 'bg-[#C9A227] text-black font-semibold'
              : 'text-[#888888] hover:text-white hover:bg-white/5'
          }`}
        >
          Level 3: Redesign
        </button>
        <button
          id="tab-btn-tools"
          onClick={() => {
            setActiveTab('tools');
            setIsInspectModeActive(false);
          }}
          className={`flex-1 min-w-[90px] py-3 text-center transition-all cursor-pointer ${
            activeTab === 'tools'
              ? 'bg-[#C9A227] text-black font-semibold'
              : 'text-[#888888] hover:text-white hover:bg-white/5'
          }`}
        >
          Color Palette
        </button>
      </div>

      {/* Main Tab Panels View */}
      <div className="flex-1 overflow-y-auto pr-1 min-h-0 custom-scrollbar">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: OVERALL DESIGN ANALYSIS */}
          {activeTab === 'overall' && (
            <motion.div
              key="tab-overall"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Aura Score Concentric Panel */}
              <div className="bg-[#121212] border border-[#C9A227]/30 p-5 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-10">
                  <div className="absolute -top-10 -right-10 w-40 h-40 border border-[#C9A227] rounded-full" />
                  <div className="absolute -top-14 -right-14 w-40 h-40 border border-dashed border-[#C9A227] rounded-full animate-spin" style={{ animationDuration: '60s' }} />
                </div>

                <div className="flex items-center space-x-5">
                  <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center border border-white/5 bg-black/40 rounded-full">
                    <svg className="absolute w-full h-full -rotate-90">
                      <circle cx="48" cy="48" r="42" className="stroke-white/5" strokeWidth="4" fill="transparent" />
                      <circle
                        cx="48"
                        cy="48"
                        r="42"
                        className="stroke-[#C9A227] transition-all duration-1000 ease-out"
                        strokeWidth="5"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 42}`}
                        strokeDashoffset={`${2 * Math.PI * 42 * (1 - (report.overallScore || 0) / 100)}`}
                      />
                    </svg>
                    <div className="text-center z-10">
                      <span className="font-display text-3xl font-light text-[#F5F5F5]">{report.overallScore || 0}</span>
                      <span className="text-[9px] font-mono text-[#666666] block -mt-1">/100</span>
                    </div>
                  </div>

                  <div>
                    <span className="font-mono text-[8px] tracking-[0.3em] text-[#C9A227] uppercase block">
                      Aura Design Score
                    </span>
                    <h3 className="font-display text-lg font-light text-white tracking-wide mt-1">
                      {(report.overallScore || 0) >= 90 ? 'PROFESSIONAL SUITE' :
                       (report.overallScore || 0) >= 70 ? 'STRIKING QUALITY' :
                       (report.overallScore || 0) >= 50 ? 'AVERAGE QUALITY' :
                       'SERIOUS REVISIONS SUGGESTED'}
                    </h3>
                    <p className="font-mono text-[8px] text-[#888888] tracking-widest uppercase mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-[#C9A227]" />
                      <span>Audited under strict {report.styleSelected} rules</span>
                    </p>
                  </div>
                </div>

                <div className="w-full md:w-auto text-center md:text-right border-t md:border-t-0 md:border-l border-white/10 pt-3 md:pt-0 md:pl-6">
                  <div className="font-mono text-[10px] text-[#666666] uppercase tracking-wider">Aesthetic Standard</div>
                  <div className="text-sm font-display text-white tracking-widest uppercase mt-0.5 font-semibold text-[#C9A227]">{report.styleSelected} Mode</div>
                </div>
              </div>

              {/* Category Scores Breakdown Dashboard Grid */}
              <div className="space-y-2">
                <span className="font-mono text-[8px] text-[#666666] uppercase tracking-[0.25em]">◇ Creative Metric Breakdown</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categoryScores.map((cat, idx) => {
                    const CatIcon = cat.icon;
                    return (
                      <div key={idx} className="bg-[#121212] border border-white/5 p-4 flex flex-col justify-between space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2.5">
                            <div className="p-1.5 bg-white/5 border border-white/10 text-[#C9A227]">
                              <CatIcon className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <h4 className="text-xs font-display font-light text-white uppercase tracking-wider">{cat.name}</h4>
                              <p className="text-[10px] text-[#888888] font-light leading-snug">{cat.desc}</p>
                            </div>
                          </div>
                          <div className="font-mono text-[11px] font-bold text-[#C9A227]">{cat.score}<span className="text-[8px] font-light text-[#666666]">/100</span></div>
                        </div>

                        <div className="space-y-1.5">
                          {/* Progress gauge bar */}
                          <div className="h-1 bg-white/5 rounded-none overflow-hidden">
                            <div className="h-full bg-[#C9A227] transition-all duration-1000" style={{ width: `${cat.score}%` }} />
                          </div>
                          {/* Quick summary bullet */}
                          <p className="text-[9px] text-[#A3A3A3] font-mono leading-relaxed truncate">{cat.summary}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Creative Director Statement Verdict */}
              <div className="bg-[#121212] border border-white/5 p-5 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227] animate-pulse" />
                  <span className="font-mono text-[8px] tracking-[0.3em] text-[#C9A227] uppercase">
                    Creative Director Verdict
                  </span>
                </div>
                <p className="text-xs font-sans font-light leading-relaxed text-[#D1D1D1] italic">
                  "{report.overallVerdict}"
                </p>
              </div>

              {/* PDF Export & Live Chat */}
              <div className="bg-[#121212] border border-white/5 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-display text-xs font-light text-white tracking-wider uppercase">
                    Audit Export Options
                  </h4>
                  <p className="font-mono text-[8px] text-[#666666] tracking-widest uppercase">
                    Download complete creative audit report
                  </p>
                </div>
                <button
                  onClick={onDownloadPDF}
                  disabled={isDownloadingPdf}
                  className="flex items-center space-x-2 font-mono text-[9px] tracking-widest text-[#050505] bg-[#C9A227] hover:bg-[#E5B92D] py-2.5 px-5 uppercase transition-all duration-300 cursor-pointer disabled:opacity-50 font-semibold shadow-[0_4px_15px_rgba(201,162,39,0.15)]"
                >
                  <Download className={`w-3.5 h-3.5 ${isDownloadingPdf ? 'animate-bounce' : ''}`} />
                  <span>{isDownloadingPdf ? 'COMPILING REPORT...' : 'EXPORT PDF REPORT'}</span>
                </button>
              </div>

              {/* Embedded Chat */}
              <DesignChat report={report} />
            </motion.div>
          )}

          {/* TAB 2: INTERACTIVE ELEMENT INSPECTOR */}
          {activeTab === 'inspector' && (
            <motion.div
              key="tab-inspector"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Element inspect active header banner */}
              <div className="bg-black/40 border border-[#C9A227]/20 p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                  <div>
                    <h4 className="text-xs font-display text-white uppercase tracking-wider font-semibold">Inspect Workspace Active</h4>
                    <p className="font-mono text-[8px] text-[#888888] tracking-widest uppercase">
                      Select elements directly on the left image or use the layer tree below
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsInspectModeActive(!isInspectModeActive)}
                  className={`font-mono text-[8px] tracking-wider uppercase px-2.5 py-1 border transition-all cursor-pointer ${
                    isInspectModeActive 
                      ? 'border-[#C9A227] text-[#C9A227] bg-[#C9A227]/10' 
                      : 'border-white/10 text-[#888888] hover:text-white'
                  }`}
                >
                  {isInspectModeActive ? 'Inspect On' : 'Inspect Off'}
                </button>
              </div>

              {/* NO SELECTED ELEMENT: Render Layer Tree */}
              {!selectedElement ? (
                <div className="space-y-3">
                  <span className="font-mono text-[8px] text-[#666666] uppercase tracking-[0.25em]">◇ Detected Asset Layer Tree</span>
                  <div className="bg-[#121212] border border-white/5 overflow-hidden">
                    <table className="w-full text-left font-mono text-[10px]">
                      <thead>
                        <tr className="border-b border-white/10 bg-black/40 text-[#666666] uppercase text-[8px] tracking-wider">
                          <th className="p-3 pl-4">Layer Name</th>
                          <th className="p-3">Type</th>
                          <th className="p-3 text-right pr-4">Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {report.elements && report.elements.map((elem) => {
                          return (
                            <tr 
                              key={elem.id}
                              onClick={() => {
                                onSelectElement(elem.id);
                                setIsInspectModeActive(true);
                              }}
                              className="group/row hover:bg-white/5 transition-colors cursor-pointer"
                            >
                              <td className="p-3 pl-4 text-white font-medium flex items-center space-x-2">
                                <span className="w-1.5 h-1.5 bg-[#C9A227] rounded-none group-hover/row:scale-125 transition-transform" />
                                <span className="text-xs font-display font-light text-white tracking-wide">{elem.name}</span>
                              </td>
                              <td className="p-3">
                                <span className="text-[9px] uppercase tracking-wider bg-white/5 border border-white/10 px-1.5 py-0.5 text-[#A3A3A3]">
                                  {elem.type}
                                </span>
                              </td>
                              <td className="p-3 text-right pr-4">
                                <span className={`font-bold ${
                                  elem.score >= 90 ? 'text-emerald-400' :
                                  elem.score >= 70 ? 'text-yellow-400' : 'text-red-400'
                                }`}>
                                  {elem.score}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-6 bg-[#121212] border border-dashed border-white/10 text-center space-y-2">
                    <HelpCircle className="w-6 h-6 text-[#A3A3A3] mx-auto opacity-50" />
                    <p className="text-xs text-[#A3A3A3] font-light">Interactive Alignment Active</p>
                    <p className="text-[10px] text-[#666666] font-mono uppercase tracking-wider">
                      Hover and click any block on the left image canvas to inspect its direct properties.
                    </p>
                  </div>
                </div>
              ) : (
                /* SELECTED ELEMENT DETAILS PANEL */
                <div className="space-y-4">
                  {/* Selected Layer Info Card Header */}
                  <div className="bg-[#121212] border border-[#C9A227]/30 p-4 flex items-center justify-between">
                    <div>
                      <button
                        onClick={() => onSelectElement(null)}
                        className="font-mono text-[8px] text-[#C9A227] hover:underline uppercase tracking-wider flex items-center gap-1 cursor-pointer mb-1"
                      >
                        ← Back to Layers Tree
                      </button>
                      <h3 className="font-display text-base font-light text-white tracking-wide">
                        {selectedElement.name}
                      </h3>
                      <p className="font-mono text-[8px] text-[#888888] tracking-widest uppercase mt-0.5">
                        Element Type: <span className="text-white">{selectedElement.type}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-[8px] text-[#666666] uppercase block">Aura Score</span>
                      <span className={`font-mono text-lg font-bold ${
                        selectedElement.score >= 90 ? 'text-emerald-400' :
                        selectedElement.score >= 70 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {selectedElement.score}/100
                      </span>
                    </div>
                  </div>

                  {/* Inspector accordions list */}
                  <div className="space-y-3">
                    
                    {/* ACCORDION 1: TYPOGRAPHY PARAMETERS */}
                    {selectedElement.typography && (
                      <div className="bg-[#121212] border border-white/5 rounded-none overflow-hidden">
                        <button
                          onClick={() => toggleInspectorSection('typography')}
                          className="w-full p-3.5 bg-black/20 hover:bg-black/40 flex items-center justify-between text-left font-mono text-[9px] tracking-wider uppercase border-b border-white/5 transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <Type className="w-3.5 h-3.5 text-[#C9A227]" />
                            Typographic Parameters
                          </span>
                          {openInspectorSections.typography ? <ChevronUp className="w-4 h-4 text-[#888888]" /> : <ChevronDown className="w-4 h-4 text-[#888888]" />}
                        </button>

                        {openInspectorSections.typography && (
                          <div className="p-4 space-y-4 text-xs font-mono">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {/* Text content field */}
                              <div className="p-2.5 bg-black/30 border border-white/5 flex items-start justify-between col-span-2">
                                <div className="min-w-0 flex-1">
                                  <span className="text-[8px] text-[#666666] block uppercase tracking-wider mb-0.5">Extracted Value (OCR)</span>
                                  <span className="text-white text-xs select-all block truncate italic">"{selectedElement.typography.text}"</span>
                                </div>
                                <button
                                  onClick={() => handleCopy(selectedElement.typography!.text, 'ocr')}
                                  className="p-1 text-[#666666] hover:text-[#C9A227] transition-colors cursor-pointer"
                                >
                                  {copiedField === 'ocr' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>

                              {/* Font Family / Category */}
                              <div className="p-2.5 bg-black/30 border border-white/5 flex items-center justify-between">
                                <div>
                                  <span className="text-[8px] text-[#666666] block uppercase">Current Font</span>
                                  <span className="text-white select-all">{selectedElement.typography.fontCategory}</span>
                                </div>
                                <button
                                  onClick={() => handleCopy(selectedElement.typography!.fontCategory, 'font')}
                                  className="p-1 text-[#666666] hover:text-[#C9A227] transition-colors cursor-pointer"
                                >
                                  {copiedField === 'font' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>

                              {/* Weight */}
                              <div className="p-2.5 bg-black/30 border border-white/5 flex items-center justify-between">
                                <div>
                                  <span className="text-[8px] text-[#666666] block uppercase">Current Weight</span>
                                  <span className="text-white select-all">{selectedElement.typography.weight}</span>
                                </div>
                                <button
                                  onClick={() => handleCopy(selectedElement.typography!.weight, 'weight')}
                                  className="p-1 text-[#666666] hover:text-[#C9A227] transition-colors cursor-pointer"
                                >
                                  {copiedField === 'weight' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>

                              {/* Readability / Score */}
                              <div className="p-2.5 bg-black/30 border border-white/5 flex items-center justify-between">
                                <div>
                                  <span className="text-[8px] text-[#666666] block uppercase">Readability</span>
                                  <span className="text-white select-all">{selectedElement.typography.readability}</span>
                                </div>
                                <button
                                  onClick={() => handleCopy(selectedElement.typography!.readability, 'readability')}
                                  className="p-1 text-[#666666] hover:text-[#C9A227] transition-colors cursor-pointer"
                                >
                                  {copiedField === 'readability' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>

                              {/* Alignment */}
                              <div className="p-2.5 bg-black/30 border border-white/5 flex items-center justify-between">
                                <div>
                                  <span className="text-[8px] text-[#666666] block uppercase">Current Align</span>
                                  <span className="text-white select-all">{selectedElement.typography.alignment}</span>
                                </div>
                                <button
                                  onClick={() => handleCopy(selectedElement.typography!.alignment, 'align')}
                                  className="p-1 text-[#666666] hover:text-[#C9A227] transition-colors cursor-pointer"
                                >
                                  {copiedField === 'align' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>

                              {/* Line Height & Letter Spacing */}
                              <div className="p-2.5 bg-black/30 border border-white/5 flex items-center justify-between">
                                <div>
                                  <span className="text-[8px] text-[#666666] block uppercase">Line Height</span>
                                  <span className="text-white select-all">{selectedElement.typography.lineHeight || '1.2'}</span>
                                </div>
                                <button
                                  onClick={() => handleCopy(selectedElement.typography!.lineHeight || '1.2', 'lh')}
                                  className="p-1 text-[#666666] hover:text-[#C9A227] transition-colors cursor-pointer"
                                >
                                  {copiedField === 'lh' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>

                              <div className="p-2.5 bg-black/30 border border-white/5 flex items-center justify-between">
                                <div>
                                  <span className="text-[8px] text-[#666666] block uppercase">Letter Spacing</span>
                                  <span className="text-white select-all">{selectedElement.typography.letterSpacing || 'normal'}</span>
                                </div>
                                <button
                                  onClick={() => handleCopy(selectedElement.typography!.letterSpacing || 'normal', 'ls')}
                                  className="p-1 text-[#666666] hover:text-[#C9A227] transition-colors cursor-pointer"
                                >
                                  {copiedField === 'ls' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>

                            {/* Typography Problems */}
                            {selectedElement.typography.problems && selectedElement.typography.problems.length > 0 && (
                              <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-none space-y-1">
                                <span className="text-[8px] text-red-400 font-bold block uppercase tracking-wider">Detected Typographic Issues</span>
                                <ul className="list-disc pl-4 space-y-1 text-[#A3A3A3] text-[11px] font-sans">
                                  {selectedElement.typography.problems.map((prob, i) => (
                                    <li key={i}>{prob}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Typography Recommendations */}
                            <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-none space-y-2">
                              <span className="text-[8px] text-emerald-400 font-bold block uppercase tracking-wider">Aura AI Recommendations</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="p-2 bg-black/30 border border-white/5 flex items-center justify-between">
                                  <div>
                                    <span className="text-[8px] text-[#666666] block uppercase">Recommended Google Font</span>
                                    <span className="text-white select-all font-semibold">{selectedElement.typography.suggestedFont}</span>
                                  </div>
                                  <button
                                    onClick={() => handleCopy(selectedElement.typography!.suggestedFont, 'recFont')}
                                    className="p-1 text-[#666666] hover:text-[#C9A227] transition-colors cursor-pointer"
                                  >
                                    {copiedField === 'recFont' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>

                                <div className="p-2 bg-black/30 border border-white/5 flex items-center justify-between">
                                  <div>
                                    <span className="text-[8px] text-[#666666] block uppercase">Aesthetic Rationale</span>
                                    <span className="text-[#C9A227] select-all truncate block max-w-[140px]">{selectedElement.typography.reason || 'Pairing coordination.'}</span>
                                  </div>
                                  <button
                                    onClick={() => handleCopy(selectedElement.typography!.reason || 'Pairing coordination.', 'recReason')}
                                    className="p-1 text-[#666666] hover:text-[#C9A227] transition-colors cursor-pointer"
                                  >
                                    {copiedField === 'recReason' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ACCORDION 2: COLOR & CONTRAST PARAMETERS */}
                    {selectedElement.color && (
                      <div className="bg-[#121212] border border-white/5 rounded-none overflow-hidden">
                        <button
                          onClick={() => toggleInspectorSection('color')}
                          className="w-full p-3.5 bg-black/20 hover:bg-black/40 flex items-center justify-between text-left font-mono text-[9px] tracking-wider uppercase border-b border-white/5 transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <Palette className="w-3.5 h-3.5 text-[#C9A227]" />
                            Chromatic & Contrast Parameters
                          </span>
                          {openInspectorSections.color ? <ChevronUp className="w-4 h-4 text-[#888888]" /> : <ChevronDown className="w-4 h-4 text-[#888888]" />}
                        </button>

                        {openInspectorSections.color && (
                          <div className="p-4 space-y-4 text-xs font-mono">
                            <div className="space-y-2">
                              <span className="text-[8px] text-[#666666] uppercase block">Detected Colors Used</span>
                              
                              <div className="grid grid-cols-1 gap-2">
                                {selectedElement.color.colorsUsed && selectedElement.color.colorsUsed.map((col: ElementColorItem, i: number) => (
                                  <div key={i} className="p-3 bg-black/30 border border-white/5 flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <div 
                                        className="w-10 h-10 border border-white/10 shadow-lg" 
                                        style={{ backgroundColor: col.hex }}
                                      />
                                      <div>
                                        <span className="text-white select-all font-bold tracking-wider block">{col.hex}</span>
                                        <span className="text-[9px] text-[#888888] block">{col.name} ({col.usage})</span>
                                      </div>
                                    </div>

                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleSelectSuggestedColor(col.hex)}
                                        className="font-mono text-[8px] tracking-wider uppercase px-2.5 py-1.5 border border-[#C9A227]/30 hover:border-[#C9A227] text-white hover:text-[#C9A227] bg-[#1A1A1A] transition-colors cursor-pointer"
                                      >
                                        Load
                                      </button>
                                      <button
                                        onClick={() => handleCopy(col.hex, `hex-${i}`)}
                                        className="p-2 border border-white/10 bg-black/20 text-[#666666] hover:text-[#C9A227] transition-colors cursor-pointer"
                                      >
                                        {copiedField === `hex-${i}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {/* Element Color Score */}
                              <div className="p-2.5 bg-black/30 border border-white/5 flex items-center justify-between">
                                <div>
                                  <span className="text-[8px] text-[#666666] block uppercase">Chromatic Score</span>
                                  <span className="text-white select-all font-bold text-yellow-400">{selectedElement.color.score}/100</span>
                                </div>
                              </div>

                              <div className="p-2.5 bg-black/30 border border-white/5 flex items-center justify-between">
                                <div>
                                  <span className="text-[8px] text-[#666666] block uppercase">WCAG Accessibility</span>
                                  <span className="text-white text-[9px] block leading-relaxed">{selectedElement.color.reason || 'Adequate contrast detected.'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Suggested Color */}
                            <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-none space-y-2">
                              <span className="text-[8px] text-emerald-400 font-bold block uppercase tracking-wider">Aura AI Color Correction</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="p-2 bg-black/30 border border-white/5 flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-5 h-5 border border-white/10" style={{ backgroundColor: selectedElement.color.suggestedColor }} />
                                    <div>
                                      <span className="text-[8px] text-[#666666] block uppercase">Recommended Color</span>
                                      <span className="text-white select-all font-semibold">{selectedElement.color.suggestedColor}</span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleCopy(selectedElement.color!.suggestedColor, 'recColor')}
                                    className="p-1 text-[#666666] hover:text-[#C9A227] transition-colors cursor-pointer"
                                  >
                                    {copiedField === 'recColor' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>

                                <div className="p-2 bg-black/30 border border-white/5 flex items-center justify-between">
                                  <div>
                                    <span className="text-[8px] text-[#666666] block uppercase">Chromatic Reason</span>
                                    <span className="text-[#C9A227] select-all truncate block max-w-[140px]">{selectedElement.color.reason || 'Polished hierarchy'}</span>
                                  </div>
                                  <button
                                    onClick={() => handleCopy(selectedElement.color!.reason || 'Polished hierarchy', 'recUsage')}
                                    className="p-1 text-[#666666] hover:text-[#C9A227] transition-colors cursor-pointer"
                                  >
                                    {copiedField === 'recUsage' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ACCORDION 3: POSITIONING & ALIGNMENT PARAMETERS */}
                    {selectedElement.position && (
                      <div className="bg-[#121212] border border-white/5 rounded-none overflow-hidden">
                        <button
                          onClick={() => toggleInspectorSection('positioning')}
                          className="w-full p-3.5 bg-black/20 hover:bg-black/40 flex items-center justify-between text-left font-mono text-[9px] tracking-wider uppercase border-b border-white/5 transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <Grid className="w-3.5 h-3.5 text-[#C9A227]" />
                            Spatial & Position Parameters
                          </span>
                          {openInspectorSections.positioning ? <ChevronUp className="w-4 h-4 text-[#888888]" /> : <ChevronDown className="w-4 h-4 text-[#888888]" />}
                        </button>

                        {openInspectorSections.positioning && (
                          <div className="p-4 space-y-4 text-xs font-mono">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {/* Alignment & margins */}
                              <div className="p-2.5 bg-black/30 border border-white/5 flex items-center justify-between">
                                <div>
                                  <span className="text-[8px] text-[#666666] block uppercase">Current Alignment</span>
                                  <span className="text-white select-all">{selectedElement.position.alignment}</span>
                                </div>
                                <button
                                  onClick={() => handleCopy(selectedElement.position!.alignment, 'posAlign')}
                                  className="p-1 text-[#666666] hover:text-[#C9A227] transition-colors cursor-pointer"
                                >
                                  {copiedField === 'posAlign' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>

                              <div className="p-2.5 bg-black/30 border border-white/5 flex items-center justify-between">
                                <div>
                                  <span className="text-[8px] text-[#666666] block uppercase">Margins / Spacing</span>
                                  <span className="text-white select-all">{selectedElement.position.margins || selectedElement.position.spacing}</span>
                                </div>
                                <button
                                  onClick={() => handleCopy(selectedElement.position!.margins || selectedElement.position!.spacing, 'posMargins')}
                                  className="p-1 text-[#666666] hover:text-[#C9A227] transition-colors cursor-pointer"
                                >
                                  {copiedField === 'posMargins' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>

                            {/* Positioning Problems */}
                            {selectedElement.position.suggestions && selectedElement.position.suggestions.length > 0 && (
                              <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-none space-y-1">
                                <span className="text-[8px] text-red-400 font-bold block uppercase tracking-wider">Detected Spatial Issues</span>
                                <ul className="list-disc pl-4 space-y-1 text-[#A3A3A3] text-[11px] font-sans">
                                  {selectedElement.position.suggestions.map((prob, i) => (
                                    <li key={i}>{prob}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Positioning correction suggestions */}
                            <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-none space-y-2">
                              <span className="text-[8px] text-emerald-400 font-bold block uppercase tracking-wider">Layout correction instructions</span>
                              <div className="p-2.5 bg-black/30 border border-white/5 flex items-center justify-between text-xs">
                                <div>
                                  <span className="text-[8px] text-[#666666] block uppercase">Sizing & Placement Shift</span>
                                  <span className="text-white select-all font-semibold block mt-0.5">{selectedElement.position.currentPosition} — {selectedElement.position.visualWeight}</span>
                                </div>
                                <button
                                  onClick={() => handleCopy(`${selectedElement.position!.currentPosition} - ${selectedElement.position!.visualWeight}`, 'suggestedMove')}
                                  className="p-1 text-[#666666] hover:text-[#C9A227] transition-colors cursor-pointer shrink-0 ml-4"
                                >
                                  {copiedField === 'suggestedMove' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: AI REDESIGN PREVIEW */}
          {activeTab === 'redesign' && (
            <motion.div
              key="tab-redesign"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Concept style selection tabs row */}
              <div className="flex bg-[#121212] border border-white/10 p-0.5 rounded-none font-mono text-[8px] uppercase select-none overflow-x-auto custom-scrollbar">
                {report.redesignConcepts && report.redesignConcepts.map((concept) => (
                  <button
                    key={concept.id}
                    onClick={() => setSelectedConceptId(concept.id)}
                    className={`flex-1 min-w-[100px] py-2 px-1 text-center transition-all cursor-pointer ${
                      selectedConceptId === concept.id
                        ? 'bg-[#C9A227] text-black font-semibold'
                        : 'text-[#888888] hover:text-white'
                    }`}
                  >
                    {concept.name}
                  </button>
                ))}
              </div>

              {/* Selected Concept Information & Mock Previews */}
              {selectedConcept && (
                <div className="space-y-4">
                  
                  {/* Concept Art Direction Header */}
                  <div className="bg-[#121212] border border-white/5 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-[#C9A227]" />
                        <span className="font-mono text-[9px] tracking-widest text-[#C9A227] uppercase">
                          Style Concept Selected
                        </span>
                      </div>
                      <span className="font-mono text-[8px] bg-white/5 border border-white/10 px-1.5 py-0.5 text-[#A3A3A3] uppercase">
                        {selectedConcept.style} MODE
                      </span>
                    </div>

                    <h3 className="font-display text-base font-light text-white tracking-wide uppercase">
                      {selectedConcept.name} — <span className="text-[#888888]">{selectedConcept.tagline}</span>
                    </h3>
                  </div>

                  {/* Transformation details and list */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Transformation checklist */}
                    <div className="bg-[#121212] border border-white/5 p-4 space-y-3">
                      <span className="font-mono text-[8px] text-[#666666] uppercase tracking-wider block">◇ Concrete Transformation Strategy</span>
                      <ul className="space-y-2.5">
                        {selectedConcept.keyChanges.map((change, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-xs text-[#D1D1D1] font-light">
                            <span className="w-1.5 h-1.5 bg-[#C9A227] mt-1.5 shrink-0" />
                            <span>{change}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Typography Pairing details */}
                    <div className="bg-[#121212] border border-white/5 p-4 space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <span className="font-mono text-[8px] text-[#666666] uppercase tracking-wider block">◇ Recommended Font Pairings</span>
                        <div className="space-y-2 font-mono text-xs">
                          <div className="p-2.5 bg-black/30 border border-white/5 flex items-center justify-between">
                            <div>
                              <span className="text-[8px] text-[#666666] block uppercase">Title Google Font</span>
                              <span className="text-white select-all font-semibold">{selectedConcept.typographyPalette.headerFont}</span>
                            </div>
                            <button
                              onClick={() => handleCopy(selectedConcept.typographyPalette.headerFont, 'titleFont')}
                              className="p-1 text-[#666666] hover:text-[#C9A227] transition-colors cursor-pointer"
                            >
                              {copiedField === 'titleFont' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          <div className="p-2.5 bg-black/30 border border-white/5 flex items-center justify-between">
                            <div>
                              <span className="text-[8px] text-[#666666] block uppercase">Body Google Font</span>
                              <span className="text-white select-all font-semibold">{selectedConcept.typographyPalette.bodyFont}</span>
                            </div>
                            <button
                              onClick={() => handleCopy(selectedConcept.typographyPalette.bodyFont, 'bodyFont')}
                              className="p-1 text-[#666666] hover:text-[#C9A227] transition-colors cursor-pointer"
                            >
                              {copiedField === 'bodyFont' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <p className="text-[11px] text-[#888888] font-sans leading-relaxed font-light">
                          {selectedConcept.typographyPalette.pairingDescription}
                        </p>
                      </div>

                      <button
                        onClick={onLaunchSandbox}
                        className="w-full font-mono text-[9px] tracking-widest uppercase bg-[#1A1A1A] border border-[#C9A227]/30 hover:border-[#C9A227] text-white hover:text-[#C9A227] py-2 transition-all cursor-pointer text-center font-semibold"
                      >
                        Launch Sandbox pairing system
                      </button>
                    </div>
                  </div>

                  {/* Redesign Color Swatches palette block */}
                  <div className="bg-[#121212] border border-white/5 p-4 space-y-3">
                    <span className="font-mono text-[8px] text-[#666666] uppercase tracking-wider block">◇ Proposed Luxury Chromatic Tones</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {selectedConcept.colorPalette.map((color, i) => (
                        <div 
                          key={i} 
                          onClick={() => handleSelectSuggestedColor(color.hex)}
                          className="bg-black/30 border border-white/5 p-2.5 flex flex-col justify-between space-y-2 cursor-pointer hover:border-[#C9A227]/50 transition-colors"
                          title="Click to copy and inspect color details"
                        >
                          <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 border border-white/10" style={{ backgroundColor: color.hex }} />
                            <div className="font-mono text-[10px] text-white font-bold tracking-wide uppercase select-all">{color.hex}</div>
                          </div>
                          <div className="leading-tight">
                            <div className="text-[10px] text-white font-display truncate font-light">{color.name}</div>
                            <div className="text-[8px] text-[#666666] font-mono uppercase tracking-wider truncate">{color.role}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Aesthetic Art Rationale Description */}
                  <div className="bg-[#121212] border border-white/5 p-4 space-y-2">
                    <span className="font-mono text-[8px] text-[#666666] uppercase tracking-wider block">◇ Why This Style Works</span>
                    <p className="text-xs text-[#D1D1D1] leading-relaxed font-light italic">
                      "{selectedConcept.whyItWorks}"
                    </p>
                    <p className="font-mono text-[8px] text-[#888888] tracking-widest uppercase mt-2">
                      Structure grid: <span className="text-white">{selectedConcept.coreLayoutStrategy}</span>
                    </p>
                  </div>

                  {/* INTERACTIVE SIMULATED VISUAL MOCK COMPONENT */}
                  <div className="space-y-2">
                    <span className="font-mono text-[8px] text-[#666666] uppercase tracking-wider block">◇ Live Simulated Redesign Preview Box</span>
                    <div className="border border-white/10 overflow-hidden h-72 relative flex items-center justify-center select-none bg-black/90">
                      
                      {/* Grid CAD indicators */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:16px_16px] opacity-10 pointer-events-none" />
                      <div className="absolute top-2 left-3 font-mono text-[7px] text-[#666666] tracking-widest uppercase">RE-LAYOUT SIMULATION: {selectedConcept.style}</div>
                      <div className="absolute top-2 right-3 font-mono text-[7px] text-[#666666] tracking-widest uppercase">GRID: {selectedConcept.coreLayoutStrategy}</div>

                      {/* CONDITIONAL RENDERED MOCKS BASED ON STYLE SELECTED */}
                      
                      {/* LUXURY THEME SIMULATOR */}
                      {selectedConcept.style === 'Luxury' && (
                        <div className="w-[85%] h-[80%] bg-[#0A0A0A] border border-[#C9A227]/30 p-5 flex flex-col justify-between shadow-[0_0_25px_rgba(201,162,39,0.15)] relative">
                          <div className="absolute top-0 right-0 w-16 h-16 border-t border-r border-[#C9A227]/30 pointer-events-none" />
                          <div className="absolute bottom-0 left-0 w-16 h-16 border-b border-l border-[#C9A227]/30 pointer-events-none" />
                          
                          <div className="text-center space-y-1 mt-3">
                            <span className="font-mono text-[6px] tracking-[0.4em] text-[#C9A227] uppercase">ESTABLISHED 2026</span>
                            <h2 className="font-serif text-3xl font-light text-[#F5F5F5] tracking-wide leading-tight italic">Poetic Silhouette</h2>
                            <p className="font-mono text-[8px] text-[#9E978E] uppercase tracking-widest mt-1">AESTHETIC PORTRAIT & GOLD ARTISTRY</p>
                          </div>

                          <div className="h-px bg-gradient-to-r from-transparent via-[#C9A227]/30 to-transparent w-[60%] mx-auto my-1" />

                          <div className="flex justify-between items-center px-4 mb-2">
                            <div className="font-mono text-[7px] text-[#9E978E] leading-snug">
                              <span className="block uppercase text-[5px] text-[#666666]">TYPEFACE</span>
                              <span>CORMORANT ITALIC</span>
                            </div>
                            <div className="w-1.5 h-1.5 bg-[#C9A227] rounded-full" />
                            <div className="font-mono text-[7px] text-[#9E978E] leading-snug text-right">
                              <span className="block uppercase text-[5px] text-[#666666]">CONTRAST</span>
                              <span>HIGH ACCESSIBLE</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* MINIMAL THEME SIMULATOR */}
                      {selectedConcept.style === 'Minimal' && (
                        <div className="w-[85%] h-[80%] bg-[#030303] border border-white/10 p-5 flex flex-col justify-between shadow-2xl">
                          <div className="flex justify-between items-start">
                            <span className="font-mono text-[8px] text-white font-bold">STRUCT.01</span>
                            <span className="font-mono text-[6px] text-[#888888] tracking-widest uppercase">OFFLINE CANVAS</span>
                          </div>

                          <div className="space-y-2 my-auto">
                            <h2 className="font-sans text-2xl font-black text-white tracking-tighter uppercase leading-none">THE VOID THEORY</h2>
                            <p className="font-mono text-[8px] text-[#888888] leading-relaxed max-w-[80%] font-light">
                              Structural grid system built purely upon negative boundaries, high-contrast typography and absolute zero color pollution.
                            </p>
                          </div>

                          <div className="flex justify-between items-center pt-3 border-t border-white/5">
                            <span className="font-mono text-[7px] text-[#888888]">SCALE: 1:1.618</span>
                            <span className="font-mono text-[7px] text-white tracking-widest font-semibold uppercase hover:underline cursor-pointer">ENTER GRID →</span>
                          </div>
                        </div>
                      )}

                      {/* CYBER / MODERN THEME SIMULATOR */}
                      {selectedConcept.style === 'Modern' && (
                        <div className="w-[85%] h-[80%] bg-[#080B10] border border-[#00F0FF]/30 p-5 flex flex-col justify-between shadow-[0_0_20px_rgba(0,240,255,0.08)]">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-1.5">
                              <span className="w-1.5 h-1.5 bg-[#00F0FF] rounded-full animate-pulse" />
                              <span className="font-mono text-[7px] text-[#00F0FF] tracking-wider uppercase font-bold">CORE_SYS: ONLINE</span>
                            </div>
                            <span className="font-mono text-[6px] text-white/40">SYSTEM LATENCY: 2MS</span>
                          </div>

                          <div className="p-3 bg-black/40 border border-white/5 rounded-none space-y-1">
                            <h3 className="font-mono text-[10px] text-white font-bold uppercase tracking-wider">CYBER_INSPECTOR_V1.9</h3>
                            <div className="font-mono text-[8px] text-[#00F0FF]/80 space-y-0.5">
                              <div>&gt; INITIALIZING CHROMATIC SHIFT...</div>
                              <div>&gt; Palettes verified under P3 gamut</div>
                              <div>&gt; Layout telemetry calibrated</div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center font-mono text-[7px]">
                            <span className="text-white/40">CALIBRATION RECT</span>
                            <span className="text-[#00F0FF] bg-[#00F0FF]/10 px-1.5 py-0.5 border border-[#00F0FF]/20">STABLE</span>
                          </div>
                        </div>
                      )}

                      {/* CREATIVE / EXPERIMENTAL THEME SIMULATOR */}
                      {selectedConcept.style === 'Creative' && (
                        <div className="w-[85%] h-[80%] bg-[#0F0F0E] border border-white/5 p-4 flex flex-col justify-between relative overflow-hidden">
                          {/* Asymmetric offset lines */}
                          <div className="absolute top-2 right-2 border-t border-l border-[#C9A227]/40 w-16 h-16 pointer-events-none" />
                          <div className="absolute -bottom-2 -right-2 border-b border-r border-[#C9A227]/40 w-12 h-12 pointer-events-none" />
                          
                          {/* Rotated label along edge */}
                          <div className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 origin-left font-mono text-[6px] tracking-[0.25em] text-[#666666] uppercase whitespace-nowrap">
                            CREATIVE RE-CONSTRUCTION GRID
                          </div>

                          <div className="pl-6 space-y-4 my-auto">
                            <div className="space-y-1">
                              <span className="font-mono text-[7px] bg-[#C9A227]/10 text-[#C9A227] px-1.5 py-0.5 border border-[#C9A227]/20 uppercase">ASYNCHRONOUS OVERLAP</span>
                              <h2 className="font-sans text-xl font-bold tracking-tight text-[#F5F5F5] uppercase leading-tight mt-1">Break The Grid</h2>
                            </div>

                            <p className="font-sans text-[10px] text-[#A3A3A3] font-light leading-relaxed max-w-[85%]">
                              Offsetting card layout units by 15px vertically and rotating structural border tags highlights custom artistic layout authority.
                            </p>
                          </div>

                          <div className="pl-6 flex justify-between items-center text-[7px] font-mono">
                            <span className="text-white/40">CRAFT STAGE: 04</span>
                            <span className="text-[#C9A227] font-semibold">VIEW OVERLAYS →</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 4: DESIGN TOOLS & COLOR EXTRACTOR */}
          {activeTab === 'tools' && (
            <motion.div
              key="tab-tools"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Color Eyedropper Results Display Card */}
              <div className="bg-[#121212] border border-[#C9A227]/30 p-5 space-y-4 shadow-xl">
                <div className="border-b border-white/5 pb-2 flex justify-between items-center">
                  <span className="font-mono text-[9px] tracking-[0.25em] text-[#C9A227] uppercase block">
                    ◇ Eyedropper Color Preview
                  </span>
                  {activePickedColor && (
                    <span className="font-mono text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 uppercase tracking-wider rounded-none">
                      Active Sample
                    </span>
                  )}
                </div>

                {activePickedColor ? (
                  <div className="space-y-4">
                    {/* Big Color block and description */}
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-16 h-16 border border-white/20 shadow-2xl relative group/swatch"
                        style={{ backgroundColor: activePickedColor.hex }}
                      >
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/swatch:opacity-100 flex items-center justify-center transition-opacity text-[8px] font-mono text-white tracking-widest text-center cursor-pointer select-none" onClick={() => handleCopy(activePickedColor.hex, 'hex')}>
                          COPY
                        </div>
                      </div>
                      <div>
                        <h4 className="font-display text-base font-light text-white tracking-wide uppercase">
                          {activePickedColor.name}
                        </h4>
                        <p className="font-mono text-[9px] text-[#A3A3A3] tracking-widest uppercase mt-0.5">
                          Approximate shade matched
                        </p>
                        <p className="font-mono text-[8px] text-[#666666] tracking-widest uppercase mt-0.5">
                          Sampled: {activePickedColor.timestamp}
                        </p>
                      </div>
                    </div>

                    {/* Value items list */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      
                      {/* HEX */}
                      <div className="p-2 bg-black/30 border border-white/5 flex items-center justify-between">
                        <div>
                          <span className="font-mono text-[8px] text-[#666666] block uppercase">HEX</span>
                          <span className="font-mono text-[10px] text-white select-all">{activePickedColor.hex}</span>
                        </div>
                        <button
                          onClick={() => handleCopy(activePickedColor.hex, 'hex')}
                          className="p-1 text-[#666666] hover:text-[#C9A227] transition-colors cursor-pointer"
                        >
                          {copiedField === 'hex' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* RGB */}
                      <div className="p-2 bg-black/30 border border-white/5 flex items-center justify-between">
                        <div>
                          <span className="font-mono text-[8px] text-[#666666] block uppercase">RGB</span>
                          <span className="font-mono text-[10px] text-white select-all">{activePickedColor.rgb}</span>
                        </div>
                        <button
                          onClick={() => handleCopy(activePickedColor.rgb, 'rgb')}
                          className="p-1 text-[#666666] hover:text-[#C9A227] transition-colors cursor-pointer"
                        >
                          {copiedField === 'rgb' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* HSL */}
                      <div className="p-2 bg-black/30 border border-white/5 flex items-center justify-between">
                        <div>
                          <span className="font-mono text-[8px] text-[#666666] block uppercase">HSL</span>
                          <span className="font-mono text-[10px] text-white select-all">{activePickedColor.hsl}</span>
                        </div>
                        <button
                          onClick={() => handleCopy(activePickedColor.hsl, 'hsl')}
                          className="p-1 text-[#666666] hover:text-[#C9A227] transition-colors cursor-pointer"
                        >
                          {copiedField === 'hsl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* HSV */}
                      <div className="p-2 bg-black/30 border border-white/5 flex items-center justify-between">
                        <div>
                          <span className="font-mono text-[8px] text-[#666666] block uppercase">HSV</span>
                          <span className="font-mono text-[10px] text-white select-all">{activePickedColor.hsv}</span>
                        </div>
                        <button
                          onClick={() => handleCopy(activePickedColor.hsv, 'hsv')}
                          className="p-1 text-[#666666] hover:text-[#C9A227] transition-colors cursor-pointer"
                        >
                          {copiedField === 'hsv' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* CMYK */}
                      <div className="p-2 bg-black/30 border border-white/5 flex items-center justify-between col-span-2">
                        <div>
                          <span className="font-mono text-[8px] text-[#666666] block uppercase">CMYK (CALCULATED)</span>
                          <span className="font-mono text-[10px] text-white select-all">{activePickedColor.cmyk}</span>
                        </div>
                        <button
                          onClick={() => handleCopy(activePickedColor.cmyk, 'cmyk')}
                          className="p-1 text-[#666666] hover:text-[#C9A227] transition-colors cursor-pointer"
                        >
                          {copiedField === 'cmyk' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-black/20 border border-dashed border-white/10 text-center space-y-2">
                    <HelpCircle className="w-6 h-6 text-[#A3A3A3] mx-auto opacity-50" />
                    <p className="text-xs text-[#A3A3A3] font-light">No pixel color sampled yet.</p>
                    <p className="text-[10px] text-[#666666] font-mono uppercase tracking-wider leading-relaxed">
                      Toggle the Eyedropper tool on the left image canvas and click any pixel to sample!
                    </p>
                  </div>
                )}

                {/* History of picked colors */}
                {recentColors.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-white/5">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[8px] text-[#666666] uppercase tracking-widest">Recent Picked Colors</span>
                      <button 
                        onClick={onClearRecentColors}
                        className="font-mono text-[8px] text-red-400/80 hover:text-red-400 uppercase tracking-widest cursor-pointer hover:underline"
                      >
                        Clear History
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentColors.map((color, idx) => (
                        <button
                          key={idx}
                          onClick={() => onSelectColor(color)}
                          className={`w-8 h-8 border transition-all cursor-pointer ${
                            activePickedColor?.hex === color.hex ? 'border-white scale-110 shadow-lg' : 'border-white/10 hover:border-white/40'
                          }`}
                          style={{ backgroundColor: color.hex }}
                          title={`${color.name} (${color.hex})`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Download formats */}
                <div className="pt-3 flex flex-wrap items-center gap-2 border-t border-white/5">
                  <span className="font-mono text-[8px] text-[#666666] uppercase tracking-widest">Download Palette:</span>
                  <button
                    onClick={() => handleExportPalette('css')}
                    className="font-mono text-[8px] tracking-wider uppercase px-2.5 py-1 border border-white/10 hover:border-white/20 text-[#A3A3A3] hover:text-white transition-colors cursor-pointer"
                  >
                    CSS Variables
                  </button>
                  <button
                    onClick={() => handleExportPalette('tailwind')}
                    className="font-mono text-[8px] tracking-wider uppercase px-2.5 py-1 border border-white/10 hover:border-white/20 text-[#A3A3A3] hover:text-white transition-colors cursor-pointer"
                  >
                    Tailwind Config
                  </button>
                  <button
                    onClick={() => handleExportPalette('json')}
                    className="font-mono text-[8px] tracking-wider uppercase px-2.5 py-1 border border-white/10 hover:border-white/20 text-[#A3A3A3] hover:text-white transition-colors cursor-pointer"
                  >
                    JSON
                  </button>
                </div>
              </div>

              {/* Suggestions system from current style mode */}
              <div className="bg-[#121212] border border-white/5 p-5 space-y-4">
                <div className="border-b border-white/5 pb-2">
                  <span className="font-mono text-[9px] tracking-[0.25em] text-[#C9A227] uppercase block">
                    ◇ Style Recommendation Swatches
                  </span>
                </div>
                <div className="space-y-4">
                  <p className="text-xs text-[#A3A3A3] leading-relaxed font-light">
                    Aura AI picked these refined tones based on standard "{report.styleSelected}" design rules. You can load any color into the Eyedropper inspector instantly.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {report.color.improvedPalette.map((color, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => handleSelectSuggestedColor(color.hex)}
                        className="p-2 bg-black/40 border border-white/5 flex items-center space-x-2.5 cursor-pointer hover:border-[#C9A227]/40 transition-colors"
                      >
                        <div className="w-5 h-5 border border-white/10 shrink-0" style={{ backgroundColor: color.hex }} />
                        <div className="font-mono text-[9px] truncate">
                          <span className="text-white block font-bold uppercase">{color.hex}</span>
                          <span className="text-[#888888] truncate block text-[8px]">{color.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommended Font Directions */}
              <div className="bg-[#121212] border border-white/5 p-5 space-y-4">
                <div className="border-b border-white/5 pb-2">
                  <span className="font-mono text-[9px] tracking-[0.25em] text-[#C9A227] uppercase block">
                    ◇ Suggested Font Pairings
                  </span>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {report.typography.recommendedFonts.map((font, idx) => (
                      <span key={idx} className="font-mono text-[10px] bg-black/40 border border-white/10 px-2.5 py-1 text-white">
                        {font}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-[#A3A3A3] leading-relaxed font-light">
                    Aura AI selected these font systems specifically to align with standard "{report.styleSelected}" design rules. You can play with and compare pairings instantly.
                  </p>
                  <button
                    onClick={onLaunchSandbox}
                    className="w-full font-mono text-[9px] tracking-widest uppercase bg-[#1A1A1A] border border-[#C9A227]/30 hover:border-[#C9A227] text-white hover:text-[#C9A227] py-2 transition-all cursor-pointer text-center block font-semibold"
                  >
                    Launch Live Pairing Sandbox
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
