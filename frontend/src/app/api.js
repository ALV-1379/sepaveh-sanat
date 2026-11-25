import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

export const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { Accept: 'application/json' },
  withCredentials: true,
});
let refreshing;
api.interceptors.response.use(undefined, async (error) => {
  const request = error.config;
  if (error.response?.status !== 401 || !request || request.retried || request.url === '/auth/login' || request.url === '/auth/refresh') throw error;
  request.retried = true;
  refreshing ??= api.post('/auth/refresh').finally(() => { refreshing = undefined; });
  await refreshing;
  return api(request);
});

export function useApi(path, options = {}) {
  const { method = 'get', body, params, enabled = true, ...queryOptions } = options;
  return useQuery({
    queryKey: method === 'get' && !params && !body ? [path] : [path, method, params, body],
    queryFn: async ({ signal }) => (await api.request({ url: path, method, data: body, params, signal })).data,
    enabled: Boolean(path) && enabled,
    ...queryOptions,
  });
}

// Compatibility alias for feature modules while all requests share the same Axios client.
export const useData = useApi;
