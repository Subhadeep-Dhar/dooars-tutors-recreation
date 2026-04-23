'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap } from 'lucide-react';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must contain uppercase, lowercase and a number'),
  role: z.enum(['student', 'tutor', 'org']),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuthStore();
  const [error, setError] = useState('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema as any),
    defaultValues: { role: 'student' },
  });

  const selectedRole = watch('role');

  async function onSubmit(data: FormData) {
    setError('');
    try {
      await registerUser(data);
      toast.success('Account created successfully!');
      if (data.role === 'student') router.push('/search');
      else router.push('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed');
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-8" style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-md p-8 rounded-2xl shadow-token-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center gradient-primary text-white shadow-token-md">
              <GraduationCap size={24} />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Create an account</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Join Dooars Tutors today</p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Role selector */}
          <div className="space-y-2">
            <Label style={{ color: 'var(--text-primary)' }}>I am a</Label>
            <div className="grid grid-cols-3 gap-2">
              {(['student', 'tutor', 'org'] as const).map((role) => (
                <label
                  key={role}
                  className="flex items-center justify-center p-2 rounded-lg cursor-pointer text-sm font-medium transition-colors"
                  style={{
                    background: selectedRole === role ? 'var(--bg-elevated)' : 'transparent',
                    border: `1px solid ${selectedRole === role ? 'var(--gradient-to)' : 'var(--border)'}`,
                    color: selectedRole === role ? 'var(--gradient-to)' : 'var(--text-secondary)',
                  }}
                >
                  <input type="radio" value={role} {...register('role')} className="sr-only" />
                  {role === 'student' ? 'Student' : role === 'tutor' ? 'Tutor' : 'Organization'}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name" style={{ color: 'var(--text-primary)' }}>Full name</Label>
            <input id="name" placeholder="Your full name" {...register('name')} className="input-base" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" style={{ color: 'var(--text-primary)' }}>Email</Label>
            <input id="email" type="email" placeholder="you@example.com" {...register('email')} className="input-base" />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" style={{ color: 'var(--text-primary)' }}>Password</Label>
            <input id="password" type="password" placeholder="Min 8 chars, upper + lower + number" {...register('password')} className="input-base" />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>

          {error && (
            <div className="p-3 rounded-lg text-sm text-red-400 border border-red-500/20 bg-red-500/10">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full mt-2 py-3 text-sm" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        
        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-medium hover:underline" style={{ color: 'var(--gradient-to)' }}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}