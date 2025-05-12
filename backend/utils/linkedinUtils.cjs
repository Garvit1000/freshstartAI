const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Gemini model
let model;

function initializeLinkedInAI(apiKey) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    console.log("LinkedIn AI utilities initialized successfully");
  } catch (error) {
    console.error("Error initializing LinkedIn AI:", error);
    throw error;
  }
}

async function optimizeLinkedInHeadline(currentHeadline) {
  try {
    if (!model) {
      throw new Error("LinkedIn AI model not initialized");
    }

    const prompt = `As a professional LinkedIn profile optimizer, enhance the following headline to make it highly impactful, keyword-rich, and attention-grabbing while maintaining authenticity and professionalism. Optimize for LinkedIn search visibility, ATS compatibility, and recruiter appeal, especially for freshers in India. Reframe the existing content without adding unstated skills or achievements unless they are directly implied or transferable from the headline itself.

    Current Headline: "${currentHeadline}"

    Focus on:
    1. Strong Professional Branding:
       - Clearly define the user's role or expertise based on the headline (e.g., "Front-End Developer," "SaaS Innovator").
       - Align with industry standards for the user's role (e.g., use "Front-End Developer" instead of "Code Ninja").
    2. Prioritized Industry Keywords:
       - Identify 2-3 high-impact keywords directly from the headline that align with the user's experience (e.g., "Front-End Development," "SaaS").
       - Reframe the headline to naturally integrate these keywords (e.g., if the headline mentions "Ex-front-end developer," include "Front-End Development | Web Development").
       - Infer skills only if directly implied (e.g., "Ex-front-end developer" implies "Web Development," possibly "React" or "JavaScript," but do not add "Python" unless mentioned).
       - Avoid overused buzzwords like "guru," "ninja," or "rockstar" to maintain professionalism.
    3. Clear Value Proposition:
       - Highlight a specific contribution or achievement from the headline (e.g., "Finalist @NFSU Hackathon," "Building Freshstart AI").
       - For freshers, emphasize potential or achievements like hackathon results (e.g., "Hackathon Finalist | Building SaaS Solutions").
    4. Professional Impact and Achievements:
       - Reframe existing achievements for impact (e.g., "Finalists @NFSU Hackathon" can become "NFSU Hackathon Finalist | Innovating SaaS Solutions").
       - Do NOT add new achievements not stated in the headline (e.g., do not add "Hackathon Winner" if only "Finalist" is mentioned).
    5. Confident Yet Authentic Tone:
       - Use confident language that reflects the user’s true experience (e.g., "SaaS Innovator" if they’re building a SaaS product).
       - For freshers, use high-potential language (e.g., "Emerging Front-End Developer | Hackathon Finalist").
    6. LinkedIn and ATS Compatibility:
       - Ensure the headline is ATS-friendly by using standard job titles and keywords (e.g., "Front-End Developer" instead of "Tech Enthusiast").
       - Keep the headline under 220 characters (including spaces) to fit LinkedIn’s limit.
       - Use separators like "|" or "–" to improve readability and keyword scanning (e.g., "Front-End Developer | SaaS Innovator | Hackathon Finalist").
    7. Tailored for Recruiter Appeal (India Context):
       - Align with recruiter expectations in India, where freshers are often evaluated on technical skills and achievements like hackathons (e.g., "Front-End Developer | NFSU Hackathon Finalist").
       - Highlight in-demand skills for the Indian job market (e.g., "Web Development," "SaaS Development") if directly implied from the headline.

    Provide only the optimized headline text, no explanations or additional text.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Error optimizing LinkedIn headline:", error);
    throw new Error("Failed to optimize LinkedIn headline");
  }
}

async function optimizeLinkedInAbout(currentAbout) {
  try {
    if (!model) {
      throw new Error("LinkedIn AI model not initialized");
    }

    const prompt = `As a professional LinkedIn profile optimizer, improve the following "About" section to make it more compelling, professional, and effective.

Current About Section:
"${currentAbout}"

Your task is to rewrite this about section to:
1. Start with a powerful hook that captures attention
2. Highlight key achievements and expertise
3. Incorporate relevant industry keywords naturally
4. Tell a cohesive professional story
5. Maintain a professional yet personable tone
6. Use proper formatting with clear paragraphs
7. Include quantifiable achievements where possible
8. End with a strong call-to-action

Provide only the optimized about section text, no explanations or additional text.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Error optimizing LinkedIn about section:", error);
    throw new Error("Failed to optimize LinkedIn about section");
  }
}

module.exports = {
  initializeLinkedInAI,
  optimizeLinkedInHeadline,
  optimizeLinkedInAbout,
};
