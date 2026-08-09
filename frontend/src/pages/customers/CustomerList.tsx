import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit2, Phone, Mail, Building, Clock } from 'lucide-react';
import api from '../../api/client';

const CustomerList: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const limit = 10;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['customers', { page, limit, search }],
    queryFn: async () => {
      const res = await api.get('/customers', { params: { page, limit, search } });
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Customers</h1>
          <p className="text-text-muted text-sm mt-1">Manage your clients and leads</p>
        </div>
        <button
          onClick={() => navigate('/customers/new')}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-border-color overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border-color flex items-center">
          <div className="relative w-full max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search by name, email, or mobile..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-surface-muted border border-border-color rounded-lg pl-10 pr-4 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-muted border-b border-border-color text-text-muted text-xs uppercase tracking-wider font-semibold">
                <th className="p-4">Customer Info</th>
                <th className="p-4">Business</th>
                <th className="p-4">Status</th>
                <th className="p-4">Follow Up</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-text-muted">Loading customers...</td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-red-500">Error loading customers.</td>
                </tr>
              ) : data?.data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-text-muted">No customers found.</td>
                </tr>
              ) : (
                data?.data.map((customer: any) => (
                  <tr key={customer.id} className="hover:bg-surface-muted/50 transition-colors">
                    <td className="p-4">
                      <p className="font-semibold text-text-main">{customer.name}</p>
                      <div className="flex items-center gap-3 mt-1 text-text-muted text-xs">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {customer.mobile}</span>
                        {customer.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {customer.email}</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      {customer.businessName ? (
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-text-muted" />
                          <span className="text-text-main">{customer.businessName}</span>
                        </div>
                      ) : <span className="text-text-muted">-</span>}
                      {customer.customerType && <p className="text-xs text-text-muted mt-1">{customer.customerType}</p>}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        customer.status === 'LEAD' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        customer.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {customer.followUpDate ? (
                        <div className="flex items-center gap-1.5 text-text-main text-sm">
                          <Clock className="w-4 h-4 text-primary-500" />
                          {new Date(customer.followUpDate).toLocaleDateString()}
                        </div>
                      ) : <span className="text-text-muted">-</span>}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => navigate(`/customers/${customer.id}`)}
                        className="p-2 text-text-muted hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.meta && data.meta.totalPages > 1 && (
          <div className="p-4 border-t border-border-color flex items-center justify-between bg-surface-muted text-sm">
            <p className="text-text-muted">
              Showing <span className="font-medium text-text-main">{(page - 1) * limit + 1}</span> to <span className="font-medium text-text-main">{Math.min(page * limit, data.meta.total)}</span> of <span className="font-medium text-text-main">{data.meta.total}</span> results
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-border-color rounded-lg bg-surface text-text-main disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page === data.meta.totalPages}
                className="px-3 py-1.5 border border-border-color rounded-lg bg-surface text-text-main disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerList;
