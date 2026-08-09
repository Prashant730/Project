import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: customerData, isLoading: custLoading } = useQuery({
    queryKey: ['customers', { limit: 1 }],
    queryFn: async () => (await api.get('/customers?limit=1')).data,
    enabled: ['ADMIN', 'SALES'].includes(user?.role || ''),
  });

  const { data: productData, isLoading: prodLoading } = useQuery({
    queryKey: ['products', { limit: 100 }],
    queryFn: async () => (await api.get('/products?limit=100')).data,
    enabled: ['ADMIN', 'WAREHOUSE'].includes(user?.role || ''),
  });

  const { data: challanData, isLoading: chalLoading } = useQuery({
    queryKey: ['challans', { limit: 1 }],
    queryFn: async () => (await api.get('/challans?limit=1')).data,
    enabled: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'].includes(user?.role || ''),
  });

  const lowStock = React.useMemo(() => {
    if (!productData?.data) return [];
    return productData.data.filter((p: any) => p.currentStock <= p.minStockAlert);
  }, [productData]);

  const Skeleton = () => (
    <div className="h-7 w-12 rounded-sm animate-pulse" style={{ background: 'var(--color-rule)' }} />
  );

  // Stat segments
  const stats = [
    { label: 'Customers', value: customerData?.meta?.total, loading: custLoading, show: ['ADMIN','SALES'].includes(user?.role || '') },
    { label: 'Products',  value: productData?.meta?.total,  loading: prodLoading, show: ['ADMIN','WAREHOUSE'].includes(user?.role || '') },
    { label: 'Challans',  value: challanData?.meta?.total,  loading: chalLoading, show: true },
  ].filter(s => s.show);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <p
          className="text-xs mb-1"
          style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)' }}
        >
          Overview
        </p>
        <h1 className="text-2xl font-medium" style={{ color: 'var(--color-ink)' }}>
          Good day, {user?.name.split(' ')[0]}
        </h1>
      </div>

      {/* ── Single stat strip ─────────────────────────────── */}
      <div
        className="flex"
        style={{ border: '1px solid var(--color-rule)', borderRadius: '2px' }}
      >
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="flex-1 px-6 py-5"
            style={{ borderRight: i < stats.length - 1 ? '1px solid var(--color-rule)' : 'none' }}
          >
            <p
              className="mb-2"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)' }}
            >
              {s.label}
            </p>
            {s.loading ? <Skeleton /> : (
              <p
                className="text-3xl font-semibold leading-none"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}
              >
                {s.value ?? 0}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── Lower row ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Placeholder chart area */}
        <div
          className="lg:col-span-2 flex flex-col items-center justify-center py-16"
          style={{ border: '1px solid var(--color-rule)', borderRadius: '2px' }}
        >
          <TrendingUp className="w-10 h-10 mb-3" style={{ color: 'var(--color-rule)' }} />
          <p className="text-sm" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.7rem' }}>
            Analytics — coming soon
          </p>
        </div>

        {/* Low stock */}
        {['ADMIN','WAREHOUSE'].includes(user?.role || '') && (
          <div style={{ border: '1px solid var(--color-rule)', borderRadius: '2px' }}>
            <div
              className="px-4 py-3 border-b"
              style={{ borderColor: 'var(--color-rule)' }}
            >
              <p
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)' }}
              >
                Low Stock
              </p>
            </div>

            {prodLoading ? (
              <div className="p-4 space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-10 rounded-sm animate-pulse" style={{ background: 'var(--color-rule)' }} />
                ))}
              </div>
            ) : lowStock.length === 0 ? (
              <p className="p-5 text-sm" style={{ color: 'var(--color-muted)' }}>
                All products adequately stocked.
              </p>
            ) : (
              <div>
                {lowStock.map((p: any) => (
                  <div key={p.id} className="low-stock-row">
                    <div className="overflow-hidden mr-3">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--color-ink)' }}>{p.name}</p>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-muted)' }}>{p.sku}</p>
                    </div>
                    <p
                      className="text-lg font-semibold shrink-0"
                      style={{ fontFamily: 'var(--font-mono)', color: '#d97706' }}
                    >
                      {p.currentStock}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
