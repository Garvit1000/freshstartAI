/**
 * API Configuration
 * Dynamically determines the API base URL based on environment
 */

// Determine the API base URL
const getApiBaseUrl = () => {
  // Check if we're in production (deployed)
  if (import.meta.env.PROD) {
    // Use the production API URL
    return import.meta.env.VITE_API_URL || 'https://freshstartai.onrender.com';
  }
  
  // In development, use localhost
  return 'http://localhost:3000';
};

export const API_BASE_URL = getApiBaseUrl();

// API endpoints
export const API_ENDPOINTS = {
  OPTIMIZE_RESUME: `${API_BASE_URL}/api/optimize-resume`,
  UPDATE_RESUME: `${API_BASE_URL}/api/update-resume`,
  DOWNLOAD_PDF: `${API_BASE_URL}/api/download-pdf`,
  GENERATE_DIRECT_PDF: `${API_BASE_URL}/api/generate-direct-pdf`,
  RESUME_TEMPLATES: `${API_BASE_URL}/api/resume-templates`,
  LINKEDIN_OPTIMIZE: `${API_BASE_URL}/api/linkedin/optimize-profile`,
};

// Log the API URL in development for debugging
if (import.meta.env.DEV) {
  console.log('🔗 API Base URL:', API_BASE_URL);
  console.log('📍 Environment:', import.meta.env.MODE);
}

export default API_ENDPOINTS;