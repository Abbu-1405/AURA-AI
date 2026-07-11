import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Heart, Copy, Check, ExternalLink, Sliders, Layout, Info, AlertCircle 
} from 'lucide-react';
import { toInches, fromInches, getAspectRatio } from './RatioVisualizer';

export interface StandardSize {
  id: string;
  name: string;
  category: 'paper' | 'social' | 'youtube' | 'presentations' | 'video' | 'devices' | 'print';
  width: number;
  height: number;
  unit: 'px' | 'mm' | 'cm' | 'in' | 'ft' | 'm';
  aspectRatio: string;
  useCases: string;
  recommendedDpi?: number;
  pixelsPrintOverride?: string; // e.g. "2480 x 3508 px" for print items
}

// Full real database of all common ratios
const standardSizesDb: StandardSize[] = [
  // --- PAPER SIZES ---
  {
    id: 'a0',
    name: 'A0 Paper',
    category: 'paper',
    width: 841,
    height: 1189,
    unit: 'mm',
    aspectRatio: '1:√2',
    useCases: 'Posters, large technical drawings, and banners.',
    recommendedDpi: 150,
    pixelsPrintOverride: '4960 × 7016 px'
  },
  {
    id: 'a1',
    name: 'A1 Paper',
    category: 'paper',
    width: 594,
    height: 841,
    unit: 'mm',
    aspectRatio: '1:√2',
    useCases: 'Medium posters, presentation boards, and charts.',
    recommendedDpi: 200,
    pixelsPrintOverride: '4677 × 6622 px'
  },
  {
    id: 'a2',
    name: 'A2 Paper',
    category: 'paper',
    width: 420,
    height: 594,
    unit: 'mm',
    aspectRatio: '1:√2',
    useCases: 'Fine art prints, advertisements, and architectural drawings.',
    recommendedDpi: 300,
    pixelsPrintOverride: '4960 × 7016 px'
  },
  {
    id: 'a3',
    name: 'A3 Paper',
    category: 'paper',
    width: 297,
    height: 420,
    unit: 'mm',
    aspectRatio: '1:√2',
    useCases: 'Drawings, marketing leaflets, and large schedules.',
    recommendedDpi: 300,
    pixelsPrintOverride: '3508 × 4960 px'
  },
  {
    id: 'a4',
    name: 'A4 Paper',
    category: 'paper',
    width: 210,
    height: 297,
    unit: 'mm',
    aspectRatio: '1:√2',
    useCases: 'Standard documents, magazines, certificates, and corporate forms.',
    recommendedDpi: 300,
    pixelsPrintOverride: '2480 × 3508 px'
  },
  {
    id: 'a5',
    name: 'A5 Paper',
    category: 'paper',
    width: 148,
    height: 210,
    unit: 'mm',
    aspectRatio: '1:√2',
    useCases: 'Leaflets, menus, flyers, pocket diaries, and booklets.',
    recommendedDpi: 300,
    pixelsPrintOverride: '1748 × 2480 px'
  },
  {
    id: 'letter',
    name: 'US Letter',
    category: 'paper',
    width: 8.5,
    height: 11,
    unit: 'in',
    aspectRatio: '1:1.29',
    useCases: 'Standard North American office printer documents, essays, and mail.',
    recommendedDpi: 300,
    pixelsPrintOverride: '2550 × 3300 px'
  },
  {
    id: 'legal',
    name: 'US Legal',
    category: 'paper',
    width: 8.5,
    height: 14,
    unit: 'in',
    aspectRatio: '1:1.64',
    useCases: 'Legal contracts, formal business agreements, and court forms.',
    recommendedDpi: 300,
    pixelsPrintOverride: '2550 × 4200 px'
  },
  {
    id: 'tabloid',
    name: 'US Tabloid',
    category: 'paper',
    width: 11,
    height: 17,
    unit: 'in',
    aspectRatio: '1:1.55',
    useCases: 'Newspaper spreads, mini-posters, and architectural schedules.',
    recommendedDpi: 300,
    pixelsPrintOverride: '3300 × 5100 px'
  },
  {
    id: 'b4',
    name: 'B4 Size',
    category: 'paper',
    width: 250,
    height: 353,
    unit: 'mm',
    aspectRatio: '1:√2',
    useCases: 'Japanese books, manga layouts, and specialty magazines.',
    recommendedDpi: 300,
    pixelsPrintOverride: '2953 × 4169 px'
  },
  {
    id: 'b5',
    name: 'B5 Size',
    category: 'paper',
    width: 176,
    height: 250,
    unit: 'mm',
    aspectRatio: '1:√2',
    useCases: 'Specialty textbooks, journals, and smaller books.',
    recommendedDpi: 300,
    pixelsPrintOverride: '2079 × 2953 px'
  },
  {
    id: 'c4',
    name: 'C4 Envelope',
    category: 'paper',
    width: 229,
    height: 324,
    unit: 'mm',
    aspectRatio: '1:√2',
    useCases: 'Perfect fit for unfolded A4 document mailings.',
    recommendedDpi: 300,
    pixelsPrintOverride: '2705 × 3827 px'
  },
  {
    id: 'c5',
    name: 'C5 Envelope',
    category: 'paper',
    width: 162,
    height: 229,
    unit: 'mm',
    aspectRatio: '1:√2',
    useCases: 'Perfect fit for A5 sheets or A4 folded in half.',
    recommendedDpi: 300,
    pixelsPrintOverride: '1913 × 2705 px'
  },

  // --- SOCIAL MEDIA ---
  {
    id: 'ig-post',
    name: 'Instagram Square Post',
    category: 'social',
    width: 1080,
    height: 1080,
    unit: 'px',
    aspectRatio: '1:1',
    useCases: 'Standard square layout feed photos and carousel posts on Instagram.'
  },
  {
    id: 'ig-portrait',
    name: 'Instagram Portrait',
    category: 'social',
    width: 1080,
    height: 1350,
    unit: 'px',
    aspectRatio: '4:5',
    useCases: 'Vertical feed posts. Highly recommended for maximum feed estate.'
  },
  {
    id: 'ig-landscape',
    name: 'Instagram Landscape',
    category: 'social',
    width: 1080,
    height: 566,
    unit: 'px',
    aspectRatio: '1.91:1',
    useCases: 'Horizontal panoramic graphics, photographs, and landscapes.'
  },
  {
    id: 'ig-story',
    name: 'Instagram Story / Reel Cover',
    category: 'social',
    width: 1080,
    height: 1920,
    unit: 'px',
    aspectRatio: '9:16',
    useCases: 'Full-screen mobile story posts, static reel graphics, and vertical slides.'
  },
  {
    id: 'fb-post',
    name: 'Facebook Post',
    category: 'social',
    width: 1200,
    height: 630,
    unit: 'px',
    aspectRatio: '1.91:1',
    useCases: 'Standard Facebook desktop & mobile landscape timeline images.'
  },
  {
    id: 'fb-cover',
    name: 'Facebook Cover Photo',
    category: 'social',
    width: 820,
    height: 312,
    unit: 'px',
    aspectRatio: '2.6:1',
    useCases: 'Personal and business page desktop profile headers.'
  },
  {
    id: 'fb-story',
    name: 'Facebook Story',
    category: 'social',
    width: 1080,
    height: 1920,
    unit: 'px',
    aspectRatio: '9:16',
    useCases: 'Full vertical screen updates shared with friends and followers.'
  },
  {
    id: 'linkedin-post',
    name: 'LinkedIn Post Image',
    category: 'social',
    width: 1200,
    height: 627,
    unit: 'px',
    aspectRatio: '1.91:1',
    useCases: 'Professional link attachments, event headers, and blog updates.'
  },
  {
    id: 'linkedin-banner',
    name: 'LinkedIn Profile Cover Banner',
    category: 'social',
    width: 1584,
    height: 396,
    unit: 'px',
    aspectRatio: '4:1',
    useCases: 'Header graphic displayed on personal LinkedIn profiles.'
  },
  {
    id: 'linkedin-company-cover',
    name: 'LinkedIn Corporate Header',
    category: 'social',
    width: 1128,
    height: 191,
    unit: 'px',
    aspectRatio: '5.9:1',
    useCases: 'Header graphic displayed at the top of Business and Company pages.'
  },
  {
    id: 'pinterest-pin',
    name: 'Pinterest Standard Pin',
    category: 'social',
    width: 1000,
    height: 1500,
    unit: 'px',
    aspectRatio: '2:3',
    useCases: 'Infographics, vertical guides, recipe designs, and product boards.'
  },
  {
    id: 'x-post',
    name: 'X (Twitter) Feed Post',
    category: 'social',
    width: 1600,
    height: 900,
    unit: 'px',
    aspectRatio: '16:9',
    useCases: 'High resolution landscape post images shared on timelines.'
  },
  {
    id: 'x-header',
    name: 'X (Twitter) Profile Header',
    category: 'social',
    width: 1500,
    height: 500,
    unit: 'px',
    aspectRatio: '3:1',
    useCases: 'Wide banner displayed behind profile pictures on X.'
  },
  {
    id: 'threads-post',
    name: 'Threads Feed Image',
    category: 'social',
    width: 1080,
    height: 1350,
    unit: 'px',
    aspectRatio: '4:5',
    useCases: 'Feed updates for the Threads network (Instagram companion).'
  },

  // --- YOUTUBE ---
  {
    id: 'yt-thumb',
    name: 'YouTube Video Thumbnail',
    category: 'youtube',
    width: 1280,
    height: 720,
    unit: 'px',
    aspectRatio: '16:9',
    useCases: 'Crucial video cover image. Maximizes click-through rate (CTR).'
  },
  {
    id: 'yt-banner',
    name: 'YouTube Channel Banner',
    category: 'youtube',
    width: 2560,
    height: 1440,
    unit: 'px',
    aspectRatio: '16:9',
    useCases: 'Channel art displaying across TV, desktop, and mobile players.'
  },
  {
    id: 'yt-shorts',
    name: 'YouTube Shorts Cover',
    category: 'youtube',
    width: 1080,
    height: 1920,
    unit: 'px',
    aspectRatio: '9:16',
    useCases: 'Custom cover thumbnail displayed for YouTube Shorts clips.'
  },
  {
    id: 'yt-end',
    name: 'YouTube End Screen',
    category: 'youtube',
    width: 1920,
    height: 1080,
    unit: 'px',
    aspectRatio: '16:9',
    useCases: 'Overlay templates placed at the final 15-20 seconds of video clips.'
  },
  {
    id: 'yt-profile',
    name: 'YouTube Channel Avatar',
    category: 'youtube',
    width: 800,
    height: 800,
    unit: 'px',
    aspectRatio: '1:1',
    useCases: 'Circular avatar representing the channel creator profile.'
  },

  // --- PRESENTATIONS ---
  {
    id: 'ppt-classic',
    name: 'PowerPoint Classic (4:3)',
    category: 'presentations',
    width: 1024,
    height: 768,
    unit: 'px',
    aspectRatio: '4:3',
    useCases: 'Traditional slideshow layouts, iPad-friendly presentation booklets.'
  },
  {
    id: 'ppt-wide',
    name: 'PowerPoint / Google Slides Widescreen',
    category: 'presentations',
    width: 1920,
    height: 1080,
    unit: 'px',
    aspectRatio: '16:9',
    useCases: 'Modern widescreen presentation files and corporate report templates.'
  },
  {
    id: 'keynote-std',
    name: 'Keynote Cinema Widescreen',
    category: 'presentations',
    width: 1920,
    height: 1080,
    unit: 'px',
    aspectRatio: '16:9',
    useCases: 'High-end aesthetic presentation files and interactive portfolio folders.'
  },

  // --- VIDEO FORMATS ---
  {
    id: 'video-hd',
    name: 'HD Standard Video',
    category: 'video',
    width: 1280,
    height: 720,
    unit: 'px',
    aspectRatio: '16:9',
    useCases: 'Standard web streams, quick animations, and lightweight rendering.'
  },
  {
    id: 'video-fhd',
    name: 'Full HD Video',
    category: 'video',
    width: 1920,
    height: 1080,
    unit: 'px',
    aspectRatio: '16:9',
    useCases: 'Modern digital video export, high definition broadcast streams.'
  },
  {
    id: 'video-4k',
    name: '4K UHD Cinematic',
    category: 'video',
    width: 3840,
    height: 2160,
    unit: 'px',
    aspectRatio: '16:9',
    useCases: 'Premium TV displays, ultra-HD commercial releases, high-end footage.'
  },
  {
    id: 'video-8k',
    name: '8K UHD Commercial',
    category: 'video',
    width: 7680,
    height: 4320,
    unit: 'px',
    aspectRatio: '16:9',
    useCases: 'Future-proof broadcasting, stadium screens, and archival footage.'
  },
  {
    id: 'video-cinemascope',
    name: 'CinemaScope Scope',
    category: 'video',
    width: 2048,
    height: 858,
    unit: 'px',
    aspectRatio: '2.39:1',
    useCases: 'Anamorphic film aspect ratio. Cinematic theater releases.'
  },
  {
    id: 'video-ultrawide',
    name: 'UltraWide Panoramic',
    category: 'video',
    width: 2560,
    height: 1080,
    unit: 'px',
    aspectRatio: '21:9',
    useCases: 'Panoramic desktop gaming, immersive displays, and scenic video loops.'
  },

  // --- DEVICES ---
  {
    id: 'dev-macbook',
    name: 'MacBook Pro 16" Liquid Retina',
    category: 'devices',
    width: 3456,
    height: 2234,
    unit: 'px',
    aspectRatio: '14:9',
    useCases: 'Mac OS desktop mockup creations and accurate web design previews.'
  },
  {
    id: 'dev-ipad',
    name: 'iPad Pro 12.9" Retina Display',
    category: 'devices',
    width: 2732,
    height: 2048,
    unit: 'px',
    aspectRatio: '4:3',
    useCases: 'Interactive portfolio assets, digital journals, and mobile web testing.'
  },
  {
    id: 'dev-android-tablet',
    name: 'Android Tablet Standard',
    category: 'devices',
    width: 2560,
    height: 1600,
    unit: 'px',
    aspectRatio: '16:10',
    useCases: 'Tablet UI wireframing and responsive dashboard sizing previews.'
  },
  {
    id: 'dev-iphone',
    name: 'iPhone 15 Pro Max Screen',
    category: 'devices',
    width: 1290,
    height: 2796,
    unit: 'px',
    aspectRatio: '9:19.5',
    useCases: 'iOS application interface designs and premium phone wallpapers.'
  },
  {
    id: 'dev-galaxy',
    name: 'Samsung Galaxy S24 Ultra',
    category: 'devices',
    width: 1440,
    height: 3120,
    unit: 'px',
    aspectRatio: '9:19.5',
    useCases: 'Android app screen wireframing and responsive splash testing.'
  },
  {
    id: 'dev-smart-tv',
    name: 'Smart TV / Apple TV',
    category: 'devices',
    width: 3840,
    height: 2160,
    unit: 'px',
    aspectRatio: '16:9',
    useCases: 'Over-The-Top (OTT) streaming app interfaces, TV slides.'
  },

  // --- PRINT ---
  {
    id: 'print-biz-us',
    name: 'US Business Card',
    category: 'print',
    width: 3.5,
    height: 2,
    unit: 'in',
    aspectRatio: '1.75:1',
    useCases: 'Corporate business cards. Standard American networking cards.',
    recommendedDpi: 300,
    pixelsPrintOverride: '1050 × 600 px'
  },
  {
    id: 'print-biz-eu',
    name: 'European Business Card',
    category: 'print',
    width: 85,
    height: 55,
    unit: 'mm',
    aspectRatio: '1.54:1',
    useCases: 'Corporate contacts. Standard European/international card format.',
    recommendedDpi: 300,
    pixelsPrintOverride: '1004 × 650 px'
  },
  {
    id: 'print-brochure',
    name: 'Brochure Fold (US Letter)',
    category: 'print',
    width: 11,
    height: 8.5,
    unit: 'in',
    aspectRatio: '1.29:1',
    useCases: 'Tri-fold informational menus, corporate flyers, and pamphlets.',
    recommendedDpi: 300,
    pixelsPrintOverride: '3300 × 2550 px'
  },
  {
    id: 'print-rollup',
    name: 'Exhibition Roll-up Banner',
    category: 'print',
    width: 850,
    height: 2000,
    unit: 'mm',
    aspectRatio: '17:40',
    useCases: 'Exhibition hall pull-up marketing banners, corporate stands.',
    recommendedDpi: 150,
    pixelsPrintOverride: '5020 × 11811 px'
  },
  {
    id: 'print-billboard',
    name: 'Highway Billboard Standard',
    category: 'print',
    width: 48,
    height: 14,
    unit: 'ft',
    aspectRatio: '24:7',
    useCases: 'Highway landscape advertising structures, huge print banners.',
    recommendedDpi: 30,
    pixelsPrintOverride: '16589 × 4838 px'
  },
  {
    id: 'print-sticker',
    name: 'US Square Sticker Decal',
    category: 'print',
    width: 3,
    height: 3,
    unit: 'in',
    aspectRatio: '1:1',
    useCases: 'Custom die-cut promotional decals, product packaging seals.',
    recommendedDpi: 300,
    pixelsPrintOverride: '900 × 900 px'
  }
];

interface RatiosLibraryProps {
  onOpenInVisualizer: (width: number, height: number, unit: string) => void;
}

export default function RatiosLibrary({ onOpenInVisualizer }: RatiosLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Load favorites from local storage
  useEffect(() => {
    const savedFavs = localStorage.getItem('aura_ratio_favorites');
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs));
      } catch (e) {
        console.error("Failed to load ratio favorites:", e);
      }
    }
  }, []);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
      localStorage.setItem('aura_ratio_favorites', JSON.stringify(next));
      return next;
    });
  };

  const handleCopyText = (text: string, idField: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedField(idField);
    setTimeout(() => setCopiedField(null), 1500);
  };

  // Filter list based on search and category
  const filteredSizes = standardSizesDb.filter(size => {
    // Category match
    if (selectedCategory !== 'all' && selectedCategory !== 'favorites') {
      if (size.category !== selectedCategory) return false;
    }
    
    // Favorites match
    if (selectedCategory === 'favorites') {
      if (!favorites.includes(size.id)) return false;
    }

    // Search query match (partial matches against Name, Platform/Category, Ratio, Dimensions)
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const dimsStr = `${size.width}x${size.height}`;
      const unitStr = size.unit.toLowerCase();
      const catStr = size.category.toLowerCase();
      const matchName = size.name.toLowerCase().includes(query);
      const matchCat = catStr.includes(query);
      const matchRatio = size.aspectRatio.toLowerCase().includes(query);
      const matchDims = dimsStr.includes(query) || `${size.width} ${size.height}`.includes(query);
      const matchUnit = unitStr.includes(query);
      
      return matchName || matchCat || matchRatio || matchDims || matchUnit;
    }

    return true;
  });

  // Categorized counts
  const getCategoryCount = (cat: string) => {
    if (cat === 'all') return standardSizesDb.length;
    if (cat === 'favorites') return favorites.length;
    return standardSizesDb.filter(s => s.category === cat).length;
  };

  // List of categories for tabs
  const categoriesList = [
    { id: 'all', label: 'All Dimensions' },
    { id: 'favorites', label: 'Starred' },
    { id: 'paper', label: 'Paper Sizes' },
    { id: 'social', label: 'Social Media' },
    { id: 'youtube', label: 'YouTube' },
    { id: 'presentations', label: 'Presentations' },
    { id: 'video', label: 'Video Formats' },
    { id: 'devices', label: 'Device Screens' },
    { id: 'print', label: 'Print Layouts' }
  ];

  return (
    <div className="space-y-6 py-4">
      {/* Search and Quick Filters Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#121212] border border-white/5 p-4 rounded-none">
        {/* Search input field */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search standard dimensions (e.g. A4, insta, 1080)..."
            className="w-full bg-[#1A1A1A] border border-white/10 text-white font-mono text-xs pl-10 pr-4 py-2.5 outline-none focus:border-[#C9A227]/50 focus:bg-[#202020] transition-colors"
          />
        </div>
        
        {/* Meta summary info */}
        <div className="font-mono text-[9px] text-[#888888] tracking-widest uppercase flex items-center space-x-2 shrink-0">
          <span>◇ Library Catalog</span>
          <span className="w-1.5 h-1.5 bg-[#C9A227] rounded-none inline-block"></span>
          <span className="text-[#F5F5F5]">{filteredSizes.length} standard sizes matched</span>
        </div>
      </div>

      {/* Categories horizontal tabs */}
      <div className="flex border-b border-white/5 pb-1 space-x-2 overflow-x-auto scrollbar-none shrink-0 select-none">
        {categoriesList.map((cat) => {
          const active = selectedCategory === cat.id;
          const count = getCategoryCount(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`font-mono text-[10px] tracking-wider uppercase py-2 px-3 border-b-2 whitespace-nowrap cursor-pointer transition-all flex items-center space-x-1.5 ${
                active 
                  ? 'text-[#C9A227] border-[#C9A227] font-semibold bg-[#C9A227]/5' 
                  : 'text-[#888888] border-transparent hover:text-white'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-none ${active ? 'bg-[#C9A227] text-black' : 'bg-white/5 text-[#666666]'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid Results layout */}
      {filteredSizes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredSizes.map((size) => {
              const isFav = favorites.includes(size.id);
              const dimensionsLabel = `${size.width} × ${size.height} ${size.unit}`;
              
              // Calculate equivalencies based on size type
              const inchVal = toInches(size.width, size.unit);
              const inchHVal = toInches(size.height, size.unit);
              
              const pxEq = size.unit === 'px' ? dimensionsLabel : `${Math.round(fromInches(inchVal, 'px'))} × ${Math.round(fromInches(inchHVal, 'px'))} px`;
              const mmEq = size.unit === 'mm' ? dimensionsLabel : `${Math.round(fromInches(inchVal, 'mm'))} × ${Math.round(fromInches(inchHVal, 'mm'))} mm`;
              const inEq = size.unit === 'in' ? dimensionsLabel : `${fromInches(inchVal, 'in').toFixed(2)} × ${fromInches(inchHVal, 'in').toFixed(2)} in`;

              return (
                <motion.div
                  layout
                  key={size.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="bg-[#121212] border border-white/5 p-5 flex flex-col justify-between relative group hover:border-[#C9A227]/25 transition-all shadow-md"
                >
                  {/* Decorative luxury corners */}
                  <div className="absolute top-0 right-0 border-t border-r border-[#C9A227]/0 group-hover:border-[#C9A227]/30 w-3.5 h-3.5 transition-all"></div>
                  <div className="absolute bottom-0 left-0 border-b border-l border-[#C9A227]/0 group-hover:border-[#C9A227]/30 w-3.5 h-3.5 transition-all"></div>

                  <div className="space-y-3">
                    {/* Size Header with favorite toggle */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <span className="font-mono text-[8px] text-[#C9A227] tracking-[0.2em] uppercase">
                          ◇ {size.category} ◇
                        </span>
                        <h4 className="font-display text-base font-light text-white tracking-wide leading-snug group-hover:text-[#C9A227] transition-colors">
                          {size.name}
                        </h4>
                      </div>
                      
                      <button
                        onClick={(e) => toggleFavorite(size.id, e)}
                        className={`p-1.5 border hover:border-[#C9A227]/30 transition-all cursor-pointer ${
                          isFav 
                            ? 'bg-[#C9A227]/15 border-[#C9A227]/40 text-[#C9A227]' 
                            : 'bg-[#1A1A1A] border-white/5 text-[#444444] hover:text-white'
                        }`}
                        title={isFav ? "Starred Size" : "Star size"}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    {/* Dimensions & Aspect Ratio Row */}
                    <div className="grid grid-cols-2 gap-3 bg-[#1A1A1A]/60 p-3 border border-white/5">
                      <div className="space-y-0.5">
                        <span className="font-mono text-[8px] text-[#666666] tracking-widest uppercase block">
                          Dimensions
                        </span>
                        <span className="font-mono text-xs text-[#F5F5F5] font-semibold">
                          {dimensionsLabel}
                        </span>
                      </div>
                      
                      <div className="space-y-0.5">
                        <span className="font-mono text-[8px] text-[#666666] tracking-widest uppercase block">
                          Aspect Ratio
                        </span>
                        <span className="font-mono text-xs text-[#C9A227] font-semibold">
                          {size.aspectRatio}
                        </span>
                      </div>
                    </div>

                    {/* Secondary metric equivalents block */}
                    <div className="space-y-1 border-b border-white/5 pb-2.5">
                      <span className="font-mono text-[8px] text-[#666666] tracking-widest uppercase block">
                        Unit Equivalents
                      </span>
                      <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-[#A3A3A3]">
                        <div className="bg-[#1A1A1A]/30 px-1.5 py-0.5">
                          <span className="text-[#666666] block text-[8px]">PX</span>
                          <span className="truncate block font-medium text-[9px]">{pxEq.split(' ').slice(0, 3).join(' ')}</span>
                        </div>
                        <div className="bg-[#1A1A1A]/30 px-1.5 py-0.5">
                          <span className="text-[#666666] block text-[8px]">MM</span>
                          <span className="truncate block font-medium text-[9px]">{mmEq.split(' ').slice(0, 3).join(' ')}</span>
                        </div>
                        <div className="bg-[#1A1A1A]/30 px-1.5 py-0.5">
                          <span className="text-[#666666] block text-[8px]">IN</span>
                          <span className="truncate block font-medium text-[9px]">{inEq.split(' ').slice(0, 3).join(' ')}</span>
                        </div>
                      </div>
                    </div>

                    {/* DPI details for print size items */}
                    {size.recommendedDpi && (
                      <div className="flex items-center space-x-1.5 bg-sky-950/20 border border-sky-900/20 px-2 py-1.5 text-sky-400 font-mono text-[9px]">
                        <Info className="w-3.5 h-3.5 shrink-0" />
                        <span>Print DPI: <strong>{size.recommendedDpi} DPI</strong> — Pixels: <strong>{size.pixelsPrintOverride}</strong></span>
                      </div>
                    )}

                    {/* Use Case details statement */}
                    <div className="space-y-1">
                      <span className="font-mono text-[8px] text-[#666666] tracking-widest uppercase block">
                        Common Use Case
                      </span>
                      <p className="font-sans text-xs text-[#A3A3A3] font-light leading-relaxed">
                        {size.useCases}
                      </p>
                    </div>
                  </div>

                  {/* Quick Action buttons */}
                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/5 mt-4">
                    <button
                      onClick={(e) => handleCopyText(dimensionsLabel.replace(` ${size.unit}`, ''), `${size.id}-dim`, e)}
                      className="flex items-center justify-center space-x-1 font-mono text-[8px] tracking-widest bg-[#1A1A1A] border border-white/5 hover:border-white/10 hover:text-white py-2 text-[#A3A3A3] uppercase transition-colors cursor-pointer"
                      title="Copy Width × Height"
                    >
                      {copiedField === `${size.id}-dim` ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Dimensions</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={(e) => handleCopyText(size.aspectRatio, `${size.id}-ratio`, e)}
                      className="flex items-center justify-center space-x-1 font-mono text-[8px] tracking-widest bg-[#1A1A1A] border border-white/5 hover:border-white/10 hover:text-white py-2 text-[#A3A3A3] uppercase transition-colors cursor-pointer"
                      title="Copy Aspect Ratio string"
                    >
                      {copiedField === `${size.id}-ratio` ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Ratio</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => onOpenInVisualizer(size.width, size.height, size.unit)}
                      className="flex items-center justify-center space-x-1 font-mono text-[8px] tracking-widest bg-[#C9A227] hover:bg-[#B8911C] py-2 text-black font-semibold uppercase transition-colors cursor-pointer text-center"
                      title="Open and visualize in Ratio Workspace"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                      <span>Visualize</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-[#121212] border border-white/5 p-12 text-center rounded-none max-w-md mx-auto">
          <AlertCircle className="w-8 h-8 text-[#C9A227] mx-auto mb-3 opacity-80" />
          <h4 className="font-display text-lg font-light text-white tracking-wide">
            No Dimensions Found
          </h4>
          <p className="font-sans font-light text-xs text-[#888888] mt-1 leading-relaxed">
            We couldn't find any standard sizes matching your search query. Try typing another term or reset your category selection.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="mt-4 px-4 py-2 bg-[#1A1A1A] border border-white/10 hover:bg-[#202020] text-white font-mono text-[9px] tracking-widest uppercase transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
