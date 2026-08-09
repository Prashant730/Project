import React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Loader2 } from 'lucide-react';
import api from '../../api/client';

const challanSchema = z.object({
  customerId: z.string().uuid('Please select a customer'),
  items: z.array(z.object({
    productId: z.string().uuid('Please select a product'),
    quantity: z.number().int().positive('Quantity must be positive'),
  })).min(1, 'At least one item is required'),
});

type ChallanFormValues = z.infer<typeof challanSchema>;

const ChallanForm: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: customerData } = useQuery({
    queryKey: ['customers', { limit: 100 }],
    queryFn: async () => (await api.get('/customers?limit=100')).data,
  });

  const { data: productData } = useQuery({
    queryKey: ['products', { limit: 100 }],
    queryFn: async () => (await api.get('/products?limit=100')).data,
  });

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<ChallanFormValues>({
    resolver: zodResolver(challanSchema),
    defaultValues: { items: [{ productId: '', quantity: 1 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const watchedItems = watch('items');

  const getProductById = (id: string) =>
    productData?.data?.find((p: any) => p.id === id);

  const calculateTotal = () =>
    watchedItems.reduce((sum: number, item: any) => {
      const product = getProductById(item.productId);
      if (!product || !item.quantity) return sum;
      return sum + Number(product.unitPrice) * (item.quantity || 0);
    }, 0);

  const mutation = useMutation({
    mutationFn: async (data: ChallanFormValues) =>
      (await api.post('/challans', data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challans'] });
      navigate('/challans');
    },
  });

  const onSubmit = (data: ChallanFormValues) => mutation.mutate(data);

  const customers = customerData?.data || [];
  const products = productData?.data || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/challans')} className="p-2 bg-surface rounded-full border border-border-color hover:bg-surface-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-text-main" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-main">New Sales Challan</h1>
          <p className="text-text-muted text-sm mt-1">Create a draft challan for a customer</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Customer Selection */}
        <div className="bg-surface rounded-2xl border border-border-color shadow-sm p-6">
          <h2 className="text-lg font-bold text-text-main border-b border-border-color pb-3 mb-4">Customer</h2>
          <div>
            <label className="block text-sm font-medium text-text-main mb-1">Select Customer <span className="text-red-500">*</span></label>
            <select
              {...register('customerId')}
              className="w-full bg-surface-muted border border-border-color rounded-lg px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            >
              <option value="">-- Choose a customer --</option>
              {customers.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.businessName ? ` (${c.businessName})` : ''}
                </option>
              ))}
            </select>
            {errors.customerId && <p className="text-red-500 text-xs mt-1">{errors.customerId.message}</p>}
          </div>
        </div>

        {/* Items */}
        <div className="bg-surface rounded-2xl border border-border-color shadow-sm p-6">
          <div className="flex items-center justify-between border-b border-border-color pb-3 mb-4">
            <h2 className="text-lg font-bold text-text-main">Line Items</h2>
            <button
              type="button"
              onClick={() => append({ productId: '', quantity: 1 })}
              className="text-primary-600 font-medium text-sm flex items-center gap-1 hover:bg-primary-50 dark:hover:bg-primary-900/20 px-3 py-1.5 rounded-lg"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>

          {errors.items?.root && (
            <p className="text-red-500 text-sm mb-4">{errors.items.root.message}</p>
          )}

          <div className="space-y-4">
            {/* Header row */}
            <div className="hidden md:grid grid-cols-12 gap-3 text-xs text-text-muted uppercase font-semibold px-1">
              <div className="col-span-6">Product</div>
              <div className="col-span-2 text-center">Stock</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-1 text-right">Subtotal</div>
              <div className="col-span-1"></div>
            </div>

            {fields.map((field, index) => {
              const selectedProduct = getProductById(watchedItems[index]?.productId);
              const subtotal = selectedProduct
                ? Number(selectedProduct.unitPrice) * (watchedItems[index]?.quantity || 0)
                : 0;

              return (
                <div key={field.id} className="grid grid-cols-12 gap-3 items-start bg-surface-muted rounded-xl p-3 border border-border-color">
                  <div className="col-span-12 md:col-span-6">
                    <Controller
                      name={`items.${index}.productId`}
                      control={control}
                      render={({ field: f }) => (
                        <select
                          {...f}
                          className="w-full bg-surface border border-border-color rounded-lg px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm"
                        >
                          <option value="">-- Select product --</option>
                          {products.map((p: any) => (
                            <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>
                          ))}
                        </select>
                      )}
                    />
                    {errors.items?.[index]?.productId && (
                      <p className="text-red-500 text-xs mt-1">{errors.items[index]?.productId?.message}</p>
                    )}
                  </div>

                  <div className="col-span-4 md:col-span-2 flex items-center justify-center">
                    {selectedProduct ? (
                      <span className={`text-sm font-semibold px-2.5 py-1 rounded-full border ${
                        selectedProduct.currentStock <= selectedProduct.minStockAlert
                          ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                      }`}>
                        {selectedProduct.currentStock}
                      </span>
                    ) : <span className="text-text-muted text-sm">—</span>}
                  </div>

                  <div className="col-span-4 md:col-span-2">
                    <input
                      type="number"
                      min="1"
                      {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                      className="w-full bg-surface border border-border-color rounded-lg px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm text-center"
                    />
                    {errors.items?.[index]?.quantity && (
                      <p className="text-red-500 text-xs mt-1">{errors.items[index]?.quantity?.message}</p>
                    )}
                  </div>

                  <div className="col-span-3 md:col-span-1 flex items-center justify-end">
                    <span className="text-sm font-semibold text-text-main">
                      ₹{subtotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="col-span-1 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="mt-6 pt-4 border-t border-border-color flex justify-end">
            <div className="text-right">
              <p className="text-text-muted text-sm">Estimated Total</p>
              <p className="text-2xl font-bold text-text-main">₹{calculateTotal().toFixed(2)}</p>
              <p className="text-xs text-text-muted mt-1">Final prices are snapshotted on confirmation</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/challans')} className="px-5 py-2.5 rounded-lg font-medium text-text-main border border-border-color hover:bg-surface-muted transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={mutation.isPending} className="px-5 py-2.5 rounded-lg font-medium text-white bg-primary-600 hover:bg-primary-700 flex items-center gap-2 transition-colors disabled:opacity-70">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save as Draft
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChallanForm;
