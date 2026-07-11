import { jsPDF } from 'jspdf';
import { CreativeDirectorReport } from '../types';

/**
 * Programmatically generates a premium, high-quality PDF report matching the "Sophisticated Dark" aesthetic.
 * Utilizes crisp vector layouts, gold accents, and native A4 document flows.
 */
export async function generateReportPDF(report: CreativeDirectorReport, uploadedImage: string | null) {
  // Initialize A4 Document (210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageW = 210;
  const pageH = 297;
  const margin = 15;
  const contentW = pageW - 2 * margin;

  // Colors
  const bgDarkRGB = [5, 5, 5]; // #050505
  const bgCardRGB = [18, 18, 18]; // #121212
  const bgInnerRGB = [26, 26, 26]; // #1A1A1A
  const goldRGB = [201, 162, 39]; // #C9A227
  const textWhiteRGB = [245, 245, 245]; // #F5F5F5
  const textGrayRGB = [163, 163, 163]; // #A3A3A3
  const textDarkRGB = [5, 5, 5];

  // Helper: Draw page background and borders
  const drawPageShell = (pageNum: number, totalPages: number) => {
    // Background fill
    doc.setFillColor(bgDarkRGB[0], bgDarkRGB[1], bgDarkRGB[2]);
    doc.rect(0, 0, pageW, pageH, 'F');

    // Outer thick border
    doc.setDrawColor(bgInnerRGB[0], bgInnerRGB[1], bgInnerRGB[2]);
    doc.setLineWidth(4);
    doc.rect(2, 2, pageW - 4, pageH - 4, 'S');

    // Gold decorative thin border
    doc.setDrawColor(goldRGB[0], goldRGB[1], goldRGB[2]);
    doc.setLineWidth(0.3);
    doc.rect(margin - 5, margin - 5, contentW + 10, pageH - 2 * margin + 10, 'S');

    // Corners (broken frame motif)
    doc.setFillColor(bgDarkRGB[0], bgDarkRGB[1], bgDarkRGB[2]);
    doc.rect(margin - 6, margin - 1, 2, 2, 'F');
    doc.rect(margin + contentW + 4, margin - 1, 2, 2, 'F');

    // Footer
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(textGrayRGB[0], textGrayRGB[1], textGrayRGB[2]);
    doc.text('AURA DESIGN LABS  ◇  YOUR CREATIVE DIRECTOR REPORT', margin, pageH - margin + 3);
    
    const pageStr = `PAGE ${pageNum} OF ${totalPages}`;
    const pageStrW = doc.getTextWidth(pageStr);
    doc.text(pageStr, pageW - margin - pageStrW, pageH - margin + 3);
  };

  // Total pages planned: 3
  const totalPages = 3;

  // ==========================================
  // PAGE 1: COVER & OVERALL VERDICT
  // ==========================================
  drawPageShell(1, totalPages);

  // Header Logo / Brand
  doc.setFont('times', 'italic');
  doc.setFontSize(28);
  doc.setTextColor(goldRGB[0], goldRGB[1], goldRGB[2]);
  doc.text('◇', margin + 2, margin + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(textWhiteRGB[0], textWhiteRGB[1], textWhiteRGB[2]);
  doc.text('AURA AI', margin + 15, margin + 8);
  
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textGrayRGB[0], textGrayRGB[1], textGrayRGB[2]);
  doc.text('YOUR AI CREATIVE DIRECTOR', margin + 15, margin + 13);

  // Divider Line
  doc.setDrawColor(goldRGB[0], goldRGB[1], goldRGB[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, margin + 18, pageW - margin, margin + 18);

  // Title
  doc.setFont('helvetica', 'light');
  doc.setFontSize(24);
  doc.setTextColor(textWhiteRGB[0], textWhiteRGB[1], textWhiteRGB[2]);
  doc.text('CREATIVE DIRECTION', margin, margin + 30);
  doc.text('AUDIT REPORT', margin, margin + 40);

  // Selected Style Badge
  doc.setFillColor(bgInnerRGB[0], bgInnerRGB[1], bgInnerRGB[2]);
  doc.rect(margin, margin + 45, 60, 8, 'F');
  doc.setDrawColor(goldRGB[0], goldRGB[1], goldRGB[2]);
  doc.setLineWidth(0.2);
  doc.rect(margin, margin + 45, 60, 8, 'S');

  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(goldRGB[0], goldRGB[1], goldRGB[2]);
  doc.text(`STYLE: ${report.styleSelected.toUpperCase()}`, margin + 4, margin + 50);

  // Uploaded Image Placement (Cover Art box)
  let imageY = margin + 58;
  let imageH = 80;
  if (uploadedImage) {
    try {
      // Draw background frame for image
      doc.setFillColor(bgCardRGB[0], bgCardRGB[1], bgCardRGB[2]);
      doc.rect(margin, imageY, contentW, imageH, 'F');
      doc.setDrawColor(bgInnerRGB[0], bgInnerRGB[1], bgInnerRGB[2]);
      doc.setLineWidth(0.5);
      doc.rect(margin, imageY, contentW, imageH, 'S');

      // Add image (constrain inside the frame)
      const imgW = 120;
      const imgH = 70;
      const imgX = margin + (contentW - imgW) / 2;
      const imgY = imageY + (imageH - imgH) / 2;
      doc.addImage(uploadedImage, 'JPEG', imgX, imgY, imgW, imgH, undefined, 'FAST');
    } catch (e) {
      console.warn("Failed to embed image in PDF:", e);
      // Fallback text if base64/image fails
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(textGrayRGB[0], textGrayRGB[1], textGrayRGB[2]);
      doc.text('[Design Image Reference Embedded]', margin + 10, imageY + 40);
    }
  }

  // Director's Statement Card
  let verdictY = imageY + imageH + 12;
  doc.setFillColor(bgCardRGB[0], bgCardRGB[1], bgCardRGB[2]);
  doc.rect(margin, verdictY, contentW, 52, 'F');
  
  // Gold left Accent line
  doc.setFillColor(goldRGB[0], goldRGB[1], goldRGB[2]);
  doc.rect(margin, verdictY, 1.5, 52, 'F');

  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(goldRGB[0], goldRGB[1], goldRGB[2]);
  doc.text('DIRECTOR\'S VERDICT & STATEMENT', margin + 6, verdictY + 8);

  // Dynamic Overall Verdict Wrapping
  doc.setFont('times', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(textWhiteRGB[0], textWhiteRGB[1], textWhiteRGB[2]);
  
  const verdictText = `"${report.overallVerdict}"`;
  const splitVerdict = doc.splitTextToSize(verdictText, contentW - 14);
  doc.text(splitVerdict, margin + 6, verdictY + 18);

  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textGrayRGB[0], textGrayRGB[1], textGrayRGB[2]);
  doc.text('AURA-V4 ENGINE  •  SECURE AUTHENTIC AUDIT', margin + 6, verdictY + 46);

  // ==========================================
  // PAGE 2: TYPOGRAPHY & COLOR SYSTEM
  // ==========================================
  doc.addPage();
  drawPageShell(2, totalPages);

  // Page Title
  doc.setFont('times', 'italic');
  doc.setFontSize(14);
  doc.setTextColor(goldRGB[0], goldRGB[1], goldRGB[2]);
  doc.text('◇ Chapter One', margin, margin + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(textWhiteRGB[0], textWhiteRGB[1], textWhiteRGB[2]);
  doc.text('TYPOGRAPHY & COLOR SYSTEM AUDIT', margin, margin + 14);

  doc.setDrawColor(bgInnerRGB[0], bgInnerRGB[1], bgInnerRGB[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, margin + 18, pageW - margin, margin + 18);

  // ---- section 1: typography ----
  let section1Y = margin + 24;
  doc.setFillColor(bgCardRGB[0], bgCardRGB[1], bgCardRGB[2]);
  doc.rect(margin, section1Y, contentW, 105, 'F');
  doc.rect(margin, section1Y, contentW, 105, 'S');

  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(goldRGB[0], goldRGB[1], goldRGB[2]);
  doc.text('01 / TYPOGRAPHY CRITIQUE', margin + 6, section1Y + 8);

  // Problems
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textGrayRGB[0], textGrayRGB[1], textGrayRGB[2]);
  doc.text('IDENTIFIED IMPEDIMENTS:', margin + 6, section1Y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(textWhiteRGB[0], textWhiteRGB[1], textWhiteRGB[2]);
  
  let probY = section1Y + 21;
  report.typography.problems.slice(0, 2).forEach((prob) => {
    const lines = doc.splitTextToSize(`• ${prob}`, contentW - 12);
    doc.text(lines, margin + 6, probY);
    probY += lines.length * 4.5 + 1;
  });

  // Recommended Fonts
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textGrayRGB[0], textGrayRGB[1], textGrayRGB[2]);
  doc.text('RECOMMENDED FONT DIRECTIVES:', margin + 6, section1Y + 50);

  let fontX = margin + 6;
  report.typography.recommendedFonts.forEach((font) => {
    doc.setFillColor(bgInnerRGB[0], bgInnerRGB[1], bgInnerRGB[2]);
    const fontW = doc.getTextWidth(font) + 6;
    doc.rect(fontX, section1Y + 53, fontW, 6, 'F');
    doc.rect(fontX, section1Y + 53, fontW, 6, 'S');

    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(textWhiteRGB[0], textWhiteRGB[1], textWhiteRGB[2]);
    doc.text(font, fontX + 3, section1Y + 57.5);
    fontX += fontW + 3;
  });

  // Structural Changes Required
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(goldRGB[0], goldRGB[1], goldRGB[2]);
  doc.text('EXACT STRUCTURAL CHANGES REQUIRED:', margin + 6, section1Y + 68);

  doc.setFillColor(bgInnerRGB[0], bgInnerRGB[1], bgInnerRGB[2]);
  doc.rect(margin + 6, section1Y + 71, contentW - 12, 28, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(textWhiteRGB[0], textWhiteRGB[1], textWhiteRGB[2]);
  let changeY = section1Y + 76;
  report.typography.exactChanges.slice(0, 3).forEach((change) => {
    const lines = doc.splitTextToSize(`→ ${change}`, contentW - 18);
    doc.text(lines, margin + 10, changeY);
    changeY += lines.length * 4.5;
  });


  // ---- section 2: color palette ----
  let section2Y = section1Y + 112;
  doc.setFillColor(bgCardRGB[0], bgCardRGB[1], bgCardRGB[2]);
  doc.rect(margin, section2Y, contentW, 110, 'F');
  doc.rect(margin, section2Y, contentW, 110, 'S');

  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(goldRGB[0], goldRGB[1], goldRGB[2]);
  doc.text('02 / COLOR THEORY & HARMONY', margin + 6, section2Y + 8);

  // Harmony & Contrast Text
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textGrayRGB[0], textGrayRGB[1], textGrayRGB[2]);
  doc.text('CONTRAST & COMPOSITION REVIEW:', margin + 6, section2Y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(textWhiteRGB[0], textWhiteRGB[1], textWhiteRGB[2]);
  const colorTheoryLines = doc.splitTextToSize(report.color.harmonyAndContrast, contentW - 12);
  doc.text(colorTheoryLines, margin + 6, section2Y + 21);

  // Swatches Visual Layout
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textGrayRGB[0], textGrayRGB[1], textGrayRGB[2]);
  doc.text('RECOMMENDED PALETTE PRESETS:', margin + 6, section2Y + 48);

  let swatchX = margin + 6;
  let swatchY = section2Y + 52;
  const swatchBoxW = (contentW - 18) / 4; // split evenly
  const swatchBoxH = 50;

  report.color.improvedPalette.slice(0, 4).forEach((color) => {
    // Outer border
    doc.setFillColor(bgInnerRGB[0], bgInnerRGB[1], bgInnerRGB[2]);
    doc.rect(swatchX, swatchY, swatchBoxW, swatchBoxH, 'F');
    doc.setDrawColor(bgInnerRGB[0] + 20, bgInnerRGB[1] + 20, bgInnerRGB[2] + 20);
    doc.rect(swatchX, swatchY, swatchBoxW, swatchBoxH, 'S');

    // Colored block
    try {
      doc.setFillColor(color.hex);
      doc.rect(swatchX + 2, swatchY + 2, swatchBoxW - 4, 18, 'F');
    } catch {
      // Fallback
    }

    // Name & Hex
    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(goldRGB[0], goldRGB[1], goldRGB[2]);
    doc.text(color.hex, swatchX + 4, swatchY + 26);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(textWhiteRGB[0], textWhiteRGB[1], textWhiteRGB[2]);
    doc.text(color.name, swatchX + 4, swatchY + 31);

    // Usage text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(textGrayRGB[0], textGrayRGB[1], textGrayRGB[2]);
    const usageSplit = doc.splitTextToSize(color.usage, swatchBoxW - 8);
    doc.text(usageSplit, swatchX + 4, swatchY + 37);

    swatchX += swatchBoxW + 2;
  });


  // ==========================================
  // PAGE 3: SIZE, POSITIONING & BACKGROUNDS
  // ==========================================
  doc.addPage();
  drawPageShell(3, totalPages);

  // Page Title
  doc.setFont('times', 'italic');
  doc.setFontSize(14);
  doc.setTextColor(goldRGB[0], goldRGB[1], goldRGB[2]);
  doc.text('◇ Chapter Two', margin, margin + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(textWhiteRGB[0], textWhiteRGB[1], textWhiteRGB[2]);
  doc.text('SIZE, SPATIAL POSITIONING & BACKDROP', margin, margin + 14);

  doc.setDrawColor(bgInnerRGB[0], bgInnerRGB[1], bgInnerRGB[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, margin + 18, pageW - margin, margin + 18);

  // ---- section 3: size and positioning ----
  let section3Y = margin + 24;
  doc.setFillColor(bgCardRGB[0], bgCardRGB[1], bgCardRGB[2]);
  doc.rect(margin, section3Y, contentW, 105, 'F');
  doc.rect(margin, section3Y, contentW, 105, 'S');

  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(goldRGB[0], goldRGB[1], goldRGB[2]);
  doc.text('03 / SPATIAL ARCHITECTURE & SCALING', margin + 6, section3Y + 8);

  // Layout Improvements text
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textGrayRGB[0], textGrayRGB[1], textGrayRGB[2]);
  doc.text('LAYOUT AUDIT REVISIONS:', margin + 6, section3Y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(textWhiteRGB[0], textWhiteRGB[1], textWhiteRGB[2]);
  const layoutLines = doc.splitTextToSize(report.sizePositioning.layoutImprovements.join(' '), contentW - 12);
  doc.text(layoutLines, margin + 6, section3Y + 21);

  // Sub-Cards: Move, Scale Up, Scale Down
  let boxY = section3Y + 45;
  const boxW = (contentW - 10) / 3;
  const boxH = 52;

  // Box A: Move
  doc.setFillColor(bgInnerRGB[0], bgInnerRGB[1], bgInnerRGB[2]);
  doc.rect(margin + 2, boxY, boxW, boxH, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(goldRGB[0], goldRGB[1], goldRGB[2]);
  doc.text('REPOSITION / ALIGN', margin + 6, boxY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textWhiteRGB[0], textWhiteRGB[1], textWhiteRGB[2]);
  let lineY = boxY + 12;
  report.sizePositioning.whatShouldMove.slice(0, 3).forEach((item) => {
    const itemSplit = doc.splitTextToSize(`• ${item}`, boxW - 8);
    doc.text(itemSplit, margin + 6, lineY);
    lineY += itemSplit.length * 4 + 1;
  });

  // Box B: Scale Up
  doc.setFillColor(bgInnerRGB[0], bgInnerRGB[1], bgInnerRGB[2]);
  doc.rect(margin + 2 + boxW + 3, boxY, boxW, boxH, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(goldRGB[0], goldRGB[1], goldRGB[2]);
  doc.text('SCALE UP (EMPHASIS)', margin + 6 + boxW + 3, boxY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textWhiteRGB[0], textWhiteRGB[1], textWhiteRGB[2]);
  lineY = boxY + 12;
  report.sizePositioning.whatShouldIncrease.slice(0, 3).forEach((item) => {
    const itemSplit = doc.splitTextToSize(`• ${item}`, boxW - 8);
    doc.text(itemSplit, margin + 6 + boxW + 3, lineY);
    lineY += itemSplit.length * 4 + 1;
  });

  // Box C: Scale Down
  doc.setFillColor(bgInnerRGB[0], bgInnerRGB[1], bgInnerRGB[2]);
  doc.rect(margin + 2 + 2 * boxW + 6, boxY, boxW, boxH, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(goldRGB[0], goldRGB[1], goldRGB[2]);
  doc.text('SCALE DOWN (REDUCE)', margin + 6 + 2 * boxW + 6, boxY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textWhiteRGB[0], textWhiteRGB[1], textWhiteRGB[2]);
  lineY = boxY + 12;
  report.sizePositioning.whatShouldDecrease.slice(0, 3).forEach((item) => {
    const itemSplit = doc.splitTextToSize(`• ${item}`, boxW - 8);
    doc.text(itemSplit, margin + 6 + 2 * boxW + 6, lineY);
    lineY += itemSplit.length * 4 + 1;
  });


  // ---- section 4: background ----
  let section4Y = section3Y + 112;
  doc.setFillColor(bgCardRGB[0], bgCardRGB[1], bgCardRGB[2]);
  doc.rect(margin, section4Y, contentW, 110, 'F');
  doc.rect(margin, section4Y, contentW, 110, 'S');

  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(goldRGB[0], goldRGB[1], goldRGB[2]);
  doc.text('04 / BACKDROP ENVIRONMENT IMPACT', margin + 6, section4Y + 8);

  // Better backdrop ideas
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textGrayRGB[0], textGrayRGB[1], textGrayRGB[2]);
  doc.text('ENVIRONMENT CONTEXT REVISIONS:', margin + 6, section4Y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(textWhiteRGB[0], textWhiteRGB[1], textWhiteRGB[2]);
  let bgIdeaY = section4Y + 22;
  report.background.betterBackgroundIdeas.slice(0, 2).forEach((idea) => {
    const splitIdea = doc.splitTextToSize(`→ ${idea}`, contentW - 12);
    doc.text(splitIdea, margin + 6, bgIdeaY);
    bgIdeaY += splitIdea.length * 4.5 + 1;
  });

  // Recommended Gradients & Colors
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textGrayRGB[0], textGrayRGB[1], textGrayRGB[2]);
  doc.text('ATMOSPHERIC PRESETS:', margin + 6, section4Y + 54);

  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(goldRGB[0], goldRGB[1], goldRGB[2]);
  doc.text(`GRADIENTS:  ${report.background.gradients.slice(0, 2).join('  |  ')}`, margin + 6, section4Y + 60);
  doc.text(`COLORS:     ${report.background.colors.slice(0, 3).join(', ')}`, margin + 6, section4Y + 65);

  // Tactile textures suggestions
  doc.setFillColor(bgInnerRGB[0], bgInnerRGB[1], bgInnerRGB[2]);
  doc.rect(margin + 6, section4Y + 72, contentW - 12, 30, 'F');

  // Textures and Blur Subcolumns
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(goldRGB[0], goldRGB[1], goldRGB[2]);
  doc.text('BLURS & DEPTH:', margin + 10, section4Y + 78);
  doc.text('TACTILE TEXTURES:', margin + (contentW / 2) + 2, section4Y + 78);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textWhiteRGB[0], textWhiteRGB[1], textWhiteRGB[2]);
  const blurSplit = doc.splitTextToSize(report.background.blurSuggestions, (contentW / 2) - 10);
  doc.text(blurSplit, margin + 10, section4Y + 83);

  const textureSplit = doc.splitTextToSize(report.background.textureSuggestions, (contentW / 2) - 10);
  doc.text(textureSplit, margin + (contentW / 2) + 2, section4Y + 83);


  // ==========================================
  // SAVE THE DOCUMENT
  // ==========================================
  const filename = `AURA_Creative_Director_Report_${report.styleSelected}.pdf`;
  doc.save(filename);
}
