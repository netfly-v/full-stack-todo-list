import { useEffect, useState } from 'react';
import { useTodoStats, useTodos } from '../hooks/useTodos';
import { useMe } from '../hooks/useAuth';
import TodoForm from './TodoForm';
import TodoList from './TodoList';
import TodoStats from './TodoStats';
import type { TodoFilter } from '../types/todo';

export function TodosPage() {
  const [filter, setFilter] = useState<TodoFilter>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { data: user } = useMe();
  const { data: stats } = useTodoStats(!!user);
  const effectiveSearch = debouncedSearch.trim().length >= 2 ? debouncedSearch.trim() : undefined;
  const {
    items: todos,
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    error,
  } = useTodos({ filter, q: effectiveSearch, page_size: 5 }, !!user);
  const totalCount = stats?.total ?? data?.pages?.[0]?.total ?? todos.length;
  const activeCount = stats?.active ?? todos.filter(todo => !todo.completed).length;
  const completedCount = stats?.completed ?? todos.filter(todo => todo.completed).length;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const handleFilterChange = (nextFilter: TodoFilter) => {
    setFilter(nextFilter);
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="loading">🔄 Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">❌ Ошибка: {error instanceof Error ? error.message : 'Unknown error'}</div>
      </div>
    );
  }

  return (
    <>
      <TodoForm />
      <div className="search-bar">
        <input
          type="text"
          placeholder="Поиск (минимум 2 символа)"
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
      </div>
      <TodoList todos={todos} filter={filter} />
      {hasNextPage && (
        <button className="load-more" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Загрузка...' : 'Загрузить ещё'}
        </button>
      )}
      <TodoStats
        currentFilter={filter}
        onFilterChange={handleFilterChange}
        total={totalCount}
        active={activeCount}
        completed={completedCount}
      />
    </>
  );
}
