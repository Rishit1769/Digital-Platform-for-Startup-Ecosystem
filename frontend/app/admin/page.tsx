'use client';

import { useRouter } from 'next/navigation';
import { api, setToken } from '../../lib/axios';
import { useState, useEffect, useRef } from 'react';
import PressNewsSection from '../../components/PressNewsSection';

const CATEGORIES = ['general', 'announcement', 'event', 'opportunity', 'update'];

const F = {
  display: "font-[family-name:var(--font-playfair)]",
  space:   "font-[family-name:var(--font-space)]",
  serif:   "font-[family-name:var(--font-serif)]",
  bebas:   "font-[family-name:var(--font-bebas)]",
};

const EMPTY_SESSION = { title: '', mentor_name: '', description: '', session_date: '', session_time: '', meet_link: '' };
const EMPTY_FEATURED = {
  startup_id: '',
  headline: '',
  summary: '',
  hero_image_url: '',
  cta_label: '',
  cta_url: '',
  display_order: '0',
};

export default function AdminDashboard() {
  const router = useRouter();

  // News
  const [news, setNews] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', content: '', category: 'general' });
  const [posting, setPosting] = useState(false);
  const [newsError, setNewsError] = useState('');
  const newsImageInputRef = useRef<HTMLInputElement>(null);
  const [newsImage, setNewsImage] = useState<File | null>(null);
  const [newsImagePreview, setNewsImagePreview] = useState<string | null>(null);

  // Sessions
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionForm, setSessionForm] = useState({ ...EMPTY_SESSION });
  const [postingSession, setPostingSession] = useState(false);
  const [sessionError, setSessionError] = useState('');

  // Featured work + startup leaders
  const [featuredWorks, setFeaturedWorks] = useState<any[]>([]);
  const [featuredForm, setFeaturedForm] = useState({ ...EMPTY_FEATURED });
  const [featuredPosting, setFeaturedPosting] = useState(false);
  const [featuredError, setFeaturedError] = useState('');
  const [startupLeaders, setStartupLeaders] = useState<any[]>([]);
  const [leaderEmails, setLeaderEmails] = useState<Record<number, string>>({});

  // Meta
  const [stats, setStats] = useState<any>(null);
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'news' | 'sessions' | 'featured' | 'leaders'>('sessions');

  useEffect(() => {
    fetchNews();
    fetchSessions();
    fetchFeaturedWorks();
    fetchStartupLeaders();
    api.get('/analytics/ecosystem').then(res => setStats(res.data.data)).catch(() => {});
    api.get('/profile/me').then(res => {
      const data = res.data.data;
      if (data.role !== 'admin') {
        router.push(data.role === 'mentor' ? '/mentor' : '/dashboard');
        return;
      }
      setAdminProfile(data);
    }).catch(() => {});
  }, []);

  /* ── avatar ── */
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await api.post('/profile/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAdminProfile((prev: any) => ({ ...prev, profile: { ...prev?.profile, avatar_url: res.data.data.avatar_url } }));
    } catch { /* silent */ } finally { setAvatarUploading(false); }
  };

  /* ── news ── */
  const fetchNews = () => api.get('/news?limit=20').then(res => setNews(res.data.data || [])).catch(console.error);

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

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) { setNewsError('Title and content required.'); return; }
    setPosting(true); setNewsError('');
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('content', form.content);
      formData.append('category', form.category);
      if (newsImage) formData.append('image', newsImage);
      await api.post('/admin/news', formData, { isFormData: true });
      setForm({ title: '', content: '', category: 'general' });
      removeNewsImage();
      fetchNews();
    } catch (err: any) {
      setNewsError(err.response?.data?.error || 'Failed to post news.');
    } finally { setPosting(false); }
  };

  const handleDeleteNews = async (id: number) => {
    if (!confirm('Delete this news item?')) return;
    try {
      await api.delete(`/admin/news/${id}`);
      setNews(prev => prev.filter(n => n.id !== id));
    } catch (err: any) { alert(err.response?.data?.error || 'Failed to delete.'); }
  };

  /* ── sessions ── */
  const fetchSessions = () =>
    api.get('/admin/public-sessions').then(res => setSessions(res.data.data || [])).catch(console.error);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionForm.title || !sessionForm.mentor_name || !sessionForm.meet_link) {
      setSessionError('Title, mentor name, and meet link are required.');
      return;
    }
    setPostingSession(true); setSessionError('');
    try {
      await api.post('/admin/public-sessions', sessionForm);
      setSessionForm({ ...EMPTY_SESSION });
      fetchSessions();
    } catch (err: any) {
      setSessionError(err.response?.data?.error || 'Failed to create session.');
    } finally { setPostingSession(false); }
  };

  const handleDeleteSession = async (id: number) => {
    if (!confirm('Delete this session?')) return;
    try {
      await api.delete(`/admin/public-sessions/${id}`);
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch (err: any) { alert(err.response?.data?.error || 'Failed to delete.'); }
  };

  const handleToggleSession = async (id: number) => {
    try {
      await api.patch(`/admin/public-sessions/${id}/toggle`);
      fetchSessions();
    } catch (err: any) { alert(err.response?.data?.error || 'Failed to toggle.'); }
  };

  /* ── featured work + startup leaders ── */
  const fetchFeaturedWorks = () =>
    api.get('/admin/featured-work').then(res => setFeaturedWorks(res.data.data || [])).catch(console.error);

  const fetchStartupLeaders = () =>
    api.get('/admin/startup-leaders').then(res => {
      const list = res.data.data || [];
      setStartupLeaders(list);
      setLeaderEmails(Object.fromEntries(list.map((row: any) => [row.startup_id, row.startup_email || ''])));
    }).catch(console.error);

  const handleCreateFeatured = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!featuredForm.startup_id) {
      setFeaturedError('Please select a startup.');
      return;
    }

    setFeaturedPosting(true);
    setFeaturedError('');
    try {
      await api.post('/admin/featured-work', {
        ...featuredForm,
        startup_id: Number(featuredForm.startup_id),
        display_order: Number(featuredForm.display_order || 0),
        is_active: true,
      });
      setFeaturedForm({ ...EMPTY_FEATURED });
      fetchFeaturedWorks();
    } catch (err: any) {
      setFeaturedError(err.response?.data?.error || 'Failed to create featured work.');
    } finally {
      setFeaturedPosting(false);
    }
  };

  const handleToggleFeatured = async (id: number) => {
    try {
      await api.patch(`/admin/featured-work/${id}/toggle`);
      fetchFeaturedWorks();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to toggle featured work item.');
    }
  };

  const handleDeleteFeatured = async (id: number) => {
    if (!confirm('Delete this featured work item?')) return;
    try {
      await api.delete(`/admin/featured-work/${id}`);
      setFeaturedWorks(prev => prev.filter(item => item.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete featured work item.');
    }
  };

  const handleSaveStartupEmail = async (startupId: number) => {
    try {
      await api.patch(`/admin/startup-leaders/${startupId}/contact`, {
        startup_email: leaderEmails[startupId] || null,
      });
      fetchStartupLeaders();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update startup email.');
    }
  };

  /* ── logout ── */
  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch { /* silent */ } finally {
      setToken(null);
      window.location.href = '/login';
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-[#1C1C1C]">

      {/* ── Header bar ── */}
      <header className="bg-[#1C1C1C] border-b-2 border-[#F7941D]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-5 flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Avatar */}
            <div className="relative group">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              <div onClick={() => !avatarUploading && fileInputRef.current?.click()}
                className="relative w-11 h-11 cursor-pointer overflow-hidden border-2 border-[#F7941D]" title="Change photo">
                {adminProfile?.profile?.avatar_url ? (
                  <img src={adminProfile.profile.avatar_url} alt="Admin" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#F7941D] flex items-center justify-center text-white font-bold text-lg">
                    {adminProfile?.name?.charAt(0) ?? 'A'}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  {avatarUploading
                    ? <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                    : <span className={`${F.space} text-white text-[10px] font-bold tracking-wider`}>EDIT</span>}
                </div>
              </div>
            </div>
            <div>
              <div className={`${F.bebas} text-white tracking-widest`} style={{ fontSize: '1.6rem', lineHeight: 1 }}>Admin Console</div>
              <div className={`${F.space} text-[#F7941D] text-[11px] tracking-[0.15em] uppercase mt-0.5`}>{adminProfile?.name ?? 'Admin'}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/analytics')}
              className={`${F.space} text-[12px] tracking-wide text-white/60 hover:text-white transition-colors border border-white/15 hover:border-white/40 px-4 py-2`}>
              Analytics
            </button>
            <button onClick={() => router.push('/admin/verifications')}
              className={`${F.space} text-[12px] tracking-wide text-white/60 hover:text-white transition-colors border border-white/15 hover:border-white/40 px-4 py-2`}>
              Verifications
            </button>
            <button onClick={handleLogout}
              className={`${F.space} text-[12px] tracking-wide bg-[#F7941D] text-white px-4 py-2 hover:bg-white hover:text-[#1C1C1C] transition-colors font-bold`}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-12">

        {/* ── Stats ── */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 border-2 border-[#1C1C1C] mb-10 divide-x-2 divide-[#1C1C1C]">
            {[
              { label: 'Total Users', value: stats.total_users },
              { label: 'Startups',    value: stats.total_startups },
              { label: 'Meetings',    value: stats.total_meetings },
              { label: 'Ideas',       value: stats.total_ideas },
            ].map(s => (
              <div key={s.label} className="bg-[#FFFFFF] px-8 py-6">
                <div className={`${F.bebas} text-[#F7941D] leading-none`} style={{ fontSize: '3rem' }}>{s.value ?? '—'}</div>
                <div className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#888888] mt-1`}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Tab bar ── */}
        <div className="flex border-b-2 border-[#1C1C1C] mb-10">
          {([
            { key: 'sessions', label: 'Mentor Sessions' },
            { key: 'featured', label: 'Featured Work' },
            { key: 'leaders', label: 'Startup Leaders' },
            { key: 'news', label: 'Press News' },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`${F.space} text-[13px] font-bold tracking-[0.15em] uppercase px-8 py-4 border-r-2 border-[#1C1C1C] transition-colors ${activeTab === tab.key ? 'bg-[#F7941D] text-white' : 'bg-[#FFFFFF] text-[#1C1C1C] hover:bg-[#F5F4F0]'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════
            SESSIONS TAB
        ════════════════════════════ */}
        {activeTab === 'sessions' && (
          <div className="grid grid-cols-12 gap-8">

            {/* Form */}
            <div className="col-span-12 lg:col-span-5">
              <div className="bg-[#FFFFFF] border-2 border-[#1C1C1C] p-8">
                <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-2`}>New Session</div>
                <h2 className={`${F.display} font-black italic text-[#1C1C1C] text-2xl mb-8`}>Add Public Session</h2>

                <form onSubmit={handleCreateSession} className="flex flex-col gap-4">
                  <div>
                    <label className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#888888] block mb-1.5`}>Session Title *</label>
                    <input type="text" value={sessionForm.title}
                      onChange={e => setSessionForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. Product-Market Fit Workshop"
                      className={`${F.space} w-full border-2 border-[#1C1C1C] bg-[#F5F4F0] px-4 py-3 text-[14px] text-[#1C1C1C] focus:outline-none focus:border-[#F7941D] transition-colors placeholder:text-[#AAAAAA]`} />
                  </div>
                  <div>
                    <label className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#888888] block mb-1.5`}>Mentor Name *</label>
                    <input type="text" value={sessionForm.mentor_name}
                      onChange={e => setSessionForm(f => ({ ...f, mentor_name: e.target.value }))}
                      placeholder="e.g. Priya Nair"
                      className={`${F.space} w-full border-2 border-[#1C1C1C] bg-[#F5F4F0] px-4 py-3 text-[14px] text-[#1C1C1C] focus:outline-none focus:border-[#F7941D] transition-colors placeholder:text-[#AAAAAA]`} />
                  </div>
                  <div>
                    <label className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#888888] block mb-1.5`}>Description</label>
                    <textarea rows={3} value={sessionForm.description}
                      onChange={e => setSessionForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Brief overview of what will be covered"
                      className={`${F.space} w-full border-2 border-[#1C1C1C] bg-[#F5F4F0] px-4 py-3 text-[14px] text-[#1C1C1C] focus:outline-none focus:border-[#F7941D] transition-colors resize-none placeholder:text-[#AAAAAA]`} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#888888] block mb-1.5`}>Date</label>
                      <input type="date" value={sessionForm.session_date}
                        onChange={e => setSessionForm(f => ({ ...f, session_date: e.target.value }))}
                        className={`${F.space} w-full border-2 border-[#1C1C1C] bg-[#F5F4F0] px-4 py-3 text-[14px] text-[#1C1C1C] focus:outline-none focus:border-[#F7941D] transition-colors`} />
                    </div>
                    <div>
                      <label className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#888888] block mb-1.5`}>Time</label>
                      <input type="time" value={sessionForm.session_time}
                        onChange={e => setSessionForm(f => ({ ...f, session_time: e.target.value }))}
                        className={`${F.space} w-full border-2 border-[#1C1C1C] bg-[#F5F4F0] px-4 py-3 text-[14px] text-[#1C1C1C] focus:outline-none focus:border-[#F7941D] transition-colors`} />
                    </div>
                  </div>
                  <div>
                    <label className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#888888] block mb-1.5`}>Meet Link *</label>
                    <input type="url" value={sessionForm.meet_link}
                      onChange={e => setSessionForm(f => ({ ...f, meet_link: e.target.value }))}
                      placeholder="https://meet.google.com/..."
                      className={`${F.space} w-full border-2 border-[#1C1C1C] bg-[#F5F4F0] px-4 py-3 text-[14px] text-[#1C1C1C] focus:outline-none focus:border-[#F7941D] transition-colors placeholder:text-[#AAAAAA]`} />
                  </div>

                  {sessionError && <p className={`${F.space} text-[#CC0000] text-[12px]`}>{sessionError}</p>}

                  <button type="submit" disabled={postingSession}
                    className={`${F.space} font-bold text-[13px] tracking-[0.1em] uppercase bg-[#F7941D] text-white px-6 py-4 hover:bg-[#1C1C1C] disabled:opacity-40 transition-colors mt-2`}>
                    {postingSession ? 'Publishing…' : 'Publish Session'}
                  </button>
                </form>
              </div>
            </div>

            {/* Session list */}
            <div className="col-span-12 lg:col-span-7">
              <div className="bg-[#FFFFFF] border-2 border-[#1C1C1C]">
                <div className="p-6 border-b-2 border-[#1C1C1C] flex items-center justify-between">
                  <div>
                    <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-0.5`}>Active & Scheduled</div>
                    <h2 className={`${F.space} font-bold text-[#1C1C1C] text-lg`}>Public Sessions ({sessions.length})</h2>
                  </div>
                </div>

                {sessions.length === 0 ? (
                  <div className="py-16 text-center">
                    <p className={`${F.space} text-[#AAAAAA] text-[12px] tracking-widest uppercase`}>No sessions yet. Create the first one.</p>
                  </div>
                ) : (
                  <div className="divide-y-2 divide-[#F5F4F0]">
                    {sessions.map(s => (
                      <div key={s.id} className="p-6 hover:bg-[#F5F4F0] transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`${F.space} text-[10px] font-bold tracking-[0.2em] uppercase px-2 py-0.5 ${s.is_active ? 'bg-[#F7941D] text-white' : 'bg-[#E0E0E0] text-[#888888]'}`}>
                                {s.is_active ? 'Live' : 'Hidden'}
                              </span>
                              {s.session_date && (
                                <span className={`${F.space} text-[11px] text-[#888888]`}>
                                  {new Date(s.session_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  {s.session_time && ` · ${s.session_time}`}
                                </span>
                              )}
                            </div>
                            <div className={`${F.space} font-bold text-[#1C1C1C] text-[15px]`}>{s.title}</div>
                            <div className={`${F.serif} italic text-[#888888] text-[13px] mt-0.5`}>{s.mentor_name}</div>
                            {s.description && (
                              <div className={`${F.serif} text-[#666666] text-[13px] mt-2 leading-relaxed line-clamp-2`}>{s.description}</div>
                            )}
                            <a href={s.meet_link} target="_blank" rel="noopener noreferrer"
                              className={`${F.space} text-[11px] text-[#003580] hover:text-[#F7941D] transition-colors mt-2 inline-block truncate max-w-xs`}>
                              {s.meet_link}
                            </a>
                          </div>
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            <button onClick={() => handleToggleSession(s.id)}
                              className={`${F.space} text-[11px] font-bold tracking-wide border px-3 py-1.5 transition-colors w-20 text-center ${s.is_active ? 'border-[#1C1C1C] text-[#1C1C1C] hover:bg-[#1C1C1C] hover:text-white' : 'border-[#F7941D] text-[#F7941D] hover:bg-[#F7941D] hover:text-white'}`}>
                              {s.is_active ? 'Hide' : 'Show'}
                            </button>
                            <button onClick={() => handleDeleteSession(s.id)}
                              className={`${F.space} text-[11px] font-bold tracking-wide border border-[#CC0000] text-[#CC0000] hover:bg-[#CC0000] hover:text-white px-3 py-1.5 transition-colors w-20 text-center`}>
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ════════════════════════════
            FEATURED WORK TAB
        ════════════════════════════ */}
        {activeTab === 'featured' && (
          <div className="grid grid-cols-12 gap-8">

            <div className="col-span-12 lg:col-span-5">
              <div className="bg-[#FFFFFF] border-2 border-[#1C1C1C] p-8">
                <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-2`}>Homepage Showcase</div>
                <h2 className={`${F.display} font-black italic text-[#1C1C1C] text-2xl mb-8`}>Add Featured Work</h2>

                <form onSubmit={handleCreateFeatured} className="flex flex-col gap-4">
                  <div>
                    <label className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#888888] block mb-1.5`}>Startup *</label>
                    <select
                      value={featuredForm.startup_id}
                      onChange={e => setFeaturedForm(f => ({ ...f, startup_id: e.target.value }))}
                      className={`${F.space} w-full border-2 border-[#1C1C1C] bg-[#F5F4F0] px-4 py-3 text-[14px] text-[#1C1C1C] focus:outline-none focus:border-[#F7941D] transition-colors`}
                    >
                      <option value="">Select a startup</option>
                      {startupLeaders.map(row => (
                        <option key={row.startup_id} value={row.startup_id}>{row.startup_name}</option>
                      ))}
                    </select>
                  </div>

                  <input
                    type="text"
                    placeholder="Headline (optional)"
                    value={featuredForm.headline}
                    onChange={e => setFeaturedForm(f => ({ ...f, headline: e.target.value }))}
                    className={`${F.space} w-full border-2 border-[#1C1C1C] bg-[#F5F4F0] px-4 py-3 text-[14px] text-[#1C1C1C] focus:outline-none focus:border-[#F7941D] transition-colors placeholder:text-[#AAAAAA]`}
                  />

                  <textarea
                    rows={4}
                    placeholder="Summary / featured description"
                    value={featuredForm.summary}
                    onChange={e => setFeaturedForm(f => ({ ...f, summary: e.target.value }))}
                    className={`${F.space} w-full border-2 border-[#1C1C1C] bg-[#F5F4F0] px-4 py-3 text-[14px] text-[#1C1C1C] focus:outline-none focus:border-[#F7941D] transition-colors resize-none placeholder:text-[#AAAAAA]`}
                  />

                  <input
                    type="url"
                    placeholder="Hero image URL (optional)"
                    value={featuredForm.hero_image_url}
                    onChange={e => setFeaturedForm(f => ({ ...f, hero_image_url: e.target.value }))}
                    className={`${F.space} w-full border-2 border-[#1C1C1C] bg-[#F5F4F0] px-4 py-3 text-[14px] text-[#1C1C1C] focus:outline-none focus:border-[#F7941D] transition-colors placeholder:text-[#AAAAAA]`}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="CTA label"
                      value={featuredForm.cta_label}
                      onChange={e => setFeaturedForm(f => ({ ...f, cta_label: e.target.value }))}
                      className={`${F.space} w-full border-2 border-[#1C1C1C] bg-[#F5F4F0] px-4 py-3 text-[14px] text-[#1C1C1C] focus:outline-none focus:border-[#F7941D] transition-colors placeholder:text-[#AAAAAA]`}
                    />
                    <input
                      type="number"
                      min={0}
                      placeholder="Display order"
                      value={featuredForm.display_order}
                      onChange={e => setFeaturedForm(f => ({ ...f, display_order: e.target.value }))}
                      className={`${F.space} w-full border-2 border-[#1C1C1C] bg-[#F5F4F0] px-4 py-3 text-[14px] text-[#1C1C1C] focus:outline-none focus:border-[#F7941D] transition-colors`}
                    />
                  </div>

                  <input
                    type="url"
                    placeholder="CTA URL (optional)"
                    value={featuredForm.cta_url}
                    onChange={e => setFeaturedForm(f => ({ ...f, cta_url: e.target.value }))}
                    className={`${F.space} w-full border-2 border-[#1C1C1C] bg-[#F5F4F0] px-4 py-3 text-[14px] text-[#1C1C1C] focus:outline-none focus:border-[#F7941D] transition-colors placeholder:text-[#AAAAAA]`}
                  />

                  {featuredError && <p className={`${F.space} text-[#CC0000] text-[12px]`}>{featuredError}</p>}

                  <button
                    type="submit"
                    disabled={featuredPosting}
                    className={`${F.space} font-bold text-[13px] tracking-[0.1em] uppercase bg-[#F7941D] text-white px-6 py-4 hover:bg-[#1C1C1C] disabled:opacity-40 transition-colors mt-2`}
                  >
                    {featuredPosting ? 'Adding…' : 'Add Featured Work'}
                  </button>
                </form>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-7">
              <div className="bg-[#FFFFFF] border-2 border-[#1C1C1C]">
                <div className="p-6 border-b-2 border-[#1C1C1C]">
                  <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-0.5`}>Management</div>
                  <h2 className={`${F.space} font-bold text-[#1C1C1C] text-lg`}>Featured Items ({featuredWorks.length})</h2>
                </div>

                {featuredWorks.length === 0 ? (
                  <div className="py-16 text-center">
                    <p className={`${F.space} text-[#AAAAAA] text-[12px] tracking-widest uppercase`}>No featured work items yet.</p>
                  </div>
                ) : (
                  <div className="divide-y-2 divide-[#F5F4F0]">
                    {featuredWorks.map(item => (
                      <div key={item.id} className="p-6 hover:bg-[#F5F4F0] transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`${F.space} text-[10px] font-bold tracking-[0.2em] uppercase px-2 py-0.5 ${item.is_active ? 'bg-[#F7941D] text-white' : 'bg-[#E0E0E0] text-[#888888]'}`}>
                                {item.is_active ? 'Live' : 'Hidden'}
                              </span>
                              <span className={`${F.space} text-[11px] text-[#888888]`}>Order {item.display_order ?? 0}</span>
                            </div>
                            <div className={`${F.space} font-bold text-[#1C1C1C] text-[15px]`}>{item.headline || item.startup_name}</div>
                            <div className={`${F.serif} italic text-[#888888] text-[13px] mt-0.5`}>{item.startup_name} {item.domain ? `· ${item.domain}` : ''}</div>
                            {item.summary && <div className={`${F.serif} text-[#666666] text-[13px] mt-2 leading-relaxed line-clamp-2`}>{item.summary}</div>}
                            {item.cta_url && (
                              <a href={item.cta_url} target="_blank" rel="noopener noreferrer" className={`${F.space} text-[11px] text-[#003580] hover:text-[#F7941D] transition-colors mt-2 inline-block truncate max-w-xs`}>
                                {item.cta_label || 'Open link'}
                              </a>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleToggleFeatured(item.id)}
                              className={`${F.space} text-[11px] font-bold tracking-wide border px-3 py-1.5 transition-colors w-20 text-center ${item.is_active ? 'border-[#1C1C1C] text-[#1C1C1C] hover:bg-[#1C1C1C] hover:text-white' : 'border-[#F7941D] text-[#F7941D] hover:bg-[#F7941D] hover:text-white'}`}
                            >
                              {item.is_active ? 'Hide' : 'Show'}
                            </button>
                            <button
                              onClick={() => handleDeleteFeatured(item.id)}
                              className={`${F.space} text-[11px] font-bold tracking-wide border border-[#CC0000] text-[#CC0000] hover:bg-[#CC0000] hover:text-white px-3 py-1.5 transition-colors w-20 text-center`}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════
            STARTUP LEADERS TAB
        ════════════════════════════ */}
        {activeTab === 'leaders' && (
          <div className="bg-[#FFFFFF] border-2 border-[#1C1C1C] overflow-hidden">
            <div className="p-6 border-b-2 border-[#1C1C1C]">
              <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-0.5`}>Contacts</div>
              <h2 className={`${F.space} font-bold text-[#1C1C1C] text-lg`}>Startup Leaders ({startupLeaders.length})</h2>
            </div>

            {startupLeaders.length === 0 ? (
              <div className="py-16 text-center">
                <p className={`${F.space} text-[#AAAAAA] text-[12px] tracking-widest uppercase`}>No startup leaders found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse">
                  <thead>
                    <tr className="bg-[#F5F4F0] border-b-2 border-[#1C1C1C]">
                      {['Startup', 'Domain / Stage', 'Leader', 'Leader Email', 'Phone', 'Startup Email'].map(head => (
                        <th key={head} className={`${F.space} text-left text-[10px] tracking-[0.2em] uppercase text-[#666666] px-4 py-3 border-r border-[#E0E0E0]`}>{head}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {startupLeaders.map(row => (
                      <tr key={row.startup_id} className="border-b border-[#EFEFEF] hover:bg-[#F9F9F9]">
                        <td className="px-4 py-3">
                          <div className={`${F.space} font-bold text-[14px] text-[#1C1C1C]`}>{row.startup_name}</div>
                          <div className={`${F.space} text-[11px] text-[#888888]`}>Upvotes {row.upvote_count ?? 0} · Members {row.member_count ?? 0}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className={`${F.space} text-[13px] text-[#1C1C1C]`}>{row.domain || '—'}</div>
                          <div className={`${F.space} text-[11px] text-[#888888] uppercase`}>{row.stage || '—'}</div>
                        </td>
                        <td className={`px-4 py-3 ${F.space} text-[13px] text-[#1C1C1C]`}>{row.leader_name || '—'}</td>
                        <td className="px-4 py-3">
                          <a href={`mailto:${row.leader_email}`} className={`${F.space} text-[13px] text-[#003580] hover:text-[#F7941D] transition-colors`}>
                            {row.leader_email || '—'}
                          </a>
                        </td>
                        <td className={`px-4 py-3 ${F.space} text-[13px] text-[#1C1C1C]`}>{row.leader_phone || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="email"
                              value={leaderEmails[row.startup_id] ?? ''}
                              onChange={e => setLeaderEmails(prev => ({ ...prev, [row.startup_id]: e.target.value }))}
                              placeholder="startup@company.com"
                              className={`${F.space} w-[220px] border border-[#1C1C1C] bg-white px-3 py-2 text-[12px] text-[#1C1C1C] focus:outline-none focus:border-[#F7941D]`}
                            />
                            <button
                              onClick={() => handleSaveStartupEmail(row.startup_id)}
                              className={`${F.space} text-[11px] font-bold tracking-wide border border-[#1C1C1C] text-[#1C1C1C] hover:bg-[#1C1C1C] hover:text-white px-3 py-2 transition-colors`}
                            >
                              Save
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════
            NEWS TAB
        ════════════════════════════ */}
        {activeTab === 'news' && (
          <div className="grid grid-cols-12 gap-8">

            {/* Post form */}
            <div className="col-span-12 lg:col-span-5">
              <div className="bg-[#FFFFFF] border-2 border-[#1C1C1C] p-8">
                <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-2`}>Publish</div>
                <h2 className={`${F.display} font-black italic text-[#1C1C1C] text-2xl mb-8`}>Post to News Feed</h2>

                <form onSubmit={handlePost} className="flex flex-col gap-4">
                  <input type="text" placeholder="Title" value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className={`${F.space} w-full border-2 border-[#1C1C1C] bg-[#F5F4F0] px-4 py-3 text-[14px] text-[#1C1C1C] focus:outline-none focus:border-[#F7941D] transition-colors placeholder:text-[#AAAAAA]`} />
                  <textarea placeholder="Content…" rows={5} value={form.content}
                    onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    className={`${F.space} w-full border-2 border-[#1C1C1C] bg-[#F5F4F0] px-4 py-3 text-[14px] text-[#1C1C1C] focus:outline-none focus:border-[#F7941D] transition-colors resize-none placeholder:text-[#AAAAAA]`} />

                  {/* Image */}
                  <input ref={newsImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleNewsImageSelect} />
                  {newsImagePreview ? (
                    <div className="relative inline-block">
                      <img src={newsImagePreview} alt="Preview" className="h-40 w-auto object-cover border-2 border-[#1C1C1C]" />
                      <button type="button" onClick={removeNewsImage}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-[#CC0000] text-white flex items-center justify-center">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => newsImageInputRef.current?.click()}
                      className={`${F.space} text-[12px] tracking-wide text-[#888888] border-2 border-dashed border-[#CCCCCC] px-4 py-3 hover:border-[#F7941D] hover:text-[#F7941D] transition-colors flex items-center gap-2`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      Attach image (optional)
                    </button>
                  )}

                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className={`${F.space} border-2 border-[#1C1C1C] bg-[#F5F4F0] text-[#1C1C1C] px-4 py-3 text-[13px] focus:outline-none focus:border-[#F7941D] transition-colors`}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>

                  {newsError && <p className={`${F.space} text-[#CC0000] text-[12px]`}>{newsError}</p>}

                  <button type="submit" disabled={posting}
                    className={`${F.space} font-bold text-[13px] tracking-[0.1em] uppercase bg-[#F7941D] text-white px-6 py-4 hover:bg-[#1C1C1C] disabled:opacity-40 transition-colors`}>
                    {posting ? 'Publishing…' : 'Publish News'}
                  </button>
                </form>
              </div>
            </div>

            {/* News list */}
            <div className="col-span-12 lg:col-span-7">
              {news.length > 0 && (
                <div className="mb-8">
                  <PressNewsSection news={news} title="Published News" subtitle="ADMIN PREVIEW" />
                </div>
              )}
              <div className="bg-[#FFFFFF] border-2 border-[#1C1C1C]">
                <div className="p-6 border-b-2 border-[#1C1C1C]">
                  <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-0.5`}>Management</div>
                  <h2 className={`${F.space} font-bold text-[#1C1C1C] text-lg`}>Published ({news.length})</h2>
                </div>
                {news.length === 0 ? (
                  <div className="py-16 text-center">
                    <p className={`${F.space} text-[#AAAAAA] text-[12px] tracking-widest uppercase`}>No news published yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#F0F0F0]">
                    {news.map(item => (
                      <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-[#F5F4F0] transition-colors">
                        {item.image_url && (
                          <img src={item.image_url} alt={item.title} className="w-12 h-12 object-cover border border-[#E0E0E0] flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`${F.space} text-[10px] font-bold uppercase tracking-wider text-[#F7941D]`}>{item.category}</span>
                            <span className={`${F.space} text-[11px] text-[#AAAAAA]`}>{new Date(item.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className={`${F.space} text-sm font-semibold text-[#1C1C1C] truncate`}>{item.title}</p>
                        </div>
                        <button onClick={() => handleDeleteNews(item.id)}
                          className={`${F.space} text-[11px] font-bold tracking-wide border border-[#CC0000] text-[#CC0000] hover:bg-[#CC0000] hover:text-white px-3 py-1.5 flex-shrink-0 transition-colors`}>
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
