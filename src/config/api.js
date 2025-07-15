// API Configuration for different environments
const getApiBaseUrl = () => {
  // Check if we're in production
  if (import.meta.env.PROD) {
    // Use environment variable if set, otherwise use a default production URL
    return import.meta.env.VITE_API_URL || 'https://your-backend-app.railway.app/api'
  }
  
  // Development environment
  return 'http://localhost:8000/api'
}

export const API_BASE_URL = getApiBaseUrl()

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  }
} 