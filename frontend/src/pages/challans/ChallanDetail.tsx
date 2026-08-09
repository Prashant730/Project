import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, XCircle, Clock, Package, User, Loader2, AlertTriangle } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

const statusConfig: Record<string, { label: string; icon: React.ReactNode; classes: string }> = {
  DRAFT: { label: 'Draft', icon: <Clock className="w-4 h-4" />, classes: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400' },
  CONFIRMED: { label: 'Confirmed', icon: <CheckCircle className="w-4 h-4" />, classes: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400' },
  CANCELLED: { label: 'Cancelled', icon: <XCircle className="w-4 h-4" />, classes: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400' },
};

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
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  if (isLoading) return (
    <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
  );
  if (isError || !challan) return (
    <div className="text-center p-12 text-red-500">Challan not found.</div>
  );

  const sc = statusConfig[challan.status] || statusConfig.DRAFT;
  const canConfirm = challan.status === 'DRAFT' && user && ['ADMIN', 'WAREHOUSE'].includes(user.role);
  const canCancel = challan.status !== 'CANCELLED' && user && ['ADMIN', 'SALES'].includes(user.role);

  const grandTotal = challan.items?.reduce((sum: number, item: any) =>
    sum + Number(item.subtotal), 0) || 0;

  const mutationError = (confirmMutation.error as any)?.response?.data?.message
    || (cancelMutation.error as any)?.response?.data?.message;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/challans')} className="p-2 bg-surface rounded-full border border-border-color hover:bg-surface-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-main" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-main font-mono">{challan.challanNumber}</h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${sc.classes}`}>
                {sc.icon} {sc.label}
              </span>
            </div>
            <p className="text-text-muted text-sm mt-1">
              Created by {challan.createdBy?.name} on {new Date(challan.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {canConfirm && (
            <button
              onClick={() => confirmMutation.mutate()}
              disabled={confirmMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70"
            >
              {confirmMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Confirm & Dispatch
            </button>
          )}
          {canCancel && challan.status !== 'CANCELLED' && (
            <button
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-surface border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors disabled:opacity-70"
            >
              {cancelMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Cancel
            </button>
          )}
        </div>
      </div>

      {mutationError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-red-700 dark:text-red-400 text-sm">{mutationError}</p>
        </div>
      )}

      {/* Customer */}
      <div className="bg-surface rounded-2xl border border-border-color shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-text-muted" />
          <h2 className="text-lg font-bold text-text-main">Customer</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-text-muted">Name</p>
            <p className="font-semibold text-text-main mt-1">{challan.customer?.name}</p>
          </div>
          {challan.customer?.businessName && (
            <div>
              <p className="text-text-muted">Business</p>
              <p className="font-semibold text-text-main mt-1">{challan.customer.businessName}</p>
            </div>
          )}
          {challan.customer?.mobile && (
            <div>
              <p className="text-text-muted">Mobile</p>
              <p className="font-semibold text-text-main mt-1">{challan.customer.mobile}</p>
            </div>
          )}
          {challan.customer?.gstNumber && (
            <div>
              <p className="text-text-muted">GST Number</p>
              <p className="font-semibold text-text-main mt-1">{challan.customer.gstNumber}</p>
            </div>
          )}
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-surface rounded-2xl border border-border-color shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border-color flex items-center gap-2">
          <Package className="w-5 h-5 text-text-muted" />
          <h2 className="text-lg font-bold text-text-main">Line Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-muted text-xs text-text-muted uppercase font-semibold tracking-wider border-b border-border-color">
                <th className="p-4">Product</th>
                <th className="p-4">SKU</th>
                <th className="p-4 text-center">Qty</th>
                <th className="p-4 text-right">Unit Price</th>
                <th className="p-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color text-sm">
              {challan.items?.map((item: any) => (
                <tr key={item.id} className="hover:bg-surface-muted/50">
                  <td className="p-4 font-medium text-text-main">{item.productNameSnapshot}</td>
                  <td className="p-4 font-mono text-text-muted">{item.productSkuSnapshot}</td>
                  <td className="p-4 text-center font-semibold text-text-main">{item.quantity}</td>
                  <td className="p-4 text-right text-text-main">₹{Number(item.unitPriceSnapshot).toFixed(2)}</td>
                  <td className="p-4 text-right font-semibold text-text-main">₹{Number(item.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border-color bg-surface-muted">
                <td colSpan={4} className="p-4 text-right font-bold text-text-main">Grand Total</td>
                <td className="p-4 text-right font-bold text-xl text-primary-600">₹{grandTotal.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ChallanDetail;
