export const enum UserRole {
  User = 'user',
  Admin = 'admin',
  Superadmin = 'superadmin',
}

export interface AdminUser {
  id: number;
  email: string;
  name?: string | null;
  role: UserRole;
}

export interface AdminUsersResponse {
  items: AdminUser[];
}
