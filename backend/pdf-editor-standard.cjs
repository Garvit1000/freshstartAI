const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");

/**
 * Enhanced Standard Resume Template with improved section detection and formatting
 */

/**
 * Generate a professional resume PDF from structured text
 * @param {string} resumeText - The resume content as text
 * @param {Object} options - Formatting options
 * @returns {Promise<Buffer>} - The generated PDF as a buffer
 */
async function createStandardResumePDF(resumeText, options = {}) {
  try {
    console.log("Creating standard resume PDF");
    console.log("Text length:", resumeText?.length || 0);

    if (!resumeText || resumeText.trim().length === 0) {
      throw new Error("Resume text is empty");
    }

    // Clean the input text
    let cleanedText = resumeText
      .replace(/```text\n?/g, "")
      .replace(/```markdown\n?/g, "")
      .replace(/```\n?/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&[a-z]+;/gi, " ")
      .trim();
    
    // Debug: Log first 500 characters to see format
    console.log("First 500 chars of cleaned text:", cleanedText.substring(0, 500));

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Embed fonts
    const fonts = {
      regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
      bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
      italic: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
    };

    // Page settings
    const PAGE_WIDTH = 612; // 8.5 inches
    const PAGE_HEIGHT = 792; // 11 inches
    const MARGIN_LEFT = 50;
    const MARGIN_RIGHT = 50;
    const MARGIN_TOP = 50;
    const MARGIN_BOTTOM = 50;
    const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

    // Font sizes
    const FONT_SIZE = {
      name: 22,
      contactInfo: 10,
      sectionHeader: 13,
      subsectionHeader: 11,
      jobTitle: 10.5,
      normal: 10,
      small: 9,
    };

    // Spacing
    const SPACING = {
      afterName: 6,
      afterContact: 18,
      afterSectionHeader: 10,
      betweenSections: 14,
      betweenSubsections: 8,
      lineHeight: 13,
      bulletLineHeight: 13,
      paragraphGap: 4,
    };

    // Colors
    const COLORS = {
      black: rgb(0, 0, 0),
      darkGray: rgb(0.15, 0.15, 0.15),
      mediumGray: rgb(0.4, 0.4, 0.4),
      lightGray: rgb(0.6, 0.6, 0.6),
      blue: rgb(0.1, 0.3, 0.6),
    };

    // Add first page
    let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let yPosition = PAGE_HEIGHT - MARGIN_TOP;

    /**
     * Add a new page if needed
     */
    function checkAndAddPage(requiredSpace = 30) {
      if (yPosition < MARGIN_BOTTOM + requiredSpace) {
        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        yPosition = PAGE_HEIGHT - MARGIN_TOP;
        return true;
      }
      return false;
    }

    /**
     * Draw text with word wrapping
     */
    function drawWrappedText(text, x, fontSize, font, color, lineHeight, maxWidth = CONTENT_WIDTH) {
      const words = text.split(' ');
      let line = '';
      const lines = [];

      for (let i = 0; i < words.length; i++) {
        const testLine = line + (line ? ' ' : '') + words[i];
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);

        if (testWidth > maxWidth && line !== '') {
          lines.push(line);
          line = words[i];
        } else {
          line = testLine;
        }
      }
      if (line) lines.push(line);

      // Draw all lines
      for (const textLine of lines) {
        checkAndAddPage();
        page.drawText(textLine, {
          x: x,
          y: yPosition,
          size: fontSize,
          font: font,
          color: color,
        });
        yPosition -= lineHeight;
      }
    }

    /**
     * Identify line type
     */
    function identifyLineType(line, prevLine) {
      const trimmed = line.trim();
      
      if (!trimmed) return 'empty';
      
      // Section headers (all caps or ## or common section names)
      const commonSections = /^(EDUCATION|EXPERIENCE|SKILLS|PROJECTS|CERTIFICATIONS|SUMMARY|OBJECTIVE|PROFESSIONAL SUMMARY|WORK EXPERIENCE|TECHNICAL SKILLS|ACHIEVEMENTS)/i;
      
      if (trimmed.startsWith('##') ||
          trimmed.startsWith('#') ||
          commonSections.test(trimmed) ||
          (trimmed === trimmed.toUpperCase() &&
           trimmed.length > 2 &&
           trimmed.length < 60 &&
           !trimmed.match(/^[•\-\*]/) &&
           !trimmed.match(/\d{4}/) &&
           !trimmed.includes('|') &&
           !trimmed.includes('@'))) {
        return 'section_header';
      }
      
      // Bullet points
      if (trimmed.match(/^[•\-\*]\s/)) {
        return 'bullet';
      }
      
      // Job/Project titles with dates or pipes
      if (trimmed.match(/\|/) || 
          (trimmed.match(/\d{4}\s*[-–]\s*(\d{4}|Present)/i) && trimmed.length < 100)) {
        return 'job_title';
      }
      
      // Company/Organization name with location and date on next line or same line
      if (trimmed.match(/^[A-Z][a-zA-Z\s&.]+$/) && trimmed.length < 60) {
        return 'company';
      }
      
      // Date ranges
      if (trimmed.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\.?\s+\d{4}\s*[-–]\s*(Present|\d{4})/i)) {
        return 'date_range';
      }
      
      // Location info
      if (trimmed.match(/^(Remote|[A-Z][a-z]+,\s*[A-Z][a-z]+|[A-Z][a-z]+\s*\/\s*[A-Z][a-z]+)$/)) {
        return 'location';
      }
      
      return 'normal';
    }

    /**
     * Parse resume into structured sections
     */
    function parseResume(text) {
      const lines = text.split('\n');
      const sections = [];
      let currentSection = null;
      let headerLines = [];
      let inHeader = true;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineType = identifyLineType(line, i > 0 ? lines[i-1] : '');
        
        // First few lines are header (name and contact)
        if (inHeader && lineType !== 'section_header') {
          if (line.trim()) {
            headerLines.push(line);
          }
          continue;
        }
        
        if (lineType === 'section_header') {
          inHeader = false;
          
          // Save header section if we just finished it
          if (headerLines.length > 0 && !currentSection) {
            sections.push({
              type: 'header',
              content: headerLines
            });
            headerLines = [];
          }
          
          // Save previous section
          if (currentSection) {
            sections.push(currentSection);
          }
          
          // Start new section
          currentSection = {
            type: 'section',
            header: line.trim().replace(/^##\s*/, ''),
            items: []
          };
        } else if (currentSection) {
          // Group related lines into items (job entries, bullet groups, etc.)
          if (lineType === 'company' || lineType === 'job_title') {
            // Start new item
            currentSection.items.push({
              type: 'subsection',
              lines: [line]
            });
          } else if (lineType === 'bullet') {
            // Add to current item or create new bullet group
            if (currentSection.items.length > 0 && 
                currentSection.items[currentSection.items.length - 1].lines) {
              currentSection.items[currentSection.items.length - 1].lines.push(line);
            } else {
              currentSection.items.push({
                type: 'bullets',
                lines: [line]
              });
            }
          } else if (lineType === 'date_range' || lineType === 'location') {
            // Add to current item
            if (currentSection.items.length > 0) {
              currentSection.items[currentSection.items.length - 1].lines.push(line);
            }
          } else if (lineType === 'normal' && line.trim()) {
            // Add to current item or create new text item
            if (currentSection.items.length > 0 && 
                currentSection.items[currentSection.items.length - 1].type === 'text') {
              currentSection.items[currentSection.items.length - 1].lines.push(line);
            } else {
              currentSection.items.push({
                type: 'text',
                lines: [line]
              });
            }
          }
        }
      }
      
      // Add last section
      if (currentSection) {
        sections.push(currentSection);
      }
      
      return sections;
    }

    /**
     * Draw header section (name and contact info)
     */
    function drawHeader(headerLines) {
      if (headerLines.length === 0) return;

      // First line is the name (remove asterisks if present)
      const name = headerLines[0].trim().replace(/^\*+|\*+$/g, '');
      const nameWidth = fonts.bold.widthOfTextAtSize(name, FONT_SIZE.name);
      const nameX = (PAGE_WIDTH - nameWidth) / 2;

      page.drawText(name, {
        x: nameX,
        y: yPosition,
        size: FONT_SIZE.name,
        font: fonts.bold,
        color: COLORS.black,
      });

      yPosition -= FONT_SIZE.name + SPACING.afterName;

      // Second line might be a tagline/summary
      if (headerLines.length > 1 && headerLines[1].trim() && 
          !headerLines[1].includes('@') && !headerLines[1].includes('|')) {
        const tagline = headerLines[1].trim();
        drawWrappedText(
          tagline,
          MARGIN_LEFT,
          FONT_SIZE.small,
          fonts.italic,
          COLORS.mediumGray,
          SPACING.lineHeight
        );
        yPosition -= SPACING.paragraphGap;
      }

      // Contact information (lines with email, phone, links, or pipe-separated)
      const contactInfo = headerLines.slice(1).filter(l => {
        const trimmed = l.trim();
        return trimmed && (trimmed.includes('@') || trimmed.includes('|') || 
                          trimmed.includes('linkedin') || trimmed.includes('github'));
      });
      
      if (contactInfo.length > 0) {
        const contactText = contactInfo.join(' | ').replace(/\s*\|\s*/g, ' | ');
        const contactLines = contactText.split('|').map(c => c.trim()).filter(c => c);
        const joinedContact = contactLines.join(' • ');
        
        drawWrappedText(
          joinedContact,
          MARGIN_LEFT,
          FONT_SIZE.contactInfo,
          fonts.regular,
          COLORS.darkGray,
          SPACING.lineHeight
        );
        
        yPosition -= SPACING.paragraphGap;
      }

      yPosition -= SPACING.afterContact - SPACING.paragraphGap;

      // Draw separator line
      page.drawLine({
        start: { x: MARGIN_LEFT, y: yPosition },
        end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: yPosition },
        thickness: 1,
        color: COLORS.lightGray,
      });

      yPosition -= SPACING.betweenSections;
    }

    /**
     * Draw section header
     */
    function drawSectionHeader(header) {
      checkAndAddPage(40);

      page.drawText(header, {
        x: MARGIN_LEFT,
        y: yPosition,
        size: FONT_SIZE.sectionHeader,
        font: fonts.bold,
        color: COLORS.black,
      });

      yPosition -= FONT_SIZE.sectionHeader + 2;

      // Draw underline
      page.drawLine({
        start: { x: MARGIN_LEFT, y: yPosition },
        end: { x: MARGIN_LEFT + fonts.bold.widthOfTextAtSize(header, FONT_SIZE.sectionHeader) + 10, y: yPosition },
        thickness: 1.5,
        color: COLORS.blue,
      });

      yPosition -= SPACING.afterSectionHeader;
    }

    /**
     * Draw subsection (job entry, project, etc.)
     */
    function drawSubsection(item) {
      checkAndAddPage(60);
      
      const lines = item.lines;
      if (lines.length === 0) return;
      
      // First line: Company/Project name
      const firstLine = lines[0].trim();
      
      // Check if second line has title and date info separated by |
      let hasInlineDate = firstLine.includes('|');
      
      if (hasInlineDate) {
        // Split by | to separate title and date
        const parts = firstLine.split('|').map(p => p.trim());
        
        // Draw title (left)
        page.drawText(parts[0], {
          x: MARGIN_LEFT,
          y: yPosition,
          size: FONT_SIZE.subsectionHeader,
          font: fonts.bold,
          color: COLORS.black,
        });
        
        // Draw date/link info (right)
        if (parts[1]) {
          const rightText = parts.slice(1).join(' | ');
          const rightWidth = fonts.regular.widthOfTextAtSize(rightText, FONT_SIZE.small);
          page.drawText(rightText, {
            x: PAGE_WIDTH - MARGIN_RIGHT - rightWidth,
            y: yPosition,
            size: FONT_SIZE.small,
            font: fonts.regular,
            color: COLORS.mediumGray,
          });
        }
        
        yPosition -= SPACING.lineHeight;
        
        // Process remaining lines
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          if (line.match(/^[•\-\*]\s/)) {
            // Bullet point
            checkAndAddPage();
            page.drawText('•', {
              x: MARGIN_LEFT + 10,
              y: yPosition,
              size: FONT_SIZE.normal,
              font: fonts.regular,
              color: COLORS.mediumGray,
            });
            
            const bulletText = line.replace(/^[•\-\*]\s*/, '');
            drawWrappedText(
              bulletText,
              MARGIN_LEFT + 25,
              FONT_SIZE.normal,
              fonts.regular,
              COLORS.darkGray,
              SPACING.bulletLineHeight,
              CONTENT_WIDTH - 25
            );
          } else {
            // Regular line (location, dates, etc.)
            drawWrappedText(
              line,
              MARGIN_LEFT,
              FONT_SIZE.small,
              fonts.regular,
              COLORS.mediumGray,
              SPACING.lineHeight
            );
          }
        }
      } else {
        // Traditional format: title on first line
        page.drawText(firstLine, {
          x: MARGIN_LEFT,
          y: yPosition,
          size: FONT_SIZE.subsectionHeader,
          font: fonts.bold,
          color: COLORS.black,
        });
        
        yPosition -= SPACING.lineHeight;
        
        // Look for date/location on second line
        if (lines.length > 1) {
          const secondLine = lines[1].trim();
          
          // Check if it's a job title with dates
          if (secondLine.includes('|') || secondLine.match(/\d{4}/)) {
            const parts = secondLine.split('|').map(p => p.trim());
            
            // Job title (left)
            if (parts[0]) {
              page.drawText(parts[0], {
                x: MARGIN_LEFT,
                y: yPosition,
                size: FONT_SIZE.jobTitle,
                font: fonts.italic,
                color: COLORS.darkGray,
              });
            }
            
            // Date range (right)
            if (parts[1]) {
              const dateWidth = fonts.regular.widthOfTextAtSize(parts[1], FONT_SIZE.small);
              page.drawText(parts[1], {
                x: PAGE_WIDTH - MARGIN_RIGHT - dateWidth,
                y: yPosition,
                size: FONT_SIZE.small,
                font: fonts.regular,
                color: COLORS.mediumGray,
              });
            }
            
            yPosition -= SPACING.lineHeight;
            
            // Location on third line
            if (lines.length > 2 && !lines[2].trim().match(/^[•\-\*]\s/)) {
              const location = lines[2].trim();
              page.drawText(location, {
                x: MARGIN_LEFT,
                y: yPosition,
                size: FONT_SIZE.small,
                font: fonts.regular,
                color: COLORS.lightGray,
              });
              yPosition -= SPACING.lineHeight;
            }
            
            // Process bullets
            for (let i = 2; i < lines.length; i++) {
              const line = lines[i].trim();
              if (!line) continue;
              
              if (line.match(/^[•\-\*]\s/)) {
                checkAndAddPage();
                page.drawText('•', {
                  x: MARGIN_LEFT + 10,
                  y: yPosition,
                  size: FONT_SIZE.normal,
                  font: fonts.regular,
                  color: COLORS.mediumGray,
                });
                
                const bulletText = line.replace(/^[•\-\*]\s*/, '');
                drawWrappedText(
                  bulletText,
                  MARGIN_LEFT + 25,
                  FONT_SIZE.normal,
                  fonts.regular,
                  COLORS.darkGray,
                  SPACING.bulletLineHeight,
                  CONTENT_WIDTH - 25
                );
              }
            }
          }
        }
      }
      
      yPosition -= SPACING.betweenSubsections;
    }

    /**
     * Draw bullet group
     */
    function drawBullets(item) {
      for (const line of item.lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        
        checkAndAddPage();
        
        page.drawText('•', {
          x: MARGIN_LEFT,
          y: yPosition,
          size: FONT_SIZE.normal,
          font: fonts.regular,
          color: COLORS.mediumGray,
        });
        
        const bulletText = trimmed.replace(/^[•\-\*]\s*/, '');
        drawWrappedText(
          bulletText,
          MARGIN_LEFT + 15,
          FONT_SIZE.normal,
          fonts.regular,
          COLORS.darkGray,
          SPACING.bulletLineHeight,
          CONTENT_WIDTH - 15
        );
      }
      
      yPosition -= SPACING.paragraphGap;
    }

    /**
     * Draw text content
     */
    function drawTextContent(item) {
      for (const line of item.lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        
        checkAndAddPage();
        
        drawWrappedText(
          trimmed,
          MARGIN_LEFT,
          FONT_SIZE.normal,
          fonts.regular,
          COLORS.darkGray,
          SPACING.lineHeight
        );
      }
      
      yPosition -= SPACING.paragraphGap;
    }

    // Parse and render the resume
    const sections = parseResume(cleanedText);
    console.log(`Parsed ${sections.length} sections`);
    
    // Debug: Log section info
    if (sections.length === 0) {
      console.error("WARNING: No sections parsed! Checking text format...");
      console.log("Lines in text:", cleanedText.split('\n').length);
      console.log("First 10 lines:", cleanedText.split('\n').slice(0, 10).join('\n'));
    } else {
      console.log("Section headers found:", sections.map(s => s.type === 'section' ? s.header : s.type).join(', '));
    }
    
    // If no sections found, create a simple fallback structure
    if (sections.length === 0) {
      console.log("Using fallback parsing strategy");
      return createFallbackPDF(cleanedText, pdfDoc, page, yPosition, fonts, FONT_SIZE, SPACING, COLORS, MARGIN_LEFT, CONTENT_WIDTH, PAGE_WIDTH, MARGIN_RIGHT, PAGE_HEIGHT, MARGIN_TOP, MARGIN_BOTTOM);
    }

    for (const section of sections) {
      if (section.type === 'header') {
        drawHeader(section.content);
      } else if (section.type === 'section') {
        drawSectionHeader(section.header);
        
        for (const item of section.items) {
          if (item.type === 'subsection') {
            drawSubsection(item);
          } else if (item.type === 'bullets') {
            drawBullets(item);
          } else if (item.type === 'text') {
            drawTextContent(item);
          }
        }
      }
    }

    // Save and return PDF
    const pdfBytes = await pdfDoc.save();
    console.log("Standard resume PDF created successfully, size:", pdfBytes.length);
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error("Error creating standard resume PDF:", error);
    throw new Error(`Failed to create standard resume PDF: ${error.message}`);
  }
}

/**
 * Fallback PDF creation when section parsing fails
 */
async function createFallbackPDF(text, pdfDoc, page, yPosition, fonts, FONT_SIZE, SPACING, COLORS, MARGIN_LEFT, CONTENT_WIDTH, PAGE_WIDTH, MARGIN_RIGHT, PAGE_HEIGHT, MARGIN_TOP, MARGIN_BOTTOM) {
  console.log("Creating PDF using fallback method");
  
  const lines = text.split('\n');
  let currentY = PAGE_HEIGHT - MARGIN_TOP;
  
  function checkPage() {
    if (currentY < MARGIN_BOTTOM + 30) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      currentY = PAGE_HEIGHT - MARGIN_TOP;
    }
  }
  
  function wrapText(text, maxWidth, fontSize, font) {
    const words = text.split(' ');
    let line = '';
    const result = [];
    
    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      const width = font.widthOfTextAtSize(testLine, fontSize);
      
      if (width > maxWidth && line) {
        result.push(line);
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) result.push(line);
    return result;
  }
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      currentY -= SPACING.lineHeight / 2;
      continue;
    }
    
    checkPage();
    
    // Detect line type
    const isAllCaps = line === line.toUpperCase() && line.length > 2 && line.length < 60;
    const isBullet = line.match(/^[•\-\*]\s/);
    const hasDate = line.match(/\d{4}/);
    
    let fontSize = FONT_SIZE.normal;
    let font = fonts.regular;
    let color = COLORS.darkGray;
    let x = MARGIN_LEFT;
    
    if (i === 0) {
      // First line is name
      fontSize = FONT_SIZE.name;
      font = fonts.bold;
      color = COLORS.black;
      const width = font.widthOfTextAtSize(line, fontSize);
      x = (PAGE_WIDTH - width) / 2;
      
      page.drawText(line, { x, y: currentY, size: fontSize, font, color });
      currentY -= fontSize + SPACING.afterName;
      continue;
    }
    
    if (isAllCaps) {
      // Section header
      fontSize = FONT_SIZE.sectionHeader;
      font = fonts.bold;
      color = COLORS.black;
      
      page.drawText(line, { x, y: currentY, size: fontSize, font, color });
      currentY -= fontSize + SPACING.afterSectionHeader;
      
      // Draw underline
      page.drawLine({
        start: { x, y: currentY + SPACING.afterSectionHeader - 2 },
        end: { x: x + font.widthOfTextAtSize(line, fontSize) + 10, y: currentY + SPACING.afterSectionHeader - 2 },
        thickness: 1.5,
        color: COLORS.blue
      });
      continue;
    }
    
    if (isBullet) {
      // Bullet point
      page.drawText('•', { x: MARGIN_LEFT + 10, y: currentY, size: fontSize, font, color: COLORS.mediumGray });
      
      const bulletText = line.replace(/^[•\-\*]\s*/, '');
      const wrappedLines = wrapText(bulletText, CONTENT_WIDTH - 25, fontSize, font);
      
      for (const wrappedLine of wrappedLines) {
        checkPage();
        page.drawText(wrappedLine, { x: MARGIN_LEFT + 25, y: currentY, size: fontSize, font, color });
        currentY -= SPACING.bulletLineHeight;
      }
      continue;
    }
    
    // Regular text
    const wrappedLines = wrapText(line, CONTENT_WIDTH, fontSize, font);
    for (const wrappedLine of wrappedLines) {
      checkPage();
      page.drawText(wrappedLine, { x, y: currentY, size: fontSize, font, color });
      currentY -= SPACING.lineHeight;
    }
  }
  
  const pdfBytes = await pdfDoc.save();
  console.log("Fallback PDF created, size:", pdfBytes.length);
  return Buffer.from(pdfBytes);
}

module.exports = { createStandardResumePDF };