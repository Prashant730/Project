import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

const rotations = ['stamp-cw', 'stamp-ccw', 'stamp-flat'];

const ChallanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: challan, isLoading, isError } = useQuery({
    queryKey: ['challan', id],
    queryFn: async () => (await api.get(`/challans/${id}`)).data,
    enabled: !!id,
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

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-muted)' }} /></div>;
  if (isError || !challan) return <p className="p-8 text-sm" style={{ color: 'var(--color-terracotta)' }}>Challan not found.</p>;

  const canConfirm = challan.status === 'DRAFT' && user && ['ADMIN', 'WAREHOUSE'].includes(user.role);
  const canCancel  = challan.status !== 'CANCELLED' && user && ['ADMIN', 'SALES'].includes(user.role);

  const grandTotal = challan.items?.reduce((s: number, i: any) => s + Number(i.subtotal), 0) || 0;

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

        <div className="flex gap-2">
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
        {/* Grand total row */}
        <div className="flex justify-between items-center px-5 py-4" style={{ borderTop: '2px solid var(--color-rule)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
            Grand Total
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 600, color: 'var(--color-ink)' }}>
            ₹{grandTotal.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChallanDetail;
