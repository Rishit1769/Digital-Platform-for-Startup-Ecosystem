'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { api } from '../../../lib/axios';
import Avatar from '../../../components/Avatar';
import GitHubWidget from '../../../components/GitHubWidget';
import { DataPanel } from '../../../components/DataPanel';
import { StatusBadge } from '../../../components/EcoTable';

const F = {
  display: "font-[family-name:var(--font-playfair)]",
  space:   "font-[family-name:var(--font-space)]",
  serif:   "font-[family-name:var(--font-serif)]",
  bebas:   "font-[family-name:var(--font-bebas)]",
};

const TABS = [
  { key: 'overview',   label: 'Overview'   },
  { key: 'team',       label: 'Team'        },
  { key: 'roles',      label: 'Open Roles'  },
  { key: 'reviews',    label: 'Reviews'     },
  { key: 'analytics',  label: 'Analytics'   },
];

const STAGE_COLOR: Record<string, 'orange'|'blue'|'dark'|'neutral'> = {
  idea: 'neutral', prototype: 'orange', mvp: 'orange', scaling: 'blue', funded: 'blue',
};

export default function StartupProfile({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [startup,     setStartup]     = useState<any>(null);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState<string>('overview');
  const [analytics,   setAnalytics]   = useState<any>(null);
  const [isUpvoted,   setIsUpvoted]   = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [reviews,     setReviews]     = useState<any[]>([]);
  const [myRole,      setMyRole]      = useState<string | null>(null);
  const [viewerRole,  setViewerRole]  = useState<string>('');
  const [reviewForm,  setReviewForm]  = useState({ rating: 5, comment: '' });
  const [submitting,  setSubmitting]  = useState(false);
  const [volunteering, setVolunteering] = useState(false);

  useEffect(() => {
    fetchStartup();
    fetchViewerRole();
    checkUpvote();
    fetchReviews();
    fetchAnalytics();
  }, [id]);

  const fetchViewerRole = async () => {
    try {
      const res = await api.get('/profile/me');
      setViewerRole(res.data?.data?.role || '');
    } catch {
      setViewerRole('');
    }
  };

  const fetchStartup = async () => {
    try {
      const res = await api.get(`/startups/${id}`);
      const s = res.data.data;
      setStartup(s);
      setUpvoteCount(s.upvote_count ?? 0);
      setMyRole(s.my_role ?? null);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchAnalytics = async () => {
    try { const res = await api.get(`/analytics/startup/${id}`); setAnalytics(res.data.data); }
    catch { /* silent */ }
  };

  const checkUpvote = async () => {
    try { const res = await api.get(`/startups/${id}/upvote`); setIsUpvoted(res.data.is_upvoted); }
    catch { /* silent */ }
  };

  const fetchReviews = async () => {
    try { const res = await api.get(`/startups/${id}/reviews`); setReviews(res.data.data); }
    catch { /* silent */ }
  };

  const handleUpvote = async () => {
    try {
      const res = await api.post(`/startups/${id}/upvote`);
      setIsUpvoted(res.data.action === 'added');
      setUpvoteCount(p => res.data.action === 'added' ? p + 1 : p - 1);
    } catch { /* silent */ }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/startups/${id}/reviews`, reviewForm);
      setReviewForm({ rating: 5, comment: '' });
      fetchReviews();
    } catch (err: any) { alert(err.response?.data?.error || 'Failed to submit review'); }
    finally { setSubmitting(false); }
  };

  const handleVolunteerAsMentor = async () => {
    const msg = window.prompt('Optional note to founder:', 'I would like to volunteer as a mentor for this startup.') || '';
    setVolunteering(true);
    try {
      await api.post(`/startups/${id}/mentor-volunteer`, { message: msg });
      alert('Volunteer request sent to the startup founder.');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to send volunteer request.');
    } finally {
      setVolunteering(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F4F0]">
      <div className={`${F.bebas} text-[#F7941D] tracking-widest`} style={{ fontSize: '2rem' }}>Loading</div>
    </div>
  );
  if (!startup) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F4F0]">
      <p className={`${F.space} text-[#888888]`}>Startup not found</p>
    </div>
  );

  const isFounderOrMember = myRole === 'founder' || myRole === 'member';
  const canVolunteerAsMentor = viewerRole === 'mentor' && !myRole;

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-[#1C1C1C]">

      {/* Top bar */}
      <header className="bg-[#1C1C1C] border-b-2 border-[#F7941D] sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 bg-[#F7941D]" />
              <span className={`${F.space} font-bold text-white text-lg tracking-[0.05em]`}>ECOSYSTEM</span>
            </a>
            <div className={`${F.space} text-white/30 text-[11px] tracking-[0.2em] uppercase hidden md:block`}>/ Startups / {startup.name}</div>
          </div>
          <div className="flex items-center gap-2">
            {isFounderOrMember && (
              <button onClick={() => router.push(`/startups/${id}/manage`)}
                className={`${F.space} text-[11px] font-bold tracking-wide bg-[#F7941D] text-white px-4 py-2 hover:bg-white hover:text-[#1C1C1C] transition-colors`}>
                Manage →
              </button>
            )}
            <button onClick={() => router.push('/discover')}
              className={`${F.space} text-[12px] text-white/60 hover:text-white transition-colors border border-white/15 hover:border-white/40 px-4 py-2`}>
              ← Discover
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-[#1C1C1C] border-b-2 border-[#1C1C1C]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-14">
          <div className="grid grid-cols-12 gap-8 items-end">
            <div className="col-span-12 lg:col-span-8">
              <div className="flex items-start gap-6 mb-6">
                {/* Logo */}
                <div className="w-20 h-20 border-2 border-white/20 flex-shrink-0 overflow-hidden bg-white/10 flex items-center justify-center">
                  {startup.logo_url
                    ? <img src={startup.logo_url} alt={startup.name} className="w-full h-full object-cover" />
                    : <span className={`${F.bebas} text-white text-4xl`}>{startup.name?.charAt(0)}</span>
                  }
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <StatusBadge label={startup.stage?.toUpperCase() ?? 'IDEA'} color={STAGE_COLOR[startup.stage] ?? 'neutral'} />
                    {startup.domain && (
                      <span className={`${F.space} text-[10px] tracking-[0.15em] uppercase text-white/40 border border-white/15 px-2 py-0.5`}>{startup.domain}</span>
                    )}
                  </div>
                  <h1 className={`${F.display} font-black italic text-white leading-[0.92]`}
                    style={{ fontSize: 'clamp(32px, 4vw, 54px)' }}>
                    {startup.name}
                  </h1>
                </div>
              </div>
              {startup.tagline && (
                <p className={`${F.serif} text-white/60 text-lg leading-[1.7] max-w-2xl`}>{startup.tagline}</p>
              )}
            </div>

            {/* Upvote + CTA */}
            <div className="col-span-12 lg:col-span-4 flex items-end justify-start lg:justify-end gap-3">
              <button onClick={handleUpvote}
                className={`${F.space} font-bold text-[12px] tracking-[0.1em] uppercase flex items-center gap-2 px-5 py-3 border-2 transition-colors ${isUpvoted ? 'bg-[#F7941D] border-[#F7941D] text-white' : 'border-white/30 text-white hover:border-[#F7941D] hover:text-[#F7941D]'}`}>
                ▲ <span>{upvoteCount}</span>
              </button>
              {canVolunteerAsMentor && (
                <button
                  onClick={handleVolunteerAsMentor}
                  disabled={volunteering}
                  className={`${F.space} font-bold text-[12px] tracking-[0.1em] uppercase px-5 py-3 border-2 border-[#F7941D] text-[#F7941D] hover:bg-[#F7941D] hover:text-white disabled:opacity-40 transition-colors`}
                >
                  {volunteering ? 'Sending…' : 'Volunteer As Mentor'}
                </button>
              )}
              {startup.website_url && (
                <a href={startup.website_url} target="_blank" rel="noopener noreferrer"
                  className={`${F.space} font-bold text-[12px] tracking-[0.1em] uppercase bg-white text-[#1C1C1C] px-5 py-3 hover:bg-[#F7941D] hover:text-white transition-colors`}>
                  Visit Site
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="border-b-2 border-[#1C1C1C] bg-[#FFFFFF] sticky top-[57px] z-30">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14">
          <div className="flex divide-x-2 divide-[#1C1C1C] overflow-x-auto">
            {TABS.map(({ key, label }, i) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`${F.space} font-bold text-[11px] tracking-[0.15em] uppercase px-6 py-4 flex-shrink-0 transition-colors flex items-center gap-2 ${activeTab === key ? 'bg-[#1C1C1C] text-white' : 'bg-white text-[#AAAAAA] hover:text-[#1C1C1C] hover:bg-[#F5F4F0]'}`}>
                <span className={activeTab === key ? 'text-[#F7941D]' : 'text-inherit'}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-12">

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
              <DataPanel eyebrow="About" title="The Idea">
                <p className={`${F.serif} text-[#555555] leading-[1.9] text-[15px]`}>{startup.description || 'No description provided.'}</p>
                {startup.tech_stack?.length > 0 && (
                  <div className="mt-6">
                    <div className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#AAAAAA] mb-3`}>Tech Stack</div>
                    <div className="flex flex-wrap gap-2">
                      {startup.tech_stack.map((t: string, i: number) => (
                        <span key={i} className={`${F.space} text-[11px] tracking-[0.1em] uppercase border border-[#1C1C1C] px-2.5 py-1 text-[#1C1C1C]`}>{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </DataPanel>
              {startup.github_repo_url && (
                <GitHubWidget repoUrl={startup.github_repo_url} />
              )}
            </div>
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              <DataPanel eyebrow="Details" title="Info">
                <div className="flex flex-col gap-4">
                  {[
                    ['Stage',   startup.stage],
                    ['Domain',  startup.domain],
                    ['Founded', startup.created_at ? new Date(startup.created_at).getFullYear() : '—'],
                    ['Members', startup.members?.length ?? 0],
                  ].map(([k, v]) => (
                    <div key={String(k)} className="flex items-center justify-between border-b border-[#F0F0F0] pb-3">
                      <span className={`${F.space} text-[11px] tracking-[0.15em] uppercase text-[#AAAAAA]`}>{k}</span>
                      <span className={`${F.space} font-bold text-[#1C1C1C] text-[13px] capitalize`}>{v ?? '—'}</span>
                    </div>
                  ))}
                </div>
              </DataPanel>
            </div>
          </div>
        )}

        {/* Team */}
        {activeTab === 'team' && (
          <div className="grid grid-cols-12 gap-6">
            {(startup.members ?? []).map((m: any) => (
              <div key={m.user_id ?? m.member_id ?? `${m.name}-${m.joined_at}`}
                className="col-span-12 sm:col-span-6 lg:col-span-4 border-2 border-[#1C1C1C] bg-white p-6 flex items-center gap-4 hover:bg-[#F5F4F0] transition-colors cursor-pointer"
                onClick={() => {
                  if (m.user_id) router.push(`/profile/${m.user_id}`);
                }}>
                <div className="w-12 h-12 flex-shrink-0">
                  <Avatar name={m.name} avatarUrl={m.avatar_url} size="md" />
                </div>
                <div className="min-w-0">
                  <div className={`${F.space} font-bold text-[#1C1C1C] truncate`}>{m.name}</div>
                  <div className={`${F.space} text-[11px] tracking-[0.1em] uppercase text-[#888888]`}>{m.role}</div>
                </div>
              </div>
            ))}
            {(startup.members ?? []).length === 0 && (
              <div className="col-span-12 py-16 text-center">
                <div className={`${F.bebas} text-[#EEEEEE]`} style={{ fontSize: '5rem', lineHeight: 1 }}>00</div>
                <div className={`${F.space} text-[#AAAAAA] mt-3`}>No team members listed yet.</div>
              </div>
            )}
          </div>
        )}

        {/* Open Roles */}
        {activeTab === 'roles' && (
          <div className="flex flex-col gap-4">
            {(startup.open_roles ?? []).map((r: any) => (
              <div key={r.id} className="border-2 border-[#1C1C1C] bg-white p-6 flex items-start justify-between gap-6">
                <div>
                  <div className={`${F.space} font-bold text-[#1C1C1C] text-[16px] mb-1`}>{r.title}</div>
                  <p className={`${F.serif} text-[#666666] text-sm leading-[1.7]`}>{r.description}</p>
                  {r.skills_required?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {r.skills_required.map((s: string, i: number) => (
                        <span key={i} className={`${F.space} text-[10px] tracking-[0.1em] uppercase border border-[#1C1C1C] px-2 py-0.5 text-[#1C1C1C]`}>{s}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => router.push(`/roles`)}
                  className={`${F.space} font-bold text-[11px] tracking-wide bg-[#F7941D] text-white px-5 py-3 hover:bg-[#1C1C1C] transition-colors flex-shrink-0`}>
                  Apply
                </button>
              </div>
            ))}
            {(startup.open_roles ?? []).length === 0 && (
              <div className="py-16 text-center border-2 border-[#1C1C1C] bg-white">
                <div className={`${F.space} text-[#AAAAAA]`}>No open roles at the moment.</div>
              </div>
            )}
          </div>
        )}

        {/* Reviews */}
        {activeTab === 'reviews' && (
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-7 flex flex-col gap-4">
              {reviews.map(r => (
                <div key={r.id} className="border-2 border-[#1C1C1C] bg-white p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className={`${F.space} font-bold text-[#1C1C1C] text-[14px]`}>{r.reviewer_name}</div>
                      <div className={`${F.space} text-[#888888] text-[11px]`}>{new Date(r.created_at).toLocaleDateString('en-IN')}</div>
                    </div>
                    <div className={`${F.bebas} text-[#F7941D] leading-none`} style={{ fontSize: '2rem' }}>{r.rating}/5</div>
                  </div>
                  <p className={`${F.serif} text-[#555555] text-[14px] leading-[1.8]`}>{r.comment}</p>
                </div>
              ))}
              {reviews.length === 0 && (
                <div className="border-2 border-[#1C1C1C] bg-white py-16 text-center">
                  <div className={`${F.space} text-[#AAAAAA]`}>No reviews yet. Be the first.</div>
                </div>
              )}
            </div>

            <div className="col-span-12 lg:col-span-5">
              <DataPanel eyebrow="Your Review" title="Leave a Rating">
                <form onSubmit={handleReview} className="flex flex-col gap-4">
                  <div>
                    <label className="eco-label">Rating (1–5)</label>
                    <select value={reviewForm.rating}
                      onChange={e => setReviewForm(f => ({ ...f, rating: Number(e.target.value) }))}
                      className="eco-input off-white">
                      {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} — {['','Poor','Fair','Good','Great','Excellent'][n]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="eco-label">Comment</label>
                    <textarea rows={4} required value={reviewForm.comment}
                      onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                      placeholder="Share your thoughts…"
                      className="eco-input off-white" />
                  </div>
                  <button type="submit" disabled={submitting} className="eco-btn eco-btn-primary">
                    {submitting ? 'Submitting…' : 'Submit Review'}
                  </button>
                </form>
              </DataPanel>
            </div>
          </div>
        )}

        {/* Analytics */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-2 sm:grid-cols-4">
            {analytics ? (
              Object.entries({
                'Profile Views':  analytics.profile_views ?? 0,
                'Upvotes':        analytics.upvotes ?? upvoteCount,
                'Applications':   analytics.total_applications ?? 0,
                'Reviews':        analytics.total_reviews ?? reviews.length,
              }).map(([label, value], i) => (
                <div key={label} className={`border-2 border-[#1C1C1C] ${i > 0 ? '-ml-0.5' : ''} bg-white px-8 py-6`}>
                  <div className={`${F.bebas} text-[#F7941D] leading-none`} style={{ fontSize: '3rem' }}>{value}</div>
                  <div className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#888888] mt-1`}>{label}</div>
                </div>
              ))
            ) : (
              <div className="col-span-4 border-2 border-[#1C1C1C] bg-white py-16 text-center">
                <div className={`${F.space} text-[#AAAAAA]`}>Analytics unavailable.</div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
