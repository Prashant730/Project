import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import api from '../../api/client';

interface SupplierForm {
  name: string;
  contactPerson: string;
  mobile: string;
  email: string;
  address: string;
  gstNumber: string;
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="field-label">{label}</label>
    {children}
  </div>
);

const SupplierForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  if ((import.meta as any).env?.DEV) console.debug('SupplierForm mounted', { id });
  const isEditing = Boolean(id && id !== 'new');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['supplier', id],
    queryFn: async () => (await api.get(`/suppliers/${id}`)).data,
    enabled: isEditing,
  });

  const form = useForm<SupplierForm>({
    defaultValues: { name: '', contactPerson: '', mobile: '', email: '', address: '', gstNumber: '' },
  });

  useEffect(() => {
    if (data && isEditing) {
      form.reset(data);
    }
  }, [data, isEditing, form]);

  const mutation = useMutation({
    mutationFn: async (payload: SupplierForm) => {
      if (isEditing) return api.put(`/suppliers/${id}`, payload);
      return api.post('/suppliers', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      navigate('/suppliers');
    },
  });

  if (isEditing && isLoading) return <div className="p-12 text-center text-[var(--color-muted)]">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/suppliers')} className="btn-secondary p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <p className="text-xs mb-1 font-mono uppercase tracking-wider text-[var(--color-muted)]">
            {isEditing ? 'Edit Supplier' : 'New Supplier'}
          </p>
          <h1 className="text-xl font-medium text-[var(--color-ink)]">
            {isEditing ? data?.name || 'Loading…' : 'Add Supplier'}
          </h1>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-5 border border-[var(--color-rule)] rounded-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <Field label="Supplier Name *">
              <input type="text" {...form.register('name')} required className="field-input" />
            </Field>
          </div>
          <Field label="Contact Person">
            <input type="text" {...form.register('contactPerson')} className="field-input" />
          </Field>
          <Field label="Mobile Number">
            <input type="text" {...form.register('mobile')} className="field-input" />
          </Field>
          <Field label="Email Address">
            <input type="email" {...form.register('email')} className="field-input" />
          </Field>
          <Field label="GST Number">
            <input type="text" {...form.register('gstNumber')} className="field-input font-mono uppercase" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Full Address">
              <textarea {...form.register('address')} rows={3} className="field-input" />
            </Field>
          </div>
        </div>

        <div className="flex justify-end pt-4 mt-6 border-t border-[var(--color-rule)] gap-3">
          <button type="button" onClick={() => navigate('/suppliers')} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {isEditing ? 'Save Changes' : 'Create Supplier'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SupplierForm;
