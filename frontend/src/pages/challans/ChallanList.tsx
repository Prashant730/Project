import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

const statusConfig: Record<string, { label: string; icon: React.ReactNode; classes: string }> = {
  DRAFT: {
    label: 'Draft',
    icon: <Clock className="w-3.5 h-3.5" />,
    classes: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  },
  CONFIRMED: {
    label: 'Confirmed',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    classes: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: <XCircle className="w-3.5 h-3.5" />,
    classes: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
  },
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
    queryFn: async () => {
      const res = await api.get('/challans', {
        params: { page, limit, search, status: statusFilter || undefined },
      });
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Sales Challans</h1>
          <p className="text-text-muted text-sm mt-1">Create and manage delivery challans</p>
        </div>
        {canCreate && (
          <button
            onClick={() => navigate('/challans/new')}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Challan
          </button>
        )}
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-border-color overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border-color flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search by challan number..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-surface-muted border border-border-color rounded-lg pl-10 pr-4 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-surface-muted border border-border-color rounded-lg px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-muted border-b border-border-color text-text-muted text-xs uppercase tracking-wider font-semibold">
                <th className="p-4">Challan #</th>
                <th className="p-4">Customer</th>
                <th className="p-4 text-center">Items (Qty)</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4">Created</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color text-sm">
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-text-muted">Loading challans...</td></tr>
              ) : isError ? (
                <tr><td colSpan={6} className="p-8 text-center text-red-500">Error loading challans.</td></tr>
              ) : data?.data.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-text-muted">No challans found.</td></tr>
              ) : (
                data?.data.map((challan: any) => {
                  const sc = statusConfig[challan.status] || statusConfig.DRAFT;
                  return (
                    <tr key={challan.id} className="hover:bg-surface-muted/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary-400" />
                          <span className="font-mono font-semibold text-text-main">{challan.challanNumber}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-text-main">{challan.customer?.name}</p>
                        {challan.customer?.businessName && (
                          <p className="text-xs text-text-muted">{challan.customer.businessName}</p>
                        )}
                      </td>
                      <td className="p-4 text-center font-medium text-text-main">{challan.totalQuantity}</td>
                      <td className="p-4">
                        <div className="flex justify-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${sc.classes}`}>
                            {sc.icon} {sc.label}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-text-muted text-sm">
                        {new Date(challan.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => navigate(`/challans/${challan.id}`)}
                          className="px-3 py-1.5 text-xs font-medium border border-border-color rounded-lg hover:bg-surface-muted text-text-main transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {data?.meta && data.meta.totalPages > 1 && (
          <div className="p-4 border-t border-border-color flex items-center justify-between bg-surface-muted text-sm">
            <p className="text-text-muted">
              Showing <span className="font-medium text-text-main">{(page - 1) * limit + 1}</span>–<span className="font-medium text-text-main">{Math.min(page * limit, data.meta.total)}</span> of <span className="font-medium text-text-main">{data.meta.total}</span>
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 border border-border-color rounded-lg bg-surface text-text-main disabled:opacity-50">Previous</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page === data.meta.totalPages} className="px-3 py-1.5 border border-border-color rounded-lg bg-surface text-text-main disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallanList;
