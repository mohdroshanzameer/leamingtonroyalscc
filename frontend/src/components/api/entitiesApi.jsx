/**
 * Entities API - Generic CRUD operations for all entities
 */

import { httpClient } from './httpClient';

export const entitiesApi = {
  /**
   * List all records
   */
  async list(entityName, { sort, limit } = {}) {
    const params = new URLSearchParams();
    if (sort) params.append('sort', sort);
    if (limit) params.append('limit', limit);
    const query = params.toString() ? `?${params}` : '';
    
    return httpClient.get(`/entities/${entityName}${query}`);
  },

  /**
   * Filter records with query
   */
  async filter(entityName, { query, sort, limit } = {}) {
    return httpClient.post(`/entities/${entityName}/filter`, { query, sort, limit });
  },

  /**
   * Get single record by ID
   */
  async get(entityName, id) {
    return httpClient.get(`/entities/${entityName}/${id}`);
  },

  /**
   * Create new record
   */
  async create(entityName, data) {
    return httpClient.post(`/entities/${entityName}`, data);
  },

  /**
   * Bulk create records
   */
  async bulkCreate(entityName, items) {
    return httpClient.post(`/entities/${entityName}/bulk`, items);
  },

  /**
   * Update record
   */
  async update(entityName, id, data) {
    return httpClient.put(`/entities/${entityName}/${id}`, data);
  },

  /**
   * Delete record
   */
  async remove(entityName, id) {
    return httpClient.delete(`/entities/${entityName}/${id}`);
  },

  /**
   * Get entity schema
   */
  async schema(entityName) {
    return httpClient.get(`/entities/${entityName}/schema`);
  },
};

// Create entity proxy for convenient access
export const createEntityProxy = () => {
  return new Proxy({}, {
    get: (target, entityName) => {
      if (!target[entityName]) {
        target[entityName] = {
          list: (options) => entitiesApi.list(entityName, options || {}),
          filter: (options) => entitiesApi.filter(entityName, options || {}),
          get: (id) => entitiesApi.get(entityName, id),
          create: (data) => entitiesApi.create(entityName, data),
          bulkCreate: (items) => entitiesApi.bulkCreate(entityName, items),
          update: (id, data) => entitiesApi.update(entityName, id, data),
          delete: (id) => entitiesApi.remove(entityName, id),
          schema: () => entitiesApi.schema(entityName),
        };
      }
      return target[entityName];
    },
  });
};

export const entities = createEntityProxy();

export default entitiesApi;