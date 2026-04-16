'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setToken } from '../../lib/axios';
import GoogleOAuthButton from '../../components/GoogleOAuthButton';

const F = {
  display: "font-[family-name:var(--font-playfair)]",
  space:   "font-[family-name:var(--font-space)]",
  serif:   "font-[family-name:var(--font-serif)]",
  bebas:   "font-[family-name:var(--font-bebas)]",
};

export default function Login() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, accessToken } = res.data.data;
      setToken(accessToken);
      localStorage.setItem('token', accessToken);
      if (user.role === 'student') router.push('/dashboard');
      else if (user.role === 'mentor') router.push('/mentor');
      else router.push('/admin');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password.');
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
          <div className={`${F.space} text-[11px] tracking-[0.25em] uppercase text-[#F7941D] mb-5`}>Welcome Back</div>
          <h2 className={`${F.display} font-black italic text-white leading-[0.9] mb-7`} style={{ fontSize: 'clamp(52px, 5vw, 80px)' }}>
            Build.<br />Scale.<br />Ship.
          </h2>
          <p className={`${F.serif} text-white/50 text-[16px] leading-[1.8] max-w-sm`}>
            Your startup ecosystem is live. Sign in to access your dashboard, track milestones, and connect with mentors.
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

          <div className={`${F.space} text-[11px] tracking-[0.25em] uppercase text-[#F7941D] mb-3`}>Sign In</div>
          <h1 className={`${F.display} font-black italic text-[#1C1C1C] mb-10`} style={{ fontSize: 'clamp(36px, 4vw, 52px)' }}>
            Welcome back.
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            <div>
              <label className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#888888] block mb-1.5`}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@example.com"
                className={`${F.space} w-full border-2 border-[#1C1C1C] bg-white px-4 py-3.5 text-[14px] text-[#1C1C1C] focus:outline-none focus:border-[#F7941D] transition-colors placeholder:text-[#CCCCCC]`} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#888888]`}>Password</label>
                <button type="button" onClick={() => router.push('/forgot-password')}
                  className={`${F.space} text-[11px] text-[#888888] hover:text-[#F7941D] transition-colors`}>
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="Enter password"
                  className={`${F.space} w-full border-2 border-[#1C1C1C] bg-white px-4 py-3.5 pr-12 text-[14px] text-[#1C1C1C] focus:outline-none focus:border-[#F7941D] transition-colors placeholder:text-[#CCCCCC]`} />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#1C1C1C] transition-colors">
                  {showPass
                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  }
                </button>
              </div>
            </div>

            {error && (
              <div className={`${F.space} text-[12px] text-[#CC0000] border-l-4 border-[#CC0000] pl-3 py-1.5 bg-red-50`}>{error}</div>
            )}

            <button type="submit" disabled={loading}
              className={`${F.space} font-bold text-[13px] tracking-[0.1em] uppercase bg-[#F7941D] text-white px-6 py-4 hover:bg-[#1C1C1C] disabled:opacity-40 transition-colors`}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-[1px] bg-[#D8D8D8]" />
              <span className={`${F.space} text-[10px] tracking-[0.15em] uppercase text-[#999999]`}>or</span>
              <div className="flex-1 h-[1px] bg-[#D8D8D8]" />
            </div>

            <GoogleOAuthButton mode="signin" onError={setError} />

            <p className={`${F.serif} text-center text-[14px] text-[#888888]`}>
              No account?{' '}
              <button type="button" onClick={() => router.push('/register')}
                className={`${F.space} text-[#1C1C1C] font-bold hover:text-[#F7941D] transition-colors`}>
                Register
              </button>
            </p>

          </form>
        </div>
      </div>

    </div>
  );
}
