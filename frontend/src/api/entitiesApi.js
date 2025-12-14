import { httpClient } from './httpClient';

export const entitiesApi = {
  list: async (entityName, sort, limit) => {
    const params = new URLSearchParams();
    if (sort) params.append('sort', sort);
    if (limit) params.append('limit', limit);
    const query = params.toString() ? `?${params.toString()}` : '';
    return await httpClient(`/entities/${entityName}${query}`);
  },
  filter: async (entityName, query, sort, limit) => {
    return await httpClient(`/entities/${entityName}/filter`, {
      method: 'POST',
      body: JSON.stringify({ query, sort, limit })
    });
  },
  create: async (entityName, data) => {
    return await httpClient(`/entities/${entityName}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  update: async (entityName, id, data) => {
    return await httpClient(`/entities/${entityName}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },
  delete: async (entityName, id) => {
    return await httpClient(`/entities/${entityName}/${id}`, {
      method: 'DELETE'
    });
  }
};
