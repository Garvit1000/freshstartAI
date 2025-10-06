const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");

/**
 * Two professional resume templates with Garvit Joshi resume-style formatting
 */
const RESUME_TEMPLATES = {
  classic: {
    colors: {
      headerText: rgb(0, 0, 0),
      bodyText: rgb(0.1, 0.1, 0.1),
      sectionHeader: rgb(0, 0, 0),
      headerLine: rgb(0, 0, 0),
      bullet: rgb(0, 0, 0),
      link: rgb(0, 0, 0.8),
    },
    margins: {
      horizontal: 50,
      vertical: 40,
    },
    spacing: {
      section: 8,
      afterHeader: 12,
      paragraph: 6,
      line: 14,
    },
    fonts: {
      nameSize: 24,
      sectionSize: 12,
      normalSize: 10,
      smallSize: 9,
    }
  },
  minimalist: {
    colors: {
      headerText: rgb(0, 0, 0),
      bodyText: rgb(0.2, 0.2, 0.2),
      sectionHeader: rgb(0, 0, 0),
      headerLine: rgb(0.7, 0.7, 0.7),
      bullet: rgb(0.4, 0.4, 0.4),
      link: rgb(0.2, 0.2, 0.4),
    },
    margins: {
      horizontal: 65,
      vertical: 50,
    },
    spacing: {
      section: 12,
      afterHeader: 16,
      paragraph: 8,
      line: 15,
    },
    fonts: {
      nameSize: 22,
      sectionSize: 11,
      normalSize: 10,
      smallSize: 9,
    }
  },
};

/**
 * Edit a PDF with optimized text content
 */
async function editPDF(pdfBuffer, optimizedText, formattingInfo, template = "classic") {
  try {
    console.log("Starting PDF editing with template:", template);

    if (!optimizedText || optimizedText.trim().length === 0) {
      throw new Error("Optimized text is empty");
    }

    const templateStyle = RESUME_TEMPLATES[template] || RESUME_TEMPLATES.classic;
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([612, 792]);
    const { width, height } = page.getSize();

    // Embed fonts
    const fonts = {
      normal: await pdfDoc.embedFont(StandardFonts.Helvetica),
      bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
      italic: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
    };

    const { margins, spacing, fonts: fontSizes, colors } = templateStyle;
    const lineHeight = spacing.line;

    // Clean and parse text - remove HTML entities too
    let cleanedText = optimizedText
      .replace(/```text\n?/g, "")
      .replace(/```markdown\n?/g, "")
      .replace(/```\n?/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&[a-z]+;/gi, " ")
      .trim();

    // Debug logging
    console.log("First 300 chars of cleaned text:", cleanedText.substring(0, 300));

    // Split sections more intelligently - don't require double line breaks
    let sections = cleanedText.split(/\n\s*\n+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    // If we got very few sections, the text might not have double line breaks
    // Try alternative splitting by detecting section headers
    if (sections.length < 3) {
      console.log("Few sections detected, trying alternative parsing");
      console.log("Total lines in text:", cleanedText.split('\n').length);
      
      const lines = cleanedText.split('\n');
      sections = [];
      let currentSection = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        // Skip empty lines
        if (!trimmed) continue;
        
        // Section header detection - improved to catch ## headers and ALL CAPS
        const hasMarkdownHeader = trimmed.startsWith('##');
        const cleanedForCapsCheck = trimmed.replace(/^##\s*/, ''); // Remove ## for caps check
        const isAllCaps = cleanedForCapsCheck === cleanedForCapsCheck.toUpperCase() &&
                         cleanedForCapsCheck.length > 2 &&
                         cleanedForCapsCheck.length < 60 &&
                         !cleanedForCapsCheck.match(/^[•\-\*]/) &&
                         !cleanedForCapsCheck.includes('@') &&
                         !cleanedForCapsCheck.match(/\d{4}/); // Not a date line
        
        const isSectionHeader = hasMarkdownHeader || isAllCaps;
        
        // Debug logging for headers
        if (hasMarkdownHeader || (isAllCaps && cleanedForCapsCheck.length > 2)) {
          console.log(`Line ${i}: "${trimmed.substring(0, 50)}" - isHeader: ${isSectionHeader}, hasMarkdown: ${hasMarkdownHeader}, isAllCaps: ${isAllCaps}`);
        }
        
        if (isSectionHeader && currentSection.length > 0) {
          // Save previous section
          sections.push(currentSection.join('\n'));
          console.log(`  -> Created section with ${currentSection.length} lines`);
          currentSection = [line];
        } else {
          currentSection.push(line);
        }
      }
      
      if (currentSection.length > 0) {
        sections.push(currentSection.join('\n'));
        console.log(`  -> Created final section with ${currentSection.length} lines`);
      }
      
      console.log(`Alternative parsing created ${sections.length} sections`);
      
      // Debug: log first line of each section
      sections.forEach((section, idx) => {
        const firstLine = section.split('\n')[0];
        console.log(`Section ${idx + 1}: ${firstLine.substring(0, 60)}`);
      });
    }
    
    console.log(`Parsed ${sections.length} sections from text`);

    let y = height - margins.vertical;

    // Draw header (name and contact info)
    if (sections.length > 0) {
      y = drawHeader(page, sections[0], y, width, margins, fonts, fontSizes, colors, height);
      y -= spacing.afterHeader;
    }

    // Process remaining sections
    for (let i = 1; i < sections.length; i++) {
      const section = sections[i];
      if (!section || section.trim().length === 0) continue;

      const lines = section.split("\n");
      const firstLine = lines[0].trim();
      
      // Improved section header detection
      const hasMarkdownHeader = firstLine.startsWith('##');
      const isAllCaps = firstLine === firstLine.toUpperCase() &&
                       firstLine.length > 2 &&
                       firstLine.length < 50 &&
                       !firstLine.includes('@');
      
      const isSectionHeader = hasMarkdownHeader || isAllCaps;

      if (isSectionHeader) {
        // Check if we need a new page
        if (y < margins.vertical + 100) {
          page = pdfDoc.addPage([612, 792]);
          y = height - margins.vertical;
        }

        // Draw section header
        y -= 6;
        page.drawText(firstLine, {
          x: margins.horizontal,
          y,
          size: fontSizes.sectionSize,
          font: fonts.bold,
          color: colors.sectionHeader,
        });

        y -= 4;
        page.drawLine({
          start: { x: margins.horizontal, y },
          end: { x: width - margins.horizontal, y },
          thickness: 0.8,
          color: colors.headerLine,
        });

        y -= spacing.section;

        // Process section content
        for (let j = 1; j < lines.length; j++) {
          y = await drawLine(page, pdfDoc, lines[j], y, width, margins, fonts, fontSizes, colors, lineHeight, height);
        }
      } else {
        // Regular paragraph
        for (let j = 0; j < lines.length; j++) {
          y = await drawLine(page, pdfDoc, lines[j], y, width, margins, fonts, fontSizes, colors, lineHeight, height);
        }
      }

      y -= spacing.paragraph;
    }

    const pdfBytes = await pdfDoc.save();
    console.log("PDF generated successfully");
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error("Error creating PDF:", error);
    throw new Error(`Failed to create PDF: ${error.message}`);
  }
}

/**
 * Draw header with name and contact info (centered, Garvit Joshi style)
 */
function drawHeader(page, section, yPos, pageWidth, margins, fonts, fontSizes, colors, height) {
  const lines = section.split("\n");
  let name = lines[0].trim().replace(/text|```|\.\.\./gi, "").trim();
  
  if (!name && lines.length > 1) {
    name = lines[1].trim();
  }

  // Draw name centered
  const nameWidth = fonts.bold.widthOfTextAtSize(name, fontSizes.nameSize);
  const nameX = (pageWidth - nameWidth) / 2;
  const nameY = height - margins.vertical;

  page.drawText(name, {
    x: nameX,
    y: nameY,
    size: fontSizes.nameSize,
    font: fonts.bold,
    color: colors.headerText,
  });

  // Process contact info
  const contactLines = lines.slice(1).filter(l => l.trim().length > 0);
  
  if (contactLines.length > 0) {
    const contactText = contactLines.join(" ");
    const contactItems = [];

    // Extract contact info
    const email = contactText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phone = contactText.match(/(?:\+?\d{1,2}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    const linkedin = contactText.match(/linkedin\.com\/in\/[a-zA-Z0-9-]+/);
    const github = contactText.match(/github\.com\/[a-zA-Z0-9-]+/);
    const website = contactText.match(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/);

    if (phone) contactItems.push(phone[0]);
    if (email) contactItems.push(email[0]);
    if (linkedin) contactItems.push(linkedin[0]);
    if (github) contactItems.push(github[0]);
    if (website && !website[0].includes("linkedin") && !website[0].includes("github")) {
      contactItems.push(website[0]);
    }

    // Calculate total width
    const separator = " | ";
    let totalWidth = 0;
    contactItems.forEach((item, idx) => {
      totalWidth += fonts.normal.widthOfTextAtSize(item, fontSizes.smallSize);
      if (idx < contactItems.length - 1) {
        totalWidth += fonts.normal.widthOfTextAtSize(separator, fontSizes.smallSize);
      }
    });

    // Draw contact items centered
    const contactY = nameY - fontSizes.nameSize - 8;
    let xPos = (pageWidth - totalWidth) / 2;

    contactItems.forEach((item, idx) => {
      const isLink = item.includes("@") || item.includes(".com") || item.includes("linkedin") || item.includes("github");
      
      page.drawText(item, {
        x: xPos,
        y: contactY,
        size: fontSizes.smallSize,
        font: fonts.normal,
        color: isLink ? colors.link : colors.bodyText,
      });

      xPos += fonts.normal.widthOfTextAtSize(item, fontSizes.smallSize);

      if (idx < contactItems.length - 1) {
        page.drawText(separator, {
          x: xPos,
          y: contactY,
          size: fontSizes.smallSize,
          font: fonts.normal,
          color: colors.bodyText,
        });
        xPos += fonts.normal.widthOfTextAtSize(separator, fontSizes.smallSize);
      }
    });

    return contactY - 12;
  }

  return nameY - fontSizes.nameSize - 8;
}

/**
 * Draw a single line with proper formatting
 */
async function drawLine(page, pdfDoc, line, yPos, pageWidth, margins, fonts, fontSizes, colors, lineHeight, pageHeight) {
  if (!line || line.trim().length === 0) {
    return yPos - lineHeight / 2;
  }

  // Check for new page
  if (yPos < margins.vertical + 20) {
    page = pdfDoc.addPage([612, 792]);
    yPos = pageHeight - margins.vertical;
  }

  const isBullet = line.trim().startsWith("•") || line.trim().startsWith("-");
  const indentMatch = line.match(/^\s*/);
  const indent = indentMatch ? indentMatch[0].length : 0;
  const xPos = margins.horizontal + indent * 2;

  if (isBullet) {
    // Draw bullet
    page.drawText("•", {
      x: xPos,
      y: yPos,
      size: fontSizes.normalSize,
      font: fonts.normal,
      color: colors.bullet,
    });

    // Draw bullet text
    const bulletText = line.replace(/^[\s•\-]+/, "").trim();
    const maxWidth = pageWidth - xPos - 12 - margins.horizontal;
    
    yPos = await drawWrappedText(
      page,
      bulletText,
      xPos + 12,
      yPos,
      maxWidth,
      fonts.normal,
      fontSizes.normalSize,
      colors.bodyText,
      lineHeight
    );
  } else {
    // Detect bold text (job titles, headings with dates)
    const isBold = line.includes("|") || 
                   (line.match(/\d{4}/g) && (line.includes("--") || line.includes("–")));
    
    const font = isBold ? fonts.bold : fonts.normal;
    const maxWidth = pageWidth - xPos - margins.horizontal;
    
    yPos = await drawWrappedText(
      page,
      line.trim(),
      xPos,
      yPos,
      maxWidth,
      font,
      fontSizes.normalSize,
      colors.bodyText,
      lineHeight
    );
  }

  return yPos - lineHeight;
}

/**
 * Draw text with word wrapping
 */
async function drawWrappedText(page, text, x, y, maxWidth, font, fontSize, color, lineHeight) {
  const words = text.split(" ");
  let currentLine = "";
  let currentY = y;

  for (const word of words) {
    const testLine = currentLine + (currentLine ? " " : "") + word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (testWidth <= maxWidth || currentLine === "") {
      currentLine = testLine;
    } else {
      page.drawText(currentLine, {
        x,
        y: currentY,
        size: fontSize,
        font,
        color,
      });
      currentY -= lineHeight;
      currentLine = word;
    }
  }

  if (currentLine) {
    page.drawText(currentLine, {
      x,
      y: currentY,
      size: fontSize,
      font,
      color,
    });
  }

  return currentY;
}

const templates = Object.keys(RESUME_TEMPLATES);

module.exports = { editPDF, templates };