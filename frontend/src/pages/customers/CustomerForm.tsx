import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Loader2 } from 'lucide-react';
import api from '../../api/client';

const customerSchema = z.object({
  name: z.string().min(1, 'Required'),
  mobile: z.string().min(1, 'Required'),
  email: z.string().email().optional().or(z.literal('')),
  businessName: z.string().optional(),
  gstNumber: z.string().optional(),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']).optional(),
  address: z.string().optional(),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).optional(),
  followUpDate: z.string().optional(),
  notes: z.array(z.object({ note: z.string().min(1) })).optional(),
});
type CustomerFormValues = z.infer<typeof customerSchema>;

const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div>
    <label className="field-label">{label}</label>
    {children}
    {error && <p className="mt-1 text-xs" style={{ color: 'var(--color-terracotta)' }}>{error}</p>}
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-4 pb-2 text-xs font-semibold" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted)', borderBottom: '1px solid var(--color-rule)' }}>
    {children}
  </p>
);

const CustomerForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id && id !== 'new');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: customerData, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => (await api.get(`/customers/${id}`)).data,
    enabled: isEditing,
  });

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: { status: 'LEAD', customerType: 'RETAIL' },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'notes' });

  useEffect(() => {
    if (customerData) {
      reset({
        ...customerData,
        email: customerData.email || '',
        businessName: customerData.businessName || '',
        gstNumber: customerData.gstNumber || '',
        address: customerData.address || '',
        followUpDate: customerData.followUpDate ? new Date(customerData.followUpDate).toISOString().split('T')[0] : '',
        notes: [],
      });
    }
  }, [customerData, reset]);

  const mutation = useMutation({
    mutationFn: async (data: CustomerFormValues) => {
      const payload = { ...data, email: data.email || undefined, businessName: data.businessName || undefined, gstNumber: data.gstNumber || undefined, address: data.address || undefined, followUpDate: data.followUpDate || undefined };
      return isEditing ? api.put(`/customers/${id}`, payload) : api.post('/customers', payload);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customers'] }); navigate('/customers'); },
  });

  if (isEditing && isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-muted)' }} /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/customers')} className="btn-secondary p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <p className="text-xs mb-1" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
            {isEditing ? 'Edit Customer' : 'New Customer'}
          </p>
          <h1 className="text-xl font-medium" style={{ color: 'var(--color-ink)' }}>
            {isEditing ? customerData?.name : 'Create a customer record'}
          </h1>
        </div>
      </div>

      {mutation.isError && (
        <div className="px-4 py-3 text-sm" style={{ borderLeft: '3px solid var(--color-terracotta)', color: 'var(--color-terracotta)', background: 'color-mix(in srgb, var(--color-terracotta) 8%, transparent)' }}>
          Failed to save. Please check your inputs.
        </div>
      )}

      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-6">
        {/* Basic info */}
        <div className="p-6 space-y-5" style={{ border: '1px solid var(--color-rule)', borderRadius: '2px' }}>
          <SectionTitle>Basic Information</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Full Name *" error={errors.name?.message}>
              <input type="text" {...register('name')} className="field-input" />
            </Field>
            <Field label="Mobile *" error={errors.mobile?.message}>
              <input type="text" {...register('mobile')} className="field-input" />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <input type="email" {...register('email')} className="field-input" />
            </Field>
          </div>
        </div>

        {/* Business */}
        <div className="p-6 space-y-5" style={{ border: '1px solid var(--color-rule)', borderRadius: '2px' }}>
          <SectionTitle>Business Details</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Business Name">
              <input type="text" {...register('businessName')} className="field-input" />
            </Field>
            <Field label="GST Number">
              <input type="text" {...register('gstNumber')} className="field-input" />
            </Field>
            <Field label="Customer Type">
              <select {...register('customerType')} className="field-select">
                <option value="RETAIL">Retail</option>
                <option value="WHOLESALE">Wholesale</option>
                <option value="DISTRIBUTOR">Distributor</option>
              </select>
            </Field>
            <Field label="Status">
              <select {...register('status')} className="field-select">
                <option value="LEAD">Lead</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </Field>
            <Field label="Follow Up Date">
              <input type="date" {...register('followUpDate')} className="field-input" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Address">
                <textarea {...register('address')} rows={2} className="field-textarea mt-1" />
              </Field>
            </div>
          </div>
        </div>

        {/* Existing notes */}
        {isEditing && customerData?.notes?.length > 0 && (
          <div className="p-6 space-y-3" style={{ border: '1px solid var(--color-rule)', borderRadius: '2px' }}>
            <SectionTitle>Existing Notes</SectionTitle>
            {customerData.notes.map((n: any) => (
              <div key={n.id} className="p-3 text-sm" style={{ borderLeft: '3px solid var(--color-rule)' }}>
                <p style={{ color: 'var(--color-ink)' }}>{n.note}</p>
                <p className="mt-1" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--color-muted)', letterSpacing: '0.04em' }}>
                  {n.createdBy?.name} · {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Add new notes */}
        <div className="p-6 space-y-4" style={{ border: '1px solid var(--color-rule)', borderRadius: '2px' }}>
          <div className="flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-rule)', paddingBottom: '0.75rem' }}>
            <SectionTitle>Add Notes</SectionTitle>
            <button type="button" onClick={() => append({ note: '' })} className="btn-secondary py-1 text-xs">
              <Plus className="w-3 h-3" /> Add Note
            </button>
          </div>
          {fields.length === 0 && <p className="text-sm italic" style={{ color: 'var(--color-muted)' }}>No new notes.</p>}
          {fields.map((field, idx) => (
            <div key={field.id} className="flex gap-2 items-start">
              <textarea {...register(`notes.${idx}.note`)} rows={2} className="field-textarea flex-1" placeholder="Write a note…" />
              <button type="button" onClick={() => remove(idx)} className="btn-danger p-1.5 mt-1"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/customers')} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;
