import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin';
import { useMe } from '../hooks/useAuth';
import { UserRole, type AdminUser } from '../types/admin';
import './AdminPage.css';

export function AdminPage() {
  const { data: user } = useMe();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'todos'] as const,
    queryFn: () => adminApi.getTodos(),
  });
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users'] as const,
    queryFn: () => adminApi.getUsers(),
  });
  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: number; role: UserRole }) => adminApi.updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  if (isLoading || usersLoading) {
    return (
      <div className="admin-page">
        <div className="loading">Loading admin data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="error">Failed to load admin data.</div>
      </div>
    );
  }

  const items = data?.items ?? [];
  const users = usersData?.items ?? [];
  const canManageRoles = user?.role === UserRole.Superadmin;
  const currentUserId = user?.id;

  const getRoleLabel = (role: UserRole) => {
    if (role === UserRole.Superadmin) return 'Superadmin';
    if (role === UserRole.Admin) return 'Admin';
    return 'User';
  };

  const handleRoleChange = (item: AdminUser, nextRole: UserRole) => {
    const isSelfDemote = item.id === currentUserId && item.role === UserRole.Superadmin && nextRole !== UserRole.Superadmin;
    if (isSelfDemote) {
      alert('You cannot remove your own superadmin role.');
      return;
    }

    const confirmed = window.confirm(
      `Change role for ${item.email} from ${getRoleLabel(item.role)} to ${getRoleLabel(nextRole)}?`
    );
    if (!confirmed) {
      return;
    }

    updateRole.mutate({ id: item.id, role: nextRole });
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h2>Admin Dashboard</h2>
          <p className="admin-subtitle">Manage todos and users</p>
        </div>
        <div className="admin-meta">
          <span className="admin-badge">{getRoleLabel(user?.role ?? UserRole.User)}</span>
          <span className="admin-email">{user?.email}</span>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3>All Todos</h3>
          <span className="admin-count">Total: {data?.total ?? 0}</span>
        </div>
        <div className="admin-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Title</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {items.map(todo => (
              <tr key={todo.id}>
                <td>{todo.id}</td>
                <td>{todo.user_email}</td>
                <td>{todo.title}</td>
                <td>
                  <span className={`status-pill ${todo.completed ? 'status-done' : 'status-active'}`}>
                    {todo.completed ? 'Completed' : 'Active'}
                  </span>
                </td>
                <td>{new Date(todo.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Users</h3>
          <span className="admin-count">Total: {users.length}</span>
        </div>
        <div className="admin-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Name</th>
              <th>Role</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(item => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.email}</td>
                <td>{item.name || '-'}</td>
                <td>
                  <span className={`role-pill role-${item.role}`}>{getRoleLabel(item.role)}</span>
                </td>
                <td>
                  <select
                    value={item.role}
                    disabled={!canManageRoles || updateRole.isPending}
                    onChange={event => {
                      const nextRole = event.target.value as UserRole;
                      if (nextRole !== item.role) {
                        handleRoleChange(item, nextRole);
                      }
                    }}
                  >
                    <option value={UserRole.User}>User</option>
                    <option value={UserRole.Admin}>Admin</option>
                    <option value={UserRole.Superadmin}>Superadmin</option>
                  </select>
                  {item.id === currentUserId && item.role === UserRole.Superadmin && (
                    <span className="admin-hint">You</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {!canManageRoles && (
          <p className="admin-note">Only superadmins can change roles.</p>
        )}
      </div>
    </div>
  );
}
