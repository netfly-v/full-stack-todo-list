import type { UserRole } from './admin';

export interface User {
  id: number;
  email: string;
  name?: string;
  bio?: string;
  avatar_url?: string;
  role?: UserRole;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface UpdateProfileData {
  name?: string;
  bio?: string;
}
