import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const mutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await api.post('/auth/login', data);
      return response.data;
    },
    onSuccess: (data) => {
      login(data.user, data.token);
      navigate('/');
    },
  });

  const onSubmit = (data: LoginForm) => {
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 animate-fade-in p-4">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-primary-900/20 rounded-full blur-3xl"></div>

      <div className="glass w-full max-w-md rounded-2xl shadow-2xl p-8 relative z-10 animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Mini ERP</h2>
          <p className="text-white/70 mt-2">Sign in to your account</p>
        </div>

        {mutation.isError && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-100 p-3 rounded-lg mb-6 text-sm flex items-center">
            <span className="block">Invalid credentials or server error.</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-white/90 text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              {...register('email')}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
              placeholder="admin@test.com"
            />
            {errors.email && <p className="text-red-300 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-white/90 text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              {...register('password')}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-red-300 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-white text-primary-700 font-semibold rounded-lg px-4 py-2.5 hover:bg-white/90 transition-all active:scale-[0.98] flex items-center justify-center disabled:opacity-70 disabled:pointer-events-none mt-4 shadow-lg"
          >
            {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
