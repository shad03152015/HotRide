/**
 * App configuration constants
 */

export const Config = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api',
  GOOGLE_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
  APPLE_CLIENT_ID: process.env.EXPO_PUBLIC_APPLE_CLIENT_ID || 'com.hotride.app',

  // API Timeout (10 seconds)
  API_TIMEOUT: 10000,

  // Toast Auto-dismiss Duration (3 seconds)
  TOAST_DURATION: 3000,
};
