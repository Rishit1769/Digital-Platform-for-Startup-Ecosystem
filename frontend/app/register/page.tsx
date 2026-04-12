'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/axios';
import { ArrowRight, Eye, EyeOff, Mail, User, Phone, Lock } from 'lucide-react';

export default function RegisterStep1() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    role: 'student' as 'student' | 'mentor',
    startup_intent: '' as '' | 'has_startup' | 'finding_startup'
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.phone || !form.password) {
      setError('All fields are required.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!/^\d{10}$/.test(form.phone.replace(/\s/g, ''))) {
      setError('Enter a valid 10-digit phone number.');
      return;
    }
    if (form.role === 'student' && !form.startup_intent) {
      setError('Please select your startup status.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/send-otp', {
        email: form.email,
        name: form.name,
        phone: form.phone,
        password: form.password,
        role: form.role,
        startup_intent: form.startup_intent || null,
        type: 'register',
      });
      sessionStorage.setItem('registerEmail', form.email);
      router.push('/register/verify');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[20%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px]"></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-lg text-white shadow-lg">C</div>
            <span className="text-xl font-extrabold tracking-tight text-white">CloudCampus</span>
          </div>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
          <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
          <p className="text-gray-400 text-sm mb-8">Join the startup ecosystem. We'll send an OTP to verify your email.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Full Name"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                className="w-full bg-gray-800/60 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                required
              />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                placeholder="Email Address"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                className="w-full bg-gray-800/60 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                required
              />
            </div>

            {/* Phone */}
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="tel"
                placeholder="Phone Number (10 digits)"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                className="w-full bg-gray-800/60 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                required
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Password (min. 8 characters)"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                className="w-full bg-gray-800/60 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 pl-11 pr-12 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                required
              />
              <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Role Selection */}
            <div>
              <p className="text-sm text-gray-400 mb-3 font-medium">I am joining as a...</p>
              <div className="grid grid-cols-2 gap-3">
                {(['student', 'mentor'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => set('role', r)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      form.role === r
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-gray-700 bg-gray-800/40 hover:border-gray-600'
                    }`}
                  >
                    <div className="text-xl mb-1">{r === 'student' ? '🎓' : '🧑‍💼'}</div>
                    <div className={`font-bold capitalize text-sm ${form.role === r ? 'text-indigo-400' : 'text-gray-300'}`}>{r}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{r === 'student' ? 'Build & grow startups' : 'Guide founders'}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Startup Intent — only for students */}
            {form.role === 'student' && (
              <div>
                <p className="text-sm text-gray-400 mb-3 font-medium">What's your startup status?</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'has_startup', icon: '🚀', label: 'I have a startup', sub: 'Already building something' },
                    { value: 'finding_startup', icon: '🔍', label: 'Finding a startup', sub: 'Looking to join a team' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set('startup_intent', opt.value)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        form.startup_intent === opt.value
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-700 bg-gray-800/40 hover:border-gray-600'
                      }`}
                    >
                      <div className="text-xl mb-1">{opt.icon}</div>
                      <div className={`font-bold text-sm ${form.startup_intent === opt.value ? 'text-blue-400' : 'text-gray-300'}`}>{opt.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{opt.sub}</div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-2">You can change this later in Settings.</p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm font-medium flex items-start gap-2">
                <span className="mt-0.5">⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition duration-300 shadow-[0_0_20px_rgba(79,70,229,0.3)]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Send Verification OTP <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{' '}
              <button type="button" onClick={() => router.push('/login')} className="text-indigo-400 hover:text-indigo-300 font-semibold transition">
                Sign in
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
