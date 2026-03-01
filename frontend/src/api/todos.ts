import type { Todo, CreateTodoDto, UpdateTodoDto, TodoFilter, TodosPage, TodosStats } from '../types/todo';
import { api } from './client';

type GetTodosParams = {
  filter?: TodoFilter;
  q?: string;
  page?: number;
  page_size?: number;
};

// API methods
export const todoApi = {
  getTodos: async (params?: GetTodosParams): Promise<TodosPage> => {
    const requestParams: Record<string, string | number> = {};
    if (params?.filter && params.filter !== 'all') {
      requestParams.filter = params.filter;
    }
    if (params?.q) {
      requestParams.q = params.q;
    }
    if (params?.page !== undefined) {
      requestParams.page = params.page;
    }
    if (params?.page_size) {
      requestParams.page_size = params.page_size;
    }
    const { data } = await api.get<TodosPage>('/todos', { params: requestParams });
    return data;
  },

  getTodo: async (id: number): Promise<Todo> => {
    const { data } = await api.get<Todo>(`/todos/${id}`);
    return data;
  },

  getTodoStats: async (): Promise<TodosStats> => {
    const { data } = await api.get<TodosStats>('/todos/stats');
    return data;
  },

  createTodo: async (todo: CreateTodoDto): Promise<Todo> => {
    const { data } = await api.post<Todo>('/todos', todo);
    return data;
  },

  updateTodo: async (id: number, updates: UpdateTodoDto): Promise<Todo> => {
    const { data } = await api.put<Todo>(`/todos/${id}`, updates);
    return data;
  },

  deleteTodo: async (id: number): Promise<Todo> => {
    const { data } = await api.delete<Todo>(`/todos/${id}`);
    return data;
  },
};
