import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit2, AlertTriangle, ArrowRightLeft, PackageOpen } from 'lucide-react';
import api from '../../api/client';
import StockMovementModal from './StockMovementModal';

const ProductList: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const limit = 10;
  
  const [movementProduct, setMovementProduct] = useState<{id: string, name: string, stock: number} | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['products', { page, limit, search }],
    queryFn: async () => {
      const res = await api.get('/products', { params: { page, limit, search } });
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Inventory Management</h1>
          <p className="text-text-muted text-sm mt-1">Manage your product catalog and stock levels</p>
        </div>
        <button
          onClick={() => navigate('/inventory/new')}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-border-color overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border-color flex items-center">
          <div className="relative w-full max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search by name, SKU..."
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
                <th className="p-4">Product Details</th>
                <th className="p-4 text-right">Price</th>
                <th className="p-4 text-center">Current Stock</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-text-muted">Loading products...</td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-red-500">Error loading products.</td>
                </tr>
              ) : data?.data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-text-muted">No products found.</td>
                </tr>
              ) : (
                data?.data.map((product: any) => {
                  const isLowStock = product.currentStock <= product.minStockAlert;
                  return (
                    <tr key={product.id} className="hover:bg-surface-muted/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex items-center justify-center border border-primary-100 dark:border-primary-800">
                            <PackageOpen className="w-5 h-5 text-primary-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-text-main">{product.name}</p>
                            <p className="text-xs text-text-muted mt-0.5">SKU: {product.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right font-medium text-text-main">
                        ₹{Number(product.unitPrice).toFixed(2)}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col items-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-sm border ${
                            isLowStock 
                              ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400'
                          }`}>
                            {isLowStock && <AlertTriangle className="w-3.5 h-3.5" />}
                            {product.currentStock}
                          </span>
                          {isLowStock && (
                            <span className="text-[10px] text-red-500 mt-1 uppercase font-semibold">Low Stock Alert</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setMovementProduct({ id: product.id, name: product.name, stock: product.currentStock })}
                            className="px-3 py-1.5 bg-surface border border-border-color rounded-lg text-xs font-medium text-text-main hover:bg-surface-muted transition-colors flex items-center gap-1.5"
                            title="Adjust Stock"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            Adjust
                          </button>
                          <button
                            onClick={() => navigate(`/inventory/${product.id}`)}
                            className="p-2 text-text-muted hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
