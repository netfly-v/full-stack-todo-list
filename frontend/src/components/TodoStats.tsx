import type { TodoFilter } from '../types/todo';
import './TodoStats.css';

interface TodoStatsProps {
  currentFilter: TodoFilter;
  onFilterChange: (filter: TodoFilter) => void;
  total: number;
  active: number;
  completed: number;
}

export default function TodoStats({ currentFilter, onFilterChange, total, active, completed }: TodoStatsProps) {
  const stats = {
    total,
    active,
    completed,
  };

  return (
    <div className="stats">
      <div className={`stat-item ${currentFilter === 'all' ? 'active' : ''}`} onClick={() => onFilterChange('all')}>
        <span className="stat-number">{stats.total}</span>
        <div className="stat-label">Всего</div>
      </div>
      <div
        className={`stat-item ${currentFilter === 'active' ? 'active' : ''}`}
        onClick={() => onFilterChange('active')}
      >
        <span className="stat-number">{stats.active}</span>
        <div className="stat-label">Активных</div>
      </div>
      <div
        className={`stat-item ${currentFilter === 'completed' ? 'active' : ''}`}
        onClick={() => onFilterChange('completed')}
      >
        <span className="stat-number">{stats.completed}</span>
        <div className="stat-label">Выполнено</div>
      </div>
    </div>
  );
}
