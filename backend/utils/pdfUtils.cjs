const fs = require('fs');
const pdf = require('pdf-parse');
const PDFServicesSdk = require('@adobe/pdfservices-node-sdk');
const { editPDF, templates } = require('../pdf-editor-v2.cjs');

// Helper function for PDF text extraction
function render_page(pageData) {
  let render_options = {
    normalizeWhitespace: false,
    disableCombineTextItems: false
  };

  return pageData.getTextContent(render_options).then(function(textContent) {
    let lastY, text = '';
    const items = textContent.items;
    const lineSpacing = 2; // Line height threshold
    const formattingInfo = []; // Store formatting information

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const transform = item.transform;
      const fontSize = Math.sqrt(transform[0] * transform[0] + transform[1] * transform[1]);
      const isBold = item.fontName && item.fontName.toLowerCase().includes('bold');
      
      // Store formatting info
      formattingInfo.push({
        text: item.str,
        x: transform[4],
        y: transform[5],
        fontSize,
        isBold,
        fontName: item.fontName
      });
      
      if (lastY && Math.abs(lastY - item.transform[5]) > lineSpacing) {
        text += '\n';
      } else if (i > 0 && items[i - 1].str.trim().length > 0) {
        text += ' ';
      }

      if (item.str.match(/^[•∙⋅◦○●]/)) {
        text += '• ';
      } else {
        text += item.str;
      }
      
      lastY = item.transform[5];
    }
    return { text, formattingInfo };
  });
}

// Configure Adobe PDF Services
let executionContext = null;

function initializeAdobeSDK() {
  try {
    if (!process.env.ADOBE_CLIENT_ID || !process.env.ADOBE_CLIENT_SECRET) {
      throw new Error('Adobe credentials not found in environment variables');
    }

    // Create credentials instance using OAuth server-to-server
    const credentials = PDFServicesSdk.Credentials
      .servicePrincipalCredentialsBuilder()
      .withClientId(process.env.ADOBE_CLIENT_ID)
      .withClientSecret(process.env.ADOBE_CLIENT_SECRET)
      .build();

    // Create execution context using credentials
    executionContext = PDFServicesSdk.ExecutionContext.create(credentials);
    console.log('Adobe SDK initialized successfully with OAuth server-to-server authentication');
  } catch (error) {
    console.error('Failed to initialize Adobe SDK:', error);
    throw error;
  }
}

// Use Adobe PDF Extract API to analyze document structure
async function analyzeDocumentStructureWithAdobe(pdfBuffer) {
  try {
    if (!executionContext) {
      console.log("Adobe SDK not initialized, skipping structure analysis");
      return null;
    }
    
    console.log("Analyzing PDF structure with Adobe PDF Extract API");
    
    // Save the buffer to a temporary file
    const tempInputPath = require('path').join(__dirname, '../temp-input.pdf');
    await fs.promises.writeFile(tempInputPath, pdfBuffer);
    
    // Create the extract operation
    const extractOperation = PDFServicesSdk.ExtractPDF.Operation.createNew();
    
    // Set the input PDF file
    const input = PDFServicesSdk.FileRef.createFromLocalFile(
      tempInputPath,
      PDFServicesSdk.ExtractPDF.SupportedSourceFormat.pdf
    );
    extractOperation.setInput(input);
    
    // Configure extraction options using the correct format
    const extractOptions = new PDFServicesSdk.ExtractPDF.options.ExtractPdfOptions.Builder()
      .addElementsToExtract(PDFServicesSdk.ExtractPDF.options.ExtractElementType.TEXT)
      .addElementsToExtract(PDFServicesSdk.ExtractPDF.options.ExtractElementType.TABLES)
      .build();
    
    extractOperation.setOptions(extractOptions);
    
    console.log("Executing PDF Extract operation");
    const result = await extractOperation.execute(executionContext);
    
    // Process the result
    const outputPath = require('path').join(__dirname, '../extracted-info.zip');
    await result.saveAsFile(outputPath);
    
    console.log("PDF structure extracted successfully");
    
    // Process the ZIP file to extract structure information
    const structureData = await processAdobeExtractedStructure(outputPath);
    
    // Clean up the input file
    try {
      await fs.promises.unlink(tempInputPath);
    } catch (cleanupError) {
      console.error("Error cleaning up input file:", cleanupError);
    }
    
    return structureData || {
      hasAdobeAnalysis: true,
      extractedWithAdobe: true,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error("Error analyzing document with Adobe:", error);
    return null;
  }
}

// Process Adobe extracted ZIP structure
async function processAdobeExtractedStructure(zipFilePath) {
  try {
    console.log(`Processing extracted structure from ${zipFilePath}`);
    // Read the ZIP file
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(zipFilePath);
    
    // Extract the JSON file
    const jsonEntry = zip.getEntries().find(entry => entry.entryName.endsWith('structuredData.json'));
    
    if (!jsonEntry) {
      console.error("Could not find structuredData.json in the extracted file");
      return null;
    }
    
    // Parse the JSON data
    const jsonData = JSON.parse(jsonEntry.getData().toString('utf8'));
    
    // Extract useful formatting information
    const formattingInfo = {
      hasAdobeStructure: true,
      
      // Document info
      pageCount: jsonData.elements ? jsonData.elements.length : 1,
      
      // Extract font information
      fonts: extractFontInfo(jsonData),
      
      // Extract text elements
      textElements: extractTextElements(jsonData),
      
      // Extract headings and sections
      headings: extractHeadings(jsonData),
      
      // Extract lists and bullets
      lists: extractLists(jsonData),
      
      // Extract tables (if any)
      tables: extractTables(jsonData)
    };
    
    // Clean up the ZIP file
    try {
      await fs.promises.unlink(zipFilePath);
    } catch (cleanupError) {
      console.error("Error cleaning up ZIP file:", cleanupError);
    }
    
    return formattingInfo;
  } catch (error) {
    console.error("Error processing Adobe extracted structure:", error);
    return null;
  }
}

// Helper functions to extract specific information
function extractFontInfo(jsonData) {
  try {
    const fonts = new Set();
    const fontSizes = new Set();
    const fontColors = new Set();
    
    // Process elements to find font information
    if (jsonData && Array.isArray(jsonData.pages)) {
      jsonData.pages.forEach(page => {
        if (page.elements) {
          page.elements.forEach(element => {
            if (element.properties) {
              if (element.properties.fontName) fonts.add(element.properties.fontName);
              if (element.properties.fontSize) fontSizes.add(element.properties.fontSize);
              if (element.properties.color) fontColors.add(element.properties.color);
            }
          });
        }
      });
    }
    
    return {
      fontNames: Array.from(fonts),
      fontSizes: Array.from(fontSizes).sort((a, b) => a - b),
      fontColors: Array.from(fontColors)
    };
  } catch (error) {
    console.error("Error extracting font info:", error);
    return { fontNames: [], fontSizes: [], fontColors: [] };
  }
}

function extractTextElements(jsonData) {
  try {
    const textElements = [];
    
    // Process elements to find text information
    if (jsonData && Array.isArray(jsonData.pages)) {
      jsonData.pages.forEach(page => {
        if (page.elements) {
          page.elements.forEach(element => {
            if (element.text) {
              textElements.push({
                text: element.text || "",
                bounds: element.bounds || null,
                properties: element.properties || null
              });
            }
          });
        }
      });
    }
    
    return textElements;
  } catch (error) {
    console.error("Error extracting text elements:", error);
    return [];
  }
}

function extractHeadings(jsonData) {
  try {
    const headings = [];
    
    // Process elements to find headings
    if (jsonData.elements) {
      jsonData.elements.forEach(page => {
        if (page.Heading) {
          page.Heading.forEach(heading => {
            headings.push({
              text: heading.value || "",
              level: heading.properties?.level || 1,
              bounds: heading.bounds || null
            });
          });
        }
      });
    }
    
    return headings;
  } catch (error) {
    console.error("Error extracting headings:", error);
    return [];
  }
}

function extractLists(jsonData) {
  try {
    const lists = [];
    
    // Process elements to find lists
    if (jsonData.elements) {
      jsonData.elements.forEach(page => {
        if (page.List) {
          page.List.forEach(list => {
            const items = [];
            if (list.items) {
              list.items.forEach(item => {
                items.push({
                  text: item.value || "",
                  level: item.properties?.level || 1
                });
              });
            }
            
            lists.push({
              items,
              bounds: list.bounds || null
            });
          });
        }
      });
    }
    
    return lists;
  } catch (error) {
    console.error("Error extracting lists:", error);
    return [];
  }
}

function extractTables(jsonData) {
  try {
    const tables = [];
    
    // Process elements to find tables
    if (jsonData.elements) {
      jsonData.elements.forEach(page => {
        if (page.Table) {
          page.Table.forEach(table => {
            tables.push({
              rowCount: table.properties?.rowCount || 0,
              columnCount: table.properties?.columnCount || 0,
              bounds: table.bounds || null
            });
          });
        }
      });
    }
    
    return tables;
  } catch (error) {
    console.error("Error extracting tables:", error);
    return [];
  }
}

// PDF modification function with robust error handling
async function modifyPDFWithFallback(buffer, optimizedText, formattingInfo, template = 'classic') {
  try {
    console.log(`Using local PDF editor with ${template} template for document modification`);
    
    // Validate inputs
    if (!optimizedText || optimizedText.trim().length === 0) {
      throw new Error("Optimized text is empty or invalid");
    }
    
    if (!buffer || buffer.length < 100) {
      throw new Error("Invalid PDF buffer");
    }
    
    // Only allow classic and minimalist templates
    const validTemplates = ['classic', 'minimalist'];
    const finalTemplate = validTemplates.includes(template) ? template : 'classic';
    
    if (finalTemplate !== template) {
      console.log(`Invalid template '${template}', using 'classic' instead`);
    }
    
    // Call the editPDF function with the specified template
    const result = await editPDF(buffer, optimizedText, formattingInfo, finalTemplate);
    
    // Validate result
    if (!result || result.length < 1000) {
      throw new Error(`Generated PDF is too small (${result?.length || 0} bytes)`);
    }
    
    console.log("PDF editing completed successfully, size:", result.length);
    return result;
  } catch (error) {
    console.error('Error modifying PDF with template:', template, error.message);
    
    // Try the other template as fallback
    const fallbackTemplate = template === 'classic' ? 'minimalist' : 'classic';
    console.log(`Attempting fallback to ${fallbackTemplate} template`);
    
    try {
      const fallbackResult = await editPDF(buffer, optimizedText, formattingInfo, fallbackTemplate);
      
      if (fallbackResult && fallbackResult.length > 1000) {
        console.log(`${fallbackTemplate} template fallback successful`);
        return fallbackResult;
      }
    } catch (fallbackError) {
      console.error(`${fallbackTemplate} template fallback failed:`, fallbackError.message);
    }
    
    // Final fallback: return original PDF with a warning
    console.warn("All PDF generation attempts failed, returning original PDF");
    return buffer;
  }
}

// Function to get template descriptions
function getTemplateDescription(template) {
  const descriptions = {
    classic: "Traditional resume format with clean, professional styling and standard margins",
    minimalist: "Clean, minimal design with ample white space for elegant simplicity and wider margins"
  };
  return descriptions[template] || "Professional resume template";
}

module.exports = {
  initializeAdobeSDK,
  analyzeDocumentStructureWithAdobe,
  processAdobeExtractedStructure,
  modifyPDFWithFallback,
  render_page,
  getTemplateDescription,
  templates
}; 