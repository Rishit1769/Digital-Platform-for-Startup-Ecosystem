'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/axios';

const F = {
  display: "font-[family-name:var(--font-playfair)]",
  space:   "font-[family-name:var(--font-space)]",
  serif:   "font-[family-name:var(--font-serif)]",
  bebas:   "font-[family-name:var(--font-bebas)]",
};

export default function RegisterVerify() {
  const router = useRouter();
  const [email, setEmail]         = useState('');
  const [otp, setOtp]             = useState(['', '', '', '', '', '']);
  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem('registerEmail');
    if (!stored) { router.push('/register'); return; }
    setEmail(stored);
    inputRefs.current[0]?.focus();
  }, [router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(-1);
    const next = [...otp]; next[index] = cleaned; setOtp(next); setError('');
    if (cleaned && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0)
      inputRefs.current[index - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) { setOtp(pasted.split('')); inputRefs.current[5]?.focus(); }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) { setError('Please enter all 6 digits.'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/verify-otp', { email, code, type: 'register' });
      setSuccess(true);
      sessionStorage.removeItem('registerEmail');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  const handleResend = () => {
    sessionStorage.removeItem('registerEmail');
    router.push('/register');
  };

  const maskedEmail = email.replace(/(.{2}).*(@.*)/, '$1***$2');

  if (success) {
    return (
      <div className="min-h-screen bg-[#F5F4F0] flex items-center justify-center">
        <div className="bg-white border-2 border-[#1C1C1C] p-14 text-center max-w-md w-full mx-4">
          <div className="w-12 h-12 bg-[#F7941D] border-2 border-[#1C1C1C] flex items-center justify-center mx-auto mb-6">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-3`}>Success</div>
          <h2 className={`${F.display} font-black italic text-[#1C1C1C] text-3xl mb-2`}>Account Created.</h2>
          <p className={`${F.serif} text-[#888888] text-sm`}>Redirecting you to login...</p>
        </div>
      </div>
    );
  }

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
          <div className={`${F.space} text-[11px] tracking-[0.25em] uppercase text-[#F7941D] mb-5`}>Almost There</div>
          <h2 className={`${F.display} font-black italic text-white leading-[0.9] mb-7`} style={{ fontSize: 'clamp(44px, 4.5vw, 68px)' }}>
            One step<br />left.
          </h2>
          <p className={`${F.serif} text-white/50 text-[16px] leading-[1.8] max-w-sm`}>
            We sent a 6-digit code to your email. Enter it to activate your account and join the ecosystem.
          </p>
          <div className="mt-10 flex flex-col gap-4">
            {[
              ['01', 'Account registered'],
              ['02', 'Verify your email'],
              ['03', 'Complete your profile'],
            ].map(([num, label]) => (
              <div key={num} className="flex items-center gap-4">
                <div className={`${F.bebas} text-[#F7941D] text-xl w-8`}>{num}</div>
                <div className={`${F.space} text-white/50 text-[13px] ${num === '02' ? 'text-white/90 font-semibold' : ''}`}>{label}</div>
                {num === '02' && <div className="w-1.5 h-1.5 bg-[#F7941D]" />}
              </div>
            ))}
          </div>
        </div>

        <div className={`${F.space} text-white/20 text-[10px] tracking-[0.2em] uppercase z-10`}>
          Digital Platform for Startup Ecosystem 2026
        </div>
      </div>

      {/* Right: OTP form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-14">
        <div className="w-full max-w-[420px]">

          <a href="/" className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-3 h-3 bg-[#F7941D]" />
            <span className={`${F.space} font-bold text-[#1C1C1C] tracking-[0.05em]`}>ECOSYSTEM</span>
          </a>

          <button onClick={() => router.push('/register')}
            className={`${F.space} flex items-center gap-2 text-[#888888] hover:text-[#1C1C1C] transition-colors text-[12px] mb-8`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>

          <div className={`${F.space} text-[11px] tracking-[0.25em] uppercase text-[#F7941D] mb-3`}>Email Verification</div>
          <h1 className={`${F.display} font-black italic text-[#1C1C1C] mb-3`} style={{ fontSize: 'clamp(32px, 3.5vw, 46px)' }}>
            Verify your email.
          </h1>
          <p className={`${F.serif} text-[#888888] text-[14px] mb-10`}>
            We sent a 6-digit OTP to{' '}
            <span className={`${F.space} text-[#1C1C1C] font-semibold`}>{maskedEmail}</span>.
          </p>

          {/* OTP Inputs */}
          <div className="flex justify-center gap-3 mb-8" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={`${F.bebas} w-12 h-14 text-center text-3xl border-2 bg-white focus:outline-none transition-colors ${
                  digit
                    ? 'border-[#F7941D] text-[#F7941D]'
                    : 'border-[#1C1C1C] text-[#1C1C1C] focus:border-[#F7941D]'
                }`}
              />
            ))}
          </div>

          {error && (
            <div className={`${F.space} text-[12px] text-[#CC0000] border-l-4 border-[#CC0000] pl-3 py-1.5 bg-red-50 mb-5`}>{error}</div>
          )}

          <button
            onClick={handleVerify}
            disabled={loading || otp.join('').length !== 6}
            className={`${F.space} w-full font-bold text-[13px] tracking-[0.1em] uppercase bg-[#F7941D] text-white px-6 py-4 hover:bg-[#1C1C1C] disabled:opacity-40 transition-colors`}>
            {loading ? 'Verifying...' : 'Verify & Create Account'}
          </button>

          <div className={`${F.serif} text-center text-[13px] text-[#888888] mt-6`}>
            {countdown > 0 ? (
              <span>Resend OTP in <span className={`${F.space} text-[#1C1C1C] font-bold`}>{countdown}s</span></span>
            ) : (
              <button onClick={handleResend} disabled={resending}
                className={`${F.space} text-[#1C1C1C] font-bold hover:text-[#F7941D] transition-colors text-[13px]`}>
                {resending ? 'Redirecting...' : 'Re-enter details to resend'}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
