import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { authApi } from '../api/auth';
import type { AuthCredentials, User } from '../types/auth';

export const authKeys = {
  me: ['auth', 'me'] as const,
};

export const useMe = () => {
  return useQuery<User | null>({
    queryKey: authKeys.me,
    queryFn: async () => {
      try {
        return await authApi.me();
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          return null;
        }
        throw error;
      }
    },
    retry: false,
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentials: AuthCredentials) => authApi.register(credentials),
    onSuccess: user => {
      queryClient.setQueryData(authKeys.me, user);
      queryClient.removeQueries({ queryKey: ['todos'] });
    },
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentials: AuthCredentials) => authApi.login(credentials),
    onSuccess: user => {
      queryClient.setQueryData(authKeys.me, user);
      queryClient.removeQueries({ queryKey: ['todos'] });
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.setQueryData(authKeys.me, null);
      queryClient.removeQueries({ queryKey: ['todos'] });
    },
  });
};
