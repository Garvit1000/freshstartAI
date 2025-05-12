const express = require('express');
const cors = require('cors');
const multer = require('multer');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const setupFonts = require('./setup-fonts.cjs');

// Import utility modules
const { initializeAdobeSDK } = require('./utils/pdfUtils.cjs');
const { initializeGeminiAI } = require('./utils/aiUtils.cjs');
const { initializeLinkedInAI } = require('./utils/linkedinUtils.cjs');
const resumeRoutes = require('./routes/resumeRoutes.cjs');
const linkedinRoutes = require('./routes/linkedinRoutes.cjs');

// Load environment variables first
dotenv.config();
dotenv.config({ path: path.join(__dirname, '.env') });

// Set Adobe environment variables
process.env.PDF_SERVICES_CLIENT_ID = process.env.ADOBE_CLIENT_ID;
process.env.PDF_SERVICES_CLIENT_SECRET = process.env.ADOBE_CLIENT_SECRET;

const app = express();
const port = process.env.PORT || 3000;

// Configure middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(express.json());

// Initialize Adobe SDK
try {
  const executionContext = initializeAdobeSDK();
  app.locals.executionContext = executionContext;
} catch (error) {
  console.error('Error during Adobe SDK initialization:', error);
  console.log('Continuing without Adobe PDF Services functionality');
}

// Initialize Gemini AI
const geminiApiKey = process.env.VITE_GEMINI_API_KEY;
if (!geminiApiKey) {
  console.error('VITE_GEMINI_API_KEY is not set in environment variables');
  process.exit(1);
}

// Initialize services and start server
async function initializeServer() {
  try {
    initializeAdobeSDK();
    initializeGeminiAI(geminiApiKey);
    initializeLinkedInAI(geminiApiKey);
    await setupFonts();

    // Use routes
    app.use('/api', resumeRoutes);
    app.use('/api/linkedin', linkedinRoutes);

    // Start server
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Error during initialization:', error);
    process.exit(1);
  }
}

initializeServer();

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

