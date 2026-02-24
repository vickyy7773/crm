// API Configuration for Development and Production

// Check if custom API URL is provided via environment variable (for Render deployment)
// Otherwise fall back to default URLs
const API_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? 'https://crm-backend-5l4r.onrender.com/api'
    : 'http://localhost:5000/api');

export default API_URL;
