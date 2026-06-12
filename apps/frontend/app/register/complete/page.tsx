'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/axios';

export default function CompleteRegistration() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  useEffect(() => {
    const data = sessionStorage.getItem('registerData');
    if (!data) {
      router.push('/register');
      return;
    }
    const parsed = JSON.parse(data);
    if (!parsed.verificationToken) {
      router.push('/register/verify');
      return;
    }
    setSessionInfo(parsed);
  }, [router]);

  const getPasswordStrength = (password: string) => {
    let score = 0;
    if (!password) return score;
    if (password.length > 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  };

  const strength = getPasswordStrength(formData.password);
  
  const getStrengthColor = () => {
    if (strength === 0) return 'bg-gray-200 dark:bg-gray-700';
    if (strength === 1) return 'bg-red-500';
    if (strength <= 2) return 'bg-yellow-500';
    if (strength === 3) return 'bg-blue-500';
    return 'bg-green-500';
  };
  
  const getStrengthText = () => {
    if (strength === 0) return 'Too short';
    if (strength === 1) return 'Weak';
    if (strength <= 2) return 'Fair';
    if (strength === 3) return 'Good';
    return 'Strong';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (strength < 2) {
      setError('Please choose a stronger password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/register', {
        email: sessionInfo.email,
        name: formData.name,
        password: formData.password,
        verificationToken: sessionInfo.verificationToken
      });
      
      const user = res.data.data.user;
      sessionStorage.removeItem('registerData');
      
      if (user.role === 'student') router.push('/dashboard');
      else if (user.role === 'mentor') router.push('/mentor');
      else router.push('/admin');
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (!sessionInfo) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="p-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
            Complete Profile
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            Set up your name and password
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="••••••••"
              />
              
              {formData.password && (
                <div className="mt-2 text-sm">
                  <div className="flex gap-1 h-1.5 mt-2">
                    {[1, 2, 3, 4].map((level) => (
                      <div 
                        key={level} 
                        className={`flex-1 rounded-full ${strength >= level ? getStrengthColor() : 'bg-gray-200 dark:bg-gray-700'} transition-all`}
                      />
                    ))}
                  </div>
                  <div className={`mt-1 text-xs font-medium text-right ${strength < 2 ? 'text-red-500' : strength === 4 ? 'text-green-500' : 'text-yellow-600 dark:text-yellow-400'}`}>
                    {getStrengthText()}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="••••••••"
              />
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
                'Create Account'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
