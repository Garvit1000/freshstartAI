const { PDFDocument, rgb, StandardFonts, PDFFont } = require("pdf-lib");

/**
 * Predefined resume templates with professional styling
 */
const RESUME_TEMPLATES = {
  classic: {
    colors: {
      headerText: rgb(0, 0, 0),
      bodyText: rgb(0.1, 0.1, 0.1),
      headerLine: rgb(0.4, 0.4, 0.4),
      bullet: rgb(0.3, 0.3, 0.3),
      footer: rgb(0.5, 0.5, 0.5),
      link: rgb(0, 0, 0.8),
    },
    margins: {
      horizontal: 50,
      vertical: 40,
    },
    spacing: {
      section: 12,
      paragraph: 8,
      line: 14,
    },
  },
  professional: {
    colors: {
      headerText: rgb(0.1, 0.2, 0.4), // Dark blue for headers
      bodyText: rgb(0.15, 0.15, 0.15),
      headerLine: rgb(0.1, 0.2, 0.4),
      bullet: rgb(0.1, 0.2, 0.4),
      footer: rgb(0.5, 0.5, 0.6),
      link: rgb(0.1, 0.2, 0.6),
    },
    margins: {
      horizontal: 60,
      vertical: 45,
    },
    spacing: {
      section: 15,
      paragraph: 10,
      line: 15,
    },
  },
  modern: {
    colors: {
      headerText: rgb(0.2, 0.4, 0.5), // Teal for headers
      bodyText: rgb(0.2, 0.2, 0.2),
      headerLine: rgb(0.2, 0.4, 0.5),
      bullet: rgb(0.2, 0.4, 0.5),
      footer: rgb(0.5, 0.6, 0.6),
      link: rgb(0.2, 0.5, 0.6),
    },
    margins: {
      horizontal: 55,
      vertical: 50,
    },
    spacing: {
      section: 14,
      paragraph: 10,
      line: 16,
    },
  },
  tech: {
    colors: {
      headerText: rgb(0.15, 0.15, 0.15),
      bodyText: rgb(0.25, 0.25, 0.25),
      headerLine: rgb(0.5, 0.5, 0.5),
      bullet: rgb(0, 0.7, 0.8), // Bright blue bullets
      footer: rgb(0.5, 0.5, 0.5),
      link: rgb(0, 0.5, 0.8),
    },
    margins: {
      horizontal: 50,
      vertical: 40,
    },
    spacing: {
      section: 12,
      paragraph: 8,
      line: 15,
    },
  },
  minimalist: {
    colors: {
      headerText: rgb(0, 0, 0),
      bodyText: rgb(0.25, 0.25, 0.25),
      headerLine: rgb(0.8, 0.8, 0.8),
      bullet: rgb(0.5, 0.5, 0.5),
      footer: rgb(0.7, 0.7, 0.7),
      link: rgb(0.3, 0.3, 0.5),
    },
    margins: {
      horizontal: 65,
      vertical: 50,
    },
    spacing: {
      section: 16,
      paragraph: 12,
      line: 16,
    },
  },
};

/**
 * Edit a PDF with optimized text content
 * @param {Buffer} pdfBuffer - Original PDF buffer
 * @param {string} optimizedText - The optimized text content
 * @param {Object} formattingInfo - Formatting information from original PDF
 * @param {string} template - Template name (classic, professional, modern, tech, minimalist)
 * @returns {Promise<Buffer>} - The modified PDF as a buffer
 */
async function editPDF(
  pdfBuffer,
  optimizedText,
  formattingInfo,
  template = "professional",
) {
  try {
    console.log("Starting PDF editing process with template:", template);
    console.log("Text length:", optimizedText?.length || 0, "bytes");

    if (!optimizedText || optimizedText.trim().length === 0) {
      throw new Error("Optimized text is empty or undefined");
    }

    if (!pdfBuffer || pdfBuffer.length < 100) {
      throw new Error(
        `Invalid PDF buffer (size: ${pdfBuffer?.length || 0} bytes)`,
      );
    }

    // Debug the input text
    console.log("First 100 chars:", optimizedText.substring(0, 100));
    console.log(
      "Last 100 chars:",
      optimizedText.substring(optimizedText.length - 100),
    );

    // Get template styling
    const templateStyle =
      RESUME_TEMPLATES[template] || RESUME_TEMPLATES.professional;

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    // Add a page with standard letter size
    let page = pdfDoc.addPage([612, 792]);
    const { width, height } = page.getSize();

    // Embed standard fonts
    const fonts = {
      normal: await pdfDoc.embedFont(StandardFonts.Helvetica),
      bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
      italic: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
      heading: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
    };

    // Define font sizes and margins based on template
    const fontSizes = {
      name: 18,
      section: 14,
      normal: 9,
      small: 9,
      contactInfo: 10,
      subheading: 11,
      bodyText: 8,
    };

    const margin = templateStyle.margins.horizontal || 50;
    const lineHeight = templateStyle.spacing.line || 14;

    // Enhanced section splitting with better handling of whitespace
    let sections = [];
    if (optimizedText && optimizedText.trim()) {
      // First clean up text markers or code block markers
      let cleanedText = optimizedText
        .replace(/```text\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      // Log the cleaned text for debugging
      console.log("Cleaned text length:", cleanedText.length);
      console.log("Cleaned text first 50 chars:", cleanedText.substring(0, 50));

      // Split by double newlines to identify sections
      // Use a more permissive regex to handle various newline patterns
      sections = cleanedText.split(/\n\s*\n+/);

      // Further clean up sections
      sections = sections
        .map((section) => section.trim())
        .filter((section) => section.length > 0);

      console.log(`Found ${sections.length} sections in resume`);

      // For debugging, log the first section
      if (sections.length > 0) {
        console.log("First section:", sections[0].substring(0, 50) + "...");
      }

      // If we couldn't find sections properly, try a simpler approach
      if (sections.length < 2) {
        console.log("Falling back to simpler section splitting");

        // Just split by line breaks and group into reasonable chunks
        const lines = cleanedText.split("\n");
        let currentSection = [];
        sections = [];

        for (const line of lines) {
          // If we find a line that looks like a section header,
          // and we already have content, start a new section
          if (
            line.trim() === line.trim().toUpperCase() &&
            line.trim().length > 3 &&
            currentSection.length > 0
          ) {
            sections.push(currentSection.join("\n"));
            currentSection = [line];
          } else {
            currentSection.push(line);
          }
        }

        // Add the last section
        if (currentSection.length > 0) {
          sections.push(currentSection.join("\n"));
        }

        console.log(`After fallback splitting: ${sections.length} sections`);
      }
    } else {
      console.error("Text is empty after processing");
      throw new Error("Text content is empty after processing");
    }

    // Start position for drawing
    let y = height - (templateStyle.margins.vertical || 40);

    // Process header section (name and contact info)
    if (sections.length > 0) {
      // Use enhanced header drawing with better contact item handling
      y = drawEnhancedHeader(
        page,
        sections[0],
        y,
        width,
        margin,
        fonts,
        fontSizes,
        templateStyle.colors,
        template,
        formattingInfo,
        height,
      );

      // Adjust spacing after header
      y -= 10;
    }

    // Process remaining sections with improved section handling
    for (let i = 1; i < sections.length; i++) {
      const section = sections[i];

      if (!section || section.trim().length === 0) {
        continue; // Skip empty sections
      }

      console.log(`Processing section ${i}: ${section.substring(0, 30)}...`);

      const lines = section.split("\n");

      // Check if section header (all caps, short line)
      const firstLine = lines[0].trim();
      const isSectionHeader =
        firstLine === firstLine.toUpperCase() &&
        firstLine.length > 2 &&
        firstLine.length < 30;

      if (isSectionHeader) {
        // Add spacing before section header
        y -= 10;

        // Draw section header with better visibility
        page.drawText(firstLine, {
          x: margin,
          y,
          size: fontSizes.section,
          font: fonts.bold,
          color: templateStyle.colors.headerText,
        });

        // Add separator line
        y -= 5;
        page.drawLine({
          start: { x: margin, y },
          end: { x: width - margin, y },
          thickness: 1,
          color: templateStyle.colors.headerLine,
        });

        y -= 10;

        // Process lines after header with improved text wrapping
        for (let j = 1; j < lines.length; j++) {
          const line = lines[j];

          if (!line || line.trim().length === 0) {
            y -= lineHeight / 2; // Half space for empty lines
            continue;
          }

          // Check for new page
          if (y < margin) {
            console.log("Creating new page");
            page = pdfDoc.addPage([612, 792]);
            y = height - margin;
          }

          // Determine indentation and bullet status
          const isBullet =
            line.trim().startsWith("•") || line.trim().startsWith("-");
          const indentMatch = line.match(/^\s*/);
          const indent = indentMatch ? indentMatch[0].length : 0;
          const xPos = margin + indent * 2; // 2 points per space

          // Handle bullet points
          if (isBullet) {
            // Extract text after bullet
            const bulletText = line.replace(/^[\s•\-]+/, "").trim();

            // Draw bullet symbol
            page.drawText("•", {
              x: xPos,
              y,
              size: fontSizes.normal,
              font: fonts.normal,
              color: templateStyle.colors.bullet,
            });

            // Enhanced text wrapping for bullet points
            const bulletIndent = 10; // Space after bullet
            const maxWidth = width - margin - xPos - bulletIndent - margin;
            const words = bulletText.split(" ");
            let currentLine = "";
            let lineX = xPos + bulletIndent;

            for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
              const word = words[wordIndex];
              const testLine = currentLine + (currentLine ? " " : "") + word;
              const testWidth = fonts.normal.widthOfTextAtSize(
                testLine,
                fontSizes.normal,
              );

              if (testWidth <= maxWidth || currentLine === "") {
                currentLine = testLine;
              } else {
                // Draw current line
                page.drawText(currentLine, {
                  x: lineX,
                  y,
                  size: fontSizes.normal,
                  font: fonts.normal,
                  color: templateStyle.colors.bodyText,
                });

                // Process links in this line
                processLinks(
                  page,
                  currentLine,
                  lineX,
                  y,
                  fontSizes.normal,
                  fonts.normal,
                );

                // Move to next line
                y -= lineHeight;

                // Check for new page
                if (y < margin) {
                  console.log("Creating new page for continued bullet point");
                  page = pdfDoc.addPage([612, 792]);
                  y = height - margin;
                }

                // Start new line with current word
                currentLine = word;
              }
            }

            // Draw the last line
            if (currentLine) {
              page.drawText(currentLine, {
                x: lineX,
                y,
                size: fontSizes.normal,
                font: fonts.normal,
                color: templateStyle.colors.bodyText,
              });

              // Process links in this line
              processLinks(
                page,
                currentLine,
                lineX,
                y,
                fontSizes.normal,
                fonts.normal,
              );
            }
          } else {
            // Regular text with improved wrapping
            const maxWidth = width - xPos - margin;
            const words = line.trim().split(" ");
            let currentLine = "";
            let font = fonts.normal;

            // Detect if this is a subheading or job title
            const isSubheading = line.trim().endsWith(":");
            const isJobTitle =
              line.trim().includes("|") || // Company | Title format
              (line.includes("20") &&
                (line.includes("-") || line.includes("–"))); // Date format

            if (isSubheading || isJobTitle) {
              font = fonts.bold;
            }

            for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
              const word = words[wordIndex];
              const testLine = currentLine + (currentLine ? " " : "") + word;
              const testWidth = font.widthOfTextAtSize(
                testLine,
                fontSizes.normal,
              );

              if (testWidth <= maxWidth || currentLine === "") {
                currentLine = testLine;
              } else {
                // Draw current line
                page.drawText(currentLine, {
                  x: xPos,
                  y,
                  size: fontSizes.normal,
                  font: font,
                  color: templateStyle.colors.bodyText,
                });

                // Process links in this line
                processLinks(
                  page,
                  currentLine,
                  xPos,
                  y,
                  fontSizes.normal,
                  font,
                );

                // Move to next line
                y -= lineHeight;

                // Check for new page
                if (y < margin) {
                  console.log("Creating new page for continued text");
                  page = pdfDoc.addPage([612, 792]);
                  y = height - margin;
                }

                // Start new line with current word
                currentLine = word;
              }
            }

            // Draw the last line
            if (currentLine) {
              page.drawText(currentLine, {
                x: xPos,
                y,
                size: fontSizes.normal,
                font: font,
                color: templateStyle.colors.bodyText,
              });

              // Process links in this line
              processLinks(page, currentLine, xPos, y, fontSizes.normal, font);
            }
          }

          // Move to next line
          y -= lineHeight;
        }
      } else {
        // Regular paragraph with improved handling
        for (let j = 0; j < lines.length; j++) {
          const line = lines[j];

          if (!line || line.trim().length === 0) {
            y -= lineHeight / 2; // Half space for empty lines
            continue;
          }

          // Check for new page
          if (y < margin) {
            console.log("Creating new page for paragraph");
            page = pdfDoc.addPage([612, 792]);
            y = height - margin;
          }

          // Determine indentation
          const indentMatch = line.match(/^\s*/);
          const indent = indentMatch ? indentMatch[0].length : 0;
          const xPos = margin + indent * 2; // 2 points per space

          // Improved text wrapping
          const maxWidth = width - xPos - margin;
          const words = line.trim().split(" ");
          let currentLine = "";

          for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
            const word = words[wordIndex];
            const testLine = currentLine + (currentLine ? " " : "") + word;
            const testWidth = fonts.normal.widthOfTextAtSize(
              testLine,
              fontSizes.normal,
            );

            if (testWidth <= maxWidth || currentLine === "") {
              currentLine = testLine;
            } else {
              // Draw current line
              page.drawText(currentLine, {
                x: xPos,
                y,
                size: fontSizes.normal,
                font: fonts.normal,
                color: templateStyle.colors.bodyText,
              });

              // Process links in this line
              processLinks(
                page,
                currentLine,
                xPos,
                y,
                fontSizes.normal,
                fonts.normal,
              );

              // Move to next line
              y -= lineHeight;

              // Check for new page
              if (y < margin) {
                console.log("Creating new page for continued paragraph");
                page = pdfDoc.addPage([612, 792]);
                y = height - margin;
              }

              // Start new line with current word
              currentLine = word;
            }
          }

          // Draw the last line
          if (currentLine) {
            page.drawText(currentLine, {
              x: xPos,
              y,
              size: fontSizes.normal,
              font: fonts.normal,
              color: templateStyle.colors.bodyText,
            });

            // Process links in this line
            processLinks(
              page,
              currentLine,
              xPos,
              y,
              fontSizes.normal,
              fonts.normal,
            );
          }

          // Move to next line
          y -= lineHeight;
        }
      }

      // Add space between sections
      y -= templateStyle.spacing.section;
    }

    // Save the PDF
    console.log("Saving PDF document");
    const pdfBytes = await pdfDoc.save();
    console.log("PDF saved successfully, size:", pdfBytes.length, "bytes");
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error("Error creating PDF:", error);
    throw new Error(`Failed to create PDF: ${error.message}`);
  }
}

/**
 * Process links in text and draw them
 */
function processLinks(page, text, x, y, fontSize, font) {
  // Find links
  const linkRegex =
    /(https?:\/\/[^\s]+)|([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)|(linkedin\.com\/in\/[a-zA-Z0-9-]+)|(github\.com\/[a-zA-Z0-9-]+)|(\[Code\])|(\[Live\])/g;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    // Get the matched text
    const linkText = match[0];
    const linkX =
      x + font.widthOfTextAtSize(text.substring(0, match.index), fontSize);
    const linkWidth = font.widthOfTextAtSize(linkText, fontSize);

    // Skip [Code] and [Live] tags - just make them visible in blue
    if (linkText === "[Code]" || linkText === "[Live]") {
      // Erase background (white rectangle)
      page.drawRectangle({
        x: linkX - 1,
        y: y - fontSize,
        width: linkWidth + 2,
        height: fontSize + 2,
        color: rgb(1, 1, 1),
      });

      // Draw the tag in blue
      page.drawText(linkText, {
        x: linkX,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0.5, 0.8),
      });
      continue;
    }

    // Draw link text in blue
    page.drawRectangle({
      x: linkX - 1,
      y: y - fontSize,
      width: linkWidth + 2,
      height: fontSize + 2,
      color: rgb(1, 1, 1),
    });

    page.drawText(linkText, {
      x: linkX,
      y,
      size: fontSize,
      font,
      color: rgb(0, 0.4, 0.8),
    });

    // Add underline
    page.drawLine({
      start: { x: linkX, y: y - 1 },
      end: { x: linkX + linkWidth, y: y - 1 },
      thickness: 0.5,
      color: rgb(0, 0.4, 0.8),
    });
  }
}

/**
 * Add a clickable link annotation to a PDF page
 */
function addLinkAnnotation(page, x, y, width, height, url) {
  try {
    // pdf-lib doesn't directly support annotations like we tried
    // Instead, we can rely on visual styling and skip the clickable link for now
    // This prevents errors while keeping the visual appearance
    console.log(
      `Would add link to ${url} at (${x}, ${y}, ${width}, ${height}) - skipping annotation creation`,
    );
  } catch (error) {
    console.warn("Unable to create link annotation:", error);
  }
}

/**
 * Draw an enhanced professional header with styling based on template
 */
function drawEnhancedHeader(
  page,
  section,
  yPos,
  pageWidth,
  margin,
  fonts,
  fontSizes,
  colors,
  template,
  formattingInfo,
  height,
) {
  try {
    console.log("Drawing enhanced header");
    const lines = section.split("\n");

    // Extract name from the first line
    let name = lines[0].trim();

    // Remove any "text" label, dots (```), or irrelevant text that might be in the name
    if (
      name.toLowerCase().includes("text") ||
      name.includes("```") ||
      name.includes("...")
    ) {
      name = name.replace(/text|```|\.\.\./gi, "").trim();
      // If name is empty after removal, try to get it from the second line
      if (!name && lines.length > 1) {
        name = lines[1]
          .trim()
          .replace(/text|```|\.\.\./gi, "")
          .trim();
        lines.shift(); // Remove the first line with "text"
      }
    }

    // If name is still empty, search other lines for a name
    if (!name && lines.length > 0) {
      // Use the first non-empty line as the name
      for (let i = 0; i < Math.min(lines.length, 3); i++) {
        if (lines[i].trim().length > 0) {
          name = lines[i].trim();
          break;
        }
      }
    }

    // Final fallback - use a generic name if we couldn't find one
    if (!name) {
      name = "Professional Resume";
    }

    // Get the rest of the lines for contact info
    const contactLines = lines
      .slice(1)
      .filter((line) => line.trim().length > 0);

    // Create a clean background for the header
    page.drawRectangle({
      x: 0,
      y: height - 120, // Start from near top of the page
      width: pageWidth,
      height: 120, // Enough height for the header
      color: rgb(1, 1, 1), // White background
      opacity: 1,
    });

    // Draw name centered and bold at the top
    const nameSize = fontSizes.name;
    const nameWidth = fonts.bold.widthOfTextAtSize(name, nameSize);
    const nameX = (pageWidth - nameWidth) / 2;
    const nameY = height - 40; // Position at top with margin

    // Draw name text
    page.drawText(name, {
      x: nameX,
      y: nameY,
      size: nameSize,
      font: fonts.bold,
      color: rgb(0, 0, 0), // Black text for name
    });

    // Handle contact information - draw each piece centered
    if (contactLines.length > 0) {
      // Join the contact lines into one line for easier parsing
      const contactText = contactLines.join(" ");

      // Extract contact information
      const contactItems = [];

      // Extract contact items by type
      const extractContact = (type, text) => {
        switch (type) {
          case "email":
            // More comprehensive email regex
            const emailMatches = text.match(
              /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
            );
            return emailMatches ? emailMatches[0] : null;
          case "phone":
            // Handle more phone formats
            const phoneMatches = text.match(
              /(?:\+?\d{1,2}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
            );
            return phoneMatches ? phoneMatches[0] : null;
          case "linkedin":
            // Handle various LinkedIn URL formats
            const linkedinMatches = text.match(
              /(?:linkedin\.com\/(?:in|profile)\/[a-zA-Z0-9-]+|(?:^|\s)in\/[a-zA-Z0-9-]+)/g,
            );
            return linkedinMatches ? linkedinMatches[0] : null;
          case "github":
            // Handle GitHub profile URLs and usernames
            const githubMatches = text.match(
              /(?:github\.com\/[a-zA-Z0-9-]+|(?:^|\s)github:?\s*[a-zA-Z0-9-]+)/g,
            );
            return githubMatches ? githubMatches[0] : null;
        }
        return null;
      };

      // Process each contact line individually to preserve structure
      contactLines.forEach((line) => {
        const email = extractContact("email", line);
        const phone = extractContact("phone", line);
        const linkedin = extractContact("linkedin", line);
        const github = extractContact("github", line);

        if (email) contactItems.push(email);
        if (phone) contactItems.push(phone);
        if (linkedin) contactItems.push(linkedin);
        if (github) {
          // Format GitHub link properly
          const githubUser = github.split(/github(?:\.com)?[:\s\/]+/).pop();
          contactItems.push(`github.com/${githubUser}`);
        }

        // If line doesn't match any pattern but contains text, add it as is
        if (!email && !phone && !linkedin && !github && line.trim()) {
          contactItems.push(line.trim());
        }
      });

      // Deduplicate contact items while preserving order
      const uniqueItems = [...new Set(contactItems)];
      contactItems.length = 0;
      contactItems.push(...uniqueItems);

      // Calculate total width of contact items with spacing
      const spacing = 15; // Space between contact items
      let totalWidth = 0;
      contactItems.forEach((item, index) => {
        totalWidth += fonts.normal.widthOfTextAtSize(item, fontSizes.normal);
        if (index < contactItems.length - 1) {
          totalWidth += spacing;
        }
      });

      // Draw contact items centered
      const contactY = nameY - nameSize - 15; // Position below name
      let xPos = (pageWidth - totalWidth) / 2;

      contactItems.forEach((item, index) => {
        const itemWidth = fonts.normal.widthOfTextAtSize(
          item,
          fontSizes.normal,
        );

        // Determine if this is a link (email or LinkedIn)
        const isLink =
          item.includes("@") ||
          item.includes("linkedin") ||
          item.includes("github");

        // Draw the contact item
        page.drawText(item, {
          x: xPos,
          y: contactY,
          size: fontSizes.normal,
          font: fonts.normal,
          color: isLink ? colors.link : colors.bodyText,
        });

        // Add separator dot if not the last item
        if (index < contactItems.length - 1) {
          const dotX = xPos + itemWidth + spacing / 2;
          page.drawCircle({
            x: dotX,
            y: contactY + 2,
            size: 2,
            color: rgb(0.5, 0.5, 0.5),
          });
        }

        // Move to next position
        xPos += itemWidth + spacing;
      });

      // Draw separator line below contact info
      const lineY = contactY - 15;
      page.drawLine({
        start: { x: margin, y: lineY },
        end: { x: pageWidth - margin, y: lineY },
        thickness: 1,
        color: rgb(0.4, 0.4, 0.4),
      });

      // Return the Y position for the content to follow
      return lineY - 15;
    } else {
      // If no contact info, just draw a separator line below the name
      const lineY = nameY - 25;
      page.drawLine({
        start: { x: margin, y: lineY },
        end: { x: pageWidth - margin, y: lineY },
        thickness: 1,
        color: rgb(0.4, 0.4, 0.4),
      });

      return lineY - 15;
    }
  } catch (error) {
    console.error("Error in drawEnhancedHeader:", error);
    // Return a default position if there's an error
    return height - 120;
  }
}

/**
 * Extract Adobe analysis data to improve formatting
 */
function extractAdobeFormattingData(formattingInfo) {
  if (!formattingInfo?.adobeAnalysis) {
    return null;
  }

  try {
    const adobeData = formattingInfo.adobeAnalysis;

    // Extract font information
    const fonts = adobeData.fonts || {
      fontNames: [],
      fontSizes: [],
      fontColors: [],
    };

    // Extract text elements to analyze layout
    const textElements = adobeData.textElements || [];

    // Extract header elements
    const headings = adobeData.headings || [];

    // Look for potential header section based on text position and size
    let headerBounds = null;
    if (textElements.length > 0) {
      // Sort by y-position (top to bottom)
      const sortedElements = [...textElements].sort((a, b) => {
        return (b.bounds?.y || 0) - (a.bounds?.y || 0);
      });

      // The first few elements are likely part of the header
      const topElements = sortedElements.slice(
        0,
        Math.min(5, sortedElements.length),
      );

      // Find largest font size in top elements
      const maxFontSize = Math.max(
        ...topElements
          .map((el) => el.properties?.fontSize || 0)
          .filter((size) => size > 0),
      );

      // Top element with largest font is likely the name
      const nameElement = topElements.find(
        (el) => el.properties?.fontSize === maxFontSize,
      );

      if (nameElement) {
        headerBounds = {
          top: nameElement.bounds?.y || 0,
          left: nameElement.bounds?.x || 0,
          fontSize: maxFontSize,
        };
      }
    }

    return {
      fonts,
      headerBounds,
      headings,
      textElements,
    };
  } catch (error) {
    console.error("Error extracting Adobe formatting data:", error);
    return null;
  }
}

/**
 * Format a contact section with proper links
 */
function formatContactSection(
  page,
  section,
  yPos,
  pageWidth,
  fonts,
  fontSizes,
  colors,
) {
  const lines = section.split("\n");
  const contactText = lines.join(" ").trim();

  // Parse contact info
  const emailMatch = contactText.match(
    /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/,
  );
  const phoneMatch = contactText.match(
    /(\d{10}|\d{3}[-\.\s]\d{3}[-\.\s]\d{4})/,
  );
  const linkedinMatch = contactText.match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/);
  const githubMatch = contactText.match(/github\.com\/([a-zA-Z0-9-]+)/);

  // Create contact parts
  const contactInfoParts = [];

  if (emailMatch) {
    contactInfoParts.push({
      text: emailMatch[0],
      isLink: true,
      url: `mailto:${emailMatch[0]}`,
    });
  }

  if (phoneMatch) {
    const formattedPhone = phoneMatch[0].replace(/[\s\(\)-\.]/g, "");
    contactInfoParts.push({
      text: phoneMatch[0],
      isLink: true,
      url: `tel:${formattedPhone}`,
    });
  }

  if (linkedinMatch) {
    const fullLinkedinUrl = `https://linkedin.com/in/${linkedinMatch[1]}`;
    contactInfoParts.push({
      text: `linkedin.com/in/${linkedinMatch[1]}`,
      isLink: true,
      url: fullLinkedinUrl,
    });
  }

  if (githubMatch) {
    const fullGithubUrl = `https://github.com/${githubMatch[1]}`;
    contactInfoParts.push({
      text: `github.com/${githubMatch[1]}`,
      isLink: true,
      url: fullGithubUrl,
    });
  }

  // Calculate total width for centering
  const totalContactsWidth = contactInfoParts.reduce((total, part, idx) => {
    const textWidth = fonts.normal.widthOfTextAtSize(
      part.text,
      fontSizes.contactInfo,
    );
    // Add separator width
    const separatorWidth =
      idx < contactInfoParts.length - 1
        ? fonts.normal.widthOfTextAtSize(" | ", fontSizes.contactInfo)
        : 0;
    return total + textWidth + separatorWidth;
  }, 0);

  // Center the contact info
  let xPosition = (pageWidth - totalContactsWidth) / 2;

  // Draw each contact part
  contactInfoParts.forEach((part, idx) => {
    const textWidth = fonts.normal.widthOfTextAtSize(
      part.text,
      fontSizes.contactInfo,
    );

    // Draw text
    page.drawText(part.text, {
      x: xPosition,
      y: yPos,
      size: fontSizes.contactInfo,
      font: fonts.normal,
      color: part.isLink ? colors.link : colors.bodyText,
    });

    // Add link annotation for clickable items
    if (part.isLink && part.url) {
      // Only add underline for non-highlighted links
      if (!part.highlight) {
        page.drawLine({
          start: { x: xPosition, y: yPos - 1 },
          end: { x: xPosition + textWidth, y: yPos - 1 },
          thickness: 0.5,
          color: colors.link,
          opacity: 0.8,
        });
      }

      // Add link annotation
      addLinkAnnotation(
        page,
        xPosition - 2,
        yPos - 4,
        textWidth + 4,
        fontSizes.contactInfo + 4,
        part.url,
      );
    }

    // Move to next item and add separator
    xPosition += textWidth;
    if (idx < contactInfoParts.length - 1) {
      page.drawText(" | ", {
        x: xPosition,
        y: yPos,
        size: fontSizes.contactInfo,
        font: fonts.normal,
        color: colors.bodyText,
      });
      xPosition += fonts.normal.widthOfTextAtSize(" | ", fontSizes.contactInfo);
    }
  });
}

/**
 * Draw a formatted line of text with proper indentation and bullet points
 */
function drawFormattedLine(page, line, yPos, margin, fonts, fontSizes, colors) {
  // Determine if this is a bullet point
  const isBullet = line.trim().startsWith("•") || line.trim().startsWith("-");

  // Determine if this is a subheading (bold or ends with colon)
  const isSubheading =
    line.trim().endsWith(":") ||
    (line.trim().length > 0 && !isBullet && !line.includes(":"));

  // Calculate indentation
  const indent = line.match(/^\s*/)[0].length;
  const xPos = margin + indent * 8; // 8 points per indentation level

  // Choose font based on content
  let font = fonts.normal;
  let fontSize = fontSizes.bodyText;

  if (isSubheading) {
    font = fonts.bold;
    fontSize = fontSizes.subheading;
  }

  // Check for special lines that should be highlighted (e.g., position titles)
  const isPositionTitle =
    !isBullet &&
    line.includes("—") &&
    (line.includes("Stack") ||
      line.includes("Native") ||
      line.includes("Intern"));

  // Handle bullet points with improved styling
  if (isBullet) {
    // Use a nicer bullet symbol
    const bulletSymbol = "•"; // Unicode bullet

    // Draw an enhanced bullet with better styling
    page.drawText(bulletSymbol, {
      x: xPos - 12,
      y: yPos,
      size: fontSize,
      font: font,
      color: colors.bullet,
    });

    // Get the bullet text
    let bulletText = line.trim().replace(/^[•\-]\s*/, "");

    // Draw text after bullet with improved wrapping
    page.drawText(bulletText, {
      x: xPos,
      y: yPos,
      size: fontSize,
      font: font,
      color: colors.bodyText,
    });

    // Add links if found
    addLinksToText(page, bulletText, xPos, yPos, fontSize, font, colors);
  } else if (isPositionTitle) {
    // Draw position title with special formatting
    // First check if it has a date part (e.g., "Developer — MERN Stack (09/2024 - 11/2024)")
    const parts = line.split("(");

    if (parts.length > 1) {
      // Title part
      const titlePart = parts[0].trim();
      // Date part
      const datePart = "(" + parts.slice(1).join("(").trim();

      // Draw title part in bold
      page.drawText(titlePart, {
        x: xPos,
        y: yPos,
        size: fontSize,
        font: fonts.bold,
        color: colors.headerText,
      });

      // Calculate width to position date part
      const titleWidth = fonts.bold.widthOfTextAtSize(titlePart, fontSize);

      // Draw date part in normal font
      page.drawText(datePart, {
        x: xPos + titleWidth + 4,
        y: yPos,
        size: fontSize,
        font: fonts.normal,
        color: colors.bodyText,
      });

      // Add links if found
      addLinksToText(page, titlePart, xPos, yPos, fontSize, fonts.bold, colors);
      addLinksToText(
        page,
        datePart,
        xPos + titleWidth + 4,
        yPos,
        fontSize,
        fonts.normal,
        colors,
      );
    } else {
      // Draw the entire line in bold
      page.drawText(line.trim(), {
        x: xPos,
        y: yPos,
        size: fontSize,
        font: fonts.bold,
        color: colors.headerText,
      });

      // Add links if found
      addLinksToText(
        page,
        line.trim(),
        xPos,
        yPos,
        fontSize,
        fonts.bold,
        colors,
      );
    }
  } else {
    // Draw regular text
    page.drawText(line.trim(), {
      x: xPos,
      y: yPos,
      size: fontSize,
      font: font,
      color: colors.bodyText,
    });

    // Add links if found
    addLinksToText(page, line.trim(), xPos, yPos, fontSize, font, colors);
  }
}

/**
 * Add clickable links to text where URLs are found
 */
function addLinksToText(page, text, xStart, yPos, fontSize, font, colors) {
  // Find URLs, emails, and other linkable items
  const urlMatches = text.match(/https?:\/\/[^\s]+/g) || [];
  const emailMatches =
    text.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/g) || [];
  const linkedinMatches = text.match(/linkedin\.com\/in\/[a-zA-Z0-9-]+/g) || [];
  const githubMatches = text.match(/github\.com\/[a-zA-Z0-9-]+/g) || [];
  const codeMatches = text.match(/\[Code\]/g) || [];
  const liveMatches = text.match(/\[Live\]/g) || [];

  // Process all potential link matches
  const allMatches = [
    ...urlMatches.map((url) => ({ text: url, url: url, highlight: true })),
    ...emailMatches.map((email) => ({
      text: email,
      url: `mailto:${email}`,
      highlight: true,
    })),
    ...linkedinMatches.map((url) => ({
      text: url,
      url: `https://${url}`,
      highlight: true,
    })),
    ...githubMatches.map((url) => ({
      text: url,
      url: `https://${url}`,
      highlight: true,
    })),
    ...codeMatches.map((code) => ({
      text: code,
      url: `#code`,
      highlight: true,
      specialTag: true,
    })),
    ...liveMatches.map((live) => ({
      text: live,
      url: `#live`,
      highlight: true,
      specialTag: true,
    })),
  ];

  // Add links for each match - visual only
  allMatches.forEach((match) => {
    const startIndex = text.indexOf(match.text);
    if (startIndex >= 0) {
      // Calculate the position of the match within the text
      const precedingText = text.substring(0, startIndex);
      const precedingWidth = font.widthOfTextAtSize(precedingText, fontSize);
      const linkWidth = font.widthOfTextAtSize(match.text, fontSize);
      const linkX = xStart + precedingWidth;

      // Special handling for [Code] and [Live] tags - ultra minimal styling
      if (match.specialTag) {
        // Just make them appear like normal text with a slightly different color
        // No boxes, no backgrounds - just the text itself for minimal styling
        page.drawText(match.text, {
          x: linkX,
          y: yPos,
          size: fontSize,
          font: font,
          color: rgb(0, 0.5, 0.8), // Slightly blue text
        });
      } else if (match.highlight) {
        // Standard link highlighting - just color the text blue
        // First erase background by drawing white rectangle behind it
        page.drawRectangle({
          x: linkX - 1,
          y: yPos - fontSize,
          width: linkWidth + 2,
          height: fontSize + 2,
          color: rgb(1, 1, 1),
          opacity: 1,
        });

        // Draw the text in link color
        page.drawText(match.text, {
          x: linkX,
          y: yPos,
          size: fontSize,
          font: font,
          color: colors.link,
        });

        // Add underline
        page.drawLine({
          start: { x: linkX, y: yPos - 1 },
          end: { x: linkX + linkWidth, y: yPos - 1 },
          thickness: 0.5,
          color: colors.link,
          opacity: 0.8,
        });
      }
    }
  });
}

/**
 * Available templates for export
 */
const templates = Object.keys(RESUME_TEMPLATES);

module.exports = { editPDF, templates };
