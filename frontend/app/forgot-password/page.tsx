'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/axios';

const F = {
  display: "font-[family-name:var(--font-playfair)]",
  space:   "font-[family-name:var(--font-space)]",
  serif:   "font-[family-name:var(--font-serif)]",
  bebas:   "font-[family-name:var(--font-bebas)]",
};

export default function ForgotPasswordStep1() {
  const router = useRouter();
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/send-otp', { email, type: 'forgot_password' });
      sessionStorage.setItem('forgotPasswordData', JSON.stringify({ email }));
      router.push('/forgot-password/verify');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Account not found or error sending OTP');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F5F4F0] flex">

      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-[#1C1C1C] flex-col justify-between p-14 relative overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 59px,rgba(255,255,255,0.03) 59px,rgba(255,255,255,0.03) 60px),repeating-linear-gradient(90deg,transparent,transparent 59px,rgba(255,255,255,0.03) 59px,rgba(255,255,255,0.03) 60px)' }} />
        <div className={`${F.bebas} absolute bottom-0 right-[-2rem] text-white opacity-[0.04] leading-none select-none`} style={{ fontSize: '26rem' }}>E</div>

        <a href="/" className="flex items-center gap-2.5 z-10">
          <div className="w-3.5 h-3.5 bg-[#F7941D]" />
          <span className={`${F.space} font-bold text-white text-lg tracking-[0.05em]`}>ECOSYSTEM</span>
        </a>

        <div className="z-10">
          <div className={`${F.space} text-[11px] tracking-[0.25em] uppercase text-[#F7941D] mb-5`}>Account Recovery</div>
          <h2 className={`${F.display} font-black italic text-white leading-[0.9] mb-7`} style={{ fontSize: 'clamp(44px, 4.5vw, 68px)' }}>
            Reset your<br />access.
          </h2>
          <p className={`${F.serif} text-white/50 text-[16px] leading-[1.8] max-w-sm`}>
            Enter your registered email address. We will send a 6-digit code to verify your identity before resetting your password.
          </p>
        </div>

        <div className={`${F.space} text-white/20 text-[10px] tracking-[0.2em] uppercase z-10`}>
          Digital Platform for Startup Ecosystem 2026
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-14">
        <div className="w-full max-w-[440px]">

          <a href="/" className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-3 h-3 bg-[#F7941D]" />
            <span className={`${F.space} font-bold text-[#1C1C1C] tracking-[0.05em]`}>ECOSYSTEM</span>
          </a>

          <button onClick={() => router.push('/login')}
            className={`${F.space} flex items-center gap-2 text-[#888888] hover:text-[#1C1C1C] transition-colors text-[12px] mb-8`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to login
          </button>

          <div className={`${F.space} text-[11px] tracking-[0.25em] uppercase text-[#F7941D] mb-3`}>Password Reset</div>
          <h1 className={`${F.display} font-black italic text-[#1C1C1C] mb-3`} style={{ fontSize: 'clamp(32px, 3.5vw, 46px)' }}>
            Forgot password?
          </h1>
          <p className={`${F.serif} text-[#888888] text-[14px] mb-10`}>
            Enter your email and we will send you a verification code.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#888888] block mb-1.5`}>Email Address</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`${F.space} w-full border-2 border-[#1C1C1C] bg-white px-4 py-3.5 text-[14px] text-[#1C1C1C] focus:outline-none focus:border-[#F7941D] transition-colors placeholder:text-[#CCCCCC]`} />
            </div>

            {error && (
              <div className={`${F.space} text-[12px] text-[#CC0000] border-l-4 border-[#CC0000] pl-3 py-1.5 bg-red-50`}>{error}</div>
            )}

            <button type="submit" disabled={loading}
              className={`${F.space} font-bold text-[13px] tracking-[0.1em] uppercase bg-[#F7941D] text-white px-6 py-4 hover:bg-[#1C1C1C] disabled:opacity-40 transition-colors`}>
              {loading ? 'Sending Code...' : 'Send Verification Code'}
            </button>

            <p className={`${F.serif} text-center text-[14px] text-[#888888]`}>
              Remember your password?{' '}
              <button type="button" onClick={() => router.push('/login')}
                className={`${F.space} text-[#1C1C1C] font-bold hover:text-[#F7941D] transition-colors`}>
                Sign In
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
