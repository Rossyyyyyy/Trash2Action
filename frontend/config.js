// config.js - Dynamic API Configuration
import Constants from 'expo-constants';

/**
 * Get the backend API URL dynamically based on the environment
 * 
 * In development (Expo):
 * - Uses the device's local network IP automatically
 * - Works on same WiFi network without hardcoding IPs
 * 
 * In production:
 * - Set BACKEND_URL in app.json extra config
 */
const getApiUrl = () => {
  // Check if we have a custom backend URL in app.json
  const customUrl = Constants.expoConfig?.extra?.backendUrl;
  if (customUrl) {
    return customUrl;
  }

  // In Expo development, use the manifest's debuggerHost
  // This automatically uses your computer's local network IP
  const { debuggerHost } = Constants.expoConfig?.hostUri 
    ? { debuggerHost: Constants.expoConfig.hostUri.split(':').shift() }
    : { debuggerHost: null };

  if (debuggerHost) {
    // Use the same IP as the Expo dev server with port 5000 for backend
    return `http://${debuggerHost}:5000`;
  }

  // Fallback for production or if debuggerHost is not available
  // You can set this in your .env or app.json
  return 'http://localhost:5000';
};

export const API_URL = getApiUrl();

// Log the API URL for debugging (remove in production)
console.log('📡 API URL:', API_URL);

export default {
  API_URL,
};
