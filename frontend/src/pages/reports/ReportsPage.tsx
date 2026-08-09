import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import api from '../../api/client';

/* ─── CSV export helper ───────────────────────────────────────────────────── */
function downloadCSV(rows: string[][], filename: string) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ─── Stat card ───────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div style={{ border: '1px solid var(--color-rule)', borderRadius: '2px', padding: '1.25rem 1.5rem' }}>
    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: '0.5rem' }}>
      {label}
    </p>
    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 600, color: 'var(--color-ink)', lineHeight: 1 }}>
      {value}
    </p>
    {sub && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--color-muted)', marginTop: '0.35rem' }}>{sub}</p>}
  </div>
);

const ReportsPage: React.FC = () => {
  /* ── Fetch raw data ─────────────────────────────────────────────────────── */
  const { data: challanAll, isLoading: chalLoading } = useQuery({
    queryKey: ['challans-report'],
    queryFn: async () => (await api.get('/challans?limit=500')).data,
  });

  const { data: productAll, isLoading: prodLoading } = useQuery({
    queryKey: ['products-report'],
    queryFn: async () => (await api.get('/products?limit=500')).data,
  });

  const { data: customerAll, isLoading: custLoading } = useQuery({
    queryKey: ['customers-report'],
    queryFn: async () => (await api.get('/customers?limit=500')).data,
  });

  /* ── Derived: challan breakdown ─────────────────────────────────────────── */
  const challans: any[] = challanAll?.data || [];
  const confirmed  = challans.filter(c => c.status === 'CONFIRMED');
  const draft      = challans.filter(c => c.status === 'DRAFT');
  const cancelled  = challans.filter(c => c.status === 'CANCELLED');

  /* ── Derived: low stock ─────────────────────────────────────────────────── */
  const products: any[] = productAll?.data || [];
  const lowStock = products.filter(p => p.currentStock <= p.minStockAlert);

  /* ── Derived: top customers (by confirmed challan count) ─────────────────── */
  const customers: any[] = customerAll?.data || [];
  const customerChallanCounts: Record<string, number> = {};
  confirmed.forEach(ch => {
    customerChallanCounts[ch.customer?.name || ch.customerId] =
      (customerChallanCounts[ch.customer?.name || ch.customerId] || 0) + 1;
  });
  const topCustomers = Object.entries(customerChallanCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const isLoading = chalLoading || prodLoading || custLoading;
  const Skel = () => <div className="h-10 w-24 animate-pulse rounded-sm" style={{ background: 'var(--color-rule)' }} />;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs mb-1" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
          Analytics
        </p>
        <h1 className="text-2xl font-medium" style={{ color: 'var(--color-ink)' }}>Reports</h1>
      </div>

      {/* ── Challan Summary ───────────────────────────────────────────────── */}
      <section className="space-y-3">
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)', borderBottom: '1px solid var(--color-rule)', paddingBottom: '0.5rem' }}>
          Challan Summary
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isLoading ? [1,2,3,4].map(i => <div key={i} style={{ border:'1px solid var(--color-rule)', borderRadius:'2px', padding:'1.25rem 1.5rem' }}><Skel /></div>) : (
            <>
              <StatCard label="Total"     value={challans.length} />
              <StatCard label="Confirmed" value={confirmed.length} sub={`${challans.length ? Math.round(confirmed.length / challans.length * 100) : 0}% of total`} />
              <StatCard label="Draft"     value={draft.length} />
              <StatCard label="Cancelled" value={cancelled.length} />
            </>
          )}
        </div>
      </section>

      {/* ── Revenue Summary ───────────────────────────────────────────────── */}
      <section className="space-y-3">
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)', borderBottom: '1px solid var(--color-rule)', paddingBottom: '0.5rem' }}>
          Revenue (Confirmed Challans)
        </p>
        {/* Note: subtotals are stored per item; we need to fetch each challan's items.
            We approximate from totalQuantity * avgUnitPrice or note this needs line-item data.
            Instead we show total qty dispatched since we don't have subtotals in the list endpoint. */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {isLoading ? [1,2,3].map(i => <div key={i} style={{ border:'1px solid var(--color-rule)', borderRadius:'2px', padding:'1.25rem 1.5rem' }}><Skel /></div>) : (
            <>
              <StatCard
                label="Confirmed Challans"
                value={confirmed.length}
                sub="Dispatched orders"
              />
              <StatCard
                label="Total Qty Dispatched"
                value={confirmed.reduce((s, c) => s + (c.totalQuantity || 0), 0)}
                sub="Units across all confirmed"
              />
              <StatCard
                label="Active Customers"
                value={customers.filter(c => c.status === 'ACTIVE').length}
                sub={`of ${customers.length} total`}
              />
            </>
          )}
        </div>
      </section>

      {/* ── Two-column: Low Stock + Top Customers ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Report */}
        <section className="space-y-3">
          <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--color-rule)' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
              Low Stock Report
            </p>
            {lowStock.length > 0 && (
              <button
                className="btn-secondary py-1 px-2"
                onClick={() => downloadCSV(
                  [['Product', 'SKU', 'Current Stock', 'Alert Threshold'],
                   ...lowStock.map(p => [p.name, p.sku, p.currentStock, p.minStockAlert])],
                  'low-stock-report.csv'
                )}
              >
                <Download className="w-3 h-3" />
                Export CSV
              </button>
            )}
          </div>

          <div style={{ border: '1px solid var(--color-rule)', borderRadius: '2px' }}>
            {prodLoading ? (
              <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-8 animate-pulse rounded-sm" style={{ background: 'var(--color-rule)' }} />)}</div>
            ) : lowStock.length === 0 ? (
              <p className="p-5 text-sm" style={{ color: 'var(--color-muted)' }}>All products are adequately stocked. ✓</p>
            ) : (
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style={{ textAlign: 'center' }}>Stock</th>
                    <th style={{ textAlign: 'center' }}>Alert At</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((p: any) => (
                    <tr key={p.id}>
                      <td>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>{p.name}</p>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--color-muted)' }}>{p.sku}</p>
                      </td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#d97706', fontSize: '1rem' }}>
                        {p.currentStock}
                      </td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--color-muted)' }}>
                        {p.minStockAlert}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Top Customers */}
        <section className="space-y-3">
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)', borderBottom: '1px solid var(--color-rule)', paddingBottom: '0.5rem' }}>
            Top Customers (by Confirmed Challans)
          </p>

          <div style={{ border: '1px solid var(--color-rule)', borderRadius: '2px' }}>
            {chalLoading ? (
              <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-8 animate-pulse rounded-sm" style={{ background: 'var(--color-rule)' }} />)}</div>
            ) : topCustomers.length === 0 ? (
              <p className="p-5 text-sm" style={{ color: 'var(--color-muted)' }}>No confirmed challans yet.</p>
            ) : (
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Customer</th>
                    <th style={{ textAlign: 'right' }}>Confirmed Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.map(([name, count], idx) => (
                    <tr key={name}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--color-muted)', width: '2rem' }}>
                        {idx + 1}
                      </td>
                      <td className="font-medium text-sm" style={{ color: 'var(--color-ink)' }}>{name}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '1rem', color: 'var(--color-ink)' }}>
                        {count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      {/* ── All products export ───────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--color-rule)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
            Full Inventory Export
          </p>
          <button
            className="btn-secondary py-1 px-2"
            disabled={prodLoading}
            onClick={() => downloadCSV(
              [['Product', 'SKU', 'Category', 'Unit Price', 'Current Stock', 'Alert Threshold'],
               ...products.map(p => [p.name, p.sku, p.category || '', Number(p.unitPrice).toFixed(2), p.currentStock, p.minStockAlert])],
              'inventory-report.csv'
            )}
          >
            <Download className="w-3 h-3" />
            Export CSV
          </button>
        </div>
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
          Downloads a full CSV of all {products.length} products with pricing and stock levels.
        </p>
      </section>
    </div>
  );
};

export default ReportsPage;
