import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import api from '../../api/client';

const productSchema = z.object({
  name: z.string().min(1, 'Required'),
  sku: z.string().min(1, 'Required'),
  description: z.string().optional(),
  unitPrice: z.number().min(0, 'Cannot be negative'),
  minStockAlert: z.number().min(0, 'Cannot be negative'),
});
type ProductFormValues = z.infer<typeof productSchema>;

const Field = ({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) => (
  <div>
    <label className="field-label">{label}</label>
    {children}
    {hint && <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>{hint}</p>}
    {error && <p className="mt-1 text-xs" style={{ color: 'var(--color-terracotta)' }}>{error}</p>}
  </div>
);

const ProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id && id !== 'new');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: productData, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => (await api.get(`/products/${id}`)).data,
    enabled: isEditing,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { unitPrice: 0, minStockAlert: 10 },
  });

  useEffect(() => {
    if (productData) {
      reset({
        name: productData.name,
        sku: productData.sku,
        description: productData.description || '',
        unitPrice: Number(productData.unitPrice),
        minStockAlert: productData.minStockAlert,
      });
    }
  }, [productData, reset]);

  const mutation = useMutation({
    mutationFn: async (data: ProductFormValues) =>
      isEditing ? api.put(`/products/${id}`, data) : api.post('/products', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); navigate('/inventory'); },
  });

  if (isEditing && isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-muted)' }} /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/inventory')} className="btn-secondary p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <p className="text-xs mb-1" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
            {isEditing ? 'Edit Product' : 'New Product'}
          </p>
          <h1 className="text-xl font-medium" style={{ color: 'var(--color-ink)' }}>
            {isEditing ? productData?.name : 'Add to catalog'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(d => mutation.mutate(d))}>
        <div className="p-6 space-y-5" style={{ border: '1px solid var(--color-rule)', borderRadius: '2px' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <Field label="Product Name *" error={errors.name?.message}>
                <input type="text" {...register('name')} className="field-input" />
              </Field>
            </div>
            <Field label="SKU *" error={errors.sku?.message}>
              <input type="text" {...register('sku')} className="field-input" style={{ fontFamily: 'var(--font-mono)' }} />
            </Field>
            <Field label="Unit Price (₹) *" error={errors.unitPrice?.message}>
              <input type="number" step="0.01" {...register('unitPrice', { valueAsNumber: true })} className="field-input" style={{ fontFamily: 'var(--font-mono)' }} />
            </Field>
            <Field label="Low Stock Alert Threshold" hint="Warn when stock falls below this level." error={errors.minStockAlert?.message}>
              <input type="number" {...register('minStockAlert', { valueAsNumber: true })} className="field-input" style={{ fontFamily: 'var(--font-mono)' }} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Description">
                <textarea {...register('description')} rows={3} className="field-textarea mt-1" />
              </Field>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--color-rule)' }}>
            <button type="button" onClick={() => navigate('/inventory')} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary">
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Product
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
