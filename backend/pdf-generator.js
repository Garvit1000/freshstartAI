import { PDFDocument, StandardFonts } from 'pdf-lib';

export async function generateOptimizedPDF(pdfBuffer, optimizedTextInput) {
  if (!optimizedTextInput?.trim()) {
    throw new Error('Empty or invalid optimized text input');
  }

  try {
    const pdfDoc = await PDFDocument.create();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let page = pdfDoc.addPage([612, 792]); // US Letter
    const { width, height } = page.getSize();
    const margin = 72; // 1-inch margins
    const fontSize = 11;
    const headerSize = 12;
    const lineHeight = fontSize * 1.2;
    let y = height - margin;

    // Process each line
    const lines = optimizedTextInput.split('\n');
    let prevWasHeader = false;

    for (const line of lines) {
      // Handle empty lines
      if (!line.trim()) {
        y -= lineHeight;
        prevWasHeader = false;
        continue;
      }

      // Check for page break
      if (y < margin + lineHeight) {
        page = pdfDoc.addPage([612, 792]);
        y = height - margin;
      }

      // Get line formatting
      const indent = line.match(/^\s*/)[0].length;
      const trimmedLine = line.trim();
      const isHeader = trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 2;
      const isBullet = trimmedLine.startsWith('•') || trimmedLine.startsWith('-');
      const xPos = margin + (indent * (fontSize / 3));

      // Draw bullet if needed
      if (isBullet) {
        page.drawText('•', {
          x: xPos - fontSize,
          y,
          size: fontSize,
          font: helvetica
        });
      }

      // Draw main text with preserved formatting
      const content = isBullet ? trimmedLine.substring(1).trim() : trimmedLine;
      page.drawText(content, {
        x: xPos,
        y,
        size: isHeader ? headerSize : fontSize,
        font: isHeader ? helveticaBold : helvetica
      });

      // Adjust spacing based on context
      y -= lineHeight * (isHeader ? 1.5 : (prevWasHeader ? 1.2 : 1));
      prevWasHeader = isHeader;
    }

    return await pdfDoc.save();
  } catch (error) {
    console.error('Error generating optimized PDF:', error);
    throw new Error('Failed to generate optimized PDF: ' + error.message);
  }
}