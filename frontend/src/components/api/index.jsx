/**
 * API Module - Central export for all API functions
 */

export { httpClient } from './httpClient';
export { authApi } from './authApi';
export { entitiesApi, entities } from './entitiesApi';
export { integrationsApi } from './integrationsApi';

// Legacy compatibility - provides same interface as old apiClient
import { authApi } from './authApi';
import { entities } from './entitiesApi';
import { integrationsApi } from './integrationsApi';

export const api = {
  auth: authApi,
  entities: entities,
  integrations: integrationsApi,
};

export default api;