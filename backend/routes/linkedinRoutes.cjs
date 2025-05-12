const express = require('express');
const router = express.Router();
const {
    optimizeLinkedInHeadline,
    optimizeLinkedInAbout,
} = require('../utils/linkedinUtils.cjs');

// Optimize LinkedIn headline
router.post('/optimize-headline', async (req, res) => {
    try {
        const { currentHeadline } = req.body;
        
        if (!currentHeadline) {
            return res.status(400).json({ error: 'Current headline is required' });
        }

        const optimizedHeadline = await optimizeLinkedInHeadline(currentHeadline);

        res.json({
            optimizedHeadline,
        });
    } catch (error) {
        console.error('Error in optimize-headline route:', error);
        res.status(500).json({ 
            error: 'Failed to optimize headline',
            details: error.message 
        });
    }
});

// Optimize LinkedIn about section
router.post('/optimize-about', async (req, res) => {
    try {
        const { currentAbout } = req.body;
        
        if (!currentAbout) {
            return res.status(400).json({ error: 'Current about section is required' });
        }

        const optimizedAbout = await optimizeLinkedInAbout(currentAbout);

        res.json({
            optimizedAbout,
        });
    } catch (error) {
        console.error('Error in optimize-about route:', error);
        res.status(500).json({ 
            error: 'Failed to optimize about section',
            details: error.message 
        });
    }
});

module.exports = router;