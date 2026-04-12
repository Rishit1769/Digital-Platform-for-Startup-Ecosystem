'use client';

import { useRouter } from 'next/navigation';
import { api } from '../../lib/axios';
import { useState, useEffect } from 'react';

const CATEGORIES = ['general', 'announcement', 'event', 'opportunity', 'update'];

export default function AdminDashboard() {
  const router = useRouter();
  const [news, setNews] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', content: '', category: 'general' });
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchNews();
    api.get('/analytics/ecosystem').then(res => setStats(res.data.data)).catch(() => {});
  }, []);

  const fetchNews = () => {
    api.get('/news?limit=20').then(res => setNews(res.data.data || [])).catch(console.error);
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) { setError('Title and content required.'); return; }
    setPosting(true);
    setError('');
    try {
      await api.post('/admin/news', form);
      setForm({ title: '', content: '', category: 'general' });
      fetchNews();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to post news.');
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this news item?')) return;
    try {
      await api.delete(`/admin/news/${id}`);
      setNews(prev => prev.filter(n => n.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete.');
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      router.push('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow border border-gray-100 dark:border-gray-700">
          <div>
            <h1 className="text-2xl font-bold dark:text-white">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Manage the CloudCampus ecosystem</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => router.push('/admin/verifications')} className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              Verifications
            </button>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition text-sm font-medium">
              Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: stats.total_users },
              { label: 'Startups', value: stats.total_startups },
              { label: 'Meetings', value: stats.total_meetings },
              { label: 'Ideas', value: stats.total_ideas },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 text-center shadow-sm">
                <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{s.value ?? '—'}</div>
                <div className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Post News */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
          <h2 className="font-bold text-lg dark:text-white mb-4">Post News to Feed</h2>
          <form onSubmit={handlePost} className="space-y-3">
            <input
              type="text"
              placeholder="Title"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition"
            />
            <textarea
              placeholder="Content..."
              rows={4}
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition resize-none"
            />
            <div className="flex gap-3 items-center">
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl text-sm focus:outline-none"
              >
                {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
              <button
                type="submit"
                disabled={posting}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition text-sm"
              >
                {posting ? 'Publishing...' : 'Publish'}
              </button>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </form>
        </div>

        {/* News List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
          <h2 className="font-bold text-lg dark:text-white mb-4">Published News ({news.length})</h2>
          {news.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No news published yet.</p>
          ) : (
            <div className="space-y-3">
              {news.map(item => (
                <div key={item.id} className="flex justify-between items-start gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">{item.category}</span>
                      <span className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{item.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.content}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-500 hover:text-red-700 text-xs font-bold shrink-0 border border-red-200 dark:border-red-900 px-3 py-1.5 rounded-lg transition"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
