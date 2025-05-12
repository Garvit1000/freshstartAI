import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

export async function modifyExistingPDF(pdfBuffer, optimizedText) {
  try {
    // First create a new PDF
    const pdfDoc = await PDFDocument.create();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Get text with positions from original PDF
    const parsedData = await pdfParse(pdfBuffer);
    const originalText = parsedData.text;
    const originalLines = originalText.split('\n');
    const optimizedLines = optimizedText.split('\n').filter(line => line.trim());

    // Create pages matching original dimensions
    const originalPdf = await PDFDocument.load(pdfBuffer);
    const originalPages = originalPdf.getPages();

    // Copy dimensions and create new pages
    for (const originalPage of originalPages) {
      const { width, height } = originalPage.getSize();
      pdfDoc.addPage([width, height]);
    }

    // Set up formatting parameters
    const pages = pdfDoc.getPages();
    const margin = 72; // 1-inch margins
    const fontSize = 11;
    const headerSize = 12;
    const lineHeight = fontSize * 1.2;

    let currentLine = 0;
    
    // Process each page
    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const page = pages[pageIndex];
      const { width, height } = page.getSize();
      let y = height - margin;

      // Process lines for this page while preserving formatting
      while (currentLine < optimizedLines.length && y > margin) {
        const line = optimizedLines[currentLine];
        const originalLine = originalLines[currentLine] || '';

        // Analyze line formatting
        const isHeader = originalLine.trim() === originalLine.trim().toUpperCase() 
          && originalLine.trim().length > 3;
        const isBullet = originalLine.trim().startsWith('•') 
          || originalLine.trim().startsWith('-');
        const indent = originalLine.match(/^\s*/)[0].length;

        // Calculate x position preserving indentation
        const x = margin + (indent * (fontSize / 3));

        // Draw bullet if needed
        if (isBullet) {
          page.drawText('•', {
            x: x - fontSize,
            y,
            size: fontSize,
            font: helvetica,
            color: rgb(0, 0, 0)
          });
        }

        // Draw main text
        const textContent = isBullet ? line.replace(/^[•\-]\s*/, '').trim() : line;
        page.drawText(textContent, {
          x,
          y,
          size: isHeader ? headerSize : fontSize,
          font: isHeader ? helveticaBold : helvetica,
          color: rgb(0, 0, 0),
          maxWidth: width - margin - x
        });

        // Move to next line
        y -= lineHeight * (isHeader ? 1.5 : 1.2);
        currentLine++;

        // Add extra space after headers
        if (isHeader) {
          y -= lineHeight * 0.3;
        }
      }
    }

    return await pdfDoc.save();
  } catch (error) {
    console.error('Error modifying PDF:', error);
    if (error.message.includes('getTextContent')) {
      throw new Error('PDF modification failed: The PDF document appears to be image-based or unreadable. Please provide a PDF with selectable text.');
    }
    throw new Error(`Failed to modify PDF: ${error.message}`);
  }
}