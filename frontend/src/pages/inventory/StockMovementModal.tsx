import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { X, ArrowDownToLine, ArrowUpFromLine, Loader2 } from 'lucide-react';
import api from '../../api/client';

const schema = z.object({
  type: z.enum(['IN', 'OUT']),
  quantity: z.number().min(1, 'Must be at least 1'),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface Props { productId: string; productName: string; currentStock: number; onClose: () => void; onSuccess: () => void; }

const StockMovementModal: React.FC<Props> = ({ productId, productName, currentStock, onClose, onSuccess }) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'IN', quantity: 1 },
  });

  const selectedType = watch('type');
  const qty = watch('quantity');
  const wouldOverdraw = selectedType === 'OUT' && (qty || 0) > currentStock;

  const mutation = useMutation({
    mutationFn: async (data: FormValues) =>
      api.post(`/products/${productId}/movement`, { movementType: data.type, quantity: data.quantity, reason: data.notes }),
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (e: any) => setErrorMsg(e.response?.data?.error || 'Failed to update stock'),
  });

  const onSubmit = (data: FormValues) => {
    setErrorMsg(null);
    if (data.type === 'OUT' && data.quantity > currentStock) {
      setErrorMsg(`Cannot remove ${data.quantity} units — only ${currentStock} in stock.`);
      return;
    }
    mutation.mutate(data);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(35, 36, 31, 0.55)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md animate-slide-up"
        style={{ background: 'var(--color-paper)', border: '1px solid var(--color-rule)', borderRadius: '2px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--color-rule)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
            Stock Adjustment
          </p>
          <button onClick={onClose} className="btn-secondary p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
          {/* Product info */}
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>{productName}</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--color-muted)', marginTop: '2px' }}>
              Current stock: <strong style={{ color: 'var(--color-ink)' }}>{currentStock}</strong>
            </p>
          </div>

          {errorMsg && (
            <div className="px-3 py-2 text-xs" style={{ borderLeft: '3px solid var(--color-terracotta)', color: 'var(--color-terracotta)', background: 'color-mix(in srgb, var(--color-terracotta) 8%, transparent)' }}>
              {errorMsg}
            </div>
          )}

          {/* Type toggle */}
          <div className="flex" style={{ border: '1px solid var(--color-rule)', borderRadius: '2px' }}>
            {(['IN', 'OUT'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setValue('type', t)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 transition-colors"
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                  background: selectedType === t ? (t === 'IN' ? 'var(--color-ink)' : 'var(--color-terracotta)') : 'transparent',
                  color: selectedType === t ? 'var(--color-paper)' : 'var(--color-muted)',
                  borderRight: t === 'IN' ? '1px solid var(--color-rule)' : 'none',
                  borderRadius: '0',
                }}
              >
                {t === 'IN' ? <ArrowDownToLine className="w-3.5 h-3.5" /> : <ArrowUpFromLine className="w-3.5 h-3.5" />}
                Stock {t}
              </button>
            ))}
          </div>

          {/* Quantity */}
          <div>
            <label className="field-label">Quantity *</label>
            <input
              type="number"
              min="1"
              {...register('quantity', { valueAsNumber: true })}
              className="field-input"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem' }}
            />
            {errors.quantity && <p className="mt-1 text-xs" style={{ color: 'var(--color-terracotta)' }}>{errors.quantity.message}</p>}
            {wouldOverdraw && (
              <p className="mt-1 text-xs font-medium" style={{ color: 'var(--color-terracotta)', fontFamily: 'var(--font-mono)' }}>
                Exceeds current stock — will be blocked.
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="field-label">Reason (optional)</label>
            <textarea {...register('notes')} rows={2} className="field-textarea mt-1" placeholder="e.g. Opening stock, Damaged goods…" />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending || wouldOverdraw}
            className="btn-primary w-full justify-center py-2.5"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Adjustment'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StockMovementModal;
