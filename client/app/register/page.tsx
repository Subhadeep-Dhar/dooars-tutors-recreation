'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap } from 'lucide-react';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(10, 'Valid phone number required'),
  role: z.enum(['student', 'tutor', 'org']),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ message: string; action?: string; link?: string } | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema as any),
    defaultValues: { role: 'student' },
  });

  const selectedRole = watch('role');

  async function onSubmit(data: FormData) {
    setError(null);
    setIsLoading(true);
    try {
      // 1. Supabase OTP Sign Up
      const { error: supabaseError } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          shouldCreateUser: true,
        }
      });

      if (supabaseError) throw supabaseError;

      // 2. Register pending user in MongoDB
      await api.post('/auth/register-pending', {
        email: data.email,
        name: data.name,
        phone: data.phone,
        category: data.role // Or whatever maps to category
      });

      toast.success('OTP sent to your email!');
      // 3. Route to /verify-otp
      router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setError({
          message: 'An account with this email already exists.',
          action: 'Login instead',
          link: '/login'
        });
      } else {
        setError({ message: err?.message || err?.response?.data?.message || 'Registration failed' });
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-8" style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-md p-8" style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-cards)',
      }}>
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white"
              style={{ backgroundColor: 'var(--color-brand)' }}>
              <GraduationCap size={24} />
            </div>
          </div>
          <h1 style={{ fontSize: 'var(--text-heading)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Create an account</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Join Dooars Tutors password-free today</p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Role selector */}
          <div className="space-y-2">
            <Label style={{ color: 'var(--text-primary)' }}>I am a</Label>
            <div className="grid grid-cols-3 gap-2">
              {(['student', 'tutor', 'org'] as const).map((role) => (
                <label
                  key={role}
                  className="flex items-center justify-center p-2.5 cursor-pointer text-sm font-medium transition-colors"
                  style={{
                    background: selectedRole === role ? 'var(--color-brand-light)' : 'transparent',
                    border: `1px solid ${selectedRole === role ? 'var(--color-brand)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-inputs)',
                    color: selectedRole === role ? 'var(--color-brand)' : 'var(--text-secondary)',
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
            <Label htmlFor="phone" style={{ color: 'var(--text-primary)' }}>Phone Number</Label>
            <input id="phone" type="tel" placeholder="10-digit mobile number" {...register('phone')} className="input-base" />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
          </div>

          {error && (
            <div className="p-4 rounded-xl text-sm flex flex-col gap-3" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div className="text-red-400 font-medium">{error.message}</div>
              {error.action && error.link && (
                <Link href={error.link} className="inline-flex items-center justify-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/10 w-full font-medium">
                  {error.action}
                </Link>
              )}
            </div>
          )}

          <button type="submit" className="btn-primary w-full mt-2 py-3 text-sm" disabled={isLoading}>
            {isLoading ? 'Sending OTP...' : 'Continue'}
          </button>
        </form>
        
        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-medium hover:underline" style={{ color: 'var(--color-brand)' }}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}