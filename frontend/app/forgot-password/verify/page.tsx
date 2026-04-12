'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/axios';

export default function VerifyForgotPasswordOtp() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [currentTimeLeft, setCurrentTimeLeft] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const data = sessionStorage.getItem('forgotPasswordData');
    if (!data) {
      router.push('/forgot-password');
      return;
    }
    const parsed = JSON.parse(data);
    setEmail(parsed.email);
  }, [router]);

  useEffect(() => {
    if (currentTimeLeft > 0) {
      const timerId = setTimeout(() => setCurrentTimeLeft(currentTimeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [currentTimeLeft]);

  const maskEmail = (email: string) => {
    if (!email) return '';
    const [name, domain] = email.split('@');
    return `${name.slice(0, 3)}***@${domain}`;
  };

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    if (pastedData.some(char => isNaN(Number(char)))) return;
    
    const newOtp = [...otp];
    pastedData.forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);
    
    inputRefs.current[Math.min(5, pastedData.length)]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/verify-otp', { email, code, type: 'forgot_password' });
      const token = res.data.data.verificationToken;
      
      const sessionData = JSON.parse(sessionStorage.getItem('forgotPasswordData') || '{}');
      sessionData.verificationToken = token;
      sessionStorage.setItem('forgotPasswordData', JSON.stringify(sessionData));
      
      router.push('/forgot-password/reset');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setCurrentTimeLeft(60);
      setOtp(['', '', '', '', '', '']);
      setError('');
      await api.post('/auth/send-otp', { email, type: 'forgot_password' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error resending OTP');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="p-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
            Verify Email
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8 whitespace-pre-wrap">
            We sent a 6-digit code to \n<span className="font-semibold text-gray-900 dark:text-gray-200">{maskEmail(email)}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-14 text-center text-2xl font-bold bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              ))}
            </div>

            {error && (
              <div className="text-red-500 text-sm font-medium bg-red-50 dark:bg-red-900/30 p-3 rounded-lg text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Verify Email'
              )}
            </button>

            <div className="text-center mt-4 text-sm">
              <span className="text-gray-600 dark:text-gray-400">Didn't receive the code? </span>
              {currentTimeLeft > 0 ? (
                <span className="font-medium text-gray-500 dark:text-gray-500">Resend in {currentTimeLeft}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
