// Type definitions for Todo API

export interface Todo {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  createdAt: string;
  tags: string[];
  deadline: string | null;
}

export interface TodosPage {
  items: Todo[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface TodosStats {
  total: number;
  active: number;
  completed: number;
}

export enum UserRole {
  User = 'user',
  Admin = 'admin',
  Superadmin = 'superadmin',
}

export interface User {
  id: number;
  email: string;
  name?: string;
  bio?: string;
  avatar_url?: string;
  role?: UserRole;
}

export interface AuthPayload {
  userId: number;
  email: string;
  role: UserRole;
}

export interface CreateTodoDto {
  title: string;
  description?: string;
  tags?: string[];
  deadline?: string | null;
}

export interface UpdateTodoDto {
  title?: string;
  description?: string;
  completed?: boolean;
  tags?: string[];
  deadline?: string | null;
}

export type TodoFilter = 'all' | 'active' | 'completed';

export interface UpdateProfileDto {
  name?: string;
  bio?: string;
}
