/**
 * Application Configuration
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

export const ORGANIZATION_NAME = "Leamington Royals Cricket Club";
export const PROJECT_NAME = "LRCC";

// Keep token storage consistent across the app (apiClient, AuthProvider, etc.)
export const TOKEN_KEY = 'access_token';

export const config = {
  api: {
    baseUrl: API_BASE_URL,
    timeout: 30000,
  },
  auth: {
    tokenKey: TOKEN_KEY,
  },
  app: {
    name: PROJECT_NAME,
    fullName: ORGANIZATION_NAME,
  },
};

export default config;