import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import api from '../../api/client';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  description: z.string().optional(),
  unitPrice: z.number().min(0, 'Price cannot be negative'),
  minStockAlert: z.number().min(0, 'Alert threshold cannot be negative'),
});

type ProductFormValues = z.infer<typeof productSchema>;

const ProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id && id !== 'new');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: productData, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => (await api.get(`/products/${id}`)).data,
    enabled: isEditing,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      unitPrice: 0,
      minStockAlert: 10,
    }
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
    mutationFn: async (data: ProductFormValues) => {
      if (isEditing) {
        return api.put(`/products/${id}`, data);
      } else {
        return api.post('/products', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      navigate('/inventory');
    },
  });

  const onSubmit = (data: ProductFormValues) => {
    mutation.mutate(data);
  };

  if (isEditing && isLoadingProduct) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/inventory')} className="p-2 bg-surface rounded-full border border-border-color hover:bg-surface-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-text-main" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-main">{isEditing ? 'Edit Product' : 'New Product'}</h1>
          <p className="text-text-muted text-sm mt-1">{isEditing ? 'Update catalog details' : 'Add a new product to the catalog'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-surface rounded-2xl shadow-sm border border-border-color p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-main mb-1">Product Name <span className="text-red-500">*</span></label>
            <input type="text" {...register('name')} className="w-full bg-surface-muted border border-border-color rounded-lg px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-main mb-1">SKU <span className="text-red-500">*</span></label>
            <input type="text" {...register('sku')} className="w-full bg-surface-muted border border-border-color rounded-lg px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
            {errors.sku && <p className="text-red-500 text-xs mt-1">{errors.sku.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-main mb-1">Base Price ($) <span className="text-red-500">*</span></label>
            <input type="number" step="0.01" {...register('unitPrice', { valueAsNumber: true })} className="w-full bg-surface-muted border border-border-color rounded-lg px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
            {errors.unitPrice && <p className="text-red-500 text-xs mt-1">{errors.unitPrice.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-main mb-1">Low Stock Alert Threshold</label>
            <input type="number" {...register('minStockAlert', { valueAsNumber: true })} className="w-full bg-surface-muted border border-border-color rounded-lg px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
            <p className="text-text-muted text-xs mt-1">Warn when stock falls below this level.</p>
            {errors.minStockAlert && <p className="text-red-500 text-xs mt-1">{errors.minStockAlert.message}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-main mb-1">Description (Optional)</label>
            <textarea {...register('description')} rows={3} className="w-full bg-surface-muted border border-border-color rounded-lg px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border-color">
          <button type="button" onClick={() => navigate('/inventory')} className="px-5 py-2.5 rounded-lg font-medium text-text-main border border-border-color hover:bg-surface-muted transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={mutation.isPending} className="px-5 py-2.5 rounded-lg font-medium text-white bg-primary-600 hover:bg-primary-700 flex items-center gap-2 transition-colors disabled:opacity-70">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Product
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
