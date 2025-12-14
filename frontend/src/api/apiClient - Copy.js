import { authApi } from './authApi';
import { entitiesApi } from './entitiesApi';

export const api = {
  auth: authApi,
  entities: new Proxy({}, {
    get: (_, entityName) => ({
      list: (sort, limit) => entitiesApi.list(entityName, sort, limit),
      filter: (query, sort, limit) => entitiesApi.filter(entityName, query, sort, limit),
      create: (data) => entitiesApi.create(entityName, data),
      update: (id, data) => entitiesApi.update(entityName, id, data),
      delete: (id) => entitiesApi.delete(entityName, id)
    })
  })
};
