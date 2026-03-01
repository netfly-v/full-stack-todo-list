// API Types
export interface Todo {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  createdAt: string;
  tags: string[];
  deadline: string | null;
}

export interface AdminTodo extends Todo {
  user_id: number;
  user_email: string;
}

export interface AdminTodosResponse {
  items: AdminTodo[];
  requested_by: number;
  total: number;
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

export type TodoFilter = 'all' | 'active' | 'completed';

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
