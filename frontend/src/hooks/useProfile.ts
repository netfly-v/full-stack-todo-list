import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../api/profile';
import type { UpdateProfileData } from '../types/auth';

/**
 * Hook to fetch current user's profile
 */
export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to update profile (name, bio)
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: UpdateProfileData) => profileApi.updateProfile(updates),
    onSuccess: (updatedUser) => {
      // Update profile cache
      queryClient.setQueryData(['profile'], updatedUser);
      // Also update auth/me cache if it exists
      queryClient.setQueryData(['auth', 'me'], updatedUser);
    },
  });
}

/**
 * Hook to upload avatar
 */
export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => profileApi.uploadAvatar(file),
    onSuccess: (updatedUser) => {
      // Update profile cache
      queryClient.setQueryData(['profile'], updatedUser);
      // Also update auth/me cache if it exists
      queryClient.setQueryData(['auth', 'me'], updatedUser);
    },
  });
}

/**
 * Hook to delete avatar
 */
export function useDeleteAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => profileApi.deleteAvatar(),
    onSuccess: (updatedUser) => {
      // Update profile cache
      queryClient.setQueryData(['profile'], updatedUser);
      // Also update auth/me cache if it exists
      queryClient.setQueryData(['auth', 'me'], updatedUser);
    },
  });
}
