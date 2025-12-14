/**
 * Integrations API - External integrations (file upload, email, AI, etc.)
 */

import { httpClient } from './httpClient';

export const integrationsApi = {
  Core: {
    /**
     * Invoke LLM
     */
    async InvokeLLM(params) {
      return httpClient.post('/integrations/llm', params);
    },

    /**
     * Send email
     */
    async SendEmail(params) {
      return httpClient.post('/integrations/send-email', params);
    },

    /**
     * Upload public file
     */
    async UploadFile({ file }) {
      return httpClient.uploadFile('/integrations/upload', file);
    },

    /**
     * Upload private file
     */
    async UploadPrivateFile({ file }) {
      return httpClient.uploadFile('/integrations/upload-private', file);
    },

    /**
     * Create signed URL for private file
     */
    async CreateFileSignedUrl(params) {
      return httpClient.post('/integrations/signed-url', params);
    },

    /**
     * Generate image with AI
     */
    async GenerateImage(params) {
      return httpClient.post('/integrations/generate-image', params);
    },

    /**
     * Extract data from uploaded file
     */
    async ExtractDataFromUploadedFile(params) {
      return httpClient.post('/integrations/extract-data', params);
    },
  },
};

export default integrationsApi;