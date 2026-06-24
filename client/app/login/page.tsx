'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Valid email required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema as any),
  });

  async function onSubmit(data: FormData) {
    setError('');
    setIsLoading(true);
    try {
      // Supabase Passwordless Login (OTP)
      const { error: supabaseError } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          shouldCreateUser: true, // Allow legacy users to get a Supabase ID
        }
      });

      if (supabaseError) throw supabaseError;

      toast.success('OTP sent to your email!');
      // Route to verify-otp (the verify page gracefully handles already-active users)
      router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please try again.');
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
          <h1 style={{ fontSize: 'var(--text-heading)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Welcome back</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Login password-free to your account</p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="email" style={{ color: 'var(--text-primary)' }}>Email</Label>
            <input 
              id="email" 
              type="email" 
              placeholder="you@example.com" 
              {...register('email')} 
              className="input-base"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>
          
          {error && (
            <div className="p-3 rounded-lg text-sm text-red-400 border border-red-500/20 bg-red-500/10">
              {error}
            </div>
          )}
          
          <button type="submit" className="btn-primary w-full mt-2 py-3 text-sm" disabled={isLoading}>
            {isLoading ? 'Sending OTP...' : 'Login with Email'}
          </button>
        </form>
        
        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium hover:underline" style={{ color: 'var(--color-brand)' }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}