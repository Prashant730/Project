import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { X, ArrowDownToLine, ArrowUpFromLine, Loader2, AlertTriangle } from 'lucide-react';
import api from '../../api/client';

const movementSchema = z.object({
  type: z.enum(['IN', 'OUT']),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  notes: z.string().optional(),
});

type MovementFormValues = z.infer<typeof movementSchema>;

interface Props {
  productId: string;
  productName: string;
  currentStock: number;
  onClose: () => void;
  onSuccess: () => void;
}

const StockMovementModal: React.FC<Props> = ({ productId, productName, currentStock, onClose, onSuccess }) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<MovementFormValues>({
    resolver: zodResolver(movementSchema),
    defaultValues: { type: 'IN', quantity: 1 }
  });

  const selectedType = watch('type');
  const inputQuantity = watch('quantity');

  const mutation = useMutation({
    mutationFn: async (data: MovementFormValues) => {
      return api.post(`/products/${productId}/movement`, {
        movementType: data.type,
        quantity: data.quantity,
        reason: data.notes,
      });
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      setErrorMsg(error.response?.data?.error || 'Failed to update stock');
    }
  });

  const onSubmit = (data: MovementFormValues) => {
    setErrorMsg(null);
    if (data.type === 'OUT' && data.quantity > currentStock) {
      setErrorMsg(`Cannot remove ${data.quantity} units. Only ${currentStock} in stock.`);
      return;
    }
    mutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface w-full max-w-md rounded-2xl shadow-xl border border-border-color overflow-hidden animate-slide-up">
        <div className="p-4 border-b border-border-color flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-main">Stock Adjustment</h2>
          <button onClick={onClose} className="p-1 hover:bg-surface-muted rounded-lg text-text-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div>
            <p className="text-sm text-text-muted mb-1">Product</p>
            <p className="font-semibold text-text-main">{productName}</p>
            <p className="text-xs text-text-muted mt-1">Current Stock: <span className="font-bold text-text-main">{currentStock}</span></p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 p-3 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setValue('type', 'IN')}
              className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-colors ${selectedType === 'IN' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'border-border-color bg-surface-muted text-text-muted hover:border-emerald-200'}`}
            >
              <ArrowDownToLine className="w-6 h-6" />
              <span className="font-semibold text-sm">Stock IN</span>
            </button>
            <button
              type="button"
              onClick={() => setValue('type', 'OUT')}
              className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-colors ${selectedType === 'OUT' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' : 'border-border-color bg-surface-muted text-text-muted hover:border-amber-200'}`}
            >
              <ArrowUpFromLine className="w-6 h-6" />
              <span className="font-semibold text-sm">Stock OUT</span>
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-main mb-1">Quantity <span className="text-red-500">*</span></label>
            <input 
              type="number" 
              {...register('quantity', { valueAsNumber: true })} 
              className="w-full bg-surface-muted border border-border-color rounded-lg px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500/50" 
              min="1"
            />
            {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>}
            
            {/* Visual warning if trying to OUT more than current stock */}
            {selectedType === 'OUT' && (inputQuantity || 0) > currentStock && (
              <p className="text-red-500 text-xs mt-1 font-medium">Quantity exceeds current stock. Action will be blocked.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-main mb-1">Notes (Optional)</label>
            <textarea 
              {...register('notes')} 
              rows={2} 
              className="w-full bg-surface-muted border border-border-color rounded-lg px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500/50" 
              placeholder="Reason for adjustment (e.g., Damaged goods, Initial stock)"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={mutation.isPending || (selectedType === 'OUT' && (inputQuantity || 0) > currentStock)}
              className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
            >
              {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockMovementModal;
