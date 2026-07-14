import { generateContentWithFallback, getAiClient } from "../src/api-core";

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
    const { message, history, report } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: "Missing message payload." });
    }

    console.log("Aura AI (Serverless): Received design chat inquiry:", message.substring(0, 60));

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

    const aiClient = getAiClient();

    if (aiClient) {
      try {
        console.log("Aura AI (Serverless): Querying Gemini Chat for follow-up...");
        
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

        const response = await generateContentWithFallback({
          contents: chatParts,
          config: {
            systemInstruction: creativeDirectorInstruction,
            temperature: 0.7,
          }
        });

        if (response && response.text) {
          return res.status(200).json({ success: true, answer: response.text.trim() });
        } else {
          throw new Error("Empty response text from Gemini Chat API.");
        }
      } catch (chatError) {
        console.error("Aura AI (Serverless): Chat API error, using intelligent fallback response:", chatError);
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

    return res.status(200).json({ success: true, answer: reply });

  } catch (error: any) {
    console.error("Aura AI (Serverless): Error in /api/design-chat:", error);
    return res.status(500).json({ error: error?.message || "Failed to generate AI response." });
  }
}
