import type { AdminTodosResponse } from '../types/todo';
import type { AdminUser, AdminUsersResponse, UserRole } from '../types/admin';
import { api } from './client';

export const adminApi = {
  getTodos: async (): Promise<AdminTodosResponse> => {
    const { data } = await api.get<AdminTodosResponse>('/admin/todos');
    return data;
  },
  getUsers: async (): Promise<AdminUsersResponse> => {
    const { data } = await api.get<AdminUsersResponse>('/admin/users');
    return data;
  },
  updateUserRole: async (id: number, role: UserRole): Promise<AdminUser> => {
    const { data } = await api.put<AdminUser>(`/admin/users/${id}/role`, { role });
    return data;
  },
};
