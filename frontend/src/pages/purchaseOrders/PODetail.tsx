import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, X, FileText } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

const PODetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  if ((import.meta as any).env?.DEV) console.debug('PODetail mounted', { id });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: po, isLoading } = useQuery({
    queryKey: ['po', id],
    queryFn: async () => (await api.get(`/purchase-orders/${id}`)).data,
  });

  const confirmMutation = useMutation({
    mutationFn: async () => api.post(`/purchase-orders/${id}/confirm`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['po', id] }),
  });

  const cancelMutation = useMutation({
    mutationFn: async () => api.post(`/purchase-orders/${id}/cancel`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['po', id] }),
  });

  if (isLoading) return <div className="p-12 text-center text-[var(--color-muted)]">Loading...</div>;
  if (!po) return <div className="p-12 text-center text-[var(--color-terracotta)]">Not Found</div>;

  const grandTotal = po.items.reduce((sum: number, item: any) => sum + Number(item.subtotal), 0);
  const canModify = po.status === 'DRAFT' && user && ['ADMIN', 'WAREHOUSE'].includes(user.role);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/purchase-orders')} className="btn-secondary p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <p className="text-xs mb-1 font-mono uppercase text-[var(--color-muted)] tracking-wider">Purchase Order</p>
          <h1 className="text-2xl font-medium text-[var(--color-ink)] flex items-center gap-3">
            {po.poNumber}
            <span className={`stamp ${po.status === 'CONFIRMED' ? 'stamp-confirmed' : po.status === 'CANCELLED' ? 'stamp-cancelled' : 'stamp-draft'} stamp-flat text-[0.65rem] px-2 py-0.5`}>
              {po.status}
            </span>
          </h1>
        </div>
      </div>

      {canModify && (
        <div className="flex gap-3 mb-6">
          <button onClick={() => confirmMutation.mutate()} disabled={confirmMutation.isPending} className="btn-primary bg-[#2D6A4F] text-white">
            <Check className="w-4 h-4 mr-1" /> Confirm PO & Receive Stock
          </button>
          <button onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending} className="btn-secondary border-[var(--color-terracotta)] text-[var(--color-terracotta)]">
            <X className="w-4 h-4 mr-1" /> Cancel PO
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 border border-[var(--color-rule)] bg-[var(--color-paper)]">
          <h3 className="text-sm font-medium mb-3 border-b border-[var(--color-rule)] pb-2 flex items-center gap-2"><FileText className="w-4 h-4"/> Supplier Info</h3>
          <p className="font-medium">{po.supplier.name}</p>
          {po.supplier.contactPerson && <p className="text-sm text-[var(--color-muted)]">{po.supplier.contactPerson}</p>}
          <div className="mt-2 text-sm font-mono text-[var(--color-muted)]">
            {po.supplier.mobile && <p>{po.supplier.mobile}</p>}
            {po.supplier.email && <p>{po.supplier.email}</p>}
          </div>
        </div>
        <div className="p-5 border border-[var(--color-rule)] bg-[var(--color-paper)]">
          <h3 className="text-sm font-medium mb-3 border-b border-[var(--color-rule)] pb-2">Order Details</h3>
          <div className="space-y-1 text-sm">
            <p className="flex justify-between"><span className="text-[var(--color-muted)]">Created On:</span> <span className="font-mono">{new Date(po.createdAt).toLocaleString()}</span></p>
            <p className="flex justify-between"><span className="text-[var(--color-muted)]">Created By:</span> <span>{po.createdBy.name}</span></p>
            <p className="flex justify-between"><span className="text-[var(--color-muted)]">Total Items:</span> <span className="font-mono">{po.totalQuantity}</span></p>
          </div>
        </div>
      </div>

      <div className="border border-[var(--color-rule)] bg-[var(--color-paper)] mt-6">
        <table className="erp-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product</th>
              <th style={{textAlign:'center'}}>Qty</th>
              <th style={{textAlign:'right'}}>Unit Cost</th>
              <th style={{textAlign:'right'}}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {po.items.map((it: any) => (
              <tr key={it.id}>
                <td className="font-mono text-xs">{it.productSkuSnapshot}</td>
                <td className="text-sm">{it.productNameSnapshot}</td>
                <td style={{textAlign:'center'}} className="font-mono">{it.quantity}</td>
                <td style={{textAlign:'right'}} className="font-mono">₹{Number(it.unitCostSnapshot).toFixed(2)}</td>
                <td style={{textAlign:'right'}} className="font-mono">₹{Number(it.subtotal).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[color-mix(in_srgb,var(--color-rule)_30%,transparent)]">
              <td colSpan={4} style={{textAlign:'right'}} className="font-semibold text-sm">Grand Total</td>
              <td style={{textAlign:'right'}} className="font-mono font-bold">₹{grandTotal.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default PODetail;
