'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { api } from '../../lib/axios';

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    api.get('/profile/me').then(res => {
      const p = res.data.data.profile;
      if (!p || Object.keys(p).length === 0 || !p.bio || !p.skills) {
        router.push('/profile/setup');
      }
    }).catch(err => console.error(err));
  }, [router]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      router.push('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow">
        <h1 className="text-2xl font-bold dark:text-white">Student Dashboard</h1>
        <button 
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
