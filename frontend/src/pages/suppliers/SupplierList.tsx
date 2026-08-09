import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Truck } from 'lucide-react';
import api from '../../api/client';
import { Pagination } from '../../components/Pagination';
import { SearchInput } from '../../components/SearchInput';

const SupplierList: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const limit = 10;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['suppliers', page, search],
    queryFn: async () => (await api.get(`/suppliers?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`)).data,
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <p className="text-xs mb-1 font-mono uppercase tracking-wider text-[var(--color-muted)]">Procurement</p>
          <h1 className="text-2xl font-medium text-[var(--color-ink)]">Suppliers</h1>
        </div>
        <button className="btn-primary" onClick={() => navigate('/suppliers/new')}>
          <Plus className="w-3.5 h-3.5" />
          New Supplier
        </button>
      </div>

      <div className="flex items-center">
        <SearchInput value={search} onChange={(val) => { setSearch(val); setPage(1); }} placeholder="Search name, contact…" />
      </div>

      <div style={{ border: '1px solid var(--color-rule)', borderRadius: '2px' }}>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Supplier Name</th>
                <th>Contact Person</th>
                <th>Contact Info</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4} className="text-center py-10 text-[var(--color-muted)]">Loading…</td></tr>
              ) : isError ? (
                <tr><td colSpan={4} className="text-center py-10 text-[var(--color-terracotta)]">Error loading suppliers.</td></tr>
              ) : data?.data.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-[var(--color-muted)]">No suppliers found.</td></tr>
              ) : data?.data.map((s: any) => (
                <tr key={s.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-sm bg-[var(--color-rule)] flex items-center justify-center shrink-0">
                        <Truck className="w-4 h-4 text-[var(--color-muted)]" />
                      </div>
                      <p className="font-medium text-sm text-[var(--color-ink)]">{s.name}</p>
                    </div>
                  </td>
                  <td className="text-sm">{s.contactPerson || '-'}</td>
                  <td>
                    <div className="text-xs text-[var(--color-muted)] space-y-0.5">
                      {s.mobile && <p>{s.mobile}</p>}
                      {s.email && <p>{s.email}</p>}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => navigate(`/suppliers/${s.id}`)} className="btn-secondary py-1 px-2">
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data?.meta && (
          <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onPageChange={setPage} />
        )}
      </div>
    </div>
  );
};

export default SupplierList;
