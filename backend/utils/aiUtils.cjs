const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini AI with the provided API key
let model = null;

function initializeGeminiAI(apiKey) {
  if (!apiKey) {
    console.error("Gemini API key is not set");
    throw new Error("Gemini API key is required");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  console.log("Gemini AI initialized successfully");
  return model;
}

// Extract text from PDF with improved Adobe integration
async function extractTextFromPDF(
  pdfBuffer,
  analyzeDocumentStructureWithAdobe,
) {
  try {
    // Attempt to get Adobe structural analysis
    let adobeAnalysis = null;
    try {
      adobeAnalysis = await analyzeDocumentStructureWithAdobe(pdfBuffer);
      if (adobeAnalysis) {
        console.log("Successfully analyzed document structure with Adobe");
      }
    } catch (adobeError) {
      console.error(
        "Adobe analysis failed, continuing with Gemini only:",
        adobeError,
      );
    }

    // Convert PDF buffer to base64
    const base64PDF = pdfBuffer.toString("base64");

    // Create the vision model
    const visionModel = model.geminiPro || model;

    // Create the prompt with the PDF content
const prompt = `
Developer: Role and Objective:
Extract and structure the full text content from a PDF resume, carefully preserving the document's original layout, section hierarchy, and formatting in a Markdown output.
Instructions:
- Begin with a concise checklist (3-7 bullets) of what you will do; keep items conceptual, not implementation-level.
- Extract all textual elements, maintaining:
  1. Section headers and their hierarchical order
  2. Bullet points and nested lists
  3. The exact formatting, including spacing and indentation
  4. All contact information
  5. Work experience entries with corresponding dates
  6. Education entries with corresponding dates
  7. Skills and certifications
  8. Professional summary or profile section
Sub-categories:
- Preserve:
  - Indentation of every line
  - Styles and depth of bullet points
  - Formatting of section headers (e.g., ALL CAPS, bold)
  - Spacing precision between sections
  - Layout of contact information
  - Original date formatting in relevant sections
Context:
- Resume PDF is the source; your output must mimic the input's structure and formatting as closely as possible using Markdown.
- Some sections may be missing; these should be explicitly noted.
Reasoning Steps:
- Analyze the input PDF step by step, identifying and preserving hierarchical and stylistic cues throughout extraction.
Planning and Verification:
- Decompose PDF into sections and components (headers, lists, etc.).
- Pay close attention to layout, indentation, spacing, and any unique formatting.
- Double-check that extracted text hierarchy, styles, indentation, and spacing match the original before generating Markdown output.
- Confirm all required sections are present or appropriately commented if missing.
- After the Markdown output is generated, validate that all required elements and structure are correctly preserved; if discrepancies are found, self-correct and repeat validation.
Output Format:
- Return results as a Markdown-formatted document.
- Use Markdown headings (#, ##, ###, etc.) to mirror the original section hierarchy.
- Apply Markdown code blocks (\`\`\`) or &nbsp; (HTML non-breaking space) to preserve precise spacing/indentation where needed.
- Utilize **bold** for bold text and ALL CAPS where appropriate.
- For bullet points and nested lists, use - markers and correct nests as per original.
- Present contact information prominently at the top, bolded and spaced as per original layout.
- Dates should match the original format; if there is any need for standardization, use MMM YYYY (e.g., Jan 2021), otherwise retain original.
- For any missing section, include a Markdown comment: <!-- Section missing -->.
Verbosity:
- Provide concise, highly readable output.
- Use high verbosity with clear, explicit Markdown constructs for sections and lists.
Stop Conditions:
- Extraction is complete and formatted when all sections and elements are preserved or commented if missing, and Markdown accurately reflects input structure.
Additional Note:
- Ensure &nbsp; is only used to recreate indentation or spacing as seen in the original PDF—avoid introducing excessive or spurious use that does not map to the actual document layout.
`;
    // Create the image part
    const imagePart = {
      inlineData: {
        data: base64PDF,
        mimeType: "application/pdf",
      },
    };

    // Generate content with the PDF
    const result = await visionModel.generateContent([prompt, imagePart]);
    const response = await result.response;
    const extractedText = response.text().trim();

    if (!extractedText || extractedText.length === 0) {
      throw new Error("No text content found in PDF");
    }

    // Analyze the document structure in detail
    const lines = extractedText.split("\n");
    const sections = extractedText.split("\n\n");

    // Detect the resume structure
    const documentStructure = {
      // Add Adobe analysis if available
      adobeAnalysis: adobeAnalysis,

      // Basic information
      sections: sections.map((section) => {
        const sectionLines = section.split("\n");
        return {
          content: section,
          isHeader:
            sectionLines[0].trim() === sectionLines[0].trim().toUpperCase() &&
            sectionLines[0].trim().length > 3,
          hasBullets: section.includes("•") || section.includes("-"),
          indentLevel: sectionLines[0].match(/^\s*/)[0].length,
          lineCount: sectionLines.length,
        };
      }),

      // Detailed analysis
      hasContactInfo:
        extractedText.includes("@") ||
        extractedText.includes("Phone") ||
        extractedText.includes("LinkedIn"),

      hasExperience:
        extractedText.includes("Experience") ||
        extractedText.includes("Work History") ||
        extractedText.includes("EXPERIENCE") ||
        extractedText.includes("WORK HISTORY"),

      hasEducation:
        extractedText.includes("Education") ||
        extractedText.includes("Academic") ||
        extractedText.includes("EDUCATION") ||
        extractedText.includes("ACADEMIC"),

      hasSkills:
        extractedText.includes("Skills") ||
        extractedText.includes("Technical Skills") ||
        extractedText.includes("SKILLS") ||
        extractedText.includes("TECHNICAL SKILLS"),

      // Layout analysis
      sectionCount: sections.length,
      lineCount: lines.length,
      averageSectionLength:
        sections.reduce(
          (total, section) => total + section.split("\n").length,
          0,
        ) / sections.length,
      bulletCount:
        extractedText.split("•").length -
        1 +
        extractedText.split("-").length -
        1,
      hasAllCapsHeaders: sections.some((section) => {
        const firstLine = section.split("\n")[0].trim();
        return firstLine === firstLine.toUpperCase() && firstLine.length > 3;
      }),
      dateFormat: extractedText.includes("20")
        ? extractedText.includes("/")
          ? "MM/YYYY"
          : extractedText.includes("-")
            ? "MM-YYYY"
            : "MMMM YYYY"
        : "Unknown",

      // Layout style
      style: {
        isDense: sections.length > 6,
        isMinimalist: sections.length < 4,
        hasLongBullets:
          extractedText.includes("• ") &&
          extractedText.split("• ").some((bullet) => bullet.length > 100),
      },
    };

    return {
      text: extractedText,
      formattingInfo: documentStructure,
    };
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from PDF");
  }
}

// Optimize resume using Gemini
async function optimizeResume(
  resumeText,
  jobDescription,
  formattingInfo,
  optimizationGuidance = "",
  transparencyMode = false,
) {
  try {
    // Clean up text markers from input while preserving whitespace after newlines
    resumeText = resumeText
      .replace(/```text\n?/g, "")
      .replace(/```\n?/g, "")
      .replace(/^\s+|\s+$/g, ""); // Trim start/end but preserve internal whitespace

    // Analyze the resume structure to provide format preservation guidance
    const structureGuide = `
      Format Preservation Guide:
      - Maintain the exact same number of sections (${formattingInfo.sectionCount})
      - Preserve all section headers exactly as they appear
      - Keep the same bullet point structure (${formattingInfo.bulletCount} bullets)
      - Maintain indentation levels for nested content
      - Keep date formats consistent (${formattingInfo.dateFormat})
      - Preserve contact information layout
      - Maintain the same number of lines per section where possible
    `;

    // Extract contact information from the resume
    const contactInfoMatch = resumeText.match(/^(.*?)\n\n/s);
    const contactInfo = contactInfoMatch ? contactInfoMatch[1] : '';
    console.log("Extracted contact info:", contactInfo);

    const prompt = `
      As an expert ATS-optimized resume writer for freshers, optimize the following resume to STRICTLY FIT ON ONE PAGE with NO EXCEPTIONS while increasing the ATS score (target: 80% or higher). The page limit is ABSOLUTELY NON-NEGOTIABLE. Focus on reframing the existing content to improve ATS compatibility without rewriting the entire resume.

      IMPORTANT: The following contact information block MUST be preserved EXACTLY as is at the top of the resume:
      ${contactInfo}

      RESUME:
      ${resumeText}

      JOB DESCRIPTION:
      ${jobDescription}

      ${structureGuide}

      CONTACT INFORMATION PRESERVATION:
      - The contact information block shown above MUST appear exactly as provided at the top of the optimized resume
      - Do not modify, reformat, or rearrange any contact details
      - Ensure email, phone, and other contact details remain in their original format

      ${
        optimizationGuidance
          ? `IMPORTANT ATS ANALYSIS AND GUIDANCE:
      ${optimizationGuidance}

      Use this analysis to optimize the resume while strictly adhering to the one-page limit.
      `
          : ""
      }

      ABSOLUTE ONE-PAGE LIMIT:
      The resume MUST fit on ONE SINGLE PAGE. This is your PRIMARY directive. No exceptions.

      STRICT CONSTRAINTS TO ENSURE ONE PAGE:
      1. TARGET 550-600 WORDS TOTAL (do not exceed 650 words) to maximize space usage.
      2. TARGET 28-30 LINES of content (excluding blank lines) to fill the page effectively.
      3. NO FABRICATION: Never add experiences or skills not implied or transferable from the original resume.
      4. PRESERVE HEADER AND CONTACT INFO: Keep the original header and ALL contact information exactly as provided.
      5. CONTACT PRESERVATION: The contact section at the top MUST remain unchanged and complete.

      SPACE-EFFICIENT REQUIREMENTS:
      - Keep header exactly as in original resume.
      - DO NOT use asterisks (*) around keywords.
      - Include essential sections from original resume: Header, Education, Professional Experience (or Internships), Projects, Skills.
      - Focus on most recent/relevant experiences.
      - Keep bullet points to 12-18 words maximum for concise, impactful statements.
      - Use condensed line spacing to maximize content within 1 page.

      ATS OPTIMIZATION TO ACHIEVE 80%+ SCORE:
      - Keyword Matching (50% of score): Integrate prioritized keywords naturally to maximize score.
      - Formatting (30% of score): Use ATS-friendly formatting (standard headers, single-column, no tables/images).
      - Content Quality (20% of score): Include quantifiable achievements in PAR format (Problem + Action + Result).

      OPTIMIZATION STRATEGY (REFRAME, DON’T REWRITE):
      1. SELECTIVE KEYWORD INTEGRATION:
         - Identify ALL keywords from the job description (e.g., "Python", "AWS", "project management").
         - Prioritize the top 5-7 most critical keywords based on frequency and importance (e.g., "Python" over "communication").
         - Reframe existing bullet points to naturally integrate these keywords, ensuring they align with the candidate’s experience (e.g., if the job requires "project management" and the candidate led a team project, rephrase to "Led project team, applying project management skills to deliver on time").
         - Avoid overstuffing; ensure keywords fit within the existing content naturally.

      2. SKILL ADDITION (ONLY IF IMPLIED/TRANSFERABLE):
         - Identify skills required by the job description (e.g., "JIRA", "AWS").
         - Add these skills to the Skills section ONLY if they are implied or transferable from the candidate’s experience (e.g., if the candidate used a similar tool like Trello, add "JIRA (transferable from Trello experience)"; if they worked on cloud projects, add "AWS" if not explicitly listed).
         - Do NOT fabricate skills; if a skill cannot be implied or transferred, do not add it.

      3. REFRAME BULLET POINTS FOR ATS:
         - Use 3-4 bullet points maximum per role/experience (e.g., internships, projects) to provide sufficient detail.
         - Each bullet must be concise (12-18 words) and include a prioritized keyword and quantifiable result where possible.
         - Focus on the most impressive, job-relevant achievements to improve content quality score (e.g., "Developed Python tool on AWS, reducing workload by 40%").
         - Use strong action verbs (e.g., "Managed," "Developed," "Implemented") and the PAR format (Problem + Action + Result) to enhance content quality (e.g., "Resolved performance issues; developed Python solution; improved speed 30%").
         - Mirror the job description explicitly to enhance keyword matching (e.g., if the job requires "1+ years of Python experience," and the candidate has 3 months, reframe to "Applied Python experience in projects, building tools over 3 months").
         - Handle experience gaps honestly: Do not exaggerate duration; emphasize impact with keywords (e.g., "Led Python project over 3 months; reduced workload 40%").

      4. ESSENTIAL SECTIONS ONLY:
         - Header: Preserve as is.
         - Summary: Optional, 1-2 lines maximum (e.g., "Recent Computer Science graduate skilled in Python, AWS") if space permits.
         - Professional Experience (or Internships): Include most relevant roles (1-2 roles max), 3-4 bullet points each, reframing existing content.
         - Projects: Include 1-2 relevant projects, 2-3 bullet points each, reframing for job-relevant outcomes.
         - Education: Keep minimal (degree, institution, year, 1-2 lines max, e.g., "B.S. Computer Science, XYZ University, 2023").
         - Skills: Group by category, one line per category (e.g., "Programming: Python, Java; Cloud: AWS").
         - Optional sections (e.g., Certifications): Include only if critical and space permits.

      5. SPACE MAXIMIZATION WITHIN LIMITS:
         - Target 28-30 lines of content to fill the page effectively without exceeding 1 page.
         - Use standard abbreviations where possible (e.g., "B.S." for Bachelor of Science).
         - Remove articles (e.g., "the", "a") and unnecessary words where clarity is not impacted.
         - Use semicolons to group related items (e.g., "Skills: Python; Java; AWS").
         - Consider narrower margins (0.5-0.7 inches) to fit more content if needed.

      6. CONTENT PRIORITIZATION AND TRIMMING:
         - Prioritize the most recent and relevant experiences (e.g., recent internships, projects) to fill space effectively.
         - Include quantifiable achievements in PAR format to enhance content quality (e.g., "Built Python tool; cut workload 40%").
         - If content exceeds 30 lines or 650 words, trim by:
           - Removing older/less relevant experiences or projects completely.
           - Cutting redundant or less impactful bullet points (e.g., generic tasks like "attended meetings").
           - Shortening bullet points while retaining impact (e.g., "Debugged code; ensured 100% functionality").
         - Eliminate "References available upon request" and similar fillers.
         - Remove full street address from contact information (e.g., keep only city, state).

      FINAL CHECK:
      Before returning, VERIFY the resume fits on one page:
      - Count lines: Must be 28-30 lines (excluding blank lines) to maximize space.
      - Count words: Must be 550-600 words (do not exceed 650).
      - Ensure ATS score potential: Include 5-7 prioritized keywords, ATS-friendly formatting, and quantifiable achievements.
      - Confirm no fabrication: All content must be based on the original resume or implied/transferable skills.

      Return ONLY the optimized resume text with preserved formatting. The resume MUST fit on one page.
    `;

    console.log("Sending optimization prompt to Gemini");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let optimizedText = response.text().trim();

    // Clean up any remaining text markers
    let finalOptimizedText = optimizedText
      .replace(/```text\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // Make sure section headers are in the right format (all caps if original was)
    finalOptimizedText = finalOptimizedText
      .split("\n")
      .map((line, index) => {
        if (
          formattingInfo.hasAllCapsHeaders &&
          index > 0 &&
          line.trim().length > 3 &&
          !line.trim().startsWith("•") &&
          !line.trim().startsWith("-") &&
          !line.includes("@") &&
          !line.includes(":")
        ) {
          const originalLines = resumeText.split("\n");
          for (const origLine of originalLines) {
            if (
              origLine.trim().toUpperCase() === origLine.trim() &&
              origLine.trim().length > 3 &&
              line.trim().toLowerCase() === origLine.trim().toLowerCase()
            ) {
              return line.trim().toUpperCase();
            }
          }
        }
        return line;
      })
      .join("\n");

    // Remove any asterisks that might be around keywords
    finalOptimizedText = finalOptimizedText.replace(/\*([^*]+)\*/g, "$1");

    // Apply a hard limit to enforce one page
    finalOptimizedText = enforceOnePageLimit(finalOptimizedText);

    // Always return an object with both properties for consistent structure
    let transparencyInsights = null;
    if (transparencyMode) {
      transparencyInsights = await generateTransparencyInsights(resumeText, finalOptimizedText, jobDescription);
    }

    console.log("Resume optimization complete");
    console.log("Optimized text length:", finalOptimizedText.length);
    return { 
      optimizedText: finalOptimizedText,
      transparencyInsights 
    };
  } catch (error) {
    console.error("Error optimizing resume:", error);
    throw new Error("Failed to optimize resume: " + error.message);
  }
}

// Function to enforce a strict one-page limit by truncating if necessary
/**
 * Generates transparency insights for the resume optimization
 * @param {string} originalResume - The original resume text
 * @param {string} optimizedResume - The AI optimized resume text
 * @param {string} jobDescription - The job description used for optimization
 * @returns {Promise<Array>} - Array of transparency insights
 */
async function generateTransparencyInsights(originalResume, optimizedResume, jobDescription) {
  try {
    console.log("Generating transparency insights");
    
    const prompt = `
      As an AI resume analyzer, identify and explain the key changes made between the original and optimized resume in a concise, bullet-point format. Focus on:

      1. Keywords added from job description
      2. Format improvements for ATS compatibility
      3. Content enhancements (quantifications, action verbs, etc.)
      4. Sections reorganized or prioritized
      5. Space optimization techniques

      ORIGINAL RESUME:
      ${originalResume}

      OPTIMIZED RESUME:
      ${optimizedResume}

      JOB DESCRIPTION:
      ${jobDescription}

      Provide your analysis as JSON in this exact format:
      [
        {
          "category": "Keywords",
          "description": "Added job-specific keywords like X, Y, Z",
          "rationale": "These keywords match the job requirements and boost ATS score"
        },
        {
          "category": "Formatting",
          "description": "Standardized section headers",
          "rationale": "Improves ATS readability and parsing accuracy"
        }
      ]

      Include 5-7 key insights total. Be specific about actual changes made. Focus on the most impactful edits.
    `;

    console.log("Sending transparency insights prompt to Gemini");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let insightsText = response.text().trim();

    // Parse the JSON response
    try {
      // Remove any markdown code block formatting if present
      insightsText = insightsText.replace(/```json\s?/g, "").replace(/```\s?/g, "");
      const insights = JSON.parse(insightsText);
      return insights;
    } catch (jsonError) {
      console.error("Error parsing JSON insights:", jsonError);
      // Fallback to returning a basic array if JSON parsing fails
      return [
        {
          category: "AI Analysis",
          description: "Resume was optimized for ATS compatibility",
          rationale: "Improvements increase chances of passing automated screening"
        },
        {
          category: "Keywords",
          description: "Added relevant keywords from job description",
          rationale: "Helps resume match job requirements"
        }
      ];
    }
  } catch (error) {
    console.error("Error generating transparency insights:", error);
    return [
      {
        category: "AI Analysis",
        description: "Resume was optimized for ATS compatibility",
        rationale: "Improvements increase chances of passing automated screening"
      }
    ];
  }
}

function enforceOnePageLimit(text) {
  // Constants for a standard one-page resume
  const MAX_LINES = 45; // Typical max lines for one page with 11pt font and 1" margins
  const MAX_WORDS = 800; // Conservative word limit for one page

  let lines = text.split("\n");
  let wordCount = text.split(/\s+/).length;

  console.log(`Original resume: ${lines.length} lines, ${wordCount} words`);

  // If already within limits, return as is
  if (lines.length <= MAX_LINES && wordCount <= MAX_WORDS) {
    return text;
  }

  // First, try to identify and preserve critical sections
  const headerLines = lines.slice(0, 5); // Assume first 5 lines contain header/contact info
  let remainingLines = lines.slice(5);

  // Identify section headers (capitalized lines or lines ending with ':')
  const sectionHeaderIndices = remainingLines
    .map((line, index) => {
      // Check if line is a section header (all caps or ends with colon)
      const isHeader =
        (line.toUpperCase() === line && line.trim().length > 3) ||
        line.trim().endsWith(":");
      return isHeader ? index : -1;
    })
    .filter((index) => index !== -1);

  // Create sections from header indices
  const sections = [];
  for (let i = 0; i < sectionHeaderIndices.length; i++) {
    const start = sectionHeaderIndices[i];
    const end =
      i < sectionHeaderIndices.length - 1
        ? sectionHeaderIndices[i + 1]
        : remainingLines.length;
    sections.push(remainingLines.slice(start, end));
  }

  // If we couldn't identify sections properly, use a simpler approach
  if (sections.length === 0) {
    // Preserve header and first 35 lines for a total of 40 lines
    return [
      ...headerLines,
      ...remainingLines.slice(0, MAX_LINES - headerLines.length),
    ].join("\n");
  }

  // Prioritize sections (keep header, keep critical sections, trim others)
  const criticalSectionKeywords = ["experience", "education", "skills"];
  const prioritizedSections = [];

  // Step 1: Keep the header
  prioritizedSections.push(...headerLines);

  // Step 2: Sort sections by priority
  const categorizedSections = {
    critical: [],
    important: [],
    optional: [],
  };

  sections.forEach((section) => {
    const headerText = section[0].toLowerCase();
    if (
      criticalSectionKeywords.some((keyword) => headerText.includes(keyword))
    ) {
      categorizedSections.critical.push(section);
    } else if (
      headerText.includes("summary") ||
      headerText.includes("objective")
    ) {
      categorizedSections.important.push(section);
    } else {
      categorizedSections.optional.push(section);
    }
  });

  // Step 3: Add critical sections with possible trimming
  categorizedSections.critical.forEach((section) => {
    if (section.length > 8) {
      // If section is too long, keep header and trim content
      prioritizedSections.push(section[0], ...section.slice(1, 8));
    } else {
      prioritizedSections.push(...section);
    }
  });

  // Step 4: Add important sections if space permits
  let remainingLinesCount = MAX_LINES - prioritizedSections.length;
  if (remainingLinesCount > 0) {
    categorizedSections.important.forEach((section) => {
      if (remainingLinesCount >= 3) {
        // Keep at least header and 2 lines
        const linesToKeep = Math.min(section.length, remainingLinesCount);
        prioritizedSections.push(...section.slice(0, linesToKeep));
        remainingLinesCount -= linesToKeep;
      }
    });
  }

  // Step 5: Add optional sections if space permits
  if (remainingLinesCount > 0) {
    categorizedSections.optional.forEach((section) => {
      if (remainingLinesCount >= 2) {
        // Keep at least header and 1 line
        const linesToKeep = Math.min(section.length, remainingLinesCount);
        prioritizedSections.push(...section.slice(0, linesToKeep));
        remainingLinesCount -= linesToKeep;
      }
    });
  }

  // Final check: ensure we're under line limit
  if (prioritizedSections.length > MAX_LINES) {
    prioritizedSections.splice(MAX_LINES);
  }

  // Check word count and trim if necessary
  const finalText = prioritizedSections.join("\n");
  const finalWordCount = finalText.split(/\s+/).length;

  if (finalWordCount <= MAX_WORDS) {
    console.log(
      `Final resume: ${prioritizedSections.length} lines, ${finalWordCount} words`,
    );
    return finalText;
  }

  // Need to reduce word count - simplify bullet points by truncating sentences
  const truncatedLines = prioritizedSections.map((line) => {
    // Don't truncate headers or contact info
    if (
      line.toUpperCase() === line ||
      line.includes("@") ||
      line.includes("phone")
    ) {
      return line;
    }

    // Truncate long lines to ~10-12 words
    const words = line.split(/\s+/);
    if (words.length > 12) {
      // Find a good place to truncate (end of a clause)
      for (let i = 9; i < Math.min(words.length, 12); i++) {
        if (words[i].endsWith(",") || words[i].endsWith(";")) {
          return words.slice(0, i + 1).join(" ");
        }
      }
      return words.slice(0, 10).join(" ") + (line.includes("•") ? "" : "...");
    }
    return line;
  });

  const finalTruncatedText = truncatedLines.join("\n");
  console.log(
    `Final trimmed resume: ${truncatedLines.length} lines, ~${finalTruncatedText.split(/\s+/).length} words`,
  );

  return finalTruncatedText;
}

// Analyze skill gaps
async function analyzeSkillGaps(resumeText, jobDescription) {
  try {
    const prompt = `
      Analyze the following resume and job description to identify skill gaps.
      Return a JSON object with exactly this format:
      {
        "missingSkills": [
          {
            "skill": "skill name",
            "description": "why it's needed",
            "learningResource": "https://example.com"
          }
        ],
        "matchingSkills": [
          {
            "skill": "skill name",
            "description": "how it matches"
          }
        ]
      }

      RESUME:
      ${resumeText}

      JOB DESCRIPTION:
      ${jobDescription}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Remove any markdown code block indicators
    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "");

    try {
      const parsed = JSON.parse(text);
      // Validate the structure
      if (
        !Array.isArray(parsed.missingSkills) ||
        !Array.isArray(parsed.matchingSkills)
      ) {
        throw new Error("Invalid JSON structure");
      }
      return parsed;
    } catch (parseError) {
      console.error("Error parsing JSON:", text);
      return {
        missingSkills: [],
        matchingSkills: [],
      };
    }
  } catch (error) {
    console.error("Error analyzing skill gaps:", error);
    return {
      missingSkills: [],
      matchingSkills: [],
    };
  }
}

// Add ATS score calculation function with more detailed analysis
async function calculateATSScore(resumeText, jobDescription) {
  try {
    const prompt = `
      Analyze the following resume and job description to calculate a detailed ATS score based on:
      1. Keyword Matching (50% of score)
         - Exact keyword matches
         - Related/synonymous term matches
         - Industry-specific terminology match
         - Technical skill match

      2. Formatting (30% of score)
         - Section headers clarity
         - Content organization
         - Consistent formatting
         - Bullet point usage
         - ATS-friendly structure

      3. Content Quality (20% of score)
         - Quantifiable achievements
         - Action verbs usage
         - Results orientation
         - Relevant experience clarity

      RESUME:
      ${resumeText}

      JOB DESCRIPTION:
      ${jobDescription}

      Your response should be in JSON format only with the following structure:
      {
        "overallScore": <0-100 numeric score representing overall ATS match>,
        "keywordScore": <0-100 numeric score representing keyword match>,
        "formattingScore": <0-100 numeric score representing formatting quality>,
        "contentScore": <0-100 numeric score representing content quality>,
        "keywordMatches": [<array of strings listing all matched keywords>],
        "missingKeywords": [<array of strings listing important keywords from job description missing in resume>],
        "improvementAreas": [
          {"area": "<area title>", "description": "<improvement suggestion>", "importance": <1-5 importance rating>}
        ],
        "strengths": [
          {"title": "<strength title>", "description": "<strength description>"}
        ],
        "formattingIssues": [<array of strings describing formatting issues>],
        "contentSuggestions": [<array of strings with content improvement suggestions>]
      }

      Provide an accurate analysis ensuring:
      1. The overall score realistically reflects resume-job match (avoid inflated scores)
      2. Include all major missing keywords that would impact ATS scanning
      3. Identify concrete, actionable improvement suggestions
      4. Note any formatting issues that would affect ATS parsing
      5. Prioritize improvements by importance (5=highest)

      Return ONLY valid JSON - no other text, explanation or formatting.
    `;

    console.log("Sending ATS calculation prompt to Gemini");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text().trim();

    // Try to parse the JSON response
    try {
      // Extract just the JSON part if there's any extra text
      const jsonMatch = content.match(/(\{[\s\S]*\})/);
      const jsonString = jsonMatch ? jsonMatch[0] : content;

      // Parse and validate the JSON
      const scoreData = JSON.parse(jsonString);

      // Ensure all required properties exist
      const requiredProps = [
        "overallScore",
        "keywordScore",
        "formattingScore",
        "contentScore",
      ];
      for (const prop of requiredProps) {
        if (typeof scoreData[prop] !== "number") {
          scoreData[prop] = 50; // Default to 50% if missing
        }
      }

      // Ensure arrays exist
      const arrayProps = [
        "keywordMatches",
        "missingKeywords",
        "improvementAreas",
        "strengths",
      ];
      for (const prop of arrayProps) {
        if (!Array.isArray(scoreData[prop])) {
          scoreData[prop] = [];
        }
      }

      console.log(`ATS Score calculation complete: ${scoreData.overallScore}%`);
      return scoreData;
    } catch (error) {
      console.error("Error parsing ATS score JSON:", error);
      // Return a basic score object if parsing fails
      return {
        overallScore: 50,
        keywordScore: 50,
        formattingScore: 50,
        contentScore: 50,
        keywordMatches: [],
        missingKeywords: [],
        improvementAreas: [
          {
            area: "Parser Error",
            description: "Could not parse detailed ATS data",
            importance: 5,
          },
        ],
        strengths: [],
      };
    }
  } catch (error) {
    console.error("Error calculating ATS score:", error);
    // Return a basic error score object
    return {
      overallScore: 45,
      keywordScore: 45,
      formattingScore: 45,
      contentScore: 45,
      keywordMatches: [],
      missingKeywords: [],
      improvementAreas: [
        {
          area: "Error in Calculation",
          description: error.message,
          importance: 5,
        },
      ],
      strengths: [],
    };
  }
}

module.exports = {
  initializeGeminiAI,
  extractTextFromPDF,
  optimizeResume,
  analyzeSkillGaps,
  calculateATSScore,
  enforceOnePageLimit,
};
