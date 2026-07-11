/**
 * TypeScript definitions for Aura AI - Your AI Creative Director
 */

export type DesignStyle = 'Minimal' | 'Luxury' | 'Professional' | 'Modern' | 'Colorful' | 'Elegant' | 'Creative';

export interface TypographyBreakdown {
  fontChoice: number;
  fontPairing: number;
  readability: number;
  hierarchy: number;
  spacing: number;
}

export interface TypographyBreakdownExplanations {
  fontChoice: string;
  fontPairing: string;
  readability: string;
  hierarchy: string;
  spacing: string;
}

export interface IndividualTextAnalysis {
  text: string;
  role: string;
  category: string;
  weight: string;
  size: string;
  readability: string;
  issue: string;
  recommendedFont: string;
  recommendedStyle: string;
  sizeAdjustment: string;
  spacingAdjustment: string;
  positionAdjustment: string;
  reason: string;
}

export interface TypographyAnalysis {
  score: number;
  breakdown: TypographyBreakdown;
  breakdownExplanations: TypographyBreakdownExplanations;
  observation: string; // What Aura AI detected
  problem: string; // What is reducing quality
  reason: string; // Why this affects design
  solution: string; // How to improve it
  problems: string[];
  whyItMatters: string;
  suggestedImprovements: string;
  recommendedFonts: string[];
  exactChanges: string[];
  individualTexts: IndividualTextAnalysis[];
}

export interface ColorPaletteItem {
  name: string;
  hex: string;
  usage: string;
}

export interface ColorBreakdown {
  harmony: number;
  contrast: number;
  readability: number;
  moodMatch: number;
}

export interface ColorBreakdownExplanations {
  harmony: string;
  contrast: string;
  readability: string;
  moodMatch: string;
}

export interface ColorAnalysis {
  score: number;
  breakdown: ColorBreakdown;
  breakdownExplanations: ColorBreakdownExplanations;
  observation: string; // What Aura AI detected
  problem: string; // What is reducing quality
  reason: string; // Why this affects design
  solution: string; // How to improve it
  currentPalette: ColorPaletteItem[]; // Detected color palette
  improvedPalette: ColorPaletteItem[]; // Proposed palette
  whyTheseColorsWork: string;
  harmonyAndContrast: string;
}

export interface SizeBreakdown {
  alignment: number;
  spacing: number;
  visualHierarchy: number;
  balance: number;
}

export interface SizeBreakdownExplanations {
  alignment: string;
  spacing: string;
  visualHierarchy: string;
  balance: string;
}

export interface SizePositioningAnalysis {
  score: number;
  breakdown: SizeBreakdown;
  breakdownExplanations: SizeBreakdownExplanations;
  observation: string; // What Aura AI detected
  problem: string; // What is reducing quality
  reason: string; // Why this affects design
  solution: string; // How to improve it
  whatShouldMove: string[];
  whatShouldIncrease: string[];
  whatShouldDecrease: string[];
  layoutImprovements: string[];
}

export interface BackgroundBreakdown {
  cleanliness: number;
  compatibility: number;
  distractionControl: number;
  depth: number;
}

export interface BackgroundBreakdownExplanations {
  cleanliness: string;
  compatibility: string;
  distractionControl: string;
  depth: string;
}

export interface BackgroundAnalysis {
  score: number;
  breakdown: BackgroundBreakdown;
  breakdownExplanations: BackgroundBreakdownExplanations;
  observation: string; // What Aura AI detected
  problem: string; // What is reducing quality
  reason: string; // Why this affects design
  solution: string; // How to improve it
  betterBackgroundIdeas: string[];
  colors: string[];
  gradients: string[];
  blurSuggestions: string;
  textureSuggestions: string;
}

export interface CreativeDirectorReport {
  styleSelected: DesignStyle;
  overallScore: number;
  overallVerdict: string;
  typography: TypographyAnalysis;
  color: ColorAnalysis;
  sizePositioning: SizePositioningAnalysis;
  background: BackgroundAnalysis;
  elements?: DetectedElement[];
  redesignConcepts?: RedesignConcept[];
}

export interface ElementColorItem {
  hex: string;
  rgb: string;
  hsl: string;
  hsv: string;
  cmyk: string;
  name: string;
  usage: string;
}

export interface DetectedElement {
  id: string;
  name: string;
  type: 'heading' | 'subheading' | 'paragraph' | 'button' | 'icon' | 'logo' | 'image' | 'shape' | 'background' | 'section' | 'card';
  role: string;
  score: number;
  boundingBox: {
    x: number; // percentage from left, 0 to 100
    y: number; // percentage from top, 0 to 100
    width: number; // percentage width, 0 to 100
    height: number; // percentage height, 0 to 100
  };
  typography?: {
    text: string;
    fontCategory: string;
    readability: string;
    hierarchy: string;
    letterSpacing: string;
    lineHeight: string;
    alignment: string;
    weight: string;
    fontPairing: string;
    score: number;
    problems: string[];
    reason: string;
    suggestedFont: string;
    suggestedSize: string;
    suggestedPosition: string;
    suggestedLetterSpacing: string;
  };
  color?: {
    colorsUsed: ElementColorItem[];
    score: number;
    suggestedColor: string;
    reason: string;
  };
  position?: {
    currentPosition: string;
    alignment: string;
    spacing: string;
    margins: string;
    visualWeight: string;
    suggestions: string[];
  };
  background?: {
    texture: string;
    contrast: string;
    distractions: string;
    compatibility: string;
    mood: string;
    score: number;
    suggestions: string[];
  };
  image?: {
    cropping: string;
    brightness: string;
    contrast: string;
    visualFocus: string;
    quality: string;
    balance: string;
    suggestions: string[];
  };
  button?: {
    visibility: string;
    contrast: string;
    hierarchy: string;
    ctaStrength: string;
    size: string;
    position: string;
    improvements: string[];
  };
  logo?: {
    placement: string;
    contrast: string;
    brandProminence: string;
    clearSpace: string;
    size: string;
    improvements: string[];
  };
}

export interface RedesignConcept {
  id: string;
  name: string;
  style: DesignStyle;
  tagline: string;
  keyChanges: string[];
  typographyPalette: {
    headerFont: string;
    bodyFont: string;
    pairingDescription: string;
  };
  colorPalette: {
    name: string;
    hex: string;
    role: string;
  }[];
  coreLayoutStrategy: string;
  whyItWorks: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
