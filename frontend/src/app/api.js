import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

export const api = axios.create({ baseURL: '/api', timeout: 15000 });
let refreshing;
api.interceptors.response.use(undefined, async (error) => {
  const request = error.config;
  if (error.response?.status !== 401 || !request || request.retried || request.url === '/auth/login' || request.url === '/auth/refresh') throw error;
  request.retried = true;
  refreshing ??= api.post('/auth/refresh').finally(() => { refreshing = undefined; });
  await refreshing;
  return api(request);
});

export function useData(path) {
  return useQuery({ queryKey: [path], queryFn: async () => (await api.get(path)).data, enabled: Boolean(path) });
}
