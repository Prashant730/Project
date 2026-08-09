import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import api from '../../api/client';
import { Pagination } from '../../components/Pagination';
import { SearchInput } from '../../components/SearchInput';

const POList: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const limit = 10;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['purchaseOrders', page, search],
    queryFn: async () => (await api.get(`/purchase-orders?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`)).data,
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <p className="text-xs mb-1 font-mono uppercase tracking-wider text-[var(--color-muted)]">Procurement</p>
          <h1 className="text-2xl font-medium text-[var(--color-ink)]">Purchase Orders</h1>
        </div>
        <button className="btn-primary" onClick={() => navigate('/purchase-orders/new')}>
          <Plus className="w-3.5 h-3.5" />
          New PO
        </button>
      </div>

      <div className="flex items-center">
        <SearchInput value={search} onChange={(val) => { setSearch(val); setPage(1); }} placeholder="Search PO number…" />
      </div>

      <div style={{ border: '1px solid var(--color-rule)', borderRadius: '2px' }}>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier</th>
                <th style={{ textAlign: 'center' }}>Items</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-10 text-[var(--color-muted)]">Loading…</td></tr>
              ) : isError ? (
                <tr><td colSpan={6} className="text-center py-10 text-[var(--color-terracotta)]">Error loading POs.</td></tr>
              ) : data?.data.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-[var(--color-muted)]">No POs found.</td></tr>
              ) : data?.data.map((po: any) => (
                <tr key={po.id}>
                  <td className="font-mono text-sm">{po.poNumber}</td>
                  <td>{po.supplier.name}</td>
                  <td style={{ textAlign: 'center' }} className="font-mono">{po.totalQuantity}</td>
                  <td>
                    <span className={`stamp ${po.status === 'CONFIRMED' ? 'stamp-confirmed' : po.status === 'CANCELLED' ? 'stamp-cancelled' : 'stamp-draft'} stamp-flat`}>
                      {po.status}
                    </span>
                  </td>
                  <td className="font-mono text-xs text-[var(--color-muted)]">
                    {new Date(po.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => navigate(`/purchase-orders/${po.id}`)} className="btn-secondary py-1 px-3">
                      View
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

export default POList;
