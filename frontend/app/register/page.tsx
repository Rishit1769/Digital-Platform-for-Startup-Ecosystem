'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/axios';
import GoogleOAuthButton from '../../components/GoogleOAuthButton';

const F = {
  display: "font-[family-name:var(--font-playfair)]",
  space:   "font-[family-name:var(--font-space)]",
  serif:   "font-[family-name:var(--font-serif)]",
  bebas:   "font-[family-name:var(--font-bebas)]",
};

export default function RegisterStep1() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    role: 'student' as 'student' | 'mentor',
    startup_intent: '' as '' | 'has_startup' | 'finding_startup',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.phone || !form.password) { setError('All fields are required.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    const digits = form.phone.replace(/[\s\-().+]/g, '');
    const normalized = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits;
    if (!/^\d{10}$/.test(normalized)) { setError('Enter a valid 10-digit mobile number.'); return; }
    if (form.role === 'student' && !form.startup_intent) { setError('Please select your startup status.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/send-otp', {
        email: form.email, name: form.name, phone: form.phone,
        password: form.password, role: form.role,
        startup_intent: form.startup_intent || null, type: 'register',
      });
      sessionStorage.setItem('registerEmail', form.email);
      router.push('/register/verify');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F5F4F0] flex">

      {/* Left panel */}
      <div className="hidden lg:flex w-5/12 bg-[#1C1C1C] flex-col justify-between p-14 relative overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 59px,rgba(255,255,255,0.03) 59px,rgba(255,255,255,0.03) 60px),repeating-linear-gradient(90deg,transparent,transparent 59px,rgba(255,255,255,0.03) 59px,rgba(255,255,255,0.03) 60px)' }} />
        <div className={`${F.bebas} absolute bottom-0 right-[-2rem] text-white opacity-[0.04] leading-none select-none`} style={{ fontSize: '26rem' }}>E</div>

        <a href="/" className="flex items-center gap-2.5 z-10">
          <div className="w-3.5 h-3.5 bg-[#F7941D]" />
          <span className={`${F.space} font-bold text-white text-lg tracking-[0.05em]`}>ECOSYSTEM</span>
        </a>

        <div className="z-10">
          <div className={`${F.space} text-[11px] tracking-[0.25em] uppercase text-[#F7941D] mb-5`}>Join the Platform</div>
          <h2 className={`${F.display} font-black italic text-white leading-[0.9] mb-7`} style={{ fontSize: 'clamp(44px, 4.5vw, 68px)' }}>
            Build.<br />Connect.<br />Launch.
          </h2>
          <p className={`${F.serif} text-white/50 text-[15px] leading-[1.8] max-w-xs`}>
            Join founders, mentors, and builders. Verify your email and step into the ecosystem in under two minutes.
          </p>
          <div className="mt-10 flex flex-col gap-3">
            {['Verified founder profiles', 'AI-powered co-founder matching', 'Live milestone tracking'].map(item => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-[#F7941D] flex-shrink-0" />
                <span className={`${F.space} text-white/50 text-[12px] tracking-wide`}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`${F.space} text-white/20 text-[10px] tracking-[0.2em] uppercase z-10`}>
          Digital Platform for Startup Ecosystem 2026
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 overflow-y-auto">
        <div className="min-h-screen flex items-start justify-center p-8 lg:p-14">
          <div className="w-full max-w-[480px] py-4">

            <a href="/" className="flex items-center gap-2 mb-10 lg:hidden">
              <div className="w-3 h-3 bg-[#F7941D]" />
              <span className={`${F.space} font-bold text-[#1C1C1C] tracking-[0.05em]`}>ECOSYSTEM</span>
            </a>

            <div className={`${F.space} text-[11px] tracking-[0.25em] uppercase text-[#F7941D] mb-3`}>New Account</div>
            <h1 className={`${F.display} font-black italic text-[#1C1C1C] mb-2`} style={{ fontSize: 'clamp(32px, 3.5vw, 46px)' }}>
              Create your account.
            </h1>
            <p className={`${F.serif} text-[#888888] text-[14px] mb-10`}>We will send an OTP to verify your email.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              <div>
                <label className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#888888] block mb-1.5`}>Full Name</label>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)} required
                  placeholder="Arjun Mehta"
                  className={`${F.space} w-full border-2 border-[#1C1C1C] bg-white px-4 py-3.5 text-[14px] text-[#1C1C1C] focus:outline-none focus:border-[#F7941D] transition-colors placeholder:text-[#CCCCCC]`} />
              </div>

              <div>
                <label className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#888888] block mb-1.5`}>Email Address</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required
                  placeholder="you@example.com"
                  className={`${F.space} w-full border-2 border-[#1C1C1C] bg-white px-4 py-3.5 text-[14px] text-[#1C1C1C] focus:outline-none focus:border-[#F7941D] transition-colors placeholder:text-[#CCCCCC]`} />
              </div>

              <div>
                <label className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#888888] block mb-1.5`}>Phone Number</label>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} required
                  placeholder="10-digit mobile number"
                  className={`${F.space} w-full border-2 border-[#1C1C1C] bg-white px-4 py-3.5 text-[14px] text-[#1C1C1C] focus:outline-none focus:border-[#F7941D] transition-colors placeholder:text-[#CCCCCC]`} />
              </div>

              <div>
                <label className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#888888] block mb-1.5`}>Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} required
                    placeholder="Min. 8 characters"
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

              <div>
                <label className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#888888] block mb-3`}>I am joining as:</label>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { value: 'student', label: 'Student', sub: 'Build & grow startups' },
                    { value: 'mentor',  label: 'Mentor',  sub: 'Guide founders'        },
                  ] as const).map(r => (
                    <button key={r.value} type="button" onClick={() => set('role', r.value)}
                      className={`p-5 border-2 text-left transition-colors ${form.role === r.value ? 'border-[#F7941D] bg-[#F7941D]/5' : 'border-[#1C1C1C] bg-white hover:bg-[#F5F4F0]'}`}>
                      <div className={`${F.space} font-bold text-[14px] ${form.role === r.value ? 'text-[#F7941D]' : 'text-[#1C1C1C]'}`}>{r.label}</div>
                      <div className={`${F.serif} text-[12px] mt-1 ${form.role === r.value ? 'text-[#F7941D]/70' : 'text-[#888888]'}`}>{r.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {form.role === 'student' && (
                <div>
                  <label className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#888888] block mb-3`}>Startup status</label>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { value: 'has_startup',     label: 'I have a startup',  sub: 'Already building' },
                      { value: 'finding_startup', label: 'Finding a startup', sub: 'Looking to join'   },
                    ] as const).map(opt => (
                      <button key={opt.value} type="button" onClick={() => set('startup_intent', opt.value)}
                        className={`p-5 border-2 text-left transition-colors ${form.startup_intent === opt.value ? 'border-[#003580] bg-[#003580]/5' : 'border-[#1C1C1C] bg-white hover:bg-[#F5F4F0]'}`}>
                        <div className={`${F.space} font-bold text-[14px] ${form.startup_intent === opt.value ? 'text-[#003580]' : 'text-[#1C1C1C]'}`}>{opt.label}</div>
                        <div className={`${F.serif} text-[12px] mt-1 ${form.startup_intent === opt.value ? 'text-[#003580]/70' : 'text-[#888888]'}`}>{opt.sub}</div>
                      </button>
                    ))}
                  </div>
                  <p className={`${F.serif} text-[12px] text-[#AAAAAA] mt-2`}>You can change this later in Settings.</p>
                </div>
              )}

              {error && (
                <div className={`${F.space} text-[12px] text-[#CC0000] border-l-4 border-[#CC0000] pl-3 py-1.5 bg-red-50`}>{error}</div>
              )}

              <button type="submit" disabled={loading}
                className={`${F.space} font-bold text-[13px] tracking-[0.1em] uppercase bg-[#F7941D] text-white px-6 py-4 hover:bg-[#1C1C1C] disabled:opacity-40 transition-colors mt-1`}>
                {loading ? 'Sending OTP...' : 'Continue'}
              </button>

              <div className="flex items-center gap-3 mt-1">
                <div className="flex-1 h-[1px] bg-[#D8D8D8]" />
                <span className={`${F.space} text-[10px] tracking-[0.15em] uppercase text-[#999999]`}>or</span>
                <div className="flex-1 h-[1px] bg-[#D8D8D8]" />
              </div>

              <GoogleOAuthButton
                mode="register"
                role={form.role}
                startupIntent={form.startup_intent}
                onError={setError}
              />

              <p className={`${F.serif} text-center text-[14px] text-[#888888]`}>
                Already have an account?{' '}
                <button type="button" onClick={() => router.push('/login')}
                  className={`${F.space} text-[#1C1C1C] font-bold hover:text-[#F7941D] transition-colors`}>
                  Sign In
                </button>
              </p>

            </form>
          </div>
        </div>
      </div>

    </div>
  );
}
