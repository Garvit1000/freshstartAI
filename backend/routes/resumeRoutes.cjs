const express = require("express");
const multer = require("multer");
const path = require("path");
const rateLimit = require("express-rate-limit");
const {
  modifyPDFWithFallback,
  getTemplateDescription,
  templates,
} = require("../utils/pdfUtils.cjs");

const {
  extractTextFromPDF,
  optimizeResume,
  analyzeSkillGaps,
  calculateATSScore,
} = require("../utils/aiUtils.cjs");

const router = express.Router();

// Configure rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: "Too many requests from this IP, please try again after 15 minutes",
});

// Apply rate limiting to all routes in this router
router.use(apiLimiter);

// Configure multer for file upload
const upload = multer({ storage: multer.memoryStorage() });

// Optimize resume route
router.post("/optimize-resume", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file || !req.body.jobDescription) {
      return res
        .status(400)
        .json({ error: "Missing resume file or job description" });
    }

    // Get template choice (default to classic)
    const template = req.body.template || "classic";
    const validTemplates = ['classic', 'minimalist'];
    
    if (!validTemplates.includes(template)) {
      return res.status(400).json({
        error: "Invalid template choice",
        availableTemplates: validTemplates,
      });
    }

    // Extract text and formatting from PDF using Gemini
    const { text: resumeText, formattingInfo } = await extractTextFromPDF(
      req.file.buffer,
      req.app.locals.analyzeDocumentStructureWithAdobe,
    );

    if (!resumeText || resumeText.trim().length === 0) {
      return res.status(400).json({
        error:
          "Could not extract text from the provided PDF. Please ensure it contains readable text.",
      });
    }

    console.log(
      "Extracted text from PDF, analyzing with ATS score calculations...",
    );

    // First calculate ATS score for original resume to identify improvement areas
    const originalATSScore = await calculateATSScore(
      resumeText,
      req.body.jobDescription,
    );

    // Store original score for later comparison
    req.app.locals.originalAtsScore = originalATSScore;

    // Generate specific optimization guidance based on ATS score analysis
    let optimizationGuidance = "";
    if (originalATSScore) {
      // Extract missing keywords for targeted insertion
      const missingKeywords = originalATSScore.missingKeywords || [];
      const keywordMatches = originalATSScore.keywordMatches || [];
      const improvementAreas = originalATSScore.improvementAreas || [];

      // Create specific guidance for Gemini based on ATS analysis
      optimizationGuidance = `
ATS ANALYSIS RESULTS:
Current ATS Score: ${originalATSScore.overallScore}%
- Keyword Match Score: ${originalATSScore.keywordScore}%
- Formatting Score: ${originalATSScore.formattingScore}%
- Content Quality Score: ${originalATSScore.contentScore}%

IMPORTANT KEYWORDS TO ADD:
${missingKeywords.map((keyword) => `- "${keyword}"`).join("\n")}

EXISTING KEYWORD MATCHES (MAINTAIN THESE):
${keywordMatches.map((keyword) => `- "${keyword}"`).join("\n")}

KEY IMPROVEMENT AREAS:
${improvementAreas.map((area) => `- ${area.area}: ${area.description} (Priority: ${area.importance}/5)`).join("\n")}

FORMATTING ISSUES:
${(originalATSScore.formattingIssues || []).map((issue) => `- ${issue}`).join("\n")}

CONTENT SUGGESTIONS:
${(originalATSScore.contentSuggestions || []).map((suggestion) => `- ${suggestion}`).join("\n")}
`;
    }

    console.log("Optimizing resume with guidance...");

    // Check if transparency mode is enabled
    const transparencyMode =
      req.body.transparencyMode === "true" ||
      req.body.transparencyMode === true;

    // Now optimize the resume with this enhanced guidance
    const result = await optimizeResume(
      resumeText,
      req.body.jobDescription,
      formattingInfo,
      optimizationGuidance,
      transparencyMode,
    );

    // Get optimized text from result (always returns {optimizedText, transparencyInsights})
    const finalOptimizedText = result.optimizedText;
    const transparencyInsights = result.transparencyInsights;

    // Validate optimized text
    if (!finalOptimizedText || finalOptimizedText.trim().length === 0) {
      throw new Error("Failed to generate optimized text");
    }

    // Log the optimized text for debugging
    console.log("Optimized text length:", finalOptimizedText.length);
    console.log(
      "First 100 chars of optimized text:",
      finalOptimizedText.substring(0, 100),
    );

    const skillGaps = await analyzeSkillGaps(
      resumeText,
      req.body.jobDescription,
    );

    // Calculate ATS score for optimized resume
    const optimizedATSScore = await calculateATSScore(
      finalOptimizedText,
      req.body.jobDescription,
    );

    // Calculate improvement percentages
    const improvements = {
      overall: optimizedATSScore.overallScore - originalATSScore.overallScore,
      keywords: optimizedATSScore.keywordScore - originalATSScore.keywordScore,
      formatting:
        optimizedATSScore.formattingScore - originalATSScore.formattingScore,
      content: optimizedATSScore.contentScore - originalATSScore.contentScore,
    };

    // Add improvement data to the optimized score
    optimizedATSScore.improvement = improvements;

    // Send initial response without waiting for PDF
    res.json({
      originalText: resumeText,
      optimizedText: finalOptimizedText,
      skillGaps,
      pdfReady: false,
      template: template,
      transparencyInsights: transparencyInsights,
      atsScores: {
        original: originalATSScore,
        optimized: optimizedATSScore,
        improvements,
      },
    });

    // Start PDF generation in background
    modifyPDFWithFallback(
      req.file.buffer,
      finalOptimizedText,
      formattingInfo,
      template,
    )
      .then((optimizedPdfBuffer) => {
        req.app.locals.latestPdf = {
          buffer: optimizedPdfBuffer,
          originalBuffer: req.file.buffer,
          timestamp: Date.now(),
          template: template,
          customText: finalOptimizedText,
          hasCustomText: true,
          formattingInfo: formattingInfo,
        };
      })
      .catch((pdfError) => {
        console.error("Failed to create optimized PDF:", pdfError);
        // Use original PDF as fallback
        req.app.locals.latestPdf = {
          buffer: req.file.buffer,
          originalBuffer: req.file.buffer,
          timestamp: Date.now(),
          template: "original",
          customText: finalOptimizedText,
          hasCustomText: true,
          formattingInfo: formattingInfo,
        };
      });
  } catch (error) {
    console.error("Error processing resume:", error);
    res.status(500).json({
      error: error.message,
      details: {
        step: error.step || "unknown",
        originalError: error.originalError
          ? error.originalError.message
          : error.message,
      },
    });
  }
});

// Get available templates
router.get("/resume-templates", (req, res) => {
  const validTemplates = ['classic', 'minimalist'];
  res.json({
    templates: validTemplates.map((template) => ({
      id: template,
      name: template.charAt(0).toUpperCase() + template.slice(1),
      description: getTemplateDescription(template),
    })),
  });
});

// Update resume with custom text
router.post("/update-resume", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file || !req.body.jobDescription) {
      return res
        .status(400)
        .json({ error: "Missing resume file or job description" });
    }

    // Get template choice and custom text (default to classic)
    const template = req.body.template || "classic";
    let customText = req.body.customText;

    if (!customText) {
      return res.status(400).json({ error: "Missing custom text for resume" });
    }

    console.log("Received custom text of length:", customText.length);

    // Ensure text format is preserved correctly
    customText = customText.replace(/\\n/g, "\n");

    const validTemplates = ['classic', 'minimalist'];
    
    if (!validTemplates.includes(template)) {
      return res.status(400).json({
        error: "Invalid template choice",
        availableTemplates: validTemplates,
      });
    }

    // Extract formatting info from original PDF
    const { text: originalText, formattingInfo } = await extractTextFromPDF(
      req.file.buffer,
      req.app.locals.analyzeDocumentStructureWithAdobe,
    );

    // Log the content for debugging
    console.log("Custom text length:", customText.length);
    console.log("Custom text first 100 chars:", customText.substring(0, 100));
    console.log(
      "Custom text last 100 chars:",
      customText.substring(customText.length - 100),
    );
    console.log("Number of lines:", customText.split("\n").length);

    try {
      // Calculate ATS score for the custom text
      const customATSScore = await calculateATSScore(
        customText,
        req.body.jobDescription,
      );

      // Store the custom text
      req.app.locals.latestCustomText = customText;

      // Try a direct approach to PDF generation
      try {
        // Call modifyPDFWithFallback directly with the custom text
        const optimizedPdfBuffer = await modifyPDFWithFallback(
          req.file.buffer,
          customText,
          formattingInfo,
          template,
        );

        if (!optimizedPdfBuffer || optimizedPdfBuffer.length < 1000) {
          console.warn(
            "Warning: PDF buffer is suspiciously small:",
            optimizedPdfBuffer?.length,
          );
        }

        // Store the PDF for download
        req.app.locals.latestPdf = {
          buffer: optimizedPdfBuffer,
          originalBuffer: req.file.buffer,
          timestamp: Date.now(),
          template: template,
          customText: customText,
          formattingInfo: formattingInfo,
        };

        console.log(
          "Custom resume PDF generated successfully, size:",
          optimizedPdfBuffer.length,
        );

        res.json({
          success: true,
          pdfReady: true,
          atsScore: customATSScore,
          pdfSize: optimizedPdfBuffer.length,
        });
      } catch (pdfError) {
        console.error("Direct PDF generation failed:", pdfError);

        // Try the fallback approach
        const fallbackBuffer = await modifyPDFWithFallback(
          req.file.buffer,
          customText,
          formattingInfo,
          template,
        );

        req.app.locals.latestPdf = {
          buffer: fallbackBuffer,
          originalBuffer: req.file.buffer,
          timestamp: Date.now(),
          template: template,
          customText: customText,
          formattingInfo: formattingInfo,
        };

        res.json({
          success: true,
          pdfReady: true,
          atsScore: customATSScore,
          fallback: true,
        });
      }
    } catch (error) {
      console.error("Error processing custom resume:", error);

      // Still save the custom text even if PDF generation failed
      req.app.locals.latestCustomText = customText;

      // Use original PDF as fallback
      req.app.locals.latestPdf = {
        buffer: req.file.buffer,
        originalBuffer: req.file.buffer,
        timestamp: Date.now(),
        template: "original",
        customText: customText,
        error: error.message,
      };

      res.status(500).json({
        error:
          "Failed to process resume with edited text. PDF download will use the original format.",
        details: error.message,
        atsScore: { overallScore: 70, keywordScore: 70 }, // Fallback scores
      });
    }
  } catch (error) {
    console.error("Error in update-resume endpoint:", error);
    res.status(500).json({
      error: "Server error processing your resume",
      details: error.message,
    });
  }
});

// Download PDF
router.get("/download-pdf", (req, res) => {
  try {
    const pdfData = req.app.locals.latestPdf;
    if (!pdfData || !pdfData.buffer) {
      return res.status(404).json({ error: "No PDF available for download" });
    }

    if (Date.now() - pdfData.timestamp > 5 * 60 * 1000) {
      delete req.app.locals.latestPdf;
      return res
        .status(404)
        .json({ error: "PDF has expired. Please generate a new one." });
    }

    // If we have custom text but the PDF doesn't have it, try to regenerate
    if (
      pdfData.customText &&
      !pdfData.hasCustomText &&
      pdfData.originalBuffer
    ) {
      console.log("Regenerating PDF with custom text before download");

      // Use the stored buffer and template to regenerate with custom text
      try {
        modifyPDFWithFallback(
          pdfData.originalBuffer,
          pdfData.customText,
          pdfData.formattingInfo || {},
          pdfData.template,
        )
          .then((newBuffer) => {
            if (!newBuffer || newBuffer.length === 0) {
              throw new Error("Generated PDF is empty");
            }

            // Update the PDF data with the new buffer
            req.app.locals.latestPdf = {
              ...pdfData,
              buffer: newBuffer,
              hasCustomText: true,
              timestamp: Date.now(),
            };

            // Send the updated PDF
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
              "Content-Disposition",
              'attachment; filename="optimized-resume.pdf"',
            );
            res.send(newBuffer);
          })
          .catch((error) => {
            console.error("Error regenerating PDF with custom text:", error);
            // Fall back to sending the original PDF
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
              "Content-Disposition",
              'attachment; filename="optimized-resume.pdf"',
            );
            res.send(pdfData.buffer);
          });
      } catch (error) {
        console.error("Exception during PDF regeneration:", error);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="optimized-resume.pdf"',
        );
        res.send(pdfData.buffer);
      }
    } else {
      // Send the existing PDF
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="optimized-resume.pdf"',
      );
      res.send(pdfData.buffer);
    }
  } catch (error) {
    console.error("Error downloading PDF:", error);
    res.status(500).json({ error: "Failed to download PDF" });
  }
});

// Generate PDF directly
router.post(
  "/generate-direct-pdf",
  upload.single("resume"),
  async (req, res) => {
    try {
      console.log("Received generate-direct-pdf request");

      if (!req.file) {
        return res.status(400).json({ error: "Missing resume file" });
      }

      const customText = req.body.customText;
      if (!customText) {
        return res.status(400).json({ error: "Missing custom text" });
      }

      const template = req.body.template || "classic";
      const jobDescription = req.body.jobDescription || "";

      console.log(
        `Processing direct PDF with ${customText.length} characters of text`,
      );

      // Basic formatting info if we don't have detailed info
      const { text: originalText, formattingInfo } = await extractTextFromPDF(
        req.file.buffer,
        req.app.locals.analyzeDocumentStructureWithAdobe,
      );

      // Build enhanced formatting info by analyzing edited text
      const enhancedFormatting = {
        ...formattingInfo,
        // Count bullets in the edited text
        bulletCount:
          (customText.match(/•/g) || []).length +
          (customText.match(/^-\s/gm) || []).length,
        // Count sections - look for double line breaks or all caps headers
        sectionCount: customText.split(/\n\s*\n+/).length,
        // Detect if edited text has ALL CAPS headers
        hasAllCapsHeaders: customText.split("\n").some((line) => {
          const trimmed = line.trim();
          return trimmed === trimmed.toUpperCase() && trimmed.length > 3;
        }),
        // Identify paragraphs and lines
        lineCount: customText.split("\n").length,
        paragraphCount: customText.split(/\n\s*\n+/).length,
      };

      console.log("Enhanced formatting info:", {
        bulletCount: enhancedFormatting.bulletCount,
        sectionCount: enhancedFormatting.sectionCount,
        hasAllCapsHeaders: enhancedFormatting.hasAllCapsHeaders,
        lineCount: enhancedFormatting.lineCount,
      });

      try {
        // Calculate ATS scores
        let atsScores = null;
        const originalAtsScore = req.app.locals.originalAtsScore;

        if (jobDescription) {
          // Calculate ATS score for the edited text
          console.log("Calculating ATS score for edited resume");
          const editedAtsScore = await calculateATSScore(
            customText,
            jobDescription,
          );

          // Include both scores and calculate improvements
          if (originalAtsScore) {
            const improvements = {
              overall:
                editedAtsScore.overallScore - originalAtsScore.overallScore,
              keywords:
                editedAtsScore.keywordScore - originalAtsScore.keywordScore,
              formatting:
                editedAtsScore.formattingScore -
                originalAtsScore.formattingScore,
              content:
                editedAtsScore.contentScore - originalAtsScore.contentScore,
            };

            atsScores = {
              original: originalAtsScore,
              optimized: editedAtsScore,
              improvements,
            };
          } else {
            // If we don't have an original score, just include the new score
            atsScores = {
              optimized: editedAtsScore,
            };
          }
        }

        // Now generate the PDF with the enhanced formatting
        console.log("Generating PDF with edited text");
        const pdfBuffer = await modifyPDFWithFallback(
          req.file.buffer,
          customText,
          enhancedFormatting,
          template,
        );

        if (!pdfBuffer || pdfBuffer.length < 1000) {
          throw new Error(
            `Generated PDF appears to be invalid (size: ${pdfBuffer?.length} bytes)`,
          );
        }

        // Store the result for download
        req.app.locals.latestPdf = {
          buffer: pdfBuffer,
          originalBuffer: req.file.buffer,
          timestamp: Date.now(),
          template: template,
          customText: customText,
          hasCustomText: true,
          formattingInfo: enhancedFormatting,
        };

        // Return success response with PDF info and ATS score
        res.json({
          success: true,
          message: "PDF generated successfully",
          pdfSize: pdfBuffer.length,
          atsScores: atsScores,
        });
      } catch (pdfError) {
        console.error("Error generating direct PDF:", pdfError);
        res.status(500).json({
          error: "Failed to generate PDF",
          details: pdfError.message,
        });
      }
    } catch (error) {
      console.error("Server error in generate-direct-pdf endpoint:", error);
      res.status(500).json({
        error: "Server error processing your request",
        details: error.message,
      });
    }
  },
);

module.exports = router;
