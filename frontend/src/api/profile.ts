import type { User, UpdateProfileData } from '../types/auth';
import { api } from './client';

export const profileApi = {
  /**
   * Get current user's profile
   */
  getProfile: async (): Promise<User> => {
    const { data } = await api.get<User>('/profile');
    return data;
  },

  /**
   * Update current user's profile (name, bio)
   */
  updateProfile: async (updates: UpdateProfileData): Promise<User> => {
    const { data } = await api.put<User>('/profile', updates);
    return data;
  },

  /**
   * Upload avatar image
   */
  uploadAvatar: async (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const { data } = await api.post<User>('/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  /**
   * Delete avatar image
   */
  deleteAvatar: async (): Promise<User> => {
    const { data } = await api.delete<User>('/profile/avatar');
    return data;
  },
};
