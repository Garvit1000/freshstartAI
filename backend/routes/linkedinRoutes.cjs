const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const {
  optimizeLinkedInHeadline,
  optimizeLinkedInAbout,
} = require("../utils/linkedinUtils.cjs");

// Set up rate limiter middleware
const linkedinOptimizationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute window
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    error: "Too many optimization requests, please try again later",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiter to all routes in this router
router.use(linkedinOptimizationLimiter);

// Optimize LinkedIn headline
router.post("/optimize-headline", async (req, res) => {
  try {
    const { currentHeadline } = req.body;

    if (!currentHeadline) {
      return res.status(400).json({ error: "Current headline is required" });
    }
    
    const optimizedHeadline = await optimizeLinkedInHeadline(currentHeadline);
    
    if (!optimizedHeadline) {
      throw new Error("No response received from optimization service");
    }
    
    res.json({
      optimizedHeadline,
      success: true,
    });
  } catch (error) {
    console.error("Error in optimize-headline route:", error);
    res.status(500).json({
      error: "Failed to optimize headline",
      details: error.message || "Unknown error occurred",
      success: false,
    });
  }
});

// Optimize LinkedIn about section
router.post("/optimize-about", async (req, res) => {
  try {
    const { currentAbout } = req.body;

    if (!currentAbout) {
      return res
        .status(400)
        .json({ 
          error: "Current about section is required",
          success: false 
        });
    }
    
    const optimizedAbout = await optimizeLinkedInAbout(currentAbout);
    
    if (!optimizedAbout) {
      throw new Error("No response received from optimization service");
    }
    
    res.json({
      optimizedAbout,
      success: true,
    });
  } catch (error) {
    console.error("Error in optimize-about route:", error);
    res.status(500).json({
      error: "Failed to optimize about section",
      details: error.message || "Unknown error occurred",
      success: false,
    });
  }
});

module.exports = router;
