import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, XCircle, Loader2, Download, IndianRupee } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { generateInvoice } from '../../utils/generateInvoice';

const rotations = ['stamp-cw', 'stamp-ccw', 'stamp-flat'];

const ChallanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');

  const { data: challan, isLoading, isError } = useQuery({
    queryKey: ['challan', id],
    queryFn: async () => (await api.get(`/challans/${id}`)).data,
    enabled: !!id,
  });

  const { data: company } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get('/settings')).data,
  });

  const confirmMutation = useMutation({
    mutationFn: async () => api.post(`/challans/${id}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challan', id] });
      queryClient.invalidateQueries({ queryKey: ['challans'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => api.post(`/challans/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challan', id] });
      queryClient.invalidateQueries({ queryKey: ['challans'] });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async (amount: number) => api.put(`/challans/${id}/payment`, { amountPaid: amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challan', id] });
      setPaymentModalOpen(false);
    }
  });

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-muted)' }} /></div>;
  if (isError || !challan) return <p className="p-8 text-sm" style={{ color: 'var(--color-terracotta)' }}>Challan not found.</p>;

  const canConfirm = challan.status === 'DRAFT' && user && ['ADMIN', 'WAREHOUSE'].includes(user.role);
  const canCancel  = challan.status !== 'CANCELLED' && user && ['ADMIN', 'SALES'].includes(user.role);
  const canPayment = user && ['ADMIN', 'ACCOUNTS'].includes(user.role);

  const subtotal = challan.items?.reduce((s: number, i: any) => s + Number(i.subtotal), 0) || 0;
  const taxAmount = subtotal * (Number(challan.taxRate) / 100);
  const grandTotal = subtotal + taxAmount - Number(challan.discount);
  const amountPaid = Number(challan.amountPaid) || 0;
  const balanceDue = grandTotal - amountPaid;

  const stampVariant =
    challan.status === 'CONFIRMED' ? 'stamp-confirmed' :
    challan.status === 'DRAFT'     ? 'stamp-draft'     :
    'stamp-cancelled';

  const mutationError = (confirmMutation.error as any)?.response?.data?.message
    || (cancelMutation.error as any)?.response?.data?.message;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/challans')} className="btn-secondary p-2"><ArrowLeft className="w-4 h-4" /></button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-ink)' }}>
                {challan.challanNumber}
              </p>
              <span className={`stamp ${stampVariant} ${rotations[0]}`}>{challan.status}</span>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
              Created by {challan.createdBy?.name} · {new Date(challan.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {canPayment && challan.status !== 'CANCELLED' && balanceDue > 0 && (
            <button onClick={() => { setPaymentAmount(balanceDue); setPaymentModalOpen(true); }} className="btn-secondary text-[var(--color-ink)] border-[var(--color-ink)]">
              <IndianRupee className="w-3.5 h-3.5" />
              Record Payment
            </button>
          )}
          {challan.status === 'CONFIRMED' && (
            <button onClick={() => generateInvoice(challan, company)} className="btn-secondary">
              <Download className="w-3.5 h-3.5" />
              Download Invoice
            </button>
          )}
          {canConfirm && (
            <button onClick={() => confirmMutation.mutate()} disabled={confirmMutation.isPending} className="btn-primary">
              {confirmMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
              Confirm &amp; Dispatch
            </button>
          )}
          {canCancel && challan.status !== 'CANCELLED' && (
            <button onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending} className="btn-danger">
              {cancelMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
              Cancel
            </button>
          )}
        </div>
      </div>

      {mutationError && (
        <div className="px-4 py-3 text-sm" style={{ borderLeft: '3px solid var(--color-terracotta)', color: 'var(--color-terracotta)', background: 'color-mix(in srgb, var(--color-terracotta) 8%, transparent)' }}>
          {mutationError}
        </div>
      )}

      {/* Customer strip */}
      <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-5" style={{ border: '1px solid var(--color-rule)', borderRadius: '2px' }}>
        {[
          { label: 'Customer',    value: challan.customer?.name },
          { label: 'Business',   value: challan.customer?.businessName || '—' },
          { label: 'Mobile',     value: challan.customer?.mobile },
          { label: 'GST',        value: challan.customer?.gstNumber || '—' },
        ].map(f => (
          <div key={f.label}>
            <p className="field-label">{f.label}</p>
            <p className="text-sm font-medium mt-1" style={{ color: 'var(--color-ink)' }}>{f.value}</p>
          </div>
        ))}
      </div>

      {/* Line items table */}
      <div style={{ border: '1px solid var(--color-rule)', borderRadius: '2px' }}>
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--color-rule)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
            Line Items
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th style={{ textAlign: 'center' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Unit Price</th>
                <th style={{ textAlign: 'right' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {challan.items?.map((item: any) => (
                <tr key={item.id}>
                  <td className="font-medium" style={{ color: 'var(--color-ink)' }}>{item.productNameSnapshot}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-muted)' }}>{item.productSkuSnapshot}</td>
                  <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-ink)' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-ink)' }}>₹{Number(item.unitPriceSnapshot).toFixed(2)}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-ink)' }}>₹{Number(item.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Footer Totals */}
        <div className="flex justify-end p-5" style={{ borderTop: '2px solid var(--color-rule)' }}>
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between text-[var(--color-muted)]">
              <span>Subtotal</span>
              <span className="font-mono">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[var(--color-muted)]">
              <span>Tax ({challan.taxRate}%)</span>
              <span className="font-mono">₹{taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[var(--color-muted)] border-b border-[var(--color-rule)] pb-2">
              <span>Discount</span>
              <span className="font-mono text-[var(--color-terracotta)]">- ₹{Number(challan.discount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold pt-2" style={{ color: 'var(--color-ink)' }}>
              <span>Grand Total</span>
              <span className="font-mono">₹{grandTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[var(--color-muted)] pb-2">
              <span>Amount Paid</span>
              <span className="font-mono">₹{amountPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold pt-2" style={{ color: balanceDue > 0 ? 'var(--color-terracotta)' : '#2D6A4F', borderTop: '1px solid var(--color-rule)' }}>
              <span>Balance Due</span>
              <span className="font-mono">₹{Math.max(0, balanceDue).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--color-paper)] border border-[var(--color-rule)] p-6 rounded-sm max-w-sm w-full space-y-4">
            <h2 className="text-lg font-medium text-[var(--color-ink)]">Record Payment</h2>
            <div>
              <label className="field-label">Amount (₹)</label>
              <input type="number" min="0" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(parseFloat(e.target.value))} className="field-input font-mono" />
              <p className="text-xs text-[var(--color-muted)] mt-1">Current Balance: ₹{balanceDue.toFixed(2)}</p>
            </div>
            <div className="flex gap-3 justify-end pt-4">
              <button onClick={() => setPaymentModalOpen(false)} className="btn-secondary">Cancel</button>
              <button 
                onClick={() => paymentMutation.mutate(paymentAmount as number)} 
                disabled={paymentMutation.isPending || !paymentAmount} 
                className="btn-primary"
              >
                {paymentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallanDetail;
