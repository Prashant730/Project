import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, CartesianGrid,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';

/* ─── Custom tooltip for stock chart ───────────────────────────────────── */
const StockTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const isLow = d.currentStock <= d.minStockAlert;
  return (
    <div
      style={{
        background: 'var(--color-paper)',
        border: '1px solid var(--color-rule)',
        borderRadius: '2px',
        padding: '8px 12px',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.7rem',
      }}
    >
      <p style={{ color: 'var(--color-ink)', fontWeight: 600, marginBottom: 4 }}>{d.name}</p>
      <p style={{ color: 'var(--color-muted)' }}>SKU: {d.sku}</p>
      <p style={{ color: isLow ? '#d97706' : 'var(--color-ink)', marginTop: 2 }}>
        Stock: <strong>{d.currentStock}</strong>
      </p>
      <p style={{ color: 'var(--color-muted)' }}>Alert at: {d.minStockAlert}</p>
    </div>
  );
};

/* ─── Custom tooltip for challan chart ─────────────────────────────────── */
const ChallanTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'var(--color-paper)',
        border: '1px solid var(--color-rule)',
        borderRadius: '2px',
        padding: '8px 12px',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.7rem',
      }}
    >
      <p style={{ color: 'var(--color-ink)', fontWeight: 600, marginBottom: 4 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color, marginTop: 2 }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

/* ─── Process challans into monthly buckets ─────────────────────────────── */
function buildChallanTimeline(challans: any[]) {
  const map: Record<string, { month: string; Confirmed: number; Draft: number; Cancelled: number }> = {};
  challans.forEach((ch) => {
    const d = new Date(ch.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    if (!map[key]) map[key] = { month: label, Confirmed: 0, Draft: 0, Cancelled: 0 };
    if (ch.status === 'CONFIRMED') map[key].Confirmed++;
    else if (ch.status === 'DRAFT')  map[key].Draft++;
    else if (ch.status === 'CANCELLED') map[key].Cancelled++;
  });
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const canSeeCustomers  = ['ADMIN', 'SALES'].includes(user?.role || '');
  const canSeeInventory  = ['ADMIN', 'WAREHOUSE'].includes(user?.role || '');

  /* ── Data fetches ─────────────────────────────────────── */
  const { data: customerData, isLoading: custLoading } = useQuery({
    queryKey: ['customers', { limit: 1 }],
    queryFn: async () => (await api.get('/customers?limit=1')).data,
    enabled: canSeeCustomers,
  });

  const { data: productData, isLoading: prodLoading } = useQuery({
    queryKey: ['products', { limit: 100 }],
    queryFn: async () => (await api.get('/products?limit=100')).data,
    enabled: canSeeInventory,
  });

  const { data: challanData, isLoading: chalLoading } = useQuery({
    queryKey: ['challans-all'],
    queryFn: async () => (await api.get('/challans?limit=200')).data,
  });

  /* ── Derived data ─────────────────────────────────────── */
  const lowStock = React.useMemo(() => {
    if (!productData?.data) return [];
    return productData.data.filter((p: any) => p.currentStock <= p.minStockAlert);
  }, [productData]);

  // Sort products by stock descending, take top 8 for chart
  const stockChartData = React.useMemo(() => {
    if (!productData?.data) return [];
    return [...productData.data]
      .sort((a, b) => b.currentStock - a.currentStock)
      .slice(0, 8)
      .map((p: any) => ({
        name: p.name.length > 18 ? p.name.slice(0, 16) + '…' : p.name,
        fullName: p.name,
        sku: p.sku,
        currentStock: p.currentStock,
        minStockAlert: p.minStockAlert,
      }));
  }, [productData]);

  const challanTimeline = React.useMemo(() => {
    if (!challanData?.data) return [];
    return buildChallanTimeline(challanData.data);
  }, [challanData]);

  /* ── Stat strip segments ──────────────────────────────── */
  const stats = [
    { label: 'Customers',  value: customerData?.meta?.total, loading: custLoading, show: canSeeCustomers },
    { label: 'Products',   value: productData?.meta?.total,  loading: prodLoading, show: canSeeInventory },
    { label: 'Challans',   value: challanData?.meta?.total,  loading: chalLoading, show: true },
    { label: 'Low Stock',  value: lowStock.length,           loading: prodLoading, show: canSeeInventory, warn: lowStock.length > 0 },
  ].filter(s => s.show);

  const Skeleton = () => (
    <div className="h-7 w-10 animate-pulse" style={{ background: 'var(--color-rule)', borderRadius: '2px' }} />
  );

  const axisStyle = {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.58rem',
    fill: 'var(--color-muted)',
    letterSpacing: '0.04em',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Page heading */}
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

      {/* ── Stat strip ────────────────────────────────────── */}
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
                style={{ fontFamily: 'var(--font-mono)', color: (s as any).warn ? '#d97706' : 'var(--color-ink)' }}
              >
                {s.value ?? 0}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── Analytics row ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left: Challan timeline OR Stock chart ─────── */}
        <div
          className="lg:col-span-2"
          style={{ border: '1px solid var(--color-rule)', borderRadius: '2px' }}
        >
          {/* Tab-style section header */}
          <div
            className="flex items-center gap-4 px-5 py-3"
            style={{ borderBottom: '1px solid var(--color-rule)' }}
          >
            <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--color-muted)' }} />
            <p
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)' }}
            >
              {canSeeInventory ? 'Stock Levels — Top Products' : 'Challan Activity'}
            </p>
          </div>

          <div className="p-5">
            {/* ── INVENTORY chart (ADMIN / WAREHOUSE) ────── */}
            {canSeeInventory && (
              prodLoading ? (
                <div className="flex items-center justify-center h-48">
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--color-muted)', letterSpacing: '0.06em' }}>
                    Loading…
                  </p>
                </div>
              ) : stockChartData.length === 0 ? (
                <div className="flex items-center justify-center h-48">
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--color-muted)' }}>No product data.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stockChartData} barCategoryGap="30%" margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--color-rule)" strokeDasharray="0" />
                    <XAxis
                      dataKey="name"
                      tick={axisStyle}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                      height={48}
                    />
                    <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                    <Tooltip content={<StockTooltip />} cursor={{ fill: 'color-mix(in srgb, var(--color-rule) 40%, transparent)' }} />
                    {/* Per-bar colour: amber for low-stock, terracotta for ok */}
                    <Bar dataKey="currentStock" radius={[1, 1, 0, 0]} maxBarSize={36}>
                      {stockChartData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={entry.currentStock <= entry.minStockAlert ? '#d97706' : 'var(--color-terracotta)'}
                          fillOpacity={entry.currentStock <= entry.minStockAlert ? 1 : 0.75}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )
            )}

            {/* ── CHALLAN timeline chart (SALES / ACCOUNTS / everyone else) ─ */}
            {!canSeeInventory && (
              chalLoading ? (
                <div className="flex items-center justify-center h-48">
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--color-muted)', letterSpacing: '0.06em' }}>
                    Loading…
                  </p>
                </div>
              ) : challanTimeline.length === 0 ? (
                <div className="flex items-center justify-center h-48">
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--color-muted)' }}>No challan data yet.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={challanTimeline} barCategoryGap="35%" margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--color-rule)" strokeDasharray="0" />
                    <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
                    <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChallanTooltip />} cursor={{ fill: 'color-mix(in srgb, var(--color-rule) 40%, transparent)' }} />
                    <Bar dataKey="Confirmed" fill="var(--color-terracotta)" fillOpacity={0.85} radius={[1, 1, 0, 0]} maxBarSize={24} />
                    <Bar dataKey="Draft"     fill="var(--color-kraft)"      fillOpacity={0.9}  radius={[1, 1, 0, 0]} maxBarSize={24} />
                    <Bar dataKey="Cancelled" fill="var(--color-muted)"      fillOpacity={0.6}  radius={[1, 1, 0, 0]} maxBarSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              )
            )}

            {/* Legend */}
            {canSeeInventory ? (
              <div className="flex items-center gap-5 mt-2">
                <span className="flex items-center gap-1.5" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--color-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, background: 'var(--color-terracotta)', opacity: 0.75 }} /> Normal
                </span>
                <span className="flex items-center gap-1.5" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--color-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, background: '#d97706' }} /> Below alert
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-5 mt-2">
                {[
                  { label: 'Confirmed', color: 'var(--color-terracotta)', opacity: '0.85' },
                  { label: 'Draft',     color: 'var(--color-kraft)',      opacity: '0.9' },
                  { label: 'Cancelled', color: 'var(--color-muted)',      opacity: '0.6' },
                ].map(l => (
                  <span key={l.label} className="flex items-center gap-1.5" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--color-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, background: l.color, opacity: Number(l.opacity) }} />
                    {l.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Low stock widget ──────────────────────── */}
        {canSeeInventory && (
          <div style={{ border: '1px solid var(--color-rule)', borderRadius: '2px' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-rule)' }}>
              <p
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)' }}
              >
                Low Stock
              </p>
            </div>

            {prodLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-10 animate-pulse" style={{ background: 'var(--color-rule)', borderRadius: '2px' }} />
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
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--color-muted)', letterSpacing: '0.03em' }}>
                        {p.sku}
                      </p>
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

        {/* ── Challan timeline for ADMIN/WAREHOUSE as second chart ── */}
        {canSeeInventory && (
          <div
            className="lg:col-span-2"
            style={{ border: '1px solid var(--color-rule)', borderRadius: '2px' }}
          >
            <div
              className="flex items-center gap-4 px-5 py-3"
              style={{ borderBottom: '1px solid var(--color-rule)' }}
            >
              <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--color-muted)' }} />
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
                Challan Activity
              </p>
            </div>
            <div className="p-5">
              {chalLoading ? (
                <div className="flex items-center justify-center h-36">
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--color-muted)' }}>Loading…</p>
                </div>
              ) : challanTimeline.length === 0 ? (
                <div className="flex items-center justify-center h-36">
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--color-muted)' }}>No challan data yet.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={challanTimeline} barCategoryGap="35%" margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--color-rule)" strokeDasharray="0" />
                    <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
                    <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChallanTooltip />} cursor={{ fill: 'color-mix(in srgb, var(--color-rule) 40%, transparent)' }} />
                    <Bar dataKey="Confirmed" fill="var(--color-terracotta)" fillOpacity={0.85} radius={[1, 1, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="Draft"     fill="var(--color-kraft)"      fillOpacity={0.9}  radius={[1, 1, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="Cancelled" fill="var(--color-muted)"      fillOpacity={0.6}  radius={[1, 1, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              )}
              <div className="flex items-center gap-5 mt-2">
                {[
                  { label: 'Confirmed', color: 'var(--color-terracotta)', opacity: 0.85 },
                  { label: 'Draft',     color: 'var(--color-kraft)',      opacity: 0.9 },
                  { label: 'Cancelled', color: 'var(--color-muted)',      opacity: 0.6 },
                ].map(l => (
                  <span key={l.label} className="flex items-center gap-1.5" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--color-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, background: l.color, opacity: l.opacity }} />
                    {l.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
