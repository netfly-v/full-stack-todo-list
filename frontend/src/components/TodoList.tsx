import { useToggleTodo, useDeleteTodo } from '../hooks/useTodos';
import type { Todo, TodoFilter } from '../types/todo';
import './TodoList.css';

interface TodoListProps {
  todos: Todo[];
  filter: TodoFilter;
}

const formatDeadline = (deadline: string) => {
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) {
    return deadline;
  }
  return date.toLocaleDateString();
};

export default function TodoList({ todos, filter }: TodoListProps) {
  const toggleTodo = useToggleTodo();
  const deleteTodo = useDeleteTodo();

  if (todos.length === 0) {
    return (
      <div className="empty-state">
        {filter === 'all' && 'Нет задач. Добавь первую! 🎉'}
        {filter === 'active' && 'Нет активных задач! 🎉'}
        {filter === 'completed' && 'Нет выполненных задач ⏳'}
      </div>
    );
  }

  return (
    <ul className="todo-list">
      {todos.map(todo => (
        <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => toggleTodo.mutate({ id: todo.id, completed: !todo.completed })}
            disabled={toggleTodo.isPending}
          />
          <div className="todo-content">
            <div className="todo-title">{todo.title}</div>
            {todo.description && <div className="todo-description">{todo.description}</div>}
            {todo.tags.length > 0 && <div className="todo-description">Теги: {todo.tags.join(', ')}</div>}
            {todo.deadline && <div className="todo-description">Дедлайн: {formatDeadline(todo.deadline)}</div>}
          </div>
          <button className="delete-btn" onClick={() => deleteTodo.mutate(todo.id)} disabled={deleteTodo.isPending}>
            Удалить
          </button>
        </li>
      ))}
    </ul>
  );
}
