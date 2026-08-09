import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Save, Loader2 } from 'lucide-react';
import api from '../../api/client';

interface SettingsForm {
  name: string;
  address: string;
  gstNumber: string;
  phone: string;
  email: string;
}

const SettingsPage: React.FC = () => {
  if ((import.meta as any).env?.DEV) console.debug('SettingsPage mounted');
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get('/settings')).data,
  });

  const form = useForm<SettingsForm>({
    defaultValues: { name: '', address: '', gstNumber: '', phone: '', email: '' }
  });

  useEffect(() => {
    if (profile) {
      form.reset(profile);
    }
  }, [profile, form]);

  const mutation = useMutation({
    mutationFn: async (data: SettingsForm) => api.put('/settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      alert('Settings updated successfully!');
    }
  });

  if (isLoading) return <div className="p-12 text-center text-[var(--color-muted)]">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded bg-[var(--color-rule)] flex items-center justify-center text-[var(--color-ink)]">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs mb-1 font-mono uppercase tracking-wider text-[var(--color-muted)]">Configuration</p>
          <h1 className="text-2xl font-medium text-[var(--color-ink)]">Company Profile</h1>
        </div>
      </div>

      <div style={{ border: '1px solid var(--color-rule)', borderRadius: '2px' }} className="p-6">
        <p className="text-sm text-[var(--color-muted)] mb-6">
          These details will appear on your generated invoices and PDFs.
        </p>

        <form onSubmit={form.handleSubmit(d => mutation.mutate(d))} className="space-y-5">
          <div>
            <label className="field-label">Company Name *</label>
            <input type="text" {...form.register('name')} required className="field-input" />
          </div>

          <div>
            <label className="field-label">Full Address</label>
            <textarea {...form.register('address')} rows={3} className="field-input" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="field-label">GST Number</label>
              <input type="text" {...form.register('gstNumber')} className="field-input font-mono uppercase" />
            </div>
            <div>
              <label className="field-label">Phone Number</label>
              <input type="text" {...form.register('phone')} className="field-input" />
            </div>
            <div>
              <label className="field-label">Email Address</label>
              <input type="email" {...form.register('email')} className="field-input" />
            </div>
          </div>

          <div className="flex justify-end pt-4 mt-6 border-t border-[var(--color-rule)]">
            <button type="submit" disabled={mutation.isPending} className="btn-primary">
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
