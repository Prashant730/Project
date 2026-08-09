import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Shield, ShoppingBag, Package, Calculator, User } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

const roleConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  ADMIN:     { label: 'Admin',     icon: <Shield className="w-3 h-3" />,      color: 'var(--color-terracotta)' },
  SALES:     { label: 'Sales',     icon: <ShoppingBag className="w-3 h-3" />, color: '#2D6A4F' },
  WAREHOUSE: { label: 'Warehouse', icon: <Package className="w-3 h-3" />,     color: '#8B5E0A' },
  ACCOUNTS:  { label: 'Accounts',  icon: <Calculator className="w-3 h-3" />,  color: '#5A5A5A' },
};

const UserList: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/users')).data,
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <p className="text-xs mb-1" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
            Administration
          </p>
          <h1 className="text-2xl font-medium" style={{ color: 'var(--color-ink)' }}>User Management</h1>
        </div>
        <button className="btn-primary" onClick={() => navigate('/users/new')}>
          <Plus className="w-3.5 h-3.5" />
          New User
        </button>
      </div>

      <div style={{ border: '1px solid var(--color-rule)', borderRadius: '2px' }}>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Joined</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4} className="text-center py-10 text-sm" style={{ color: 'var(--color-muted)' }}>Loading…</td></tr>
              ) : isError ? (
                <tr><td colSpan={4} className="text-center py-10 text-sm" style={{ color: 'var(--color-terracotta)' }}>Error loading users.</td></tr>
              ) : data?.data.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-sm" style={{ color: 'var(--color-muted)' }}>No users found.</td></tr>
              ) : data?.data.map((u: any) => {
                const rc = roleConfig[u.role] || roleConfig.ACCOUNTS;
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-sm flex items-center justify-center shrink-0"
                          style={{ background: 'var(--color-rule)' }}
                        >
                          <User className="w-4 h-4" style={{ color: 'var(--color-muted)' }} />
                        </div>
                        <div>
                          <p className="font-medium text-sm" style={{ color: 'var(--color-ink)' }}>
                            {u.name}
                            {isSelf && (
                              <span className="ml-2 text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)', letterSpacing: '0.05em' }}>(you)</span>
                            )}
                          </p>
                          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-muted)' }}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.62rem',
                          letterSpacing: '0.07em',
                          textTransform: 'uppercase',
                          color: rc.color,
                          border: `1px solid ${rc.color}`,
                          borderRadius: '2px',
                        }}
                      >
                        {rc.icon}
                        {rc.label}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--color-muted)' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => navigate(`/users/${u.id}`)}
                        className="btn-secondary py-1 px-2"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserList;
