import { Type } from "@google/genai";
import { generateContentWithFallback, sanitizeReport, getPlaceholderReport, getAiClient } from "../src/api-core";
import { DesignStyle } from "../src/types";

export default async function handler(req: any, res: any) {
  // Only accept POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed. Use POST instead." });
  }

  // Validate API key presence
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return res.status(500).json({ error: "Gemini API key is missing." });
  }

  try {
    const { image, style } = req.body || {};

    if (!image) {
      return res.status(400).json({ error: "Missing image payload. Please upload a design image." });
    }

    const selectedStyle: DesignStyle = style || 'Minimal';
    console.log(`Aura AI (Serverless): Received design analysis request for style: ${selectedStyle}`);

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

    // Validate image format
    const supportedMimeTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!supportedMimeTypes.includes(mimeType)) {
      return res.status(400).json({ error: "Invalid Image. Please upload a PNG, JPG, or WEBP image." });
    }

    const aiClient = getAiClient();

    if (aiClient) {
      try {
        console.log("Aura AI (Serverless): Sending request to Gemini Vision API using gemini-3.5-flash...");

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

        const response = await generateContentWithFallback({
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
          console.log("Aura AI (Serverless): Gemini response received.");
          
          if (rawText.startsWith("```")) {
            rawText = rawText.replace(/^```(?:json)?\n/, "");
            rawText = rawText.replace(/\n```$/, "");
            rawText = rawText.trim();
          }

          let parsedReport: any;
          try {
            parsedReport = JSON.parse(rawText);
          } catch (jsonErr: any) {
            console.error("Aura AI (Serverless): JSON parsing error on response text:", jsonErr, rawText);
            throw jsonErr;
          }
          
          const fullReport = sanitizeReport(parsedReport, selectedStyle);
          return res.status(200).json({ success: true, report: fullReport });
        } else {
          throw new Error("Empty response text from Gemini API.");
        }
      } catch (apiError: any) {
        console.error("Aura AI (Serverless): Gemini API call failed, using high-quality custom fallback:", apiError);
        const fallbackReport = getPlaceholderReport(selectedStyle);
        return res.status(200).json({
          success: true,
          report: fallbackReport,
          notice: "Analysis processed by local fallback engine (API service limit or invalid key)."
        });
      }
    } else {
      console.log("Aura AI (Serverless): API client missing, serving fallback report.");
      const fallbackReport = getPlaceholderReport(selectedStyle);
      return res.status(200).json({
        success: true,
        report: fallbackReport,
        notice: "Curated analysis simulated."
      });
    }
  } catch (error: any) {
    console.error("Aura AI (Serverless): Error in /api/analyze-design:", error);
    return res.status(500).json({ error: error?.message || "Failed to analyze design image." });
  }
}
