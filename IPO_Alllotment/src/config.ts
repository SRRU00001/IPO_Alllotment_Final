// API Configuration
// In production (Render), set VITE_API_BASE_URL environment variable
// Example: https://your-backend.onrender.com/api

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD
    ? '' // In production, this MUST be set via environment variable
    : 'http://localhost:9000/api' // Development fallback
  );

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
export const DEBUG = import.meta.env.VITE_DEBUG === 'true';
