import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit2, Phone, Mail, Building, Clock } from 'lucide-react';
import api from '../../api/client';

// stamp rotation cycle
const rotations = ['stamp-cw', 'stamp-ccw', 'stamp-flat', 'stamp-cw', 'stamp-ccw'];

const statusStamp = (status: string, idx: number) => {
  const rot = rotations[idx % rotations.length];
  const variant =
    status === 'ACTIVE'   ? 'stamp-active'   :
    status === 'LEAD'     ? 'stamp-lead'      :
    status === 'INACTIVE' ? 'stamp-inactive'  : 'stamp-inactive';
  return `stamp ${variant} ${rot}`;
};

const CustomerList: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const limit = 10;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['customers', { page, limit, search }],
    queryFn: async () => (await api.get('/customers', { params: { page, limit, search } })).data,
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <p className="text-xs mb-1" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>CRM</p>
          <h1 className="text-2xl font-medium" style={{ color: 'var(--color-ink)' }}>Customers</h1>
        </div>
        <button className="btn-primary" onClick={() => navigate('/customers/new')}>
          <Plus className="w-3.5 h-3.5" />
          New Customer
        </button>
      </div>

      {/* Table wrapper */}
      <div style={{ border: '1px solid var(--color-rule)', borderRadius: '2px' }}>
        {/* Search bar */}
        <div className="flex items-center px-4 py-3" style={{ borderBottom: '1px solid var(--color-rule)' }}>
          <Search className="w-4 h-4 mr-3 shrink-0" style={{ color: 'var(--color-muted)' }} />
          <input
            type="text"
            placeholder="Search name, email, mobile…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink)' }}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Business</th>
                <th>Status</th>
                <th>Follow Up</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-10 text-sm" style={{ color: 'var(--color-muted)' }}>Loading…</td></tr>
              ) : isError ? (
                <tr><td colSpan={5} className="text-center py-10 text-sm" style={{ color: 'var(--color-terracotta)' }}>Error loading customers.</td></tr>
              ) : data?.data.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-sm" style={{ color: 'var(--color-muted)' }}>No customers found.</td></tr>
              ) : data?.data.map((c: any, idx: number) => (
                <tr key={c.id}>
                  <td>
                    <p className="font-medium text-sm" style={{ color: 'var(--color-ink)' }}>{c.name}</p>
                    <div className="flex items-center gap-3 mt-1" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.mobile}</span>
                      {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
                    </div>
                  </td>
                  <td>
                    {c.businessName ? (
                      <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--color-ink)' }}>
                        <Building className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--color-muted)' }} />
                        {c.businessName}
                      </span>
                    ) : <span style={{ color: 'var(--color-muted)' }}>—</span>}
                    {c.customerType && (
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--color-muted)', marginTop: '2px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        {c.customerType}
                      </p>
                    )}
                  </td>
                  <td>
                    <span className={statusStamp(c.status, idx)}>{c.status}</span>
                  </td>
                  <td>
                    {c.followUpDate ? (
                      <span className="flex items-center gap-1.5 text-sm" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--color-ink)' }}>
                        <Clock className="w-3.5 h-3.5" style={{ color: 'var(--color-muted)' }} />
                        {new Date(c.followUpDate).toLocaleDateString()}
                      </span>
                    ) : <span style={{ color: 'var(--color-muted)' }}>—</span>}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => navigate(`/customers/${c.id}`)}
                      className="btn-secondary py-1 px-2"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.meta && data.meta.totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: '1px solid var(--color-rule)', fontFamily: 'var(--font-mono)', fontSize: '0.68rem' }}
          >
            <span style={{ color: 'var(--color-muted)' }}>
              {(page - 1) * limit + 1}–{Math.min(page * limit, data.meta.total)} of {data.meta.total}
            </span>
            <div className="flex gap-2">
              <button className="btn-secondary py-1" onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Prev</button>
              <button className="btn-secondary py-1" onClick={() => setPage(p => p + 1)} disabled={page === data.meta.totalPages}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerList;
