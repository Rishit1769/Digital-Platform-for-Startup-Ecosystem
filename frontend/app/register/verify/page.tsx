'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/axios';
import { CheckCircle, ArrowLeft } from 'lucide-react';

export default function RegisterVerify() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem('registerEmail');
    if (!stored) {
      router.push('/register');
      return;
    }
    setEmail(stored);
    inputRefs.current[0]?.focus();
  }, [router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = cleaned;
    setOtp(newOtp);
    setError('');

    // Auto-advance
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/verify-otp', { email, code, type: 'register' });
      setSuccess(true);
      sessionStorage.removeItem('registerEmail');
      setTimeout(() => router.push('/login'), 2500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      // We can't resend without the original payload, so go back to start
      sessionStorage.removeItem('registerEmail');
      router.push('/register');
    } catch {
      setResending(false);
    }
  };

  const maskedEmail = email.replace(/(.{2}).*(@.*)/, '$1***$2');

  if (success) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Account Created!</h2>
          <p className="text-gray-400">Redirecting you to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[20%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px]"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-lg text-white shadow-lg">C</div>
            <span className="text-xl font-extrabold tracking-tight text-white">CloudCampus</span>
          </div>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
          <button
            onClick={() => router.push('/register')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm mb-6 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">Verify your email</h1>
            <p className="text-gray-400 text-sm">
              We sent a 6-digit OTP to{' '}
              <span className="text-indigo-400 font-semibold">{maskedEmail}</span>.
              Enter it below to activate your account.
            </p>
          </div>

          {/* OTP Inputs */}
          <div className="flex justify-between gap-2 mb-6" onPaste={handlePaste}>
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
                className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-gray-800/60 text-white transition focus:outline-none ${
                  digit
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-gray-700 focus:border-indigo-500'
                }`}
              />
            ))}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm font-medium mb-4 flex items-start gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            onClick={handleVerify}
            disabled={loading || otp.join('').length !== 6}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition duration-300 shadow-[0_0_20px_rgba(79,70,229,0.3)] mb-4"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Verify & Create Account'
            )}
          </button>

          <div className="text-center text-sm text-gray-500">
            {countdown > 0 ? (
              <span>Resend OTP in <span className="text-gray-300 font-semibold">{countdown}s</span></span>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-indigo-400 hover:text-indigo-300 font-semibold transition"
              >
                {resending ? 'Redirecting...' : '← Re-enter details to resend'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
