import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Loader2 } from 'lucide-react';
import api from '../../api/client';

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  mobile: z.string().min(1, 'Mobile is required'),
  email: z.string().email().optional().or(z.literal('')),
  businessName: z.string().optional(),
  gstNumber: z.string().optional(),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']).optional(),
  address: z.string().optional(),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).optional(),
  followUpDate: z.string().optional(),
  notes: z.array(z.object({
    note: z.string().min(1)
  })).optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

const CustomerForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id && id !== 'new');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: customerData, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => (await api.get(`/customers/${id}`)).data,
    enabled: isEditing,
  });

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      status: 'LEAD',
      customerType: 'RETAIL',
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "notes",
  });

  useEffect(() => {
    if (customerData) {
      const resetData = {
        ...customerData,
        email: customerData.email || '',
        businessName: customerData.businessName || '',
        gstNumber: customerData.gstNumber || '',
        address: customerData.address || '',
        followUpDate: customerData.followUpDate ? new Date(customerData.followUpDate).toISOString().split('T')[0] : '',
        notes: [] // We don't populate old notes into the new note field. Existing notes are read-only below.
      };
      reset(resetData);
    }
  }, [customerData, reset]);

  const mutation = useMutation({
    mutationFn: async (data: CustomerFormValues) => {
      // Clean up empty strings to undefined to match Prisma schema
      const payload = {
        ...data,
        email: data.email || undefined,
        businessName: data.businessName || undefined,
        gstNumber: data.gstNumber || undefined,
        address: data.address || undefined,
        followUpDate: data.followUpDate || undefined,
      };

      if (isEditing) {
        return api.put(`/customers/${id}`, payload);
      } else {
        return api.post('/customers', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      navigate('/customers');
    },
  });

  const onSubmit = (data: CustomerFormValues) => {
    mutation.mutate(data);
  };

  if (isEditing && isLoadingCustomer) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/customers')} className="p-2 bg-surface rounded-full border border-border-color hover:bg-surface-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-main" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-main">{isEditing ? 'Edit Customer' : 'New Customer'}</h1>
            <p className="text-text-muted text-sm mt-1">{isEditing ? 'Update customer details and add notes' : 'Enter new customer details'}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-surface rounded-2xl shadow-sm border border-border-color p-6 space-y-6">
          <h2 className="text-lg font-bold text-text-main border-b border-border-color pb-3">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">Full Name <span className="text-red-500">*</span></label>
              <input type="text" {...register('name')} className="w-full bg-surface-muted border border-border-color rounded-lg px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">Mobile Number <span className="text-red-500">*</span></label>
              <input type="text" {...register('mobile')} className="w-full bg-surface-muted border border-border-color rounded-lg px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
              {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">Email</label>
              <input type="email" {...register('email')} className="w-full bg-surface-muted border border-border-color rounded-lg px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl shadow-sm border border-border-color p-6 space-y-6">
          <h2 className="text-lg font-bold text-text-main border-b border-border-color pb-3">Business Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">Business Name</label>
              <input type="text" {...register('businessName')} className="w-full bg-surface-muted border border-border-color rounded-lg px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">GST Number</label>
              <input type="text" {...register('gstNumber')} className="w-full bg-surface-muted border border-border-color rounded-lg px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">Customer Type</label>
              <select {...register('customerType')} className="w-full bg-surface-muted border border-border-color rounded-lg px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500/50">
                <option value="RETAIL">Retail</option>
                <option value="WHOLESALE">Wholesale</option>
                <option value="DISTRIBUTOR">Distributor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">Status</label>
              <select {...register('status')} className="w-full bg-surface-muted border border-border-color rounded-lg px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500/50">
                <option value="LEAD">Lead</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">Follow Up Date</label>
              <input type="date" {...register('followUpDate')} className="w-full bg-surface-muted border border-border-color rounded-lg px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-main mb-1">Address</label>
              <textarea {...register('address')} rows={2} className="w-full bg-surface-muted border border-border-color rounded-lg px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
            </div>
          </div>
        </div>

        {isEditing && customerData?.notes?.length > 0 && (
          <div className="bg-surface rounded-2xl shadow-sm border border-border-color p-6 space-y-4">
            <h2 className="text-lg font-bold text-text-main border-b border-border-color pb-3">Existing Notes</h2>
            <div className="space-y-3">
              {customerData.notes.map((n: any) => (
                <div key={n.id} className="p-3 bg-surface-muted rounded-lg border border-border-color">
                  <p className="text-text-main text-sm">{n.note}</p>
                  <p className="text-xs text-text-muted mt-2 font-medium">By {n.createdBy?.name} on {new Date(n.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-surface rounded-2xl shadow-sm border border-border-color p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border-color pb-3">
            <h2 className="text-lg font-bold text-text-main">Add New Notes</h2>
            <button type="button" onClick={() => append({ note: '' })} className="text-primary-600 font-medium text-sm flex items-center gap-1 hover:bg-primary-50 px-2 py-1 rounded">
              <Plus className="w-4 h-4" /> Add Note
            </button>
          </div>
          
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-start">
              <textarea 
                {...register(`notes.${index}.note`)} 
                rows={2} 
                className="w-full bg-surface-muted border border-border-color rounded-lg px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500/50" 
                placeholder="Write a note..."
              />
              <button type="button" onClick={() => remove(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
          {fields.length === 0 && <p className="text-text-muted text-sm italic">No new notes to add.</p>}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate('/customers')} className="px-5 py-2.5 rounded-lg font-medium text-text-main border border-border-color hover:bg-surface-muted transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={mutation.isPending} className="px-5 py-2.5 rounded-lg font-medium text-white bg-primary-600 hover:bg-primary-700 flex items-center gap-2 transition-colors disabled:opacity-70">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Customer
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;
