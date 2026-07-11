/**
 * Aura Creative Suite - Color Utilities
 * Comprehensive color space converters, naming engine, and canvas pixel analysis.
 */

export interface ColorDetails {
  hex: string;
  rgb: string; // "rgb(r, g, b)"
  rgbValues: { r: number; g: number; b: number };
  hsl: string; // "hsl(h, s%, l%)"
  hslValues: { h: number; s: number; l: number };
  hsv: string; // "hsv(h, s%, v%)"
  hsvValues: { h: number; s: number; v: number };
  cmyk: string; // "cmyk(c%, m%, y%, k%)"
  cmykValues: { c: number; m: number; y: number; k: number };
  name: string;
  coverage: number; // percentage (0 - 100)
}

// 1. Color Conversions
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  return "#" + ((1 << 24) + (clamp(r) << 16) + (clamp(g) << 8) + clamp(b)).toString(16).slice(1).toUpperCase();
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const v = max;
  const d = max - min;
  const s = max === 0 ? 0 : d / max;

  let h = 0;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

export function rgbToCmyk(r: number, g: number, b: number): { c: number; m: number; y: number; k: number } {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const k = 1 - Math.max(rNorm, gNorm, bNorm);
  
  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  const c = Math.round(((1 - rNorm - k) / (1 - k)) * 100);
  const m = Math.round(((1 - gNorm - k) / (1 - k)) * 100);
  const y = Math.round(((1 - bNorm - k) / (1 - k)) * 100);

  return { c, m, y, k: Math.round(k * 100) };
}

// 2. High-End Color Naming Engine
export function getColorName(r: number, g: number, b: number): string {
  const { h, s, l } = rgbToHsl(r, g, b);
  
  // Custom curated dictionary of beautiful architectural/artistic names
  // 1. Grayscale / Neutrals
  if (s < 8) {
    if (l > 95) return "Alabaster Silk";
    if (l > 85) return "frosted Parchment";
    if (l > 70) return "Mist Ivory";
    if (l > 50) return "Mineral Ash";
    if (l > 35) return "Slate Charcoal";
    if (l > 15) return "Steel Shadow";
    if (l > 5) return "Obsidian Matte";
    return "Void Black";
  }

  // Define hue groups
  let hueName = "";
  if (h >= 345 || h < 15) {
    // Red
    if (l < 25) hueName = "Burgundy Wine";
    else if (l < 45) return s > 60 ? "Imperial Crimson" : "Terracotta Clay";
    else if (l > 75) return s > 60 ? "Flamingo Rose" : "Blush Quartz";
    else hueName = s > 70 ? "Scarlet Aura" : "Warm Coral";
  } else if (h >= 15 && h < 45) {
    // Orange / Brown
    if (l < 25) return "Espresso Timber";
    else if (l < 50) return s > 60 ? "Burnt Amber" : "Sienna Bark";
    else if (l > 75) return s > 60 ? "Apricot Glaze" : "Desert Sand";
    else hueName = "Copper Sunset";
  } else if (h >= 45 && h < 65) {
    // Yellow
    if (l < 30) return "Muted Ochre";
    else if (l > 80) return s > 50 ? "Lemon Butter" : "Soft Champagne";
    else return s > 75 ? "Solar Gold" : "Honey Wheat";
  } else if (h >= 65 && h < 150) {
    // Green
    if (l < 25) return s > 50 ? "Forest Pine" : "Olive Moss";
    else if (l > 75) return s > 50 ? "Mint Sage" : "Pistachio Glaze";
    else return s > 60 ? "Royal Emerald" : "Jade Leaf";
  } else if (h >= 150 && h < 200) {
    // Cyan / Teal
    if (l < 25) return "Abyss Petrol";
    else if (l > 75) return s > 50 ? "Frosted Aqua" : "Glacier Mist";
    else return s > 60 ? "Deep Teal" : "Sage Lagoon";
  } else if (h >= 200 && h < 255) {
    // Blue
    if (l < 20) return "Midnight Navy";
    else if (l < 45) return s > 60 ? "Cobalt Velvet" : "Steel Slate";
    else if (l > 75) return s > 50 ? "Cerulean Sky" : "Mist Blue";
    else return s > 60 ? "Prussian Blue" : "Nordic Dusk";
  } else if (h >= 255 && h < 300) {
    // Purple / Violet
    if (l < 25) return "Deep Amethyst";
    else if (l > 75) return "Lavender Silk";
    else return s > 60 ? "Imperial Violet" : "Muted Plum";
  } else {
    // Magenta / Pink
    if (l < 25) return "Gothic Cassis";
    else if (l > 75) return "Soft Rosewood";
    else return s > 60 ? "Vibrant Orchid" : "Dusk Fuchsia";
  }

  // Combine shade with hue
  if (l < 30) return `Shadowed ${hueName}`;
  if (l > 70) return `Luminous ${hueName}`;
  if (s < 30) return `Muted ${hueName}`;
  if (s > 80) return `Vibrant ${hueName}`;
  return hueName;
}

// 3. Client-Side Image Analysis & Color Extractor
// Samples pixels, clusters close colors, sorts by coverage percentage.
export function extractColorsFromImage(
  imageSrc: string,
  colorCount: number = 10,
  filterType: string = "all"
): Promise<ColorDetails[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not create canvas context"));
          return;
        }

        // Downscale image to a standard small resolution for blazing fast, CPU-friendly pixel processing
        const MAX_DIM = 200;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > MAX_DIM) {
            h = Math.round((h * MAX_DIM) / w);
            w = MAX_DIM;
          }
        } else {
          if (h > MAX_DIM) {
            w = Math.round((w * MAX_DIM) / h);
            h = MAX_DIM;
          }
        }

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);

        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        // Step A: Sample pixels to build frequency map
        const colorBuckets: { [key: string]: { r: number; g: number; b: number; count: number } } = {};
        const totalPixels = w * h;

        // Skip pixels to avoid tiny details & speed up processing
        const sampleStep = 4; // Samples every 4th pixel
        let sampledCount = 0;

        for (let i = 0; i < data.length; i += 4 * sampleStep) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Ignore transparent/highly semi-transparent pixels
          if (a < 50) continue;

          // Round colors slightly to group near-identical pixels together early
          const roundFactor = 16;
          const rRound = Math.round(r / roundFactor) * roundFactor;
          const gRound = Math.round(g / roundFactor) * roundFactor;
          const bRound = Math.round(b / roundFactor) * roundFactor;
          const key = `${rRound},${gRound},${bRound}`;

          if (colorBuckets[key]) {
            colorBuckets[key].count++;
            colorBuckets[key].r += r;
            colorBuckets[key].g += g;
            colorBuckets[key].b += b;
          } else {
            colorBuckets[key] = { r, g, b, count: 1 };
          }
          sampledCount++;
        }

        // Step B: Convert buckets to list and average original values
        let colorsList = Object.keys(colorBuckets).map(key => {
          const bucket = colorBuckets[key];
          const rAvg = Math.round(bucket.r / bucket.count);
          const gAvg = Math.round(bucket.g / bucket.count);
          const bAvg = Math.round(bucket.b / bucket.count);
          return {
            r: rAvg,
            g: gAvg,
            b: bAvg,
            count: bucket.count,
            coverage: (bucket.count / sampledCount) * 100
          };
        });

        // Sort by coverage/count
        colorsList.sort((a, b) => b.count - a.count);

        // Step C: Cluster similar colors (Merge colors with Euclidean distance < 45 in RGB space)
        const MERGE_THRESHOLD = 45;
        const clusters: typeof colorsList = [];

        for (const item of colorsList) {
          let merged = false;
          for (const cluster of clusters) {
            // Euclidean distance
            const dist = Math.sqrt(
              Math.pow(item.r - cluster.r, 2) +
              Math.pow(item.g - cluster.g, 2) +
              Math.pow(item.b - cluster.b, 2)
            );

            if (dist < MERGE_THRESHOLD) {
              // Merge into cluster
              cluster.count += item.count;
              // Weighted average for center
              const totalCount = cluster.count;
              cluster.r = Math.round((cluster.r * (totalCount - item.count) + item.r * item.count) / totalCount);
              cluster.g = Math.round((cluster.g * (totalCount - item.count) + item.g * item.count) / totalCount);
              cluster.b = Math.round((cluster.b * (totalCount - item.count) + item.b * item.count) / totalCount);
              cluster.coverage = (totalCount / sampledCount) * 100;
              merged = true;
              break;
            }
          }

          if (!merged && clusters.length < 50) {
            clusters.push({ ...item });
          }
        }

        // Re-sort clusters by coverage
        clusters.sort((a, b) => b.coverage - a.coverage);

        // Step D: Map clusters to final rich ColorDetails formats
        let finalColors: ColorDetails[] = clusters.map(c => {
          const hex = rgbToHex(c.r, c.g, c.b);
          const rgb = `rgb(${c.r}, ${c.g}, ${c.b})`;
          const hslVal = rgbToHsl(c.r, c.g, c.b);
          const hsvVal = rgbToHsv(c.r, c.g, c.b);
          const cmykVal = rgbToCmyk(c.r, c.g, c.b);
          const name = getColorName(c.r, c.g, c.b);

          return {
            hex,
            rgb,
            rgbValues: { r: c.r, g: c.g, b: c.b },
            hsl: `hsl(${hslVal.h}, ${hslVal.s}%, ${hslVal.l}%)`,
            hslValues: hslVal,
            hsv: `hsv(${hsvVal.h}, ${hsvVal.s}%, ${hsvVal.v}%)`,
            hsvValues: hsvVal,
            cmyk: `cmyk(${cmykVal.c}%, ${cmykVal.m}%, ${cmykVal.y}%, ${cmykVal.k}%)`,
            cmykValues: cmykVal,
            name,
            coverage: parseFloat(c.coverage.toFixed(1))
          };
        });

        // Step E: Apply filters if requested
        if (filterType !== "all") {
          finalColors = finalColors.filter(c => {
            const { h, s, l } = c.hslValues;
            const isWarm = (h >= 0 && h < 65) || h >= 320;
            const isCool = h >= 120 && h < 300;
            const isNeutral = s < 12;

            switch (filterType) {
              case "dominant":
                return c.coverage >= 10;
              case "warm":
                return isWarm && !isNeutral;
              case "cool":
                return isCool && !isNeutral;
              case "neutral":
                return isNeutral;
              case "dark":
                return l < 35;
              case "light":
                return l > 70;
              case "pastel":
                return s > 15 && s < 45 && l > 65;
              case "vibrant":
                return s > 65 && l > 20 && l < 80;
              case "muted":
                return s < 45 && l >= 25 && l <= 75;
              default:
                return true;
            }
          });
        }

        // Limit results to chosen number
        const countToTake = colorCount === -1 ? 12 : colorCount; // -1 represents Auto (say, take top 12)
        resolve(finalColors.slice(0, countToTake));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("Failed to load image for pixel analysis"));
    img.src = imageSrc;
  });
}
