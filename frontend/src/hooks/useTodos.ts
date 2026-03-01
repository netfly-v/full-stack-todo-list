import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { todoApi } from '../api/todos';
import type { CreateTodoDto, UpdateTodoDto, TodoFilter } from '../types/todo';

export const todoKeys = {
  all: ['todos'] as const,
  lists: () => [...todoKeys.all, 'list'] as const,
  list: (filter?: TodoFilter, q?: string, pageSize?: number) =>
    [...todoKeys.lists(), filter ?? 'all', q ?? '', pageSize ?? 5] as const,
  details: () => [...todoKeys.all, 'detail'] as const,
  detail: (id: number) => [...todoKeys.details(), id] as const,
};

type UseTodosParams = {
  filter?: TodoFilter;
  q?: string;
  page_size?: number;
};

export const useTodos = (params: UseTodosParams = {}, enabled = true) => {
  const { filter, q, page_size } = params;
  const query = useInfiniteQuery({
    queryKey: todoKeys.list(filter, q, page_size),
    queryFn: ({ pageParam = 0 }) => todoApi.getTodos({ filter, q, page: pageParam, page_size }),
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.has_next ? lastPage.page + 1 : undefined),
    enabled,
  });
  const items = query.data?.pages.flatMap(page => page.items) ?? [];
  return { ...query, items };
};

export const useTodo = (id: number) => {
  return useQuery({
    queryKey: todoKeys.detail(id),
    queryFn: () => todoApi.getTodo(id),
    enabled: !!id,
  });
};

export const useTodoStats = (enabled = true) => {
  return useQuery({
    queryKey: [...todoKeys.all, 'stats'] as const,
    queryFn: () => todoApi.getTodoStats(),
    enabled,
  });
};

export const useCreateTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newTodo: CreateTodoDto) => todoApi.createTodo(newTodo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...todoKeys.all, 'stats'] });
    },
  });
};

export const useUpdateTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: UpdateTodoDto }) => todoApi.updateTodo(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...todoKeys.all, 'stats'] });
    },
  });
};

export const useDeleteTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => todoApi.deleteTodo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...todoKeys.all, 'stats'] });
    },
  });
};

export const useToggleTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, completed }: { id: number; completed: boolean }) => todoApi.updateTodo(id, { completed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...todoKeys.all, 'stats'] });
    },
  });
};
