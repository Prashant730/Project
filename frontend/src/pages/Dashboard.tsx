import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Package, FileText, AlertTriangle, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Fetch totals using the meta object of our paginated endpoints
  const { data: customerData, isLoading: custLoading } = useQuery({
    queryKey: ['customers', { limit: 1 }],
    queryFn: async () => (await api.get('/customers?limit=1')).data,
    enabled: ['ADMIN', 'SALES'].includes(user?.role || ''),
  });

  const { data: productData, isLoading: prodLoading } = useQuery({
    queryKey: ['products', { limit: 50 }],
    queryFn: async () => (await api.get('/products?limit=50')).data,
    enabled: ['ADMIN', 'WAREHOUSE'].includes(user?.role || ''),
  });

  const { data: challanData, isLoading: chalLoading } = useQuery({
    queryKey: ['challans', { limit: 1 }],
    queryFn: async () => (await api.get('/challans?limit=1')).data,
    enabled: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'].includes(user?.role || ''),
  });

  // Calculate Low Stock from fetched products
  const lowStockProducts = React.useMemo(() => {
    if (!productData?.data) return [];
    return productData.data.filter((p: any) => p.currentStock <= p.minStockAlert).slice(0, 5);
  }, [productData]);

  const StatCard = ({ title, value, icon, colorClass, loading }: any) => (
    <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border-color flex items-center gap-4 transition-transform hover:-translate-y-1">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-text-muted text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-text-main mt-1">
          {loading ? <div className="h-6 w-16 bg-surface-muted rounded animate-pulse" /> : value || 0}
        </h3>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-main tracking-tight">Welcome back, {user?.name.split(' ')[0]}</h1>
          <p className="text-text-muted mt-1">Here is what's happening with your business today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['ADMIN', 'SALES'].includes(user?.role || '') && (
          <StatCard 
            title="Total Customers" 
            value={customerData?.meta?.total} 
            icon={<Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />} 
            colorClass="bg-blue-100 dark:bg-blue-900/30"
            loading={custLoading}
          />
        )}
        {['ADMIN', 'WAREHOUSE'].includes(user?.role || '') && (
          <StatCard 
            title="Total Products" 
            value={productData?.meta?.total} 
            icon={<Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />} 
            colorClass="bg-purple-100 dark:bg-purple-900/30"
            loading={prodLoading}
          />
        )}
        <StatCard 
          title="Total Challans" 
          value={challanData?.meta?.total} 
          icon={<FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />} 
          colorClass="bg-emerald-100 dark:bg-emerald-900/30"
          loading={chalLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface rounded-2xl shadow-sm border border-border-color p-6 flex flex-col items-center justify-center min-h-[300px]">
           <TrendingUp className="w-16 h-16 text-border-color mb-4" />
           <p className="text-text-muted">Analytics visualization coming soon.</p>
        </div>

        {/* Low Stock Widget */}
        {['ADMIN', 'WAREHOUSE'].includes(user?.role || '') && (
          <div className="bg-surface rounded-2xl shadow-sm border border-border-color p-6">
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-text-main">Low Stock Alerts</h2>
            </div>

            {prodLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-surface-muted rounded-xl animate-pulse" />
                ))}
              </div>
            ) : lowStockProducts.length > 0 ? (
              <div className="space-y-3">
                {lowStockProducts.map((product: any) => (
                  <div key={product.id} className="flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                    <div className="overflow-hidden">
                      <p className="font-semibold text-sm text-text-main truncate">{product.name}</p>
                      <p className="text-xs text-text-muted mt-0.5">SKU: {product.sku}</p>
                    </div>
                    <div className="text-right ml-2 shrink-0">
                      <p className="text-lg font-bold text-red-600 dark:text-red-400">{product.currentStock}</p>
                      <p className="text-[10px] text-red-500 uppercase font-semibold">Left</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 border border-dashed border-border-color rounded-xl">
                <p className="text-text-muted text-sm">All products are adequately stocked.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
