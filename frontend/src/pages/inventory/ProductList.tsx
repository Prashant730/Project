import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit2, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import api from '../../api/client';
import StockMovementModal from './StockMovementModal';
import { Pagination } from '../../components/Pagination';
import { SearchInput } from '../../components/SearchInput';

const ProductList: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const limit = 10;
  const [movementProduct, setMovementProduct] = useState<{ id: string; name: string; stock: number } | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['products', { page, limit, search }],
    queryFn: async () => (await api.get('/products', { params: { page, limit, search } })).data,
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <p className="text-xs mb-1" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>Inventory</p>
          <h1 className="text-2xl font-medium" style={{ color: 'var(--color-ink)' }}>Products</h1>
        </div>
        <button className="btn-primary" onClick={() => navigate('/inventory/new')}>
          <Plus className="w-3.5 h-3.5" />
          New Product
        </button>
      </div>

      <div style={{ border: '1px solid var(--color-rule)', borderRadius: '2px' }}>
        <div className="flex items-center px-4 py-3" style={{ borderBottom: '1px solid var(--color-rule)' }}>
          <SearchInput value={search} onChange={(val) => { setSearch(val); setPage(1); }} placeholder="Search name, SKU…" />
        </div>

        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Unit Price</th>
                <th style={{ textAlign: 'center' }}>Stock</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-10 text-sm" style={{ color: 'var(--color-muted)' }}>Loading…</td></tr>
              ) : isError ? (
                <tr><td colSpan={5} className="text-center py-10 text-sm" style={{ color: 'var(--color-terracotta)' }}>Error loading products.</td></tr>
              ) : data?.data.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-sm" style={{ color: 'var(--color-muted)' }}>No products found.</td></tr>
              ) : data?.data.map((p: any) => {
                const isLow = p.currentStock <= p.minStockAlert;
                return (
                  <tr key={p.id}>
                    <td>
                      <p className="font-medium text-sm" style={{ color: 'var(--color-ink)' }}>{p.name}</p>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-muted)', letterSpacing: '0.04em' }}>
                        {p.sku}
                      </p>
                    </td>
                    <td>
                      {p.category ? (
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                          {p.category}
                        </p>
                      ) : <span style={{ color: 'var(--color-muted)' }}>—</span>}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--color-ink)' }}>
                      ₹{Number(p.unitPrice).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className="font-semibold text-lg"
                          style={{ fontFamily: 'var(--font-mono)', color: isLow ? '#d97706' : 'var(--color-ink)' }}
                        >
                          {p.currentStock}
                        </span>
                        {isLow && (
                          <span className="flex items-center gap-1" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: '#d97706', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                            <AlertTriangle className="w-3 h-3" /> Low
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setMovementProduct({ id: p.id, name: p.name, stock: p.currentStock })}
                          className="btn-secondary py-1 px-2"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          Adjust
                        </button>
                        <button
                          onClick={() => navigate(`/inventory/${p.id}`)}
                          className="btn-secondary py-1 px-2"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {data?.meta && (
          <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onPageChange={setPage} />
        )}
      </div>

      {movementProduct && (
        <StockMovementModal
          productId={movementProduct.id}
          productName={movementProduct.name}
          currentStock={movementProduct.stock}
          onClose={() => setMovementProduct(null)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
};

export default ProductList;
