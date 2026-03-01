import type { AuthCredentials, User } from '../types/auth';
import { api } from './client';

export const authApi = {
  register: async (credentials: AuthCredentials): Promise<User> => {
    const { data } = await api.post<User>('/auth/register', credentials);
    return data;
  },

  login: async (credentials: AuthCredentials): Promise<User> => {
    const { data } = await api.post<User>('/auth/login', credentials);
    return data;
  },

  logout: async (): Promise<{ ok: boolean }> => {
    const { data } = await api.post<{ ok: boolean }>('/auth/logout');
    return data;
  },

  me: async (): Promise<User> => {
    const { data } = await api.get<User>('/auth/me');
    return data;
  },
};
