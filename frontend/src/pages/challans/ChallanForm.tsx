import React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Loader2 } from 'lucide-react';
import api from '../../api/client';

const schema = z.object({
  customerId: z.string().uuid('Select a customer'),
  items: z.array(z.object({
    productId: z.string().uuid('Select a product'),
    quantity: z.number().int().positive('Must be positive'),
  })).min(1, 'At least one item required'),
});
type FormValues = z.infer<typeof schema>;

const ChallanForm: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: customerData } = useQuery({ queryKey: ['customers', { limit: 200 }], queryFn: async () => (await api.get('/customers?limit=200')).data });
  const { data: productData }  = useQuery({ queryKey: ['products',  { limit: 200 }], queryFn: async () => (await api.get('/products?limit=200')).data  });

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { items: [{ productId: '', quantity: 1 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');

  const getProduct = (id: string) => productData?.data?.find((p: any) => p.id === id);

  const grandTotal = watchedItems.reduce((sum: number, item: any) => {
    const p = getProduct(item.productId);
    return sum + (p ? Number(p.unitPrice) * (item.quantity || 0) : 0);
  }, 0);

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => (await api.post('/challans', data)).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['challans'] }); navigate('/challans'); },
  });

  const customers = customerData?.data || [];
  const products  = productData?.data || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/challans')} className="btn-secondary p-2"><ArrowLeft className="w-4 h-4" /></button>
        <div>
          <p className="text-xs mb-1" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>New Challan</p>
          <h1 className="text-xl font-medium" style={{ color: 'var(--color-ink)' }}>Create draft challan</h1>
        </div>
      </div>

      {mutation.isError && (
        <div className="px-4 py-3 text-sm" style={{ borderLeft: '3px solid var(--color-terracotta)', color: 'var(--color-terracotta)', background: 'color-mix(in srgb, var(--color-terracotta) 8%, transparent)' }}>
          Failed to create challan. Please check your inputs.
        </div>
      )}

      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-5">
        {/* Customer */}
        <div className="p-6" style={{ border: '1px solid var(--color-rule)', borderRadius: '2px' }}>
          <p className="text-xs mb-4 pb-2 font-semibold" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted)', borderBottom: '1px solid var(--color-rule)' }}>
            Customer
          </p>
          <div>
            <label className="field-label">Select Customer *</label>
            <select {...register('customerId')} className="field-select">
              <option value="">— choose —</option>
              {customers.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}{c.businessName ? ` (${c.businessName})` : ''}</option>
              ))}
            </select>
            {errors.customerId && <p className="mt-1 text-xs" style={{ color: 'var(--color-terracotta)' }}>{errors.customerId.message}</p>}
          </div>
        </div>

        {/* Items */}
        <div className="p-6" style={{ border: '1px solid var(--color-rule)', borderRadius: '2px' }}>
          <div className="flex items-center justify-between pb-3 mb-4" style={{ borderBottom: '1px solid var(--color-rule)' }}>
            <p className="text-xs font-semibold" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
              Line Items
            </p>
            <button type="button" onClick={() => append({ productId: '', quantity: 1 })} className="btn-secondary py-1">
              <Plus className="w-3 h-3" /> Add Item
            </button>
          </div>

          {/* Column headers */}
          <div className="hidden md:grid grid-cols-12 gap-3 mb-2" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)', paddingBottom: '6px', borderBottom: '1px solid var(--color-rule)' }}>
            <div className="col-span-6">Product</div>
            <div className="col-span-2 text-center">Stock</div>
            <div className="col-span-2 text-center">Qty</div>
            <div className="col-span-1 text-right">Subtotal</div>
            <div className="col-span-1"></div>
          </div>

          <div className="space-y-3 mt-3">
            {fields.map((field, idx) => {
              const selectedProd = getProduct(watchedItems[idx]?.productId);
              const isLow = selectedProd && selectedProd.currentStock <= selectedProd.minStockAlert;
              const subtotal = selectedProd ? Number(selectedProd.unitPrice) * (watchedItems[idx]?.quantity || 0) : 0;

              return (
                <div key={field.id} className="grid grid-cols-12 gap-3 items-center py-2" style={{ borderBottom: '1px solid var(--color-rule)' }}>
                  <div className="col-span-12 md:col-span-6">
                    <Controller name={`items.${idx}.productId`} control={control} render={({ field: f }) => (
                      <select {...f} className="field-select text-sm">
                        <option value="">— select product —</option>
                        {products.map((p: any) => (
                          <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                        ))}
                      </select>
                    )} />
                    {errors.items?.[idx]?.productId && <p className="mt-1 text-xs" style={{ color: 'var(--color-terracotta)' }}>{errors.items[idx]?.productId?.message}</p>}
                  </div>

                  <div className="col-span-3 md:col-span-2 text-center" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: isLow ? '#d97706' : 'var(--color-ink)' }}>
                    {selectedProd ? selectedProd.currentStock : '—'}
                  </div>

                  <div className="col-span-5 md:col-span-2">
                    <input
                      type="number"
                      min="1"
                      {...register(`items.${idx}.quantity`, { valueAsNumber: true })}
                      className="field-input text-center"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    />
                  </div>

                  <div className="col-span-3 md:col-span-1 text-right" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--color-ink)' }}>
                    ₹{subtotal.toFixed(0)}
                  </div>

                  <div className="col-span-1 flex justify-end">
                    <button type="button" onClick={() => remove(idx)} disabled={fields.length === 1} className="btn-danger p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grand total */}
          <div className="mt-5 pt-4 flex justify-end" style={{ borderTop: '1px solid var(--color-rule)' }}>
            <div className="text-right">
              <p className="text-xs mb-1" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
                Estimated Total
              </p>
              <p className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                ₹{grandTotal.toFixed(2)}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>Prices snapshotted on confirmation</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/challans')} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save as Draft
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChallanForm;
