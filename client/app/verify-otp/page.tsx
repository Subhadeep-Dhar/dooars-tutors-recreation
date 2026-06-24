'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) setEmail(emailParam);
    else {
      toast.error('No email found to verify. Please register first.');
      router.push('/register');
    }
  }, [searchParams, router]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      // 1. Verify OTP with Supabase
      const { data: sessionData, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });

      if (verifyError) throw verifyError;
      if (!sessionData.session || !sessionData.user) throw new Error('Verification failed: No session established.');

      // 2. Call backend /api/auth/activate with the new session token
      // By explicitly passing the Authorization header since api.ts might not have intercepted it yet
      await api.post('/auth/activate', {
        supabaseId: sessionData.user.id,
        email: sessionData.user.email || email
      }, {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      });

      toast.success('Account successfully verified!');
      
      // 3. Force fetch the user profile from our backend now that the account is activated
      await useAuthStore.getState().fetchMe();
      
      // 4. Route to dashboard
      router.push('/dashboard');
      
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Verification failed');
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
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-green-500">
              <ShieldCheck size={24} />
            </div>
          </div>
          <h1 style={{ fontSize: 'var(--text-heading)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Verify Account</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            We've sent a 6-digit code to <br/><span className="font-semibold text-slate-800 dark:text-slate-200">{email}</span>
          </p>
        </div>
        
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="space-y-1.5">
            <Label htmlFor="otp" style={{ color: 'var(--text-primary)' }}>One-Time Password (OTP)</Label>
            <input 
              id="otp" 
              type="text" 
              maxLength={6}
              placeholder="••••••" 
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // only digits
              className="input-base text-center text-2xl tracking-[0.5em] font-mono h-14" 
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg text-sm text-red-400 border border-red-500/20 bg-red-500/10 text-center">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full py-3 text-sm" disabled={isLoading || otp.length < 6}>
            {isLoading ? 'Verifying...' : 'Verify Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}
