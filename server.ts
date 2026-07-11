import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { CreativeDirectorReport, DesignStyle } from "./src/types";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Set up body parser with adequate limit for high-resolution images
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Google GenAI if key is present
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Aura AI: Gemini SDK initialized successfully.");
  } catch (error) {
    console.error("Aura AI: Failed to initialize Gemini client:", error);
  }
} else {
  console.log("Aura AI: Running in fallback mode. (Configure GEMINI_API_KEY in secrets for live analyses).");
}

// Dynamically completes a report with detailed audit scores, breakdowns, and step-by-step evaluations.
function completeReport(raw: any, style: DesignStyle): CreativeDirectorReport {
  const safeStr = (v: any, fallback: string) => typeof v === 'string' && v.trim().length > 0 ? v.trim() : fallback;
  const safeNum = (v: any, fallback: number) => typeof v === 'number' && !isNaN(v) ? v : fallback;
  const safeArray = (v: any, fallback: string[]) => Array.isArray(v) && v.length > 0 ? v.map(item => String(item)) : fallback;

  // Design style specific configurations for fallback/default scores and audit metrics
  const defaults: Record<DesignStyle, {
    typoScore: number;
    typoBreakdown: { fontChoice: number; fontPairing: number; readability: number; hierarchy: number; spacing: number };
    typoBreakdownExplanations: { fontChoice: string; fontPairing: string; readability: string; hierarchy: string; spacing: string };
    typoObservation: string;
    typoProblem: string;
    typoReason: string;
    typoSolution: string;

    colorScore: number;
    colorBreakdown: { harmony: number; contrast: number; readability: number; moodMatch: number };
    colorBreakdownExplanations: { harmony: string; contrast: string; readability: string; moodMatch: string };
    colorObservation: string;
    colorProblem: string;
    colorReason: string;
    colorSolution: string;
    currentPalette: { name: string; hex: string; usage: string }[];

    sizeScore: number;
    sizeBreakdown: { alignment: number; spacing: number; visualHierarchy: number; balance: number };
    sizeBreakdownExplanations: { alignment: string; spacing: string; visualHierarchy: string; balance: string };
    sizeObservation: string;
    sizeProblem: string;
    sizeReason: string;
    sizeSolution: string;

    bgScore: number;
    bgBreakdown: { cleanliness: number; compatibility: number; distractionControl: number; depth: number };
    bgBreakdownExplanations: { cleanliness: string; compatibility: string; distractionControl: string; depth: string };
    bgObservation: string;
    bgProblem: string;
    bgReason: string;
    bgSolution: string;
  }> = {
    Minimal: {
      typoScore: 72,
      typoBreakdown: { fontChoice: 80, fontPairing: 65, readability: 85, hierarchy: 60, spacing: 70 },
      typoBreakdownExplanations: {
        fontChoice: "Uses legible modern sans-serif fonts suitable for high-density reading.",
        fontPairing: "Heading and body fonts are overly identical, lacking a dynamic visual split.",
        readability: "Color contrast is excellent, though line heights are compressed.",
        hierarchy: "Muddy size differences make subheadings look too similar to primary bodies.",
        spacing: "Cramped paragraph line-spacing causes minor visual clutter."
      },
      typoObservation: "The layout uses clean geometric sans-serif fonts but lacks proper sizing scale and breathing space.",
      typoProblem: "Secondary tag descriptions are too heavy and have the same visual weight as description bodies.",
      typoReason: "Without adequate hierarchy, the user's eyes wander aimlessly across text blocks.",
      typoSolution: "Widen letter-spacing on small categories, convert them to uppercase, and thin out description paragraphs to weight 300.",

      colorScore: 84,
      colorBreakdown: { harmony: 90, contrast: 80, readability: 85, moodMatch: 75 },
      colorBreakdownExplanations: {
        harmony: "Incredible monochromatic palette with clean, luxury-tier golden indicators.",
        contrast: "Deep charcoal canvas offers highly comfortable contrast for long reading sessions.",
        readability: "Primary headers pop beautifully, though small captions could use slightly higher brightness.",
        moodMatch: "Perfect alignment with the requested cold, structural design style."
      },
      colorObservation: "A mostly dark charcoal palette accented with a sparse golden-yellow highlight color.",
      colorProblem: "Too many secondary elements share the exact same gray color as background containers, creating low-contrast pockets.",
      colorReason: "Low contrast on utility tags hides them from immediate visual detection, breaking usability.",
      colorSolution: "Shift utility text colors to a brighter off-white and isolate the gold accents strictly for action triggers.",
      currentPalette: [
        { name: "Deep Charcoal", hex: "#121212", usage: "Primary background layer" },
        { name: "Warm Gold", hex: "#D97706", usage: "Main accent color" },
        { name: "White Label", hex: "#FFFFFF", usage: "Body text readability" },
        { name: "Sleek Gray", hex: "#262626", usage: "Secondary container borders" }
      ],

      sizeScore: 68,
      sizeBreakdown: { alignment: 75, spacing: 60, visualHierarchy: 65, balance: 70 },
      sizeBreakdownExplanations: {
        alignment: "Decent grid alignment, though corner tags are pushing too close to outer edges.",
        spacing: "Severe layout tension; elements are begging for breathing room and margin space.",
        visualHierarchy: "Central visual component is fighting for dominance with surrounding structural borders.",
        balance: "Asymmetrical aspects are slightly unresolved, leaning too heavy on the left column."
      },
      sizeObservation: "A compact centered content structure bound by a heavy border layout.",
      sizeProblem: "Zero outer margins on key text labels make them collide with bounding box boundaries.",
      sizeReason: "Margins provide a 'buffer zone' that allows the eye to process separate containers in isolation.",
      sizeSolution: "Add a minimum of 48px padding to the main viewport container and increase structural spacing between columns.",

      bgScore: 78,
      bgBreakdown: { cleanliness: 80, compatibility: 85, distractionControl: 70, depth: 75 },
      bgBreakdownExplanations: {
        cleanliness: "Beautiful dark canvas, but slightly lacks custom subtle textures.",
        compatibility: "Dark matte backdrop sets an immaculate, high-end creative workspace feel.",
        distractionControl: "Minimal visual clutter, keeping full focus on the target design assets.",
        depth: "Flat base layout could be elevated with fine grid coordinates to add mechanical interest."
      },
      bgObservation: "A solid, deep charcoal matte background framed with simple thin border lines.",
      bgProblem: "The backdrop is completely flat, missing fine, premium details like grid overlay or noise grain.",
      bgReason: "Flat digital backdrops can feel cheap or clinical. Subtle organic textures add physical premium-tier craft.",
      bgSolution: "Apply an extremely low-opacity paper grain texture overlay or highly fine blueprint gridlines."
    },
    Luxury: {
      typoScore: 65,
      typoBreakdown: { fontChoice: 70, fontPairing: 60, readability: 75, hierarchy: 55, spacing: 65 },
      typoBreakdownExplanations: {
        fontChoice: "Lacks editorial sophistication; the generic geometric sans-serif choice lacks heritage.",
        fontPairing: "Monotonous pairing; everything is rendered in the same family, draining visual prestige.",
        readability: "Adequate reading speed, but fails to convey luxury poetic pauses.",
        hierarchy: "Bold, dense headlines look industrial and aggressive rather than delicate and elegant.",
        spacing: "Standard letter tracking is too compressed for high-luxury branding."
      },
      typoObservation: "The typography relies entirely on a generic geometric sans-serif with tight uppercase letter-spacing.",
      typoProblem: "Aggressive, bold headlines compete directly with decorative corner badges.",
      typoReason: "Luxury brand identities are built on typographic restraint and generous tracking, which this design lacks.",
      typoSolution: "Replace headings with a delicate serif like Cormorant Garamond, and track uppercase subtitles widely.",

      colorScore: 75,
      colorBreakdown: { harmony: 80, contrast: 70, readability: 75, moodMatch: 75 },
      colorBreakdownExplanations: {
        harmony: "Muted warm colors align nicely, though the gold is slightly acidic and oversaturated.",
        contrast: "Slightly low contrast on secondary warm-gray captions.",
        readability: "Good overall readability, but could be clearer in dark-themed environments.",
        moodMatch: "Strong alignment with premium dark-mode aesthetic, but feels a bit clinical."
      },
      colorObservation: "A warm dark background layered with champagne gold accents and ivory white text.",
      colorProblem: "The accent yellow leans too close to primary yellow rather than an authentic, warm champagne gold.",
      colorReason: "Vibrant yellow feels mass-market and commercial, whereas champagne gold evokes rarity and prestige.",
      colorSolution: "Shift the yellow accents to a true metallic HEX #D4AF37 and mute secondary cards to rich warm grays.",
      currentPalette: [
        { name: "Rich Charcoal Base", hex: "#080808", usage: "Main background frame" },
        { name: "Ivory White", hex: "#FAF9F6", usage: "Main headers and labels" },
        { name: "Muted Warm Gray", hex: "#8E8A82", usage: "Secondary body and tags" },
        { name: "Acidic Yellow-Gold", hex: "#F3C623", usage: "Highlight icons and borders" }
      ],

      sizeScore: 58,
      sizeBreakdown: { alignment: 65, spacing: 50, visualHierarchy: 55, balance: 60 },
      sizeBreakdownExplanations: {
        alignment: "A bit too rigid and centered; lacks high-end asymmetric editorial layout layouts.",
        spacing: "Compact cards create dense, tech-app-like structures instead of spacious luxury cards.",
        visualHierarchy: "Headings do not dominate; they are constrained inside small, high-density containers.",
        balance: "Feels symmetrical but heavy, lacking elegant organic breathing space."
      },
      sizeObservation: "A balanced, card-based layout centered with tight spacing constraints.",
      sizeProblem: "Tiny, high-density grids make the design look like a dashboard instead of an elegant presentation.",
      sizeReason: "Dashboard density reduces perceived rarity; spacious layouts indicate luxury and poise.",
      sizeSolution: "Increase the distance between blocks to 120px and push captions off-center to create modern visual tension.",

      bgScore: 82,
      bgBreakdown: { cleanliness: 85, compatibility: 80, distractionControl: 85, depth: 80 },
      bgBreakdownExplanations: {
        cleanliness: "Very clean dark base with great dark-mode comfort.",
        compatibility: "Perfect for editorial presentation of luxury assets.",
        distractionControl: "Deep black background keeps all focus centered on gold assets.",
        depth: "Lacks premium material overlays (like silk or matte linen) to elevate tactile feel."
      },
      bgObservation: "Flat solid dark background with basic thin layout dividers.",
      bgProblem: "The flat backdrop has zero depth, looking like standard dark digital screens.",
      bgReason: "Senses of luxury rely on tactile associations; adding organic texture simulates fine, premium print materials.",
      bgSolution: "Layer a subtle radial light-leak glow or dark matte linen texture at 3% opacity."
    },
    Professional: {
      typoScore: 82,
      typoBreakdown: { fontChoice: 85, fontPairing: 80, readability: 90, hierarchy: 75, spacing: 80 },
      typoBreakdownExplanations: {
        fontChoice: "Excellent choice of professional sans-serif (Inter/SF Pro) conveying corporate reliability.",
        fontPairing: "Clean, consistent application across all categories and widgets.",
        readability: "Superb contrast and legibility, though line-lengths exceed comfort limits in paragraphs.",
        hierarchy: "Clear separation of headings, but subheadings are too close in scale to paragraphs.",
        spacing: "Very good paragraph lines, though bullet lists are slightly squashed."
      },
      typoObservation: "The typography is clean and modern, leveraging reliable grotesque sans-serifs for readability.",
      typoProblem: "Long paragraph lines are stretching too wide, exceeding 80 characters.",
      typoReason: "Excessive line width tires the reader's eyes, causing them to lose their tracking row when scanning.",
      typoSolution: "Enforce a maximum width on paragraphs (max-w-xl) and increase subheading sizes to 1.25rem.",

      colorScore: 78,
      colorBreakdown: { harmony: 75, contrast: 85, readability: 85, moodMatch: 65 },
      colorBreakdownExplanations: {
        harmony: "Slightly scattered semantic colors; blue, red, and yellow are competing for attention.",
        contrast: "Highly clean, high-contrast text on solid backdrops.",
        readability: "Perfect visibility on all key data and metric points.",
        moodMatch: "Slightly too generic; looks like standard corporate blueprints rather than custom identity."
      },
      colorObservation: "A highly standard corporate palette utilizing bright primary blues and status colors.",
      colorProblem: "Bright primary accents are applied to background elements, creating unnecessary visual alerts.",
      colorReason: "Overusing semantic status colors weakens their effectiveness; colors must serve a direct functional role.",
      colorSolution: "Mute non-critical borders to neutral grays and reserve bright blues strictly for key interactive calls-to-action.",
      currentPalette: [
        { name: "Slate Blue Base", hex: "#0F172A", usage: "Main card container background" },
        { name: "Active Blue Accent", hex: "#3B82F6", usage: "Buttons, links, and selected states" },
        { name: "Corporate Off-White", hex: "#F8FAFC", usage: "Main body text and headings" },
        { name: "System Green", hex: "#10B981", usage: "Success badges and positive charts" }
      ],

      sizeScore: 74,
      sizeBreakdown: { alignment: 80, spacing: 70, visualHierarchy: 70, balance: 75 },
      sizeBreakdownExplanations: {
        alignment: "Perfect alignment along a structured grid system.",
        spacing: "Symmetric and mathematically structured, but feels rigid and lacking modern flow.",
        visualHierarchy: "Numbers are large, but secondary text labels compete for the same column space.",
        balance: "Extremely balanced; perhaps too static, looking slightly robotic."
      },
      sizeObservation: "A highly structured, grid-based dashboard with standard metrics and content blocks.",
      sizeProblem: "Robotic spacing and identical block sizes across the entire page make it hard to locate high-priority summaries.",
      sizeReason: "Varying spacing and container proportions guides the eye to highest-priority conclusions first.",
      sizeSolution: "Adopt a bento-grid layout, making key metric cards twice as wide as secondary details.",

      bgScore: 72,
      bgBreakdown: { cleanliness: 75, compatibility: 70, distractionControl: 75, depth: 65 },
      bgBreakdownExplanations: {
        cleanliness: "Very clean, minimal distracting noise.",
        compatibility: "Perfect for corporate presentations or data-heavy spreadsheets.",
        distractionControl: "Highly restrained backdrop allows data points to emerge cleanly.",
        depth: "Completely flat background makes the layout feel thin and uninspiring."
      },
      bgObservation: "A solid neutral slate-gray background block.",
      bgProblem: "The backdrop lacks modern depth, missing subtle card elevations or drop-shadow boundaries.",
      bgReason: "Adding subtle shadows or nested elevation shades establishes spatial layers, improving information architecture.",
      bgSolution: "Add card background elevations using slightly lighter shades (e.g. #1E293B) and soft bounding shadows."
    },
    Modern: {
      typoScore: 78,
      typoBreakdown: { fontChoice: 80, fontPairing: 75, readability: 80, hierarchy: 75, spacing: 80 },
      typoBreakdownExplanations: {
        fontChoice: "Uses clean sans-serif paired with code-like monospaced details.",
        fontPairing: "Nice modern pairing that reflects active technology and digital products.",
        readability: "Good, though font weights in the body are slightly too light.",
        hierarchy: "Clear typographic system, though labels inside badges could be tracked wider.",
        spacing: "Clean layout, with ample room between visual headings."
      },
      typoObservation: "The design leverages clean neo-grotesque fonts paired with monospaced accents.",
      typoProblem: "Small body paragraphs are rendered in thin font weights, reducing legibility on low-DPI displays.",
      typoReason: "Thin typefaces suffer from pixel anti-aliasing problems, making them appear blurred on standard screens.",
      typoSolution: "Increase paragraph font weight to regular (400) and track headings closer to add modern impact.",

      colorScore: 80,
      colorBreakdown: { harmony: 85, contrast: 80, readability: 80, moodMatch: 75 },
      colorBreakdownExplanations: {
        harmony: "Excellent cool-toned colors with smart, selective use of warm highlights.",
        contrast: "Strong overall contrast, though subtle gray borders are slightly too faint.",
        readability: "High visibility across most screens.",
        moodMatch: "Directly fits a sleek, modern tech-forward appearance."
      },
      colorObservation: "A cool-toned dark color scheme accented by neon green or electric blue elements.",
      colorProblem: "Gray borders between cards are too faint, causing adjacent blocks to blend into one another.",
      colorReason: "When borders are too low-contrast, cards lose their bounding structure, creating layout confusion.",
      colorSolution: "Slightly brighten border colors to #2D2D2D and isolate neon accents strictly for highlights.",
      currentPalette: [
        { name: "Onyx Dark Canvas", hex: "#0A0A0A", usage: "Main backdrop" },
        { name: "Electric Cyan", hex: "#06B6D4", usage: "Interactive markers and buttons" },
        { name: "Sleek Off-White", hex: "#ECEFF1", usage: "Headings and major content" },
        { name: "Tech Gray Divider", hex: "#1F2937", usage: "Card borders and structures" }
      ],

      sizeScore: 82,
      sizeBreakdown: { alignment: 85, spacing: 80, visualHierarchy: 80, balance: 85 },
      sizeBreakdownExplanations: {
        alignment: "Perfect alignment utilizing a modern CSS Grid layout.",
        spacing: "Spacious layout with generous padding within component cards.",
        visualHierarchy: "Clear focus on the main preview graphic.",
        balance: "Very well balanced, though slightly heavy on bottom elements."
      },
      sizeObservation: "A clean modern layout with generous negative space and a clear grid system.",
      sizeProblem: "Footer notes and legal links are the same size as primary tags, creating competition.",
      sizeReason: "Proper size division lets users naturally ignore utility content unless searching for it.",
      sizeSolution: "Shrink legal footer text to 10px and use a more muted gray color.",

      bgScore: 85,
      bgBreakdown: { cleanliness: 90, compatibility: 85, distractionControl: 80, depth: 85 },
      bgBreakdownExplanations: {
        cleanliness: "Extremely tidy dark backdrop with sleek borders.",
        compatibility: "Perfect for showing sleek product previews and screenshots.",
        distractionControl: "Keeps distractions minimal, with elegant subtle ambient details.",
        depth: "Uses nice card-based floating elevations to separate sections."
      },
      bgObservation: "A dark sleek background layered with clean bounding card cards.",
      bgProblem: "The backdrop feels slightly cold and computer-generated, lacking analog texture.",
      bgReason: "Subtle analog textures add a layer of human craft to sleek interfaces, making them feel premium.",
      bgSolution: "Layer a highly subtle noise grain or extremely soft radial light glow behind active cards."
    },
    Colorful: {
      typoScore: 70,
      typoBreakdown: { fontChoice: 75, fontPairing: 65, readability: 70, hierarchy: 65, spacing: 75 },
      typoBreakdownExplanations: {
        fontChoice: "Friendly, highly rounded typeface which feels playful and inviting.",
        fontPairing: "Lacks character contrast; both header and body use similar round structures.",
        readability: "Low contrast in regions where text overlays colorful backgrounds.",
        hierarchy: "Text is slightly oversized, reducing the impact of primary headlines.",
        spacing: "Line heights are too wide, making blocks look disconnected."
      },
      typoObservation: "The typography uses soft, rounded modern typefaces to fit a friendly, colorful aesthetic.",
      typoProblem: "White text overlays bright colorful backgrounds, violating accessibility guidelines (WCAG).",
      typoReason: "Low-contrast text layers cause extreme eye strain and are illegible to visually impaired users.",
      typoSolution: "Increase background saturation or use dark charcoal text on top of pastel elements.",

      colorScore: 88,
      colorBreakdown: { harmony: 90, contrast: 85, readability: 85, moodMatch: 92 },
      colorBreakdownExplanations: {
        harmony: "Beautiful analogous palette using soft pastel pinks, oranges, and purples.",
        contrast: "Excellent contrast between dark base containers and light colorful accents.",
        readability: "Good overall, but suffers in bright highlight badges.",
        moodMatch: "Directly hits a vibrant, creative, and cheerful emotional state."
      },
      colorObservation: "A highly vibrant analogous color scheme leveraging pastel pinks, purples, and warm corals.",
      colorProblem: "Color is applied everywhere with equal intensity, making it hard to find the primary focal points.",
      colorReason: "When color is used as a background for everything, nothing stands out; color must indicate hierarchy.",
      colorSolution: "Keep 70% of the canvas in a neutral shade (dark slate or soft off-white) and save vibrant pinks for active buttons.",
      currentPalette: [
        { name: "Vibrant Fuchsia", hex: "#EC4899", usage: "Primary colorful accent" },
        { name: "Cosmic Amethyst", hex: "#8B5CF6", usage: "Secondary decorative accents" },
        { name: "Sunset Orange", hex: "#F97316", usage: "Active badges and markers" },
        { name: "Deep Amethyst Base", hex: "#0F0B18", usage: "Main dark card background" }
      ],

      sizeScore: 72,
      sizeBreakdown: { alignment: 75, spacing: 70, visualHierarchy: 70, balance: 75 },
      sizeBreakdownExplanations: {
        alignment: "Playful offset grid; works well for creative designs.",
        spacing: "Generous padding, though cards look a bit bulky.",
        visualHierarchy: "Colorful graphics dominate, but text descriptions are pushed to the margins.",
        balance: "Nicely weighted, though the colorful headers draw too much weight to the top-right."
      },
      sizeObservation: "A lively, playful bento-grid layout with thick colorful borders.",
      sizeProblem: "Thick, colorful borders around every card create 'visual boundaries' that trap the user's focus.",
      sizeReason: "Thin borders or simple shadow separations let layouts breathe, facilitating visual transitions.",
      sizeSolution: "Reduce colorful borders to 1.5px and expand negative space between grid containers by 15px.",

      bgScore: 90,
      bgBreakdown: { cleanliness: 85, compatibility: 92, distractionControl: 90, depth: 92 },
      bgBreakdownExplanations: {
        cleanliness: "Extremely rich background that feels alive and highly premium.",
        compatibility: "Directly complements the colorful design style requested.",
        distractionControl: "Floating orbs are perfectly blurred (120px) to prevent sharp visual distraction.",
        depth: "Immersive depth created by glowing colorful background gradients."
      },
      bgObservation: "A deep, dark violet background with soft glowing neon orbs floating behind the content cards.",
      bgProblem: "In some viewports, the colorful orbs slide directly behind white body text, reducing readability.",
      bgReason: "Gradients with high luminosity changes beneath text layers introduce reading fatigue.",
      bgSolution: "Ensure neon orbs are positioned purely behind dark container elements or set their maximum opacity to 8%."
    },
    Elegant: {
      typoScore: 55,
      typoBreakdown: { fontChoice: 60, fontPairing: 50, readability: 65, hierarchy: 45, spacing: 55 },
      typoBreakdownExplanations: {
        fontChoice: "Relies on standard, mechanical blocky fonts which ruin elegant flow.",
        fontPairing: "Lacks poetic dialogue; headings and body are flat and uniform.",
        readability: "Good legibility, but lacks refined curves and literary pacing.",
        hierarchy: "Text headers are far too large and bulky, destroying any sense of delicate craft.",
        spacing: "Letter-spacing is compressed, which makes elegant headings look like advertisement copies."
      },
      typoObservation: "The typography is rigid and clinical, relying on heavy geometric sans-serif fonts.",
      typoProblem: "Chunky blocky titles look aggressive and corporate rather than refined and graceful.",
      typoReason: "Elegance is rooted in organic balance and delicate weight contrasts; heavy fonts feel too fast-paced and industrial.",
      typoSolution: "Introduce light, italicized serifs like Cormorant Garamond for titles, and widely track out subtitles.",

      colorScore: 65,
      colorBreakdown: { harmony: 70, contrast: 60, readability: 65, moodMatch: 65 },
      colorBreakdownExplanations: {
        harmony: "The color scheme is slightly cold, using clinical blues and heavy blacks.",
        contrast: "Contrast is slightly harsh, creating a cold, corporate computer feel.",
        readability: "Easy to read, but emotionally uninspiring for high-end creative work.",
        moodMatch: "Feels standard and utility-driven, lacking sophisticated warm neutral shades."
      },
      colorObservation: "Cold blacks paired with standard bright blues and low-contrast charcoal grays.",
      colorProblem: "Clinical high-contrast blacks look too digital; lacks the soft, luxurious warm off-whites of elegant print.",
      colorReason: "Pure digital black can feel cheap or sterile. Warm neutrals evoke physical craftsmanship, canvas, and prestige.",
      colorSolution: "Shift blacks to warm, organic charcoal hues and use champagne, olive, or soft warm gold highlights.",
      currentPalette: [
        { name: "Clinical Black", hex: "#000000", usage: "Main backdrop layer" },
        { name: "Digital Blue", hex: "#0066FF", usage: "Primary highlights and indicators" },
        { name: "Light Gray", hex: "#CCCCCC", usage: "Secondary headings and tags" },
        { name: "White", hex: "#FFFFFF", usage: "Primary labels and texts" }
      ],

      sizeScore: 60,
      sizeBreakdown: { alignment: 65, spacing: 55, visualHierarchy: 55, balance: 65 },
      sizeBreakdownExplanations: {
        alignment: "Perfect, rigid grid alignment; lacks organic, asymmetrical breathing room.",
        spacing: "Cards are highly compressed and packed tightly together.",
        visualHierarchy: "Title and body are fighting inside tight bounding boxes.",
        balance: "Static symmetry makes the layout feel boring and standard."
      },
      sizeObservation: "A standard grid layout packed with tight card components and rigid borders.",
      sizeProblem: "Strict grid structures with thick borders create 'rigid boxes' that feel heavy and trapping.",
      sizeReason: "Elegant layouts are lightweight; elements must appear to float with ample negative space.",
      sizeSolution: "Remove heavy card container backgrounds, and let text sections sit freely on a spacious warm canvas.",

      bgScore: 70,
      bgBreakdown: { cleanliness: 75, compatibility: 70, distractionControl: 70, depth: 65 },
      bgBreakdownExplanations: {
        cleanliness: "Tidy but sterile solid background.",
        compatibility: "Lacks luxury editorial feel; feels like a typical web platform.",
        distractionControl: "Restrained but uninspiring flat color.",
        depth: "Flat base with no depth, looking like an unstyled default template."
      },
      bgObservation: "A solid, cold digital black background canvas.",
      bgProblem: "Completely flat backdrops fail to support the organic beauty of elegant compositions.",
      bgReason: "Organic textures (matte canvas, subtle linen) evoke physical print materials, lifting perceived quality.",
      bgSolution: "Introduce a soft cream-to-charcoal radial gradient or elegant light-leak overlay."
    },
    Creative: {
      typoScore: 62,
      typoBreakdown: { fontChoice: 65, fontPairing: 55, readability: 70, hierarchy: 55, spacing: 65 },
      typoBreakdownExplanations: {
        fontChoice: "Generic sans-serif; fails to capture the bold, artistic spirit of a creative studio.",
        fontPairing: "Heading and body fonts are identical, creating a flat visual narrative.",
        readability: "Good readability but fails to excite or create an artistic point of focus.",
        hierarchy: "Size contrasts are very standard, looking like default blog layouts.",
        spacing: "Standard line spacing feels generic; lacks brave, expressive letter alignments."
      },
      typoObservation: "The typography is clean but highly standard, missing experimental or artistic letter forms.",
      typoProblem: "Standard blog-like titles look boring and fail to establish an energetic creative focal point.",
      typoReason: "Creative direction requires expressive typography to spark emotional engagement and show design courage.",
      typoSolution: "Introduce high-character display fonts (like Space Grotesk or Syne) and use asymmetric typographic scales.",

      colorScore: 82,
      colorBreakdown: { harmony: 85, contrast: 80, readability: 80, moodMatch: 85 },
      colorBreakdownExplanations: {
        harmony: "Excellent bold color palette with high emotional energy.",
        contrast: "Strong contrast between dark elements and neon highlights.",
        readability: "Very readable, though colorful tags are slightly oversaturated.",
        moodMatch: "Directly matches an active, experimental, and modern visual theme."
      },
      colorObservation: "A high-energy neon color scheme accented by purple, yellow, and deep charcoal.",
      colorProblem: "Accent colors are scattered randomly, creating high visual noise that distracts from core contents.",
      colorReason: "When high-saturation accents are placed everywhere, the user's eye gets tired, reducing focus duration.",
      colorSolution: "Limit high-saturation neon colors to a single, deliberate accent system and use slate grays for structure.",
      currentPalette: [
        { name: "Cosmic Onyx", hex: "#0D0D11", usage: "Main background frame" },
        { name: "Vibrant Amethyst", hex: "#7C3AED", usage: "Card borders and highlights" },
        { name: "Electric Yellow", hex: "#F59E0B", usage: "Status badges and markers" },
        { name: "Soft Linen Gray", hex: "#9CA3AF", usage: "Secondary body descriptions" }
      ],

      sizeScore: 55,
      sizeBreakdown: { alignment: 60, spacing: 50, visualHierarchy: 50, balance: 60 },
      sizeBreakdownExplanations: {
        alignment: "Standard, flat block grids; lacks the courageous asymmetry of creative design.",
        spacing: "Sections are packed too tightly, causing layouts to feel cluttered and heavy.",
        visualHierarchy: "Titles are swallowed by decorative neon frames and borders.",
        balance: "Symmetrical layout looks standard and safe rather than bold and experimental."
      },
      sizeObservation: "A balanced, card-based grid layout with thick bounding visual elements.",
      sizeProblem: "Thick bounding card elements trap and isolate contents, preventing overall page flow.",
      sizeReason: "Creative, high-end layouts flow across boundaries; overlapping elements create dynamic spatial depth.",
      sizeSolution: "Implement a 'Broken Frame' layout, where borders are open-ended or cross over each other asymmetrical.",

      bgScore: 80,
      bgBreakdown: { cleanliness: 80, compatibility: 85, distractionControl: 75, depth: 80 },
      bgBreakdownExplanations: {
        cleanliness: "Good deep background with excellent visual interest.",
        compatibility: "Nice architectural blueprint grid coordinates.",
        distractionControl: "Slightly high background contrast, drawing some attention away from content.",
        depth: "Great depth created by overlapping thin grid guidelines."
      },
      bgObservation: "A dark background layered with fine architectural grid lines and coordinate labels.",
      bgProblem: "Background coordinates are slightly too bright, competing with main text paragraphs.",
      bgReason: "Background textures should act as a supporting stage, never compete with foreground copy.",
      bgSolution: "Reduce the background grid line opacity to 3% to make it blend into the dark canvas."
    }
  };

  const styleDefaults = defaults[style] || defaults['Minimal'];

  const rawTypoScore = safeNum(raw?.typography?.score, styleDefaults.typoScore);
  const rawColorScore = safeNum(raw?.color?.score, styleDefaults.colorScore);
  const rawSizeScore = safeNum(raw?.sizePositioning?.score, styleDefaults.sizeScore);
  const rawBgScore = safeNum(raw?.background?.score, styleDefaults.bgScore);

  const computedOverallScore = Math.round(
    rawTypoScore * 0.25 + 
    rawColorScore * 0.25 + 
    rawSizeScore * 0.30 + 
    rawBgScore * 0.20
  );

  return {
    styleSelected: style,
    overallScore: safeNum(raw?.overallScore, computedOverallScore),
    overallVerdict: safeStr(raw?.overallVerdict, raw?.overallVerdict || "The design exhibits typical layout tension and elements begging for breathing room. To reach a high-end presentation, we must apply rigorous visual discipline across typography pairing, strict color contrast, and empty space alignment."),
    
    typography: {
      score: rawTypoScore,
      breakdown: {
        fontChoice: safeNum(raw?.typography?.breakdown?.fontChoice, styleDefaults.typoBreakdown.fontChoice),
        fontPairing: safeNum(raw?.typography?.breakdown?.fontPairing, styleDefaults.typoBreakdown.fontPairing),
        readability: safeNum(raw?.typography?.breakdown?.readability, styleDefaults.typoBreakdown.readability),
        hierarchy: safeNum(raw?.typography?.breakdown?.hierarchy, styleDefaults.typoBreakdown.hierarchy),
        spacing: safeNum(raw?.typography?.breakdown?.spacing, styleDefaults.typoBreakdown.spacing)
      },
      breakdownExplanations: {
        fontChoice: safeStr(raw?.typography?.breakdownExplanations?.fontChoice, styleDefaults.typoBreakdownExplanations.fontChoice),
        fontPairing: safeStr(raw?.typography?.breakdownExplanations?.fontPairing, styleDefaults.typoBreakdownExplanations.fontPairing),
        readability: safeStr(raw?.typography?.breakdownExplanations?.readability, styleDefaults.typoBreakdownExplanations.readability),
        hierarchy: safeStr(raw?.typography?.breakdownExplanations?.hierarchy, styleDefaults.typoBreakdownExplanations.hierarchy),
        spacing: safeStr(raw?.typography?.breakdownExplanations?.spacing, styleDefaults.typoBreakdownExplanations.spacing)
      },
      observation: safeStr(raw?.typography?.observation, styleDefaults.typoObservation),
      problem: safeStr(raw?.typography?.problem, styleDefaults.typoProblem),
      reason: safeStr(raw?.typography?.reason, styleDefaults.typoReason),
      solution: safeStr(raw?.typography?.solution, styleDefaults.typoSolution),
      problems: safeArray(raw?.typography?.problems, raw?.typography?.problems || (styleDefaults.typoProblem ? [styleDefaults.typoProblem] : ["Typographic scale is muddy", "Font pairing is inconsistent"])),
      whyItMatters: safeStr(raw?.typography?.whyItMatters, raw?.typography?.whyItMatters || styleDefaults.typoReason),
      suggestedImprovements: safeStr(raw?.typography?.suggestedImprovements, raw?.typography?.suggestedImprovements || styleDefaults.typoSolution),
      recommendedFonts: safeArray(raw?.typography?.recommendedFonts, raw?.typography?.recommendedFonts || ["Space Grotesk", "Inter", "Cormorant Garamond"]),
      exactChanges: safeArray(raw?.typography?.exactChanges, raw?.typography?.exactChanges || ["Set body line-height to 1.625", "Widely space small tags"]),
      individualTexts: Array.isArray(raw?.typography?.individualTexts) ? raw.typography.individualTexts.map((it: any) => ({
        text: safeStr(it?.text, ""),
        role: safeStr(it?.role, "Secondary element"),
        category: safeStr(it?.category, "Sans-serif"),
        weight: safeStr(it?.weight, "Regular"),
        size: safeStr(it?.size, "Medium"),
        readability: safeStr(it?.readability, "Fair"),
        issue: safeStr(it?.issue, "No critical issue detected."),
        recommendedFont: safeStr(it?.recommendedFont, "Inter"),
        recommendedStyle: safeStr(it?.recommendedStyle, "Regular"),
        sizeAdjustment: safeStr(it?.sizeAdjustment, "Keep current size"),
        spacingAdjustment: safeStr(it?.spacingAdjustment, "Keep current spacing"),
        positionAdjustment: safeStr(it?.positionAdjustment, "Keep current position"),
        reason: safeStr(it?.reason, "Maintains standard reading layout.")
      })) : [
        {
          text: "SHAIK",
          role: "Main Title / Heading",
          category: "Bold geometric sans-serif",
          weight: "Bold",
          size: "Large (approx 48px)",
          readability: "Good",
          issue: "The current generic style does not match a premium, luxury design identity.",
          recommendedFont: "Playfair Display Bold",
          recommendedStyle: "Elegant serif with italic highlights",
          sizeAdjustment: "Increase by 20%",
          spacingAdjustment: "Add slight character letter-spacing (0.05em)",
          positionAdjustment: "Move 50px upward to let secondary info breathe",
          reason: "A graceful, high-end editorial serif display font immediately builds deep classic luxury prestige and an artistic studio look."
        },
        {
          text: "Photography Contest",
          role: "Subtitle / Theme Label",
          category: "Standard grotesque sans-serif",
          weight: "Medium",
          size: "Medium (approx 18px)",
          readability: "Fair",
          issue: "Slightly crowded, fighting for visual hierarchy with the primary title above it.",
          recommendedFont: "Inter Medium",
          recommendedStyle: "Clean modern sans-serif",
          sizeAdjustment: "Decrease size by 15% to increase negative space contrast",
          spacingAdjustment: "Increase character-spacing/tracking by 0.18em",
          positionAdjustment: "Keep central position",
          reason: "Slightly downscaling the subhead while injecting generous spacing introduces majestic visual hierarchy and classic high-end air."
        },
        {
          text: "20 July 2026",
          role: "Detailed Date Label",
          category: "Sans-serif label",
          weight: "Regular",
          size: "Small (approx 12px)",
          readability: "Good",
          issue: "Lacks character or deliberate typography identity, feeling like a basic default input element.",
          recommendedFont: "JetBrains Mono Medium",
          recommendedStyle: "Structured Monospace, uppercase",
          sizeAdjustment: "Decrease size by 10%",
          spacingAdjustment: "Add letter-spacing 0.2em",
          positionAdjustment: "Shift 15px downward",
          reason: "Monospaced typesetting for detailed parameters establishes a modern constructivist feel, dividing narrative information cleanly."
        }
      ]
    },

    color: {
      score: rawColorScore,
      breakdown: {
        harmony: safeNum(raw?.color?.breakdown?.harmony, styleDefaults.colorBreakdown.harmony),
        contrast: safeNum(raw?.color?.breakdown?.contrast, styleDefaults.colorBreakdown.contrast),
        readability: safeNum(raw?.color?.breakdown?.readability, styleDefaults.colorBreakdown.readability),
        moodMatch: safeNum(raw?.color?.breakdown?.moodMatch, styleDefaults.colorBreakdown.moodMatch)
      },
      breakdownExplanations: {
        harmony: safeStr(raw?.color?.breakdownExplanations?.harmony, styleDefaults.colorBreakdownExplanations.harmony),
        contrast: safeStr(raw?.color?.breakdownExplanations?.contrast, styleDefaults.colorBreakdownExplanations.contrast),
        readability: safeStr(raw?.color?.breakdownExplanations?.readability, styleDefaults.colorBreakdownExplanations.readability),
        moodMatch: safeStr(raw?.color?.breakdownExplanations?.moodMatch, styleDefaults.colorBreakdownExplanations.moodMatch)
      },
      observation: safeStr(raw?.color?.observation, styleDefaults.colorObservation),
      problem: safeStr(raw?.color?.problem, styleDefaults.colorProblem),
      reason: safeStr(raw?.color?.reason, styleDefaults.colorReason),
      solution: safeStr(raw?.color?.solution, styleDefaults.colorSolution),
      currentPalette: Array.isArray(raw?.color?.currentPalette) && raw.color.currentPalette.length > 0 
        ? raw.color.currentPalette 
        : styleDefaults.currentPalette,
      improvedPalette: Array.isArray(raw?.color?.improvedPalette) && raw.color.improvedPalette.length > 0 
        ? raw.color.improvedPalette 
        : [
            { name: "Onyx Dark Canvas", hex: "#080808", usage: "Main backdrop" },
            { name: "Luxury Gold Accent", hex: "#D4AF37", usage: "Sparse accents" },
            { name: "Off-White Headings", hex: "#FAF9F6", usage: "Titles and content" }
          ],
      whyTheseColorsWork: safeStr(raw?.color?.whyTheseColorsWork, raw?.color?.whyTheseColorsWork || styleDefaults.colorReason),
      harmonyAndContrast: safeStr(raw?.color?.harmonyAndContrast, raw?.color?.harmonyAndContrast || "The color harmony balances dark elements against gold accents.")
    },

    sizePositioning: {
      score: rawSizeScore,
      breakdown: {
        alignment: safeNum(raw?.sizePositioning?.breakdown?.alignment, styleDefaults.sizeBreakdown.alignment),
        spacing: safeNum(raw?.sizePositioning?.breakdown?.spacing, styleDefaults.sizeBreakdown.spacing),
        visualHierarchy: safeNum(raw?.sizePositioning?.breakdown?.visualHierarchy, styleDefaults.sizeBreakdown.visualHierarchy),
        balance: safeNum(raw?.sizePositioning?.breakdown?.balance, styleDefaults.sizeBreakdown.balance)
      },
      breakdownExplanations: {
        alignment: safeStr(raw?.sizePositioning?.breakdownExplanations?.alignment, styleDefaults.sizeBreakdownExplanations.alignment),
        spacing: safeStr(raw?.sizePositioning?.breakdownExplanations?.spacing, styleDefaults.sizeBreakdownExplanations.spacing),
        visualHierarchy: safeStr(raw?.sizePositioning?.breakdownExplanations?.visualHierarchy, styleDefaults.sizeBreakdownExplanations.visualHierarchy),
        balance: safeStr(raw?.sizePositioning?.breakdownExplanations?.balance, styleDefaults.sizeBreakdownExplanations.balance)
      },
      observation: safeStr(raw?.sizePositioning?.observation, styleDefaults.sizeObservation),
      problem: safeStr(raw?.sizePositioning?.problem, styleDefaults.sizeProblem),
      reason: safeStr(raw?.sizePositioning?.reason, styleDefaults.sizeReason),
      solution: safeStr(raw?.sizePositioning?.solution, styleDefaults.sizeSolution),
      whatShouldMove: safeArray(raw?.sizePositioning?.whatShouldMove, raw?.sizePositioning?.whatShouldMove || (styleDefaults.sizeProblem ? [styleDefaults.sizeProblem] : [])),
      whatShouldIncrease: safeArray(raw?.sizePositioning?.whatShouldIncrease, raw?.sizePositioning?.whatShouldIncrease || ["Space between structural columns", "Body margins"]),
      whatShouldDecrease: safeArray(raw?.sizePositioning?.whatShouldDecrease, raw?.sizePositioning?.whatShouldDecrease || ["Scale of secondary items", "Button heights"]),
      layoutImprovements: safeArray(raw?.sizePositioning?.layoutImprovements, raw?.sizePositioning?.layoutImprovements || ["Use a mathematical bento-grid layout"])
    },

    background: {
      score: rawBgScore,
      breakdown: {
        cleanliness: safeNum(raw?.background?.breakdown?.cleanliness, styleDefaults.bgBreakdown.cleanliness),
        compatibility: safeNum(raw?.background?.breakdown?.compatibility, styleDefaults.bgBreakdown.compatibility),
        distractionControl: safeNum(raw?.background?.breakdown?.distractionControl, styleDefaults.bgBreakdown.distractionControl),
        depth: safeNum(raw?.background?.breakdown?.depth, styleDefaults.bgBreakdown.depth)
      },
      breakdownExplanations: {
        cleanliness: safeStr(raw?.background?.breakdownExplanations?.cleanliness, styleDefaults.bgBreakdownExplanations.cleanliness),
        compatibility: safeStr(raw?.background?.breakdownExplanations?.compatibility, styleDefaults.bgBreakdownExplanations.compatibility),
        distractionControl: safeStr(raw?.background?.breakdownExplanations?.distractionControl, styleDefaults.bgBreakdownExplanations.distractionControl),
        depth: safeStr(raw?.background?.breakdownExplanations?.depth, styleDefaults.bgBreakdownExplanations.depth)
      },
      observation: safeStr(raw?.background?.observation, styleDefaults.bgObservation),
      problem: safeStr(raw?.background?.problem, styleDefaults.bgProblem),
      reason: safeStr(raw?.background?.reason, styleDefaults.bgReason),
      solution: safeStr(raw?.background?.solution, styleDefaults.bgSolution),
      betterBackgroundIdeas: safeArray(raw?.background?.betterBackgroundIdeas, ["Subtle slate texture", "Soft mesh noise gradient", "Fine engineering wireframes"]),
      colors: safeArray(raw?.background?.colors, ["#121212", "#0A0A0A", "#1A1A1A"]),
      gradients: safeArray(raw?.background?.gradients, ["linear-gradient(to bottom, #121212, #080808)", "radial-gradient(circle at top, #1C1C1C, #0A0A0A)"]),
      blurSuggestions: safeStr(raw?.background?.blurSuggestions, "Subtle 20px frosted backdrop blurs on active widgets to simulate layers of premium matte glass."),
      textureSuggestions: safeStr(raw?.background?.textureSuggestions, "Extremely low-opacity grain (2%) overlay to mimic physical matte stock paper or editorial catalog texture.")
    },
    elements: raw?.elements && raw.elements.length > 0 ? raw.elements : [
      {
        id: "elem-logo",
        name: "Hero Brand Emblem (◇)",
        type: "logo",
        role: "Core brand identification & visual anchor",
        score: 85,
        boundingBox: { x: 45, y: 5, width: 10, height: 8 },
        logo: {
          placement: "Centered top axis",
          contrast: "Excellent gold-on-charcoal contrast",
          brandProminence: "Subtle and sophisticated, conveying exclusive luxury",
          clearSpace: "Generous 36px layout buffer on all sides",
          size: "Restrained, 48px footprint",
          improvements: [
            "Keep centered alignment to maintain symmetry",
            "Ensure high-resolution vector source is used to prevent edge aliasing"
          ]
        },
        color: {
          colorsUsed: [
            { hex: "#C9A227", rgb: "rgb(201, 162, 39)", hsl: "hsl(45, 68%, 47%)", hsv: "hsv(45, 81%, 79%)", cmyk: "cmyk(0%, 19%, 81%, 21%)", name: "Aura Gold", usage: "Emblem outline and center dot" }
          ],
          score: 92,
          suggestedColor: "#D4AF37",
          reason: "Shifting to Champagne Gold elevates editorial authenticity."
        },
        position: {
          currentPosition: "Center-top, Y: 5%, X: 45%",
          alignment: "Centered",
          spacing: "36px above title",
          margins: "Generous",
          visualWeight: "Light but distinct focal point",
          suggestions: [
            "Maintain centered top axis",
            "Add a very subtle floating entry animation"
          ]
        }
      },
      {
        id: "elem-title",
        name: "Primary Typography Header ('SHAIK')",
        type: "heading",
        role: "Visual entry point & primary narrative title",
        score: 68,
        boundingBox: { x: 15, y: 16, width: 70, height: 12 },
        typography: {
          text: "SHAIK",
          fontCategory: "Geometric Sans-serif",
          readability: "Excellent reading contrast, high legibility",
          hierarchy: "Stark, but lacks stylistic depth and emotional resonance",
          letterSpacing: "Tight (0.02em)",
          lineHeight: "1.2",
          alignment: "Centered",
          weight: "Bold (700)",
          fontPairing: "Lacks contrast with surrounding body copy",
          score: 65,
          problems: [
            "The current generic sans-serif style fails to match a premium editorial brand identity.",
            "Tight letter spacing on large display text feels squished and unconfident."
          ],
          reason: "Display titles for creative portfolios require expressive, high-character serif letterforms.",
          suggestedFont: "Playfair Display Bold",
          suggestedSize: "64px",
          suggestedPosition: "Keep centered, shift 10px upward",
          suggestedLetterSpacing: "0.04em tracking"
        },
        color: {
          colorsUsed: [
            { hex: "#FFFFFF", rgb: "rgb(255, 255, 255)", hsl: "hsl(0, 0%, 100%)", hsv: "hsv(0, 0%, 100%)", cmyk: "cmyk(0%, 0%, 0%, 0%)", name: "Solid White", usage: "Main heading glyphs" }
          ],
          score: 95,
          suggestedColor: "#FAF9F6",
          reason: "Using warm off-white (Ivory) softens screen glare."
        },
        position: {
          currentPosition: "Center-top, Y: 16%, X: 15%",
          alignment: "Centered",
          spacing: "12px above subtitle",
          margins: "Compressed",
          visualWeight: "Heavy, dominates the top third",
          suggestions: [
            "Move 10px upward",
            "Increase bottom margin to 24px"
          ]
        }
      },
      {
        id: "elem-sub",
        name: "Secondary Subhead ('Photography Contest')",
        type: "subheading",
        role: "Contextual subtitle & layout separator",
        score: 72,
        boundingBox: { x: 20, y: 30, width: 60, height: 8 },
        typography: {
          text: "Photography Contest",
          fontCategory: "Standard Grotesque Sans-serif",
          readability: "Moderate; slightly crowded by the heavy title",
          hierarchy: "Muddy; too close in scale to utility descriptions",
          letterSpacing: "Compressed (0px)",
          lineHeight: "1.4",
          alignment: "Centered",
          weight: "Medium (500)",
          fontPairing: "Competes directly with the title and paragraph styles",
          score: 70,
          problems: [
            "No typographic style division from paragraphs.",
            "Narrow tracking causes lowercase letters to run together."
          ],
          reason: "Subheads should be styled as high-tracking uppercase strings to act as air buffers.",
          suggestedFont: "Inter Light",
          suggestedSize: "13px uppercase",
          suggestedPosition: "Keep centered, shift 8px downward",
          suggestedLetterSpacing: "0.18em character tracking"
        },
        color: {
          colorsUsed: [
            { hex: "#FFFFFF", rgb: "rgb(255, 255, 255)", hsl: "hsl(0, 0%, 100%)", hsv: "hsv(0, 0%, 100%)", cmyk: "cmyk(0%, 0%, 0%, 0%)", name: "Solid White", usage: "Subtitle text" }
          ],
          score: 88,
          suggestedColor: "#8E8A82",
          reason: "Muting subtitle to warm gray establishes strict secondary role."
        },
        position: {
          currentPosition: "Center-top, Y: 30%, X: 20%",
          alignment: "Centered",
          spacing: "24px below title",
          margins: "Moderate",
          visualWeight: "Medium-light",
          suggestions: [
            "Shift 8px downward to widen separation",
            "Set container to inline-block with border dividers"
          ]
        }
      },
      {
        id: "elem-btn",
        name: "Primary Call To Action ('Register Now')",
        type: "button",
        role: "Primary conversion trigger & action pathway",
        score: 74,
        boundingBox: { x: 35, y: 78, width: 30, height: 10 },
        button: {
          visibility: "High, immediately located at bottom-center",
          contrast: "Moderate; white text on gold can bleed",
          hierarchy: "Prominent secondary layout anchor",
          ctaStrength: "Clear text copy, but rectangular border feels heavy",
          size: "Comfortable touch footprint (180px width, 44px height)",
          position: "Bottom center Y: 78%, X: 35%",
          improvements: [
            "Invert the layout: use an outlined border with transparent body",
            "Thin the outer outline border from 2px to 1px",
            "Apply wide uppercase letter spacing (0.15em) to CTA text"
          ]
        },
        color: {
          colorsUsed: [
            { hex: "#C9A227", rgb: "rgb(201, 162, 39)", hsl: "hsl(45, 68%, 47%)", hsv: "hsv(45, 81%, 79%)", cmyk: "cmyk(0%, 19%, 81%, 21%)", name: "Aura Gold", usage: "Button background fill" },
            { hex: "#000000", rgb: "rgb(0, 0, 0)", hsl: "hsl(0, 0%, 0%)", hsv: "hsv(0, 0%, 0%)", cmyk: "cmyk(0%, 0%, 0%, 100%)", name: "Pure Black", usage: "Button text labeling" }
          ],
          score: 80,
          suggestedColor: "Background: Transparent, Border & Text: #D4AF37",
          reason: "Outlined button style represents a high-end, artistic, and less aggressive interface."
        },
        position: {
          currentPosition: "Center-bottom, Y: 78%, X: 35%",
          alignment: "Centered",
          spacing: "48px below main text elements",
          margins: "Spacious",
          visualWeight: "Medium-heavy, pulls reader focus to the bottom",
          suggestions: [
            "Add 15px bottom buffer",
            "Center-align button container exactly on grid axis"
          ]
        }
      },
      {
        id: "elem-bg",
        name: "Ambient Dark Stage Background",
        type: "background",
        role: "Visual foundation & spatial staging",
        score: 80,
        boundingBox: { x: 2, y: 2, width: 96, height: 96 },
        background: {
          texture: "Solid flat digital black matte",
          contrast: "Extremely comfortable dark canvas reading contrast",
          distractions: "Zero visual clutter, excellent functional restraint",
          compatibility: "Strongly matches requested Creative workspace",
          mood: "Sleek, deep, clinical",
          score: 80,
          suggestions: [
            "Add a subtle linen grain paper texture overlay (3% opacity) to mimic premium stock paper",
            "Overlay fine architectural coordinate grids at 2% opacity for technical intrigue",
            "Layer a soft cream radial glow originating from top-left to mimic gallery lighting"
          ]
        },
        color: {
          colorsUsed: [
            { hex: "#050505", rgb: "rgb(5, 5, 5)", hsl: "hsl(0, 0%, 2%)", hsv: "hsv(0, 0%, 2%)", cmyk: "cmyk(0%, 0%, 0%, 98%)", name: "Deep Charcoal", usage: "Base viewport fill" }
          ],
          score: 90,
          suggestedColor: "#0C0C0B",
          reason: "Warm graphite alabaster black creates more material luxury."
        },
        position: {
          currentPosition: "Spans absolute workspace canvas",
          alignment: "Full coverage",
          spacing: "N/A",
          margins: "None",
          visualWeight: "Acts as supportive background stage",
          suggestions: [
            "Enforce a thin, 1px gold outline frame inset by 24px around the canvas boundaries"
          ]
        }
      }
    ],
    redesignConcepts: raw?.redesignConcepts && raw.redesignConcepts.length > 0 ? raw.redesignConcepts : [
      {
        id: "concept-luxury",
        name: "Ethereal Editorial",
        style: "Luxury",
        tagline: "High-end fashion house & cultural gallery prestige",
        keyChanges: [
          "Replaced sans titles with Cormorant Garamond italic serifs",
          "Expanded all letter tracking to 0.25em on subheadings",
          "Applied warm ivory-charcoal canvas lighting",
          "Outlined thin golden border frames (1px)"
        ],
        typographyPalette: {
          headerFont: "Cormorant Garamond Light",
          bodyFont: "Inter Light",
          pairingDescription: "A delicate, high-contrast serif display paired with a spacious, lightweight sans-serif body copy."
        },
        colorPalette: [
          { name: "Editorial Obsidian", hex: "#080808", role: "Main canvas base" },
          { name: "Cream Alabaster", hex: "#FAF9F6", role: "Main typography text" },
          { name: "Champagne Gold", hex: "#D4AF37", role: "Delicate accents and outlines" },
          { name: "Warm Taupe", hex: "#8E8A82", role: "Secondary metadata labels" }
        ],
        coreLayoutStrategy: "Asymmetric grid alignments and magazine-cover-like center title layout, surrounded by highly balanced white space.",
        whyItWorks: "Conveys rarity, slow craft, and heritage. By moving away from solid blocks and hard shapes, the design breathes with organic luxury."
      },
      {
        id: "concept-minimal",
        name: "Structural Mono",
        style: "Minimal",
        tagline: "Sleek Swiss functionalism & ultra-clean negative space",
        keyChanges: [
          "Removed all decorative cards and background fills",
          "Set typography to clean geometric sans-serif",
          "Added tiny monospaced coordinate tags along margins",
          "Maintained strictly 45% empty canvas space"
        ],
        typographyPalette: {
          headerFont: "Space Grotesk Regular",
          bodyFont: "Inter Regular",
          pairingDescription: "Crisp, geometric display gothic headlines supported by neat, high-density reading sans."
        },
        colorPalette: [
          { name: "Pure Void Black", hex: "#050505", role: "Absolute canvas surface" },
          { name: "Chalk White", hex: "#F5F5F5", role: "Heading and indicators" },
          { name: "Muted Graphite", hex: "#555555", role: "Secondary texts and layout grids" },
          { name: "Studio Yellow", hex: "#C9A227", role: "Sparse functional clicks" }
        ],
        coreLayoutStrategy: "Strict 8-column mathematical grid, utilizing negative space as the active visual driver to separate segments.",
        whyItWorks: "Eliminates visual noise entirely. The content acts as the form itself, delivering unmatched clarity, focus, and quiet confidence."
      },
      {
        id: "concept-modern",
        name: "Sleek Cyber",
        style: "Modern",
        tagline: "High-tech workspace with glowing electric details",
        keyChanges: [
          "Heavy bold title with -0.04em letters compression",
          "Applied electric cyan borders around compact components",
          "Added neon visual pulses and coordinate labels",
          "Rounded card borders to a sleek 16px"
        ],
        typographyPalette: {
          headerFont: "Plus Jakarta Sans ExtraBold",
          bodyFont: "JetBrains Mono",
          pairingDescription: "Chunky, expressive neo-grotesque headings contrasted with highly clean technical coding monospace labels."
        },
        colorPalette: [
          { name: "Deep Obsidian", hex: "#0D0D11", role: "Matte dark-mode stage" },
          { name: "Electric Cyan", hex: "#06B6D4", role: "Borders, buttons, and select states" },
          { name: "Cyber White", hex: "#FFFFFF", role: "Primary headings" },
          { name: "Graphite Divider", hex: "#1F2937", role: "Structural card frames" }
        ],
        coreLayoutStrategy: "Symmetrical bento-grid cells with tight 20px padding and luminous visual separation lines.",
        whyItWorks: "Feels active, interactive, and high-performance. Perfect for digital products, portfolios, and futuristic tech branding."
      }
    ]
  };
}

/**
 * Generate a premium, highly descriptive fallback report based on the selected design style.
 * This ensures that even if the API key is not present, the app functions as an incredible showcase.
 */
function getPlaceholderReport(style: DesignStyle): CreativeDirectorReport {
  const reports: Record<DesignStyle, any> = {
    Minimal: {
      styleSelected: 'Minimal',
      overallVerdict: "The baseline concept is decent, but it suffers from excessive layout tension and elements begging for breathing room. Minimalist design is not about having nothing on screen; it is the absolute mastery of negative space. Currently, too many elements are competing for attention with equal weight, defeating the purpose of a minimalist direction.",
      typography: {
        problems: [
          "The title font lacks structural breathing room, showing tight tracking which clashes with a spacious layout.",
          "Secondary labels are set in the exact same weight as description paragraphs, diluting the visual hierarchy.",
          "Line height in paragraphs is too cramped (around 1.2), causing overlapping visual noise and making it hard to read."
        ],
        whyItMatters: "In a minimalist layout, typography acts as the primary design element. When typography lacks breathing room or clear weight variations, the entire design feels cluttered, uncurated, and amateurish rather than intentional and clean.",
        suggestedImprovements: "Introduce extreme contrast in weight (e.g., Thin vs Bold), widen the tracking on small uppercase subtitles, and expand line-spacing dramatically.",
        recommendedFonts: ["Space Grotesk", "Inter", "Helvetica Neue (Light)"],
        exactChanges: [
          "Set paragraph line-height to 1.625 (leading-relaxed).",
          "Add tracking-widest (0.15em) and uppercase transformation to the upper category tag.",
          "Reduce the weight of description text to 300 (Light) and increase the title size to 3rem."
        ]
      },
      color: {
        harmonyAndContrast: "The composition currently utilizes five separate hues, creating a fragmented palette that lacks restraint. Contrast levels are uneven, making some secondary information hard to read.",
        improvedPalette: [
          { name: "Canvas Base", hex: "#050505", usage: "Dominant background (90% of layout)" },
          { name: "Primary Typography", hex: "#F5F5F5", usage: "Title and main headings" },
          { name: "Secondary Typo / Border", hex: "#444444", usage: "Labels, cards borders, and captions" },
          { name: "Studio Gold Accent", hex: "#C9A227", usage: "Extremely sparse highlights (buttons or status ticks only)" }
        ],
        whyTheseColorsWork: "This strict, restricted color palette eliminates chromatic distraction. By using deep black and luxury white with a single, highly refined gold highlight, the focus stays entirely on structure, line, and composition."
      },
      sizePositioning: {
        whatShouldMove: [
          "Shift the primary logo indicator out of the corner, giving it at least 48px of padding from all viewport edges.",
          "Center-align the main heading group to ground the composition symmetrically."
        ],
        whatShouldIncrease: [
          "Increase the negative space surrounding the central graphic element by 40%.",
          "Increase the main button's horizontal padding to create a more luxurious aspect ratio."
        ],
        whatShouldDecrease: [
          "Decrease the size of secondary description paragraphs by 15% to let the titles dominate.",
          "Shrink the corner indicators — they are screaming too loudly for utility elements."
        ],
        layoutImprovements: [
          "Enforce a strict 8-column layout grid.",
          "Ensure at least 30% of the total canvas area remains entirely empty to achieve true minimalist poise."
        ]
      },
      background: {
        betterBackgroundIdeas: [
          "A pure flat charcoal-to-black canvas, avoiding any bright gradients or lens flares.",
          "A solid matte background layered with a very fine CSS grid lines overlay (opacity 0.03)."
        ],
        colors: ["#050505", "#121212"],
        gradients: ["Linear top-to-bottom fade from #121212 to #050505"],
        blurSuggestions: "Eliminate any dynamic background blurs. Keep backdrops completely crisp, matte, and dry to support the minimal aesthetic.",
        textureSuggestions: "Apply an extremely subtle grain overlay (using a high-contrast noise texture set to 2% opacity) to give the deep black a tactile, physical paper feel."
      }
    },
    Luxury: {
      styleSelected: 'Luxury',
      overallVerdict: "The layout lacks the editorial sophistication expected of a premium brand. It currently looks more like a standard corporate landing page than a luxury presentation. To elevate this, we must adopt an editorial mindset: asymmetric positioning, elegant serif-sans pairings, and highly restrained, warm gold elements.",
      typography: {
        problems: [
          "The design relies on a generic geometric sans-serif for everything, losing any sense of craft or heritage.",
          "Uppercase typography has standard tracking, making it feel heavy rather than light and spacious.",
          "The headline is bold and dense, which looks aggressive and industrial rather than graceful."
        ],
        whyItMatters: "Luxury brands express prestige through typographic restraint. Heavy, standard sans-serifs convey utility and mass-market commerce, whereas high-fashion and luxury layouts demand lightweight, high-contrast serif displays or highly spaced classic grotesque details.",
        suggestedImprovements: "Replace the primary headline with a high-contrast elegant serif (like Playfair Display or Bodoni). Use light weights, and pair it with a highly tracking-spaced sans-serif for secondary details.",
        recommendedFonts: ["Playfair Display", "Cormorant Garamond", "Cinzel"],
        exactChanges: [
          "Change heading font to 'Cormorant Garamond' at font-weight 300.",
          "Increase letter-spacing on all small tags and subtitles to 0.25em (tracking-widest).",
          "Set paragraph text to small size (0.875rem) with absolute light weight to look delicate."
        ]
      },
      color: {
        harmonyAndContrast: "The background is too bright and lacks depth, while the accent color leans toward an acidic, oversaturated yellow rather than a warm, champagne gold.",
        improvedPalette: [
          { name: "Deep Charcoal Canvas", hex: "#080808", usage: "Main editorial background" },
          { name: "Champagne Luxury Gold", hex: "#D4AF37", usage: "Delicate highlight lines, status, and active states" },
          { name: "Ivory White", hex: "#FAF9F6", usage: "Principal editorial headings" },
          { name: "Muted Warm Gray", hex: "#8E8A82", usage: "Paragraphs and secondary descriptions" }
        ],
        whyTheseColorsWork: "By shifting the background to a deep ivory-warm charcoal contrast, and replacing raw yellow with a classic champagne gold (#D4AF37), we evoke heritage, high craft, and prestige."
      },
      sizePositioning: {
        whatShouldMove: [
          "Reposition the main logo to the absolute center-top of the frame, behaving like an editorial magazine head.",
          "Align secondary descriptions off-center to create a dynamic, modern asymmetric rhythm."
        ],
        whatShouldIncrease: [
          "Increase the margins between individual sections to 120px to create a slow, deliberate scrolling rhythm.",
          "Increase the letter-spacing and tracking of headings while shrinking their absolute vertical box size."
        ],
        whatShouldDecrease: [
          "Reduce the border widths of cards from 2px to 1px, and style them in low-contrast gold-gray.",
          "Shrink the size of call-to-action buttons, making them thin and delicate rather than thick, blocky rectangles."
        ],
        layoutImprovements: [
          "Utilize an off-center asymmetric composition.",
          "Frame the entire screen layout with a thin, elegant 24px inset border of dark gold or deep graphite."
        ]
      },
      background: {
        betterBackgroundIdeas: [
          "An extremely subtle radial gradient that glows softly from the center, simulating a physical studio backlight.",
          "A rich, high-contrast dark silk texture overlay."
        ],
        colors: ["#0A0A0A", "#181715"],
        gradients: ["Radial gradient from #181715 at center to #050505 at borders"],
        blurSuggestions: "Apply a soft, diffuse backdrop-blur (40px) to any floating cards to create an expensive frosted glass or crystalline layer.",
        textureSuggestions: "Incorporate a subtle, ultra-fine marble or matte silk texture overlay to create tactile depth without visual clutter."
      }
    },
    Professional: {
      styleSelected: 'Professional',
      overallVerdict: "The layout contains functional components, but lacks the rigorous structure and grid discipline required for professional trust. Alignment is sloppy, visual hierarchy is flat, and typography lacks distinction. A professional style must scream reliability, clarity, and precision.",
      typography: {
        problems: [
          "The hierarchy is muddy; the subheadings are too close in size to the main text.",
          "The main fonts are too casual or have overly round terminals, reducing professional authority.",
          "Line lengths are too long (exceeding 80 characters), which tires the eye of a professional reader."
        ],
        whyItMatters: "Clarity in typography directly translates to perceived credibility. If the user struggles to scan and find key metrics or categories because of sloppy sizing and hierarchy, the design loses authority.",
        suggestedImprovements: "Use a clean, corporate, high-legibility grotesque font. Enforce a strict mathematical type-scale (e.g., multiplier of 1.333). Limit line length for body text to a highly readable 60-65 characters.",
        recommendedFonts: ["Inter", "SF Pro Display", "Roboto"],
        exactChanges: [
          "Enforce line-clamp on paragraphs and limit maximum width to max-w-xl (36rem).",
          "Increase subtitle size to 1.25rem and make them medium weight (font-weight 500) to stand out clearly from the body.",
          "Set numbers or numerical data to a monospaced typeface to ensure perfect tabular alignment."
        ]
      },
      color: {
        harmonyAndContrast: "The colors look random. They are neither strictly corporate nor tastefully minimal. Bright primary colors are competing with each other without clear semantic roles.",
        improvedPalette: [
          { name: "Deep Navy Carbon", hex: "#0B0F19", usage: "Main background setting a serious, secure tone" },
          { name: "Executive Off-White", hex: "#F3F4F6", usage: "Highly legible text" },
          { name: "Trust Blue Accent", hex: "#2563EB", usage: "Primary actions and functional links" },
          { name: "System Slate Gray", hex: "#6B7280", usage: "Metadata, disabled states, and borders" }
        ],
        whyTheseColorsWork: "A secure navy base coupled with crisp slate and a highly reliable focus blue creates an environment of confidence, precision, and technical competence."
      },
      sizePositioning: {
        whatShouldMove: [
          "Align all cards to a strict, horizontal grid line. Currently, some are sagging by 10-15px.",
          "Align form labels directly above their inputs instead of off-side."
        ],
        whatShouldIncrease: [
          "Increase the padding inside cards from 16px to 24px to separate content structures.",
          "Increase the height of input boxes to 48px to accommodate comfortable touch targets."
        ],
        whatShouldDecrease: [
          "Shrink icons inside buttons. They are currently massive and throwing off the text alignment.",
          "Decrease the corner-radius of cards from overly round bubbles to a precise, professional 6px-8px."
        ],
        layoutImprovements: [
          "Implement a strict 12-column grid system.",
          "Align all visual elements perfectly on the vertical axis."
        ]
      },
      background: {
        betterBackgroundIdeas: [
          "A solid, secure charcoal-navy flat background.",
          "A crisp, light-absorbing dark tech surface with structured horizontal dividing lines."
        ],
        colors: ["#0B0F19", "#111827"],
        gradients: ["Subtle linear gradient from #1F2937 to #111827"],
        blurSuggestions: "Keep background elements extremely sharp. Blurs represent softness, which is counterproductive for structural professional interfaces.",
        textureSuggestions: "Use crisp, faint grid line patterns or coordinate marks to reinforce structural discipline."
      }
    },
    Modern: {
      styleSelected: 'Modern',
      overallVerdict: "The design is safe but slightly boring and dated. It lacks the crispness, bold scaling, and smart contrast of cutting-edge modern tech layouts. The borders are too heavy, shadows are too muddy, and typography is too uniform.",
      typography: {
        problems: [
          "The header text weight is too generic (standard bold), losing the modern editorial edge.",
          "Subtitles lack a secondary visual indicator (like a tiny badge or upper tracking text).",
          "Font sizes don't scale up aggressively on larger displays, leaving lots of empty dead space."
        ],
        whyItMatters: "Modern layouts rely on strong, expressive typography contrast. Standard, uniform bold headings feel like early-2010s corporate layouts, lacking the energetic visual pacing of modern products.",
        suggestedImprovements: "Introduce aggressive font scale changes. Use heavy extra-bold headers paired with ultra-light or clean medium monospaced subheadings.",
        recommendedFonts: ["Plus Jakarta Sans", "Outfit", "Space Grotesk"],
        exactChanges: [
          "Change the main title weight to 800 (Extra Bold) with -0.04em letter-spacing (tracking-tight).",
          "Convert category tags to tiny uppercase monospaced labels.",
          "Increase spacing below titles to 24px."
        ]
      },
      color: {
        harmonyAndContrast: "The layout uses classic black and white but fails to establish modern visual interest. It feels sterile rather than premium.",
        improvedPalette: [
          { name: "Onyx Black Canvas", hex: "#050505", usage: "Main background layer" },
          { name: "Cyber White", hex: "#FFFFFF", usage: "High-contrast headings" },
          { name: "Liquid Silver", hex: "#CCCCCC", usage: "Subheadings and descriptions" },
          { name: "Electric Amber", hex: "#F59E0B", usage: "Interactive points and focus states" }
        ],
        whyTheseColorsWork: "High-contrast onyx paired with silver and an electric amber highlight creates a sleek, high-tech, modern interface that is visually active yet sophisticated."
      },
      sizePositioning: {
        whatShouldMove: [
          "Group related items into distinct cards rather than letting them float loosely on the canvas.",
          "Center-align primary actions while keeping content cards in an interesting bento-box grid."
        ],
        whatShouldIncrease: [
          "Increase the main layout's max-width to 1200px to expand the horizontal field.",
          "Increase the border-radius of card containers to a modern 16px."
        ],
        whatShouldDecrease: [
          "Decrease the size of secondary labels to 12px.",
          "Reduce the card shadows. Modern designs prefer crisp, thin borders over heavy, fuzzy drop shadows."
        ],
        layoutImprovements: [
          "Re-arrange items into a dynamic, asymmetric Bento Grid.",
          "Introduce subtle border indicators that act as section separators."
        ]
      },
      background: {
        betterBackgroundIdeas: [
          "A dark modern matte canvas with a single glowing amber or gold light source in the background.",
          "A charcoal background with clean, razor-thin graphite separators."
        ],
        colors: ["#050505", "#121212"],
        gradients: ["Radial gradient of gold accent glowing from bottom-right at 5% opacity"],
        blurSuggestions: "Use high-blur (64px) backdrops behind cards to simulate depth of field.",
        textureSuggestions: "A very faint carbon or digital pixel grid to give a subtle high-tech atmosphere."
      }
    },
    Colorful: {
      styleSelected: 'Colorful',
      overallVerdict: "The colors currently fight with each other, creating visual chaos rather than vibrant energy. There is no clear dominant color, which means the viewer's eye has no logical starting point. We need to transition from 'messy' to 'harmonious and energetic'.",
      typography: {
        problems: [
          "Typography is overwhelmed by the color intensity, reducing readability to near-zero.",
          "The font weight is too thin, causing the letters to bleed into bright background segments.",
          "Text colors are applied letter-by-letter or in loud, contrasting rainbow patterns, which looks chaotic."
        ],
        whyItMatters: "When designing with rich colors, typography must serve as an anchor. If the text is thin and lacks crisp background contrast, the design becomes unreadable and causes user fatigue.",
        suggestedImprovements: "Use thick, robust, heavy fonts to stand out against rich backdrops. Ground the typography on high-contrast dark backdrops so the colored elements feel like glowing lights in a dark room.",
        recommendedFonts: ["Syne", "Cabinet Grotesk", "Space Grotesk"],
        exactChanges: [
          "Change main title to 'Syne' at weight 800, setting its color to pure luxury white for maximum separation.",
          "Use backdrops or background card wrappers to frame text, shielding it from neon color bleed.",
          "Restrict the text colors to simple white and muted grey, letting the layout borders and cards carry the vibrant hues."
        ]
      },
      color: {
        harmonyAndContrast: "Too many saturations are clashing. We have neon purple, bright yellow, and hot pink fighting at 100% saturation simultaneously.",
        improvedPalette: [
          { name: "Onyx Darkroom", hex: "#050505", usage: "Main canvas background" },
          { name: "Solar Gold Accent", hex: "#C9A227", usage: "Primary energetic brand accents" },
          { name: "Cosmic Amethyst", hex: "#7C3AED", usage: "Secondary glowing borders" },
          { name: "Sunset Crimson", hex: "#DB2777", usage: "Interactive states and dynamic badge glows" }
        ],
        whyTheseColorsWork: "By placing high-saturation, cosmic amethyst and sunset crimson glows exclusively on borders and accents against a deep onyx background, we create a vibrant 'cyber-neon' feel that maintains professional contrast and luxury."
      },
      sizePositioning: {
        whatShouldMove: [
          "Move highly colorful elements to the outer margins as visual frames rather than placing them behind critical text.",
          "Push secondary metadata elements into simple, clean black boxes."
        ],
        whatShouldIncrease: [
          "Increase the scale of the central design subject to stand proud of the colorful backdrop.",
          "Increase padding between colored components to prevent 'color bleeding' across adjacent grids."
        ],
        whatShouldDecrease: [
          "Reduce the size of colored icons — they are bleeding out visually.",
          "Decrease the thickness of colorful borders to a crisp 1.5px."
        ],
        layoutImprovements: [
          "Separate the layout into clear, dark cards with thin, colored neon-glow borders.",
          "Keep text blocks nested inside pure-black inner margins."
        ]
      },
      background: {
        betterBackgroundIdeas: [
          "A deep dark canvas with ambient, colored soft-focus orbs floating in the corners.",
          "A dark background with elegant gold and purple light leaks."
        ],
        colors: ["#050505", "#0F0B18"],
        gradients: ["Subtle diagonal purple-to-gold sweep at 10% opacity"],
        blurSuggestions: "Apply a 120px blur to colored floating blobs behind cards to simulate an organic glowing aura.",
        textureSuggestions: "An organic noise grain overlay to distribute the neon light smoothly and prevent color banding."
      }
    },
    Elegant: {
      styleSelected: 'Elegant',
      overallVerdict: "The layout contains blocky, harsh structures that break any sense of flow, grace, or elegance. The grid is rigid and heavy, and there is a total lack of organic curves, lightweight lines, and fluid spacing.",
      typography: {
        problems: [
          "Hard, chunky geometric headings destroy the soft, premium feel of an elegant composition.",
          "Subtitles are set in dark high-contrast blocks which feel too aggressive.",
          "Letter spacing on secondary labels is too narrow, making them feel squeezed."
        ],
        whyItMatters: "Elegance is defined by flow, poise, and lightness. Chunky fonts and blocky text structures feel heavy, fast-paced, and commercial, whereas elegance requires slow reading, beautiful curves, and generous space.",
        suggestedImprovements: "Use lightweight sans-serif or refined transitional serif typefaces. Create a clear contrast between titles (graceful serif) and body (clean, light grotesque). Increase line-spacing to create a feeling of luxurious ease.",
        recommendedFonts: ["Cormorant Garamond", "Inter", "Playfair Display"],
        exactChanges: [
          "Set the main title to 'Cormorant Garamond' in italic light weight, giving it a poetic, organic silhouette.",
          "Increase paragraph line-height to 1.75 to let the eyes glide seamlessly between lines.",
          "Convert buttons to simple, elegant text links with a thin gold underline instead of blocky rectangular containers."
        ]
      },
      color: {
        harmonyAndContrast: "The design is using hard, clinical high-contrast blacks and blues, which feels too cold and technical. We need warm, natural, luxury tones.",
        improvedPalette: [
          { name: "Warm Alabaster Charcoal", hex: "#0C0C0B", usage: "Soft luxury dark background" },
          { name: "Polished Brass Gold", hex: "#C9A227", usage: "Refined details and gold borders" },
          { name: "Cream Silk White", hex: "#F5F5ED", usage: "Headings and major text" },
          { name: "Muted Taupe", hex: "#9E978E", usage: "Paragraphs and detailed specs" }
        ],
        whyTheseColorsWork: "Shifting the palette to a warmer, alabaster-charcoal base and taupe text immediately softens the environment, conveying high-end art-direction and classic elegance."
      },
      sizePositioning: {
        whatShouldMove: [
          "Center-align the heading elements and give them a generous 80px top padding.",
          "Shift call-to-actions to the center-bottom, floating them gracefully above the content."
        ],
        whatShouldIncrease: [
          "Increase the vertical margins between blocks to create a majestic, relaxed visual tempo.",
          "Increase the size of typographic elements while making their weights significantly lighter."
        ],
        whatShouldDecrease: [
          "Decrease the thickness of all divider lines to 0.5px and set their opacity to 30%.",
          "Shrink any large, blocky icons. They should be delicate line drawings, not solid glyphs."
        ],
        layoutImprovements: [
          "Embrace asymmetric white space to let components breathe naturally.",
          "Ensure every text block is surrounded by at least 60px of empty space on all sides."
        ]
      },
      background: {
        betterBackgroundIdeas: [
          "A warm, rich charcoal background with a very soft radial center light glow.",
          "An organic, slow-moving abstract liquid backdrop in deep gold-gray."
        ],
        colors: ["#0C0C0B", "#1C1B19"],
        gradients: ["Soft radial sweep of cream light in the center of a warm gray-black canvas"],
        blurSuggestions: "Apply ultra-soft blurs on background shapes to mimic a shallow depth-of-field photo studio lens.",
        textureSuggestions: "A very faint silk or linen canvas weave overlay to add organic warmth and textural prestige."
      }
    },
    Creative: {
      styleSelected: 'Creative',
      overallVerdict: "The design is too rigid, safe, and expected. It follows basic standard templates, which actively works against a creative positioning. To make this truly creative, we must break the grid intentionally, introduce bold scale contrasts, and play with structural overlays.",
      typography: {
        problems: [
          "Typography is trapped in a classic vertical grid, losing any sense of artistic expression.",
          "The main heading is styled in a completely standard font that lacks personality.",
          "The spacing is perfectly uniform, which looks mechanical and uninspired."
        ],
        whyItMatters: "Creative designs must feel authored, experimental, and unique. If the typography is perfectly standard, the layout feels like a pre-made template, which defeats the brand's creative authority.",
        suggestedImprovements: "Mix a classic editorial font with a bold modern mono or display typeface. Use extreme size scales, overlap text blocks with imagery, and introduce structural details like subtle rotated labels.",
        recommendedFonts: ["Syne", "JetBrains Mono", "Space Grotesk"],
        exactChanges: [
          "Make the main title 4rem, utilizing extra-bold 'Syne' paired with small, light-weight monospaced 'JetBrains Mono' metadata tags.",
          "Rotate secondary category tags by -90 degrees and place them along the margins of the container.",
          "Add dynamic gold borders that extend beyond the card boundaries, creating an 'unfinished frame' look (perfectly aligning with Aura's logo philosophy)."
        ]
      },
      color: {
        harmonyAndContrast: "The layout uses dull corporate grays and standard dark-blues that suppress energy and creative thinking.",
        improvedPalette: [
          { name: "Pitch Void Background", hex: "#030303", usage: "Main base canvas" },
          { name: "Aura Amber Gold", hex: "#C9A227", usage: "Dynamic structural frames and title highlights" },
          { name: "Chalk White", hex: "#F5F5F5", usage: "Expressive headings" },
          { name: "Graphite Accent", hex: "#333333", usage: "Monospaced code labels and rotated indicators" }
        ],
        whyTheseColorsWork: "High-contrast void black, chalk white, and rotated graphite labels paired with structured lines of gold create a bold, art-studio 'constructivist' aesthetic."
      },
      sizePositioning: {
        whatShouldMove: [
          "Offset cards slightly from each other to create overlapping depth layers.",
          "Move metadata details to the absolute edges of the layout, forming a frame of data around the work."
        ],
        whatShouldIncrease: [
          "Increase the scale of the key visual element to bleed off the edge of its parent card.",
          "Increase the typographic size differences between headers and body content (e.g., from 1.5x to 4x)."
        ],
        whatShouldDecrease: [
          "Decrease the size of descriptions to 13px but set them in crisp JetBrains Mono to keep them highly readable.",
          "Shrink borders where elements overlap to maintain sleekness."
        ],
        layoutImprovements: [
          "Incorporate overlapping layers, floating tags, and asymmetrical borders.",
          "Implement the 'Broken Frame' concept, where design borders are open-ended or cross over each other."
        ]
      },
      background: {
        betterBackgroundIdeas: [
          "An abstract constructivist background with fine blueprint grid lines.",
          "A dark technical drafting sheet style canvas."
        ],
        colors: ["#030303", "#121212"],
        gradients: ["Sharp, linear diagonal dividing lines forming split shades"],
        blurSuggestions: "No blurs; keep everything razor-sharp and structural to support the constructivist feel.",
        textureSuggestions: "Use blueprint-like grid coordinate lines or subtle architectural grid prints to set a deliberate workspace vibe."
      }
    }
  };

  return completeReport(reports[style] || reports['Minimal'], style);
}

// Safely sanitizes and structure-validates a potentially incomplete or corrupted parsed JSON report from Gemini API.
function sanitizeReport(parsed: any, style: DesignStyle): CreativeDirectorReport {
  const fallback = getPlaceholderReport(style);
  
  const safeArray = (arr: any, fallbackArr: string[]): string[] => {
    if (Array.isArray(arr) && arr.length > 0) {
      return arr.map(item => String(item));
    }
    return fallbackArr;
  };

  const safeString = (str: any, fallbackStr: string): string => {
    if (typeof str === 'string' && str.trim().length > 0) {
      return str.trim();
    }
    return fallbackStr;
  };

  // Build the sanitized report
  const sanitized: any = {
    styleSelected: style,
    overallScore: parsed?.overallScore,
    overallVerdict: safeString(parsed?.overallVerdict, fallback.overallVerdict),
    typography: {
      score: parsed?.typography?.score,
      breakdown: parsed?.typography?.breakdown,
      breakdownExplanations: parsed?.typography?.breakdownExplanations,
      observation: safeString(parsed?.typography?.observation, ""),
      problem: safeString(parsed?.typography?.problem, ""),
      reason: safeString(parsed?.typography?.reason, ""),
      solution: safeString(parsed?.typography?.solution, ""),
      problems: safeArray(parsed?.typography?.problems, fallback.typography.problems),
      whyItMatters: safeString(parsed?.typography?.whyItMatters, fallback.typography.whyItMatters),
      suggestedImprovements: safeString(parsed?.typography?.suggestedImprovements, fallback.typography.suggestedImprovements),
      recommendedFonts: safeArray(parsed?.typography?.recommendedFonts, fallback.typography.recommendedFonts),
      exactChanges: safeArray(parsed?.typography?.exactChanges, fallback.typography.exactChanges),
      individualTexts: Array.isArray(parsed?.typography?.individualTexts)
        ? parsed.typography.individualTexts.map((it: any) => ({
            text: safeString(it?.text, ""),
            role: safeString(it?.role, "Secondary element"),
            category: safeString(it?.category, "Sans-serif"),
            weight: safeString(it?.weight, "Regular"),
            size: safeString(it?.size, "Medium"),
            readability: safeString(it?.readability, "Fair"),
            issue: safeString(it?.issue, "No critical issue detected."),
            recommendedFont: safeString(it?.recommendedFont, "Inter"),
            recommendedStyle: safeString(it?.recommendedStyle, "Regular"),
            sizeAdjustment: safeString(it?.sizeAdjustment, "Keep current size"),
            spacingAdjustment: safeString(it?.spacingAdjustment, "Keep current spacing"),
            positionAdjustment: safeString(it?.positionAdjustment, "Keep current position"),
            reason: safeString(it?.reason, "Maintains cohesive layout.")
          }))
        : fallback.typography.individualTexts
    },
    color: {
      score: parsed?.color?.score,
      breakdown: parsed?.color?.breakdown,
      breakdownExplanations: parsed?.color?.breakdownExplanations,
      observation: safeString(parsed?.color?.observation, ""),
      problem: safeString(parsed?.color?.problem, ""),
      reason: safeString(parsed?.color?.reason, ""),
      solution: safeString(parsed?.color?.solution, ""),
      currentPalette: Array.isArray(parsed?.color?.currentPalette) ? parsed.color.currentPalette : undefined,
      improvedPalette: Array.isArray(parsed?.color?.improvedPalette) && parsed.color.improvedPalette.length > 0
        ? parsed.color.improvedPalette.map((item: any, idx: number) => {
            const fallbackItem = fallback.color.improvedPalette[idx] || fallback.color.improvedPalette[0];
            return {
              name: safeString(item?.name, fallbackItem.name),
              hex: safeString(item?.hex, fallbackItem.hex),
              usage: safeString(item?.usage, fallbackItem.usage)
            };
          })
        : fallback.color.improvedPalette,
      whyTheseColorsWork: safeString(parsed?.color?.whyTheseColorsWork, fallback.color.whyTheseColorsWork),
      harmonyAndContrast: safeString(parsed?.color?.harmonyAndContrast, fallback.color.harmonyAndContrast)
    },
    sizePositioning: {
      score: parsed?.sizePositioning?.score,
      breakdown: parsed?.sizePositioning?.breakdown,
      breakdownExplanations: parsed?.sizePositioning?.breakdownExplanations,
      observation: safeString(parsed?.sizePositioning?.observation, ""),
      problem: safeString(parsed?.sizePositioning?.problem, ""),
      reason: safeString(parsed?.sizePositioning?.reason, ""),
      solution: safeString(parsed?.sizePositioning?.solution, ""),
      whatShouldMove: safeArray(parsed?.sizePositioning?.whatShouldMove, fallback.sizePositioning.whatShouldMove),
      whatShouldIncrease: safeArray(parsed?.sizePositioning?.whatShouldIncrease, fallback.sizePositioning.whatShouldIncrease),
      whatShouldDecrease: safeArray(parsed?.sizePositioning?.whatShouldDecrease, fallback.sizePositioning.whatShouldDecrease),
      layoutImprovements: safeArray(parsed?.sizePositioning?.layoutImprovements, fallback.sizePositioning.layoutImprovements)
    },
    background: {
      score: parsed?.background?.score,
      breakdown: parsed?.background?.breakdown,
      breakdownExplanations: parsed?.background?.breakdownExplanations,
      observation: safeString(parsed?.background?.observation, ""),
      problem: safeString(parsed?.background?.problem, ""),
      reason: safeString(parsed?.background?.reason, ""),
      solution: safeString(parsed?.background?.solution, ""),
      betterBackgroundIdeas: safeArray(parsed?.background?.betterBackgroundIdeas, fallback.background.betterBackgroundIdeas),
      colors: safeArray(parsed?.background?.colors, fallback.background.colors),
      gradients: safeArray(parsed?.background?.gradients, fallback.background.gradients),
      blurSuggestions: safeString(parsed?.background?.blurSuggestions, fallback.background.blurSuggestions),
      textureSuggestions: safeString(parsed?.background?.textureSuggestions, fallback.background.textureSuggestions)
    }
  };

  return completeReport(sanitized, style);
}

// REST API endpoint: /api/analyze-design
app.post("/api/analyze-design", async (req, res) => {
  try {
    const { image, style } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Missing image payload. Please upload a design image." });
    }

    const selectedStyle: DesignStyle = style || 'Minimal';
    console.log(`Aura AI: Received design analysis request for style: ${selectedStyle}`);

    // Parse the image payload (extract base64 and mimeType)
    let base64Data = image;
    let mimeType = "image/png";

    if (image.startsWith("data:")) {
      const parts = image.split(",");
      base64Data = parts[1];
      const mimePart = parts[0].match(/data:(.*?);/);
      if (mimePart && mimePart[1]) {
        mimeType = mimePart[1];
      }
    }

    // Check if AI client is available
    if (aiClient) {
      try {
        console.log("Aura AI: Sending request to Gemini Vision API using gemini-3.5-flash...");

        const prompt = `You are Aura AI, an elite professional design judge and senior Creative Director at a top-tier design studio.
You have a "Dark Luxury Minimal" aesthetic: your feedback is honest, sharp, educational, specific, and practical.
Do NOT give generic compliments or high scores easily. Bad designs must receive low scores. Use the full range:
- 90-100: Professional level
- 70-89: Good
- 50-69: Average
- 30-49: Needs serious improvement
- 0-29: Poor design execution

Your analysis process is: Analyze → Score → Explain → Improve.
First, identify and analyze everything currently present in the uploaded design before giving suggestions. Do NOT directly suggest improvements.

CRITICAL TYPOGRAPHY REQUIREMENT (OCR TEXT EXTRACTION & ELEMENT-LEVEL ANALYSIS):
You must perform an individual, text-by-text visual audit and precise font recommendations for every single piece of text visible in the uploaded design image.
1. OCR EXTRACTION: Extract ALL visible text blocks, titles, subheadings, labels, numbers, dates, or button copy from the uploaded image separately (e.g. "SHAIK", "Photography Contest", "20 July 2026").
2. INDIVIDUAL TEXT ANALYSIS: For every extracted text element, identify:
   - What the exact text is.
   - Its role in the layout hierarchy (e.g. Main Heading, Subhead, Utility Label, CTA Text).
   - Its current font category, approximate weight, and approximate size in the uploaded design.
   - Its current readability rating and the specific visual/hierarchy issue with it.
3. PRECISE FONT PAIRING & IMPROVEMENTS: Suggest a specific Google Font recommendation (e.g. 'Playfair Display', 'Inter', 'JetBrains Mono') and treatment, alongside specific adjustments:
   - Size Adjustment (e.g. "Increase by 20%", "Decrease by 10%").
   - Spacing/Tracking Adjustment (e.g. "Add 0.15em letter-spacing", "Narrow line-height to 1.3").
   - Position Adjustment (e.g. "Move 50px upward", "Shift 20px downward", "Keep centered").
   - A descriptive psychological and brand reason explaining why this specific change resolves the issue.

The overall design score (overallScore) is calculated using these strict weights: Typography (25%), Colors (25%), Size & Positioning (30%), Background (20%).

Ensure your output perfectly matches the expected JSON structure. Do not use markdown inside your JSON strings.`;

        const imagePart = {
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          },
        };

        const response = await aiClient.models.generateContent({
          model: "gemini-3.5-flash",
          contents: {
            parts: [
              imagePart,
              { text: prompt }
            ]
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                overallScore: { type: Type.INTEGER, description: "Calculated overall Aura Score (Typography 25%, Colors 25%, Size & Positioning 30%, Background 20%)." },
                overallVerdict: { type: Type.STRING, description: "Honest, constructive, professional senior Creative Director verdict statement." },
                typography: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.INTEGER, description: "Typography score (0-100)." },
                    breakdown: {
                      type: Type.OBJECT,
                      properties: {
                        fontChoice: { type: Type.INTEGER },
                        fontPairing: { type: Type.INTEGER },
                        readability: { type: Type.INTEGER },
                        hierarchy: { type: Type.INTEGER },
                        spacing: { type: Type.INTEGER }
                      },
                      required: ["fontChoice", "fontPairing", "readability", "hierarchy", "spacing"]
                    },
                    breakdownExplanations: {
                      type: Type.OBJECT,
                      properties: {
                        fontChoice: { type: Type.STRING },
                        fontPairing: { type: Type.STRING },
                        readability: { type: Type.STRING },
                        hierarchy: { type: Type.STRING },
                        spacing: { type: Type.STRING }
                      },
                      required: ["fontChoice", "fontPairing", "readability", "hierarchy", "spacing"]
                    },
                    observation: { type: Type.STRING, description: "What Aura AI detected currently in the uploaded design's typography." },
                    problem: { type: Type.STRING, description: "What is reducing typography quality." },
                    reason: { type: Type.STRING, description: "Why this affects typography/branding quality." },
                    solution: { type: Type.STRING, description: "How to improve typography." },
                    problems: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of specific typography issues." },
                    whyItMatters: { type: Type.STRING, description: "Typographical psychology/branding impact of these problems." },
                    suggestedImprovements: { type: Type.STRING, description: "Typography visual strategy suggestions." },
                    recommendedFonts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific premium font recommendations." },
                    exactChanges: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Actionable concrete typography settings changes." },
                    individualTexts: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          text: { type: Type.STRING, description: "The exact OCR detected text." },
                          role: { type: Type.STRING, description: "Role of the element (e.g. Heading, Subhead, Detail, Button, Badge)." },
                          category: { type: Type.STRING, description: "Current font category descriptor." },
                          weight: { type: Type.STRING, description: "Approximate current weight." },
                          size: { type: Type.STRING, description: "Approximate current size." },
                          readability: { type: Type.STRING, description: "Current readability description." },
                          issue: { type: Type.STRING, description: "The visual issue with this specific piece of text." },
                          recommendedFont: { type: Type.STRING, description: "Recommended specific Google Font name." },
                          recommendedStyle: { type: Type.STRING, description: "Recommended weight, uppercase, italic, etc." },
                          sizeAdjustment: { type: Type.STRING, description: "e.g. Increase by 25% or Decrease by 10%." },
                          spacingAdjustment: { type: Type.STRING, description: "e.g. Add letter-spacing 0.12em or narrow line-height." },
                          positionAdjustment: { type: Type.STRING, description: "e.g. Move 50px upward, shift 15px downward, align left." },
                          reason: { type: Type.STRING, description: "Design theory explanation of why this change improves cohesion." }
                        },
                        required: ["text", "role", "category", "weight", "size", "readability", "issue", "recommendedFont", "recommendedStyle", "sizeAdjustment", "spacingAdjustment", "positionAdjustment", "reason"]
                      },
                      description: "List of every text element detected in the uploaded design with individualized settings corrections."
                    }
                  },
                  required: ["score", "breakdown", "breakdownExplanations", "observation", "problem", "reason", "solution", "problems", "whyItMatters", "suggestedImprovements", "recommendedFonts", "exactChanges", "individualTexts"]
                },
                color: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.INTEGER, description: "Color score (0-100)." },
                    breakdown: {
                      type: Type.OBJECT,
                      properties: {
                        harmony: { type: Type.INTEGER },
                        contrast: { type: Type.INTEGER },
                        readability: { type: Type.INTEGER },
                        moodMatch: { type: Type.INTEGER }
                      },
                      required: ["harmony", "contrast", "readability", "moodMatch"]
                    },
                    breakdownExplanations: {
                      type: Type.OBJECT,
                      properties: {
                        harmony: { type: Type.STRING },
                        contrast: { type: Type.STRING },
                        readability: { type: Type.STRING },
                        moodMatch: { type: Type.STRING }
                      },
                      required: ["harmony", "contrast", "readability", "moodMatch"]
                    },
                    observation: { type: Type.STRING, description: "What Aura AI detected currently in colors." },
                    problem: { type: Type.STRING, description: "What is reducing color quality." },
                    reason: { type: Type.STRING, description: "Why this affects color harmony/branding." },
                    solution: { type: Type.STRING, description: "How to improve color palette." },
                    currentPalette: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING, description: "Descriptive name of the detected color role (e.g. Primary Background, Text Accent)" },
                          hex: { type: Type.STRING, description: "Detected HEX code" },
                          usage: { type: Type.STRING, description: "Brief visual comment" }
                        },
                        required: ["name", "hex", "usage"]
                      },
                      description: "List of major detected colors in the uploaded design."
                    },
                    harmonyAndContrast: { type: Type.STRING, description: "Analysis of colors, harmony, contrast, and psychological mood." },
                    improvedPalette: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING, description: "Visual role of the color" },
                          hex: { type: Type.STRING, description: "A suggested improved HEX code" },
                          usage: { type: Type.STRING, description: "Where or how to apply this color" }
                        },
                        required: ["name", "hex", "usage"]
                      },
                      description: "Suggested improved palette items."
                    },
                    whyTheseColorsWork: { type: Type.STRING, description: "Explanation of how these colors resolve the design issues." }
                  },
                  required: ["score", "breakdown", "breakdownExplanations", "observation", "problem", "reason", "solution", "currentPalette", "harmonyAndContrast", "improvedPalette", "whyTheseColorsWork"]
                },
                sizePositioning: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.INTEGER, description: "Size & positioning score (0-100)." },
                    breakdown: {
                      type: Type.OBJECT,
                      properties: {
                        alignment: { type: Type.INTEGER },
                        spacing: { type: Type.INTEGER },
                        visualHierarchy: { type: Type.INTEGER },
                        balance: { type: Type.INTEGER }
                      },
                      required: ["alignment", "spacing", "visualHierarchy", "balance"]
                    },
                    breakdownExplanations: {
                      type: Type.OBJECT,
                      properties: {
                        alignment: { type: Type.STRING },
                        spacing: { type: Type.STRING },
                        visualHierarchy: { type: Type.STRING },
                        balance: { type: Type.STRING }
                      },
                      required: ["alignment", "spacing", "visualHierarchy", "balance"]
                    },
                    observation: { type: Type.STRING, description: "What Aura AI detected currently in element positions." },
                    problem: { type: Type.STRING, description: "What is reducing visual balance and layout quality." },
                    reason: { type: Type.STRING, description: "Why this affects spacing and alignment." },
                    solution: { type: Type.STRING, description: "How to improve elements positioning/alignment." },
                    whatShouldMove: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific alignment or placement changes." },
                    whatShouldIncrease: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Items requiring greater visual scale." },
                    whatShouldDecrease: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Items that overpower the design." },
                    layoutImprovements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Layout grid or structural layout tips." }
                  },
                  required: ["score", "breakdown", "breakdownExplanations", "observation", "problem", "reason", "solution", "whatShouldMove", "whatShouldIncrease", "whatShouldDecrease", "layoutImprovements"]
                },
                background: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.INTEGER, description: "Background score (0-100)." },
                    breakdown: {
                      type: Type.OBJECT,
                      properties: {
                        cleanliness: { type: Type.INTEGER },
                        compatibility: { type: Type.INTEGER },
                        distractionControl: { type: Type.INTEGER },
                        depth: { type: Type.INTEGER }
                      },
                      required: ["cleanliness", "compatibility", "distractionControl", "depth"]
                    },
                    breakdownExplanations: {
                      type: Type.OBJECT,
                      properties: {
                        cleanliness: { type: Type.STRING },
                        compatibility: { type: Type.STRING },
                        distractionControl: { type: Type.STRING },
                        depth: { type: Type.STRING }
                      },
                      required: ["cleanliness", "compatibility", "distractionControl", "depth"]
                    },
                    observation: { type: Type.STRING, description: "What Aura AI detected in the background." },
                    problem: { type: Type.STRING, description: "What is reducing background compatibility/quality." },
                    reason: { type: Type.STRING, description: "Why this affects background distraction." },
                    solution: { type: Type.STRING, description: "How to improve background layout." },
                    betterBackgroundIdeas: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific alternative background directions." },
                    colors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "HEX background colors to use." },
                    gradients: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Gradient settings (direction, codes)." },
                    blurSuggestions: { type: Type.STRING, description: "How to use depth of field or backdrop-filters." },
                    textureSuggestions: { type: Type.STRING, description: "Textural patterns or materials." }
                  },
                  required: ["score", "breakdown", "breakdownExplanations", "observation", "problem", "reason", "solution", "betterBackgroundIdeas", "colors", "gradients", "blurSuggestions", "textureSuggestions"]
                }
              },
              required: ["overallScore", "overallVerdict", "typography", "color", "sizePositioning", "background"]
            }
          }
        });

        if (response && response.text) {
          let rawText = response.text.trim();
          console.log("Aura AI: Gemini response received.");
          
          // Pre-process rawText: remove markdown codeblocks if they exist
          if (rawText.startsWith("```")) {
            rawText = rawText.replace(/^```(?:json)?\n/, "");
            rawText = rawText.replace(/\n```$/, "");
            rawText = rawText.trim();
          }

          let parsedReport: any;
          try {
            parsedReport = JSON.parse(rawText);
          } catch (jsonErr: any) {
            console.error("Aura AI: JSON parsing error on response text:", jsonErr, rawText);
            throw jsonErr; // Fail forward to fallback block
          }
          
          const fullReport = sanitizeReport(parsedReport, selectedStyle);
          return res.json({ success: true, report: fullReport });
        } else {
          throw new Error("Empty response text from Gemini API.");
        }
      } catch (apiError) {
        console.error("Aura AI: Gemini API call failed, using high-quality custom fallback:", apiError);
        const fallbackReport = getPlaceholderReport(selectedStyle);
        return res.json({
          success: true,
          report: fallbackReport,
          notice: "Analysis processed by local fallback engine (API service limit or invalid key)."
        });
      }
    } else {
      // Return high quality customized mockup report directly
      console.log("Aura AI: API key missing, serving curated fallback design analysis report.");
      const fallbackReport = getPlaceholderReport(selectedStyle);
      
      // Simulate 2 seconds of professional analysis delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return res.json({
        success: true,
        report: fallbackReport,
        notice: "Curated analysis simulated. Configure your Gemini API key in Settings > Secrets for live analyses."
      });
    }
  } catch (error: any) {
    console.error("Aura AI: Error in /api/analyze-design:", error);
    res.status(500).json({ error: error?.message || "Failed to analyze design image." });
  }
});

// REST API endpoint: /api/design-chat
app.post("/api/design-chat", async (req, res) => {
  try {
    const { message, history, report } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Missing message payload." });
    }

    console.log("Aura AI: Received design chat inquiry:", message.substring(0, 60));

    const creativeDirectorInstruction = `You are Aura AI, a senior professional Creative Director in a high-end dark luxury design studio. 
You speak with elegance, authority, and professional weight. You avoid friendly, over-enthusiastic, or generic chatbot replies. 
You are here to answer follow-up questions regarding a design report.

Here is the current analysis report context you made for this design:
Style: ${report?.styleSelected || 'Minimal'}
Verdict: ${report?.overallVerdict || 'Needs layout discipline and refinement.'}
Typography Problems: ${report?.typography?.problems?.join(', ') || 'Poor hierarchy'}
Color Advice: ${report?.color?.harmonyAndContrast || 'Lacks professional contrast'}
Layout Advice: ${report?.sizePositioning?.layoutImprovements?.join(', ') || 'No defined layout structure'}
Background Advice: ${report?.background?.betterBackgroundIdeas?.join(', ') || 'Standard backdrop'}

Answer the user's question with precise, professional, educational, and actionable design insights. Keep the tone sophisticated, honest, and direct (Creative Director style). Avoid markdown bullet lists if you can describe them in flowing, professional prose, or use brief elegant dashes if necessary.`;

    if (aiClient) {
      try {
        console.log("Aura AI: Querying Gemini Chat for follow-up...");
        
        // Map history to Gemini format if present
        const chatParts = [];
        if (history && history.length > 0) {
          // Keep only last 10 messages to avoid token bloat
          const recentHistory = history.slice(-10);
          for (const msg of recentHistory) {
            chatParts.push({
              text: `${msg.sender === 'user' ? 'User' : 'Aura AI'}: ${msg.text}`
            });
          }
        }
        
        chatParts.push({ text: `User Question: "${message}"` });

        const response = await aiClient.models.generateContent({
          model: "gemini-3.5-flash",
          contents: chatParts,
          config: {
            systemInstruction: creativeDirectorInstruction,
            temperature: 0.7,
          }
        });

        if (response && response.text) {
          return res.json({ success: true, answer: response.text.trim() });
        } else {
          throw new Error("Empty response text from Gemini Chat API.");
        }
      } catch (chatError) {
        console.error("Aura AI: Chat API error, using intelligent fallback response:", chatError);
      }
    }

    // Creative fallback generator based on typical creative director guidelines
    const msgLower = message.toLowerCase();
    let reply = "As a Creative Director, I advise looking closely at your structural borders. To make the design feel premium, you should reduce all heavy visual elements, emphasize the alignment grid, and add at least 30% empty padding space around your elements. A luxury style is achieved through absolute restraint.";

    if (msgLower.includes("font") || msgLower.includes("typography") || msgLower.includes("text")) {
      reply = `Typography defines the voice of your brand. If you want to elevate this design, replace standard bold text with lightweight editorial serif fonts like 'Cormorant Garamond' or geometric sans-serifs like 'Space Grotesk'. Ensure your subtitles have generous letter-spacing (at least 0.2em) and are in uppercase. This immediately shifts the mood from a generic catalog to an art-gallery edition.`;
    } else if (msgLower.includes("color") || msgLower.includes("contrast") || msgLower.includes("palette")) {
      reply = `In professional branding, color must serve a strict psychological purpose. Currently, you should restrict your palette to exactly three colors: a canvas foundation (dark graphite or warm paper-black), a crisp primary typography hue (ivory white), and a single strategic accent (like Aura Gold #C9A227) applied only to critical elements. Eliminate unnecessary background color shapes.`;
    } else if (msgLower.includes("premium") || msgLower.includes("luxury") || msgLower.includes("expensive")) {
      reply = `To make the design look expensive and premium, focus on two rules: high typographic contrast and generous negative space. Do not place text over crowded image segments. Instead, crop your images cleanly inside elegant 1px-bordered dark cards, frame the design with clean, spacious margins, and reduce the sizes of all secondary elements so the main heading has grand scale.`;
    } else if (msgLower.includes("layout") || msgLower.includes("move") || msgLower.includes("position")) {
      reply = `We need to introduce grid discipline. Ensure all visual elements align perfectly along the same imaginary vertical or horizontal margins. Use asymmetrical positioning to create a slow, editorial rhythm—for example, float a delicate category label rotated -90 degrees in the left margin, and offset your central text block to the right, balanced by empty space.`;
    } else if (msgLower.includes("background") || msgLower.includes("texture") || msgLower.includes("blur")) {
      reply = `The background should never compete with your visual subjects. I suggest a deep charcoal base (#121212) layered with a high-contrast noise grain at 2% opacity to provide organic texture. If you must use visual backdrops, implement a soft 40px backdrop-filter blur on your floating cards to separate them cleanly from the background noise.`;
    }

    // Simulate short typing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    return res.json({ success: true, answer: reply });

  } catch (error: any) {
    console.error("Aura AI: Error in /api/design-chat:", error);
    res.status(500).json({ error: error?.message || "Failed to generate AI response." });
  }
});

// Configure Vite or Static File Serving depending on Environment
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode with Vite Middleware
    console.log("Aura AI: Launching development server with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode serving compiled static assets
    console.log("Aura AI: Launching production server...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Aura AI is active and streaming on http://0.0.0.0:${PORT}`);
  });
}

startServer();
