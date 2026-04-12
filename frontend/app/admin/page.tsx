'use client';

import { useRouter } from 'next/navigation';
import { api, setToken } from '../../lib/axios';
import { useState, useEffect, useRef } from 'react';

const CATEGORIES = ['general', 'announcement', 'event', 'opportunity', 'update'];

export default function AdminDashboard() {
  const router = useRouter();
  const [news, setNews] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', content: '', category: 'general' });
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchNews();
    api.get('/analytics/ecosystem').then(res => setStats(res.data.data)).catch(() => {});
    api.get('/profile/me').then(res => setAdminProfile(res.data.data)).catch(() => {});
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await api.post('/profile/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAdminProfile((prev: any) => ({ ...prev, profile: { ...prev?.profile, avatar_url: res.data.data.avatar_url } }));
    } catch (err) {
      console.error('Avatar upload failed', err);
    } finally {
      setAvatarUploading(false);
    }
  };

  const [newsImage, setNewsImage] = useState<File | null>(null);
  const [newsImagePreview, setNewsImagePreview] = useState<string | null>(null);
  const newsImageInputRef = useRef<HTMLInputElement>(null);

  const handleNewsImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewsImage(file);
    setNewsImagePreview(URL.createObjectURL(file));
  };

  const removeNewsImage = () => {
    setNewsImage(null);
    setNewsImagePreview(null);
    if (newsImageInputRef.current) newsImageInputRef.current.value = '';
  };

  const fetchNews = () => {
    api.get('/news?limit=20').then(res => setNews(res.data.data || [])).catch(console.error);
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) { setError('Title and content required.'); return; }
    setPosting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('content', form.content);
      formData.append('category', form.category);
      if (newsImage) formData.append('image', newsImage);
      await api.post('/admin/news', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm({ title: '', content: '', category: 'general' });
      removeNewsImage();
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
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      setToken(null);
      window.location.href = '/login';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow border border-gray-100 dark:border-gray-700">
          {/* Admin avatar + name */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <div
                onClick={() => !avatarUploading && fileInputRef.current?.click()}
                className="relative w-14 h-14 rounded-full cursor-pointer overflow-hidden border-2 border-blue-500 shadow-md"
                title="Click to upload profile picture"
              >
                {adminProfile?.profile?.avatar_url ? (
                  <img src={adminProfile.profile.avatar_url} alt="Admin" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-xl font-bold">
                    {adminProfile?.name?.charAt(0) ?? 'A'}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  {avatarUploading ? (
                    <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  )}
                </div>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold dark:text-white">Admin Dashboard</h1>
              <p className="text-gray-500 text-sm mt-0.5">{adminProfile?.name ?? 'Admin'} · Manage the CloudCampus ecosystem</p>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap justify-end">
            <button onClick={() => router.push('/analytics')} className="px-4 py-2 border border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
              Analytics
            </button>
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

            {/* Image upload */}
            <input
              ref={newsImageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleNewsImageSelect}
            />
            {newsImagePreview ? (
              <div className="relative inline-block">
                <img src={newsImagePreview} alt="Preview" className="h-40 w-auto rounded-xl object-cover border border-gray-200 dark:border-gray-700 shadow-sm" />
                <button
                  type="button"
                  onClick={removeNewsImage}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow transition"
                  title="Remove image"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => newsImageInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                Attach image (optional)
              </button>
            )}

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
                <div key={item.id} className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                  {item.image_url && (
                    <img src={item.image_url} alt={item.title} className="w-20 h-20 rounded-lg object-cover shrink-0 border border-gray-200 dark:border-gray-700" />
                  )}
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
                    className="text-red-500 hover:text-red-700 text-xs font-bold shrink-0 border border-red-200 dark:border-red-900 px-3 py-1.5 rounded-lg transition self-start"
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
