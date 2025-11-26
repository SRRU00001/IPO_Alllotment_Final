// API Configuration
// Production API on Render, development uses localhost

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD
    ? 'https://ipo-allotment-api-6y6d.onrender.com/api' // Production backend on Render
    : 'http://localhost:9000/api' // Development fallback
  );

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
export const DEBUG = import.meta.env.VITE_DEBUG === 'true';
