import React, { useState, useEffect, useRef, MouseEvent } from 'react';
import { 
  ZoomIn, ZoomOut, Maximize2, Pipette, Move, Check, Info 
} from 'lucide-react';
import { 
  rgbToHex, rgbToHsl, rgbToHsv, rgbToCmyk, getColorName 
} from '../utils/colorUtils';

export interface PickedColor {
  hex: string;
  rgb: string;
  hsl: string;
  hsv: string;
  cmyk: string;
  name: string;
  timestamp: string;
}

interface DesignInspectorProps {
  imageUrl: string;
  onColorPicked: (color: PickedColor) => void;
  elements?: any[];
  activeElementId?: string | null;
  onSelectElement?: (id: string | null) => void;
  isInspectModeActive?: boolean;
  setIsInspectModeActive?: (active: boolean) => void;
}

export default function DesignInspector({ 
  imageUrl, 
  onColorPicked,
  elements = [],
  activeElementId = null,
  onSelectElement,
  isInspectModeActive = true,
  setIsInspectModeActive
}: DesignInspectorProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isEyedropperActive, setIsEyedropperActive] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [imageLayoutSize, setImageLayoutSize] = useState({ width: 0, height: 0 });
  
  // Magnifying Loupe / HUD State
  const [hoverColor, setHoverColor] = useState<string | null>(null);
  const [hoverColorName, setHoverColorName] = useState<string | null>(null);
  const [loupePos, setLoupePos] = useState({ x: 0, y: 0, show: false });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Keep image layout sizes updated
  useEffect(() => {
    if (imgRef.current) {
      setImageLayoutSize({
        width: imgRef.current.clientWidth || imgRef.current.offsetWidth,
        height: imgRef.current.clientHeight || imgRef.current.offsetHeight
      });
    }
  }, [imageUrl, zoom]);

  // Reset zoom & pan when image changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsEyedropperActive(false);
    offscreenCanvasRef.current = null;
  }, [imageUrl]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    
    // Create offscreen canvas to sample pixel colors from
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0);
      offscreenCanvasRef.current = canvas;
    }
  };

  // Convert viewport screen coordinates to natural image pixel coordinate
  const translateCoordinatesToPixel = (clientX: number, clientY: number) => {
    if (!imgRef.current || !containerRef.current || naturalSize.width === 0) return null;
    
    const img = imgRef.current;
    const container = containerRef.current;
    
    const containerRect = container.getBoundingClientRect();
    
    // Center of image in container coordinates is centered (relative to container center) shifted by pan
    const centerX = containerRect.left + containerRect.width / 2 + pan.x;
    const centerY = containerRect.top + containerRect.height / 2 + pan.y;
    
    // Displacement from image center on screen
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    
    // Convert to unscaled coordinates (divide by current zoom factor)
    const unscaledDx = dx / zoom;
    const unscaledDy = dy / zoom;
    
    // Image layout dimensions (unscaled layout size)
    const layoutWidth = img.offsetWidth;
    const layoutHeight = img.offsetHeight;
    
    // Translate from layout center to layout top-left
    const layoutX = layoutWidth / 2 + unscaledDx;
    const layoutY = layoutHeight / 2 + unscaledDy;
    
    // Check if coordinates lie inside the actual visible layout image boundaries
    if (layoutX >= 0 && layoutX <= layoutWidth && layoutY >= 0 && layoutY <= layoutHeight) {
      // Scale up layout coordinates to natural/original file resolution
      const naturalX = Math.floor((layoutX / layoutWidth) * naturalSize.width);
      const naturalY = Math.floor((layoutY / layoutHeight) * naturalSize.height);
      
      // Prevent out of bounds
      const clampedX = Math.max(0, Math.min(naturalSize.width - 1, naturalX));
      const clampedY = Math.max(0, Math.min(naturalSize.height - 1, naturalY));
      
      return { x: clampedX, y: clampedY };
    }
    
    return null;
  };

  // Extract solid RGB from offscreen canvas
  const getPixelColor = (pixelCoord: { x: number; y: number }) => {
    if (!offscreenCanvasRef.current) return null;
    const ctx = offscreenCanvasRef.current.getContext('2d');
    if (!ctx) return null;
    
    try {
      const pixel = ctx.getImageData(pixelCoord.x, pixelCoord.y, 1, 1).data;
      return { r: pixel[0], g: pixel[1], b: pixel[2] };
    } catch (e) {
      console.error('Failed to extract color from offscreen canvas:', e);
      return null;
    }
  };

  // Zoom management
  const handleZoomIn = () => setZoom(prev => Math.min(5, prev + 0.3));
  const handleZoomOut = () => setZoom(prev => Math.max(0.5, prev - 0.3));
  const handleZoomReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Pan management
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (isEyedropperActive) return; // Ignore pan during eyedropper active state
    setIsPanning(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;

    if (isPanning) {
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
    }

    if (isEyedropperActive) {
      const pixelCoord = translateCoordinatesToPixel(e.clientX, e.clientY);
      if (pixelCoord) {
        const color = getPixelColor(pixelCoord);
        if (color) {
          const hex = rgbToHex(color.r, color.g, color.b);
          const name = getColorName(color.r, color.g, color.b);
          setHoverColor(hex);
          setHoverColorName(name);
          setLoupePos({ x: relativeX, y: relativeY, show: true });
          return;
        }
      }
      setLoupePos(prev => ({ ...prev, show: false }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleMouseLeave = () => {
    setIsPanning(false);
    setLoupePos(prev => ({ ...prev, show: false }));
  };

  // Click handler to select color
  const handleContainerClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!isEyedropperActive) {
      if (isInspectModeActive) {
        onSelectElement?.(null);
      }
      return;
    }
    
    const pixelCoord = translateCoordinatesToPixel(e.clientX, e.clientY);
    if (pixelCoord) {
      const color = getPixelColor(pixelCoord);
      if (color) {
        const hex = rgbToHex(color.r, color.g, color.b);
        const hslVal = rgbToHsl(color.r, color.g, color.b);
        const hsvVal = rgbToHsv(color.r, color.g, color.b);
        const cmykVal = rgbToCmyk(color.r, color.g, color.b);
        const name = getColorName(color.r, color.g, color.b);
        
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        const picked: PickedColor = {
          hex,
          rgb: `rgb(${color.r}, ${color.g}, ${color.b})`,
          hsl: `hsl(${hslVal.h}, ${hslVal.s}%, ${hslVal.l}%)`,
          hsv: `hsv(${hsvVal.h}, ${hsvVal.s}%, ${hsvVal.v}%)`,
          cmyk: `cmyk(${cmykVal.c}%, ${cmykVal.m}%, ${cmykVal.y}%, ${cmykVal.k}%)`,
          name,
          timestamp
        };
        
        onColorPicked(picked);
        setIsEyedropperActive(false); // Toggle eyedropper off after selection
      }
    }
  };

  return (
    <div className="bg-[#121212] border border-white/5 rounded-none p-4 flex flex-col h-full space-y-4 shadow-xl">
      {/* Control Header Row */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center space-x-2">
          <Maximize2 className="w-4 h-4 text-[#C9A227]" />
          <div>
            <h3 className="font-display text-sm font-light text-[#F5F5F5] uppercase tracking-wider">
              Design Inspector
            </h3>
            <p className="font-mono text-[8px] text-[#888888] tracking-widest uppercase">
              Interactive Zoom, Pan, & Sampling
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center space-x-2">
          {/* Inspect Mode toggle */}
          <button
            onClick={() => setIsInspectModeActive?.(!isInspectModeActive)}
            title="Toggle Inspect Mode"
            className={`p-2 border transition-all cursor-pointer flex items-center space-x-1.5 ${
              isInspectModeActive 
                ? 'bg-[#C9A227] text-black border-[#C9A227] shadow-[0_0_10px_rgba(201,162,39,0.3)] font-semibold' 
                : 'bg-[#1A1A1A] border-white/10 text-[#A3A3A3] hover:text-[#C9A227] hover:border-[#C9A227]/30'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="font-mono text-[8px] tracking-widest uppercase hidden sm:inline">Inspect Mode</span>
          </button>

          {/* Eyedropper activation */}
          <button
            onClick={() => {
              setIsEyedropperActive(!isEyedropperActive);
              if (!isEyedropperActive) {
                setIsInspectModeActive?.(false); // turn off inspect when picking colors
              }
            }}
            title="Toggle Eyedropper tool"
            className={`p-2 border transition-all cursor-pointer ${
              isEyedropperActive 
                ? 'bg-[#C9A227] text-black border-[#C9A227] shadow-[0_0_10px_rgba(201,162,39,0.3)]' 
                : 'bg-[#1A1A1A] border-white/10 text-[#A3A3A3] hover:text-[#C9A227] hover:border-[#C9A227]/30'
            }`}
          >
            <Pipette className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-5 bg-white/10" />

          {/* Zoom controls */}
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-2 bg-[#1A1A1A] border border-white/10 text-[#A3A3A3] hover:text-white hover:border-white/20 transition-all cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="font-mono text-[10px] text-white/50 w-10 text-center select-none">
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-2 bg-[#1A1A1A] border border-white/10 text-[#A3A3A3] hover:text-white hover:border-white/20 transition-all cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleZoomReset}
            title="Reset View"
            className="font-mono text-[8px] tracking-wider uppercase px-2.5 py-2 bg-[#1A1A1A] border border-white/10 text-[#A3A3A3] hover:text-white hover:border-white/20 transition-all cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Viewport Canvas container */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleContainerClick}
        className={`relative flex-1 min-h-[300px] bg-[#0A0A0A] border border-white/5 overflow-hidden flex items-center justify-center select-none ${
          isEyedropperActive 
            ? 'cursor-crosshair' 
            : isPanning 
              ? 'cursor-grabbing' 
              : 'cursor-grab'
        }`}
      >
        {/* Subtle grid pattern background representing CAD canvas */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:20px_20px] opacity-15 pointer-events-none" />

        {/* Scaled & panned Image Container holding overlays and image */}
        <div
          className="relative transition-transform duration-75 select-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            width: imageLayoutSize.width > 0 ? `${imageLayoutSize.width}px` : 'auto',
            height: imageLayoutSize.height > 0 ? `${imageLayoutSize.height}px` : 'auto',
            maxHeight: '90%',
            maxWidth: '90%'
          }}
        >
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Inspected Asset"
            onLoad={handleImageLoad}
            className="w-full h-full object-contain pointer-events-none select-none block"
          />

          {/* Absolute Overlays for Bounding Boxes */}
          {isInspectModeActive && elements.map((elem) => {
            const isSelected = elem.id === activeElementId;
            const { x, y, width, height } = elem.boundingBox;
            return (
              <button
                key={elem.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement?.(elem.id);
                }}
                className={`absolute border transition-all duration-150 group/box ${
                  isSelected 
                    ? 'border-[#C9A227] bg-[#C9A227]/15 ring-2 ring-[#C9A227] z-25 shadow-[0_0_20px_rgba(201,162,39,0.45)]' 
                    : 'border-[#C9A227]/30 bg-transparent hover:border-[#C9A227] hover:bg-[#C9A227]/5 hover:z-20'
                }`}
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  width: `${width}%`,
                  height: `${height}%`,
                }}
                title={`Inspect ${elem.name}`}
              >
                {/* Visual anchor corners */}
                {isSelected && (
                  <>
                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-[#C9A227] border border-black rounded-none" />
                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-[#C9A227] border border-black rounded-none" />
                    <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-[#C9A227] border border-black rounded-none" />
                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-[#C9A227] border border-black rounded-none" />
                  </>
                )}

                {/* Label Badge on box */}
                <div className={`absolute -top-5 left-0 px-2 py-0.5 bg-[#C9A227] text-black font-mono text-[7px] font-bold tracking-widest uppercase rounded-none whitespace-nowrap pointer-events-none transition-opacity flex items-center space-x-1 ${
                  isSelected ? 'opacity-100' : 'opacity-0 group-hover/box:opacity-100'
                }`}>
                  <span className="w-1 h-1 bg-black rounded-full animate-ping" />
                  <span>{elem.type}: {elem.name} ({elem.score}%)</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Floating color Magnifying Loupe Overlay when Eyedropper is active */}
        {isEyedropperActive && loupePos.show && hoverColor && (
          <div 
            className="absolute pointer-events-none -translate-x-1/2 -translate-y-[120%] bg-[#1A1A1A] border border-white/20 p-2 shadow-2xl flex items-center space-x-2 rounded-none z-20"
            style={{ 
              left: `${loupePos.x}px`, 
              top: `${loupePos.y}px` 
            }}
          >
            {/* Color Swatch Indicator */}
            <div 
              className="w-8 h-8 border border-white/20 shadow-inner rounded-none"
              style={{ backgroundColor: hoverColor }}
            />
            {/* Info label */}
            <div className="font-mono text-left leading-tight">
              <span className="text-[9px] text-white font-semibold uppercase block tracking-wider">
                {hoverColor}
              </span>
              <span className="text-[7px] text-[#C9A227] uppercase tracking-widest truncate max-w-[100px] block font-light">
                {hoverColorName}
              </span>
            </div>
          </div>
        )}

        {/* Instructions Banner bottom center */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/85 border border-white/5 py-1 px-3 font-mono text-[8px] tracking-widest text-[#888888] uppercase flex items-center space-x-1.5 z-10">
          {isEyedropperActive ? (
            <>
              <Pipette className="w-2.5 h-2.5 text-[#C9A227] animate-pulse" />
              <span className="text-[#C9A227]">Click any pixel on the image to sample its color</span>
            </>
          ) : (
            <>
              <Move className="w-2.5 h-2.5 text-white/50" />
              <span>Drag design to pan • Use controls to inspect</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
