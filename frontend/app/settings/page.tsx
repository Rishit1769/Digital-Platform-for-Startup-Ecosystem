'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/axios';

const INTENT_OPTIONS = [
  { value: 'has_startup', icon: '🚀', label: 'I have a startup', sub: 'Already building something' },
  { value: 'finding_startup', icon: '🔍', label: 'Finding a startup', sub: 'Looking to join a team' },
];

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [intent, setIntent] = useState<string>('');

  useEffect(() => {
    api.get('/settings')
      .then(res => {
        setSettings(res.data.data);
        setIntent(res.data.data.startup_intent || '');
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await api.patch('/settings', { startup_intent: intent || null });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-200 transition text-sm">← Back</button>
          <h1 className="text-2xl font-bold dark:text-white">Settings</h1>
        </div>

        {/* Account Info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Account</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Name</span>
              <span className="font-medium dark:text-white">{settings?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="font-medium dark:text-white">{settings?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Phone</span>
              <span className="font-medium dark:text-white">{settings?.phone || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Role</span>
              <span className="font-medium capitalize dark:text-white">{settings?.role}</span>
            </div>
          </div>
        </div>

        {/* Startup Intent — students only */}
        {settings?.role === 'student' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="font-bold text-gray-900 dark:text-white mb-1">Startup Status</h2>
            <p className="text-gray-400 text-sm mb-5">Tell the ecosystem where you are in your startup journey. This helps us match you with the right people.</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {INTENT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setIntent(prev => prev === opt.value ? '' : opt.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    intent === opt.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="text-2xl mb-2">{opt.icon}</div>
                  <div className={`font-bold text-sm ${intent === opt.value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>{opt.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{opt.sub}</div>
                </button>
              ))}
            </div>

            {intent === '' && (
              <p className="text-xs text-gray-400">No status selected — click a card above to set one.</p>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition"
            >
              {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
            </button>
          </div>
        )}

        {/* Change Password link */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-1">Security</h2>
          <p className="text-gray-400 text-sm mb-4">Manage your password and account security.</p>
          <button
            onClick={() => router.push('/forgot-password')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Change Password
          </button>
        </div>
      </div>
    </div>
  );
}
