import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

const createSchema = z.object({
  name:     z.string().min(1, 'Required'),
  email:    z.string().email('Valid email required'),
  password: z.string().min(6, 'Min 6 characters'),
  role:     z.enum(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']),
});

const editSchema = z.object({
  name:     z.string().min(1, 'Required'),
  role:     z.enum(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']),
  password: z.string().min(6, 'Min 6 characters').optional().or(z.literal('')),
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues   = z.infer<typeof editSchema>;

const Field = ({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) => (
  <div>
    <label className="field-label">{label}</label>
    {children}
    {hint  && <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>{hint}</p>}
    {error && <p className="mt-1 text-xs" style={{ color: 'var(--color-terracotta)' }}>{error}</p>}
  </div>
);

const UserForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id && id !== 'new');
  const navigate  = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const { data: userData, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => (await api.get(`/users`)).data.data.find((u: any) => u.id === id),
    enabled: isEditing,
  });

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'SALES' },
  });

  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { role: 'SALES', password: '' },
  });

  const form = isEditing ? editForm : createForm;

  useEffect(() => {
    if (userData && isEditing) {
      editForm.reset({ name: userData.name, role: userData.role, password: '' });
    }
  }, [userData, isEditing]);

  const mutation = useMutation({
    mutationFn: async (data: CreateValues | EditValues) => {
      if (isEditing) {
        const payload: any = { name: data.name, role: data.role };
        if ((data as EditValues).password) payload.password = (data as EditValues).password;
        return api.put(`/users/${id}`, payload);
      }
      return api.post('/users', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/users');
    },
  });

  if (isEditing && isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-muted)' }} /></div>;
  }

  const isSelf = isEditing && userData?.id === currentUser?.id;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/users')} className="btn-secondary p-2"><ArrowLeft className="w-4 h-4" /></button>
        <div>
          <p className="text-xs mb-1" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
            {isEditing ? 'Edit User' : 'New User'}
          </p>
          <h1 className="text-xl font-medium" style={{ color: 'var(--color-ink)' }}>
            {isEditing ? userData?.name || 'Loading…' : 'Create a system user'}
          </h1>
        </div>
      </div>

      {mutation.isError && (
        <div className="px-4 py-3 text-sm" style={{ borderLeft: '3px solid var(--color-terracotta)', color: 'var(--color-terracotta)', background: 'color-mix(in srgb, var(--color-terracotta) 8%, transparent)' }}>
          {(mutation.error as any)?.response?.data?.message || 'Failed to save user.'}
        </div>
      )}

      <form
        onSubmit={form.handleSubmit((d) => mutation.mutate(d as any))}
        className="p-6 space-y-5"
        style={{ border: '1px solid var(--color-rule)', borderRadius: '2px' }}
      >
        <Field label="Full Name *" error={form.formState.errors.name?.message}>
          <input type="text" {...(form.register as any)('name')} className="field-input" />
        </Field>

        {!isEditing && (
          <Field label="Email *" error={(createForm.formState.errors as any).email?.message}>
            <input type="email" {...createForm.register('email')} className="field-input" style={{ fontFamily: 'var(--font-mono)' }} />
          </Field>
        )}

        {isEditing && userData && (
          <div>
            <label className="field-label">Email</label>
            <p className="pt-1 pb-2 text-sm border-b" style={{ fontFamily: 'var(--font-mono)', borderColor: 'var(--color-rule)', color: 'var(--color-muted)' }}>
              {userData.email}
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>Email cannot be changed.</p>
          </div>
        )}

        <Field label="Role *" error={form.formState.errors.role?.message}>
          <select {...(form.register as any)('role')} className="field-select" disabled={isSelf}>
            <option value="ADMIN">Admin — full access</option>
            <option value="SALES">Sales — customers & challans</option>
            <option value="WAREHOUSE">Warehouse — inventory & confirm challans</option>
            <option value="ACCOUNTS">Accounts — read-only</option>
          </select>
          {isSelf && <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>You cannot change your own role.</p>}
        </Field>

        <Field
          label={isEditing ? 'New Password (optional)' : 'Password *'}
          hint={isEditing ? 'Leave blank to keep existing password.' : 'Minimum 6 characters.'}
          error={form.formState.errors.password?.message}
        >
          <input type="password" {...(form.register as any)('password')} className="field-input" />
        </Field>

        <div className="flex justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--color-rule)' }}>
          <button type="button" onClick={() => navigate('/users')} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {isEditing ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
