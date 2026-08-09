import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
type LoginForm = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const mutation = useMutation({
    mutationFn: async (data: LoginForm) => (await api.post('/auth/login', data)).data,
    onSuccess: (data) => { login(data.user, data.token); navigate('/'); },
  });

  return (
    <div className="min-h-screen flex animate-fade-in">
      {/* LEFT — ink panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-96 shrink-0 p-12"
        style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
      >
        <div>
          <p
            className="text-2xl font-semibold tracking-tight"
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}
          >
            Mini ERP
          </p>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--color-kraft)' }}>
            Customer management, inventory control, and sales challans — in one place.
          </p>
        </div>
        <p
          className="text-xs"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-kraft)', letterSpacing: '0.06em' }}
        >
          v 1.0.0
        </p>
      </div>

      {/* RIGHT — form */}
      <div
        className="flex-1 flex items-center justify-center p-8"
        style={{ background: 'var(--color-paper)' }}
      >
        <div className="w-full max-w-sm">
          {/* Mobile wordmark */}
          <p
            className="lg:hidden text-xl font-semibold mb-10"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Mini ERP
          </p>

          <p
            className="text-xs mb-8"
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)' }}
          >
            Sign in
          </p>

          {mutation.isError && (
            <div
              className="mb-6 px-3 py-2 text-sm"
              style={{ borderLeft: '3px solid var(--color-terracotta)', color: 'var(--color-terracotta)', background: 'color-mix(in srgb, var(--color-terracotta) 8%, transparent)' }}
            >
              Invalid credentials. Please try again.
            </div>
          )}

          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-8">
            <div>
              <label className="field-label">Email</label>
              <input
                type="email"
                autoComplete="email"
                {...register('email')}
                placeholder="admin@test.com"
                className="field-input"
              />
              {errors.email && <p className="mt-1 text-xs" style={{ color: 'var(--color-terracotta)' }}>{errors.email.message}</p>}
            </div>

            <div>
              <label className="field-label">Password</label>
              <input
                type="password"
                autoComplete="current-password"
                {...register('password')}
                placeholder="••••••••"
                className="field-input"
              />
              {errors.password && <p className="mt-1 text-xs" style={{ color: 'var(--color-terracotta)' }}>{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-primary w-full justify-center py-3"
            >
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
