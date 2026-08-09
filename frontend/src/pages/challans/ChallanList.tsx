import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, FileText } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

// Stamp rotation alternates per row
const rotations = ['stamp-cw', 'stamp-ccw', 'stamp-flat', 'stamp-cw', 'stamp-ccw'];

const challanStamp = (status: string, idx: number) => {
  const rot = rotations[idx % rotations.length];
  const variant =
    status === 'CONFIRMED' ? 'stamp-confirmed' :
    status === 'DRAFT'     ? 'stamp-draft'     :
    status === 'CANCELLED' ? 'stamp-cancelled'  : 'stamp-inactive';
  return `stamp ${variant} ${rot}`;
};

const ChallanList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canCreate = user && ['ADMIN', 'SALES'].includes(user.role);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const limit = 10;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['challans', { page, limit, search, status: statusFilter }],
    queryFn: async () => (await api.get('/challans', { params: { page, limit, search, status: statusFilter || undefined } })).data,
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <p className="text-xs mb-1" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>Sales</p>
          <h1 className="text-2xl font-medium" style={{ color: 'var(--color-ink)' }}>Challans</h1>
        </div>
        {canCreate && (
          <button className="btn-primary" onClick={() => navigate('/challans/new')}>
            <Plus className="w-3.5 h-3.5" />
            New Challan
          </button>
        )}
      </div>

      <div style={{ border: '1px solid var(--color-rule)', borderRadius: '2px' }}>
        {/* Search + filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--color-rule)' }}>
          <div className="flex items-center flex-1">
            <Search className="w-4 h-4 mr-3 shrink-0" style={{ color: 'var(--color-muted)' }} />
            <input
              type="text"
              placeholder="Search challan number…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: 'var(--color-ink)' }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="field-select"
            style={{ width: 'auto', minWidth: '130px' }}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Challan #</th>
                <th>Customer</th>
                <th style={{ textAlign: 'center' }}>Qty</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-10 text-sm" style={{ color: 'var(--color-muted)' }}>Loading…</td></tr>
              ) : isError ? (
                <tr><td colSpan={6} className="text-center py-10 text-sm" style={{ color: 'var(--color-terracotta)' }}>Error loading challans.</td></tr>
              ) : data?.data.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-sm" style={{ color: 'var(--color-muted)' }}>No challans found.</td></tr>
              ) : data?.data.map((ch: any, idx: number) => (
                <tr key={ch.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--color-muted)' }} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-ink)' }}>
                        {ch.challanNumber}
                      </span>
                    </div>
                  </td>
                  <td>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>{ch.customer?.name}</p>
                    {ch.customer?.businessName && (
                      <p style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>{ch.customer.businessName}</p>
                    )}
                  </td>
                  <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-ink)' }}>
                    {ch.totalQuantity}
                  </td>
                  <td>
                    <span className={challanStamp(ch.status, idx)}>{ch.status}</span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-muted)' }}>
                    {new Date(ch.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => navigate(`/challans/${ch.id}`)} className="btn-secondary py-1 px-3">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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

export default ChallanList;
