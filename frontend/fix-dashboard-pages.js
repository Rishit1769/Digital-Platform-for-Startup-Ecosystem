// fix-dashboard-pages.js — node fix-dashboard-pages.js
const fs = require('fs');
const path = require('path');
const base = path.join(__dirname, 'app');

/* ─────────────────────────────────────────────────────────────────────────
   admin/verifications/page.tsx
   ───────────────────────────────────────────────────────────────────────── */
const adminVerifications = `'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/axios';
import { DataPanel } from '../../../components/DataPanel';
import EcoTable, { EcoRow, StatusBadge } from '../../../components/EcoTable';

const F = {
  display: "font-[family-name:var(--font-playfair)]",
  space:   "font-[family-name:var(--font-space)]",
  serif:   "font-[family-name:var(--font-serif)]",
  bebas:   "font-[family-name:var(--font-bebas)]",
};

export default function Verifications() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/admin/verification-requests');
      setRequests(res.data.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleVerify = async (userId: number, role: string) => {
    try {
      const badge_type = role === 'mentor' ? 'verified_mentor' : 'verified_student';
      await api.post(\`/admin/verify/\${userId}\`, { badge_type });
      fetchRequests();
    } catch (err) { console.error(err); }
  };

  const handleReject = async (userId: number) => {
    try {
      await api.delete(\`/admin/verify/\${userId}\`);
      fetchRequests();
    } catch (err) { console.error(err); }
  };

  const COLS = [
    { label: 'User',                span: 'col-span-4' },
    { label: 'Role / Institution',  span: 'col-span-3' },
    { label: 'Profile Strength',    span: 'col-span-3' },
    { label: 'Action',              span: 'col-span-2', align: 'right' as const },
  ];

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-[#1C1C1C]">

      {/* Top bar */}
      <header className="bg-[#1C1C1C] border-b-2 border-[#F7941D] sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="/" className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 bg-[#F7941D]" />
              <span className={\`\${F.space} font-bold text-white text-lg tracking-[0.05em]\`}>ECOSYSTEM</span>
            </a>
            <span className={\`\${F.space} text-white/30 text-[11px] tracking-[0.2em] uppercase hidden md:block\`}>/ Verifications</span>
          </div>
          <button onClick={() => router.push('/admin')}
            className={\`\${F.space} text-[12px] tracking-wide text-white/60 hover:text-white transition-colors border border-white/15 hover:border-white/40 px-4 py-2\`}>
            ← Admin Console
          </button>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-[#003580] border-b-2 border-[#1C1C1C]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-14">
          <div className={\`\${F.space} text-[11px] tracking-[0.25em] uppercase text-[#F7941D] mb-4\`}>Trust & Compliance</div>
          <div className="flex items-end justify-between flex-wrap gap-6">
            <h1 className={\`\${F.display} font-black italic text-white leading-[0.92]\`}
              style={{ fontSize: 'clamp(36px, 4vw, 56px)' }}>
              Verification Centre.
            </h1>
            <div className="border-2 border-white/20 px-6 py-4">
              <div className={\`\${F.bebas} text-[#F7941D] leading-none\`} style={{ fontSize: '2.5rem' }}>{requests.length}</div>
              <div className={\`\${F.space} text-[10px] tracking-[0.2em] uppercase text-white/50 mt-0.5\`}>Pending Requests</div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-12">
        <DataPanel noPadding
          eyebrow="Awaiting Review"
          title={\`Pending Requests (\${requests.length})\`}
        >
          <div className="px-6 lg:px-8 pb-6">
            <EcoTable cols={COLS} loading={loading} empty="No pending verification requests.">
              {requests.map(req => {
                const strength = req.bio && req.skills ? 100 : req.skills ? 60 : 25;
                const strengthLabel = strength === 100 ? 'Strong' : strength === 60 ? 'Medium' : 'Weak';
                const strengthColor = strength === 100 ? '#1C1C1C' : strength === 60 ? '#F7941D' : '#CC0000';
                return (
                  <EcoRow key={req.id}>
                    {/* User */}
                    <div className="col-span-12 md:col-span-4 flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#1C1C1C] flex items-center justify-center flex-shrink-0">
                        <span className={\`\${F.bebas} text-[#F7941D] text-xl leading-none\`}>{req.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <div className={\`\${F.space} font-bold text-[#1C1C1C] text-[14px] cursor-pointer hover:text-[#F7941D] transition-colors truncate\`}
                          onClick={() => router.push(\`/profile/\${req.id}\`)}>
                          {req.name}
                        </div>
                        <div className={\`\${F.space} text-[#888888] text-[11px] truncate\`}>{req.email}</div>
                      </div>
                    </div>

                    {/* Role / Institution */}
                    <div className="hidden md:block col-span-3">
                      <StatusBadge
                        label={req.role.toUpperCase()}
                        color={req.role === 'mentor' ? 'blue' : 'dark'}
                      />
                      <div className={\`\${F.serif} text-[#555555] text-[13px] mt-1.5\`}>
                        {req.role === 'mentor' ? req.company || '—' : req.college || '—'}
                      </div>
                    </div>

                    {/* Strength */}
                    <div className="hidden md:block col-span-3">
                      <div className="flex items-center gap-3">
                        <div className="eco-progress-bar flex-1">
                          <div className="eco-progress-bar-fill" style={{ width: strength + '%', backgroundColor: strengthColor }} />
                        </div>
                        <span className={\`\${F.space} text-[11px] font-bold w-14 flex-shrink-0\`} style={{ color: strengthColor }}>
                          {strengthLabel}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="col-span-12 md:col-span-2 flex items-center justify-end gap-2">
                      <button onClick={() => handleReject(req.id)}
                        className={\`\${F.space} font-bold text-[11px] tracking-wide border border-[#CC0000] text-[#CC0000] hover:bg-[#CC0000] hover:text-white px-3 py-2 transition-colors\`}>
                        Reject
                      </button>
                      <button onClick={() => handleVerify(req.id, req.role)}
                        className={\`\${F.space} font-bold text-[11px] tracking-wide bg-[#1C1C1C] text-white hover:bg-[#F7941D] px-3 py-2 transition-colors\`}>
                        Approve
                      </button>
                    </div>
                  </EcoRow>
                );
              })}
            </EcoTable>
          </div>
        </DataPanel>
      </div>
    </div>
  );
}
`;

/* ─────────────────────────────────────────────────────────────────────────
   startups/[id]/page.tsx  — public startup profile
   ───────────────────────────────────────────────────────────────────────── */
const startupPage = `'use client';

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
  const [reviewForm,  setReviewForm]  = useState({ rating: 5, comment: '' });
  const [submitting,  setSubmitting]  = useState(false);

  useEffect(() => {
    fetchStartup();
    checkUpvote();
    fetchReviews();
    fetchAnalytics();
  }, [id]);

  const fetchStartup = async () => {
    try {
      const res = await api.get(\`/startups/\${id}\`);
      const s = res.data.data;
      setStartup(s);
      setUpvoteCount(s.upvote_count ?? 0);
      setMyRole(s.my_role ?? null);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchAnalytics = async () => {
    try { const res = await api.get(\`/analytics/startup/\${id}\`); setAnalytics(res.data.data); }
    catch { /* silent */ }
  };

  const checkUpvote = async () => {
    try { const res = await api.get(\`/startups/\${id}/upvote\`); setIsUpvoted(res.data.is_upvoted); }
    catch { /* silent */ }
  };

  const fetchReviews = async () => {
    try { const res = await api.get(\`/startups/\${id}/reviews\`); setReviews(res.data.data); }
    catch { /* silent */ }
  };

  const handleUpvote = async () => {
    try {
      const res = await api.post(\`/startups/\${id}/upvote\`);
      setIsUpvoted(res.data.action === 'added');
      setUpvoteCount(p => res.data.action === 'added' ? p + 1 : p - 1);
    } catch { /* silent */ }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(\`/startups/\${id}/reviews\`, reviewForm);
      setReviewForm({ rating: 5, comment: '' });
      fetchReviews();
    } catch (err: any) { alert(err.response?.data?.error || 'Failed to submit review'); }
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F4F0]">
      <div className={\`\${F.bebas} text-[#F7941D] tracking-widest\`} style={{ fontSize: '2rem' }}>Loading</div>
    </div>
  );
  if (!startup) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F4F0]">
      <p className={\`\${F.space} text-[#888888]\`}>Startup not found</p>
    </div>
  );

  const isFounderOrMember = myRole === 'founder' || myRole === 'member';

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-[#1C1C1C]">

      {/* Top bar */}
      <header className="bg-[#1C1C1C] border-b-2 border-[#F7941D] sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 bg-[#F7941D]" />
              <span className={\`\${F.space} font-bold text-white text-lg tracking-[0.05em]\`}>ECOSYSTEM</span>
            </a>
            <div className={\`\${F.space} text-white/30 text-[11px] tracking-[0.2em] uppercase hidden md:block\`}>/ Startups / {startup.name}</div>
          </div>
          <div className="flex items-center gap-2">
            {isFounderOrMember && (
              <button onClick={() => router.push(\`/startups/\${id}/manage\`)}
                className={\`\${F.space} text-[11px] font-bold tracking-wide bg-[#F7941D] text-white px-4 py-2 hover:bg-white hover:text-[#1C1C1C] transition-colors\`}>
                Manage →
              </button>
            )}
            <button onClick={() => router.push('/discover')}
              className={\`\${F.space} text-[12px] text-white/60 hover:text-white transition-colors border border-white/15 hover:border-white/40 px-4 py-2\`}>
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
                    : <span className={\`\${F.bebas} text-white text-4xl\`}>{startup.name?.charAt(0)}</span>
                  }
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <StatusBadge label={startup.stage?.toUpperCase() ?? 'IDEA'} color={STAGE_COLOR[startup.stage] ?? 'neutral'} />
                    {startup.domain && (
                      <span className={\`\${F.space} text-[10px] tracking-[0.15em] uppercase text-white/40 border border-white/15 px-2 py-0.5\`}>{startup.domain}</span>
                    )}
                  </div>
                  <h1 className={\`\${F.display} font-black italic text-white leading-[0.92]\`}
                    style={{ fontSize: 'clamp(32px, 4vw, 54px)' }}>
                    {startup.name}
                  </h1>
                </div>
              </div>
              {startup.tagline && (
                <p className={\`\${F.serif} text-white/60 text-lg leading-[1.7] max-w-2xl\`}>{startup.tagline}</p>
              )}
            </div>

            {/* Upvote + CTA */}
            <div className="col-span-12 lg:col-span-4 flex items-end justify-start lg:justify-end gap-3">
              <button onClick={handleUpvote}
                className={\`\${F.space} font-bold text-[12px] tracking-[0.1em] uppercase flex items-center gap-2 px-5 py-3 border-2 transition-colors \${isUpvoted ? 'bg-[#F7941D] border-[#F7941D] text-white' : 'border-white/30 text-white hover:border-[#F7941D] hover:text-[#F7941D]'}\`}>
                ▲ <span>{upvoteCount}</span>
              </button>
              {startup.website_url && (
                <a href={startup.website_url} target="_blank" rel="noopener noreferrer"
                  className={\`\${F.space} font-bold text-[12px] tracking-[0.1em] uppercase bg-white text-[#1C1C1C] px-5 py-3 hover:bg-[#F7941D] hover:text-white transition-colors\`}>
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
                className={\`\${F.space} font-bold text-[11px] tracking-[0.15em] uppercase px-6 py-4 flex-shrink-0 transition-colors flex items-center gap-2 \${activeTab === key ? 'bg-[#1C1C1C] text-white' : 'bg-white text-[#AAAAAA] hover:text-[#1C1C1C] hover:bg-[#F5F4F0]'}\`}>
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
                <p className={\`\${F.serif} text-[#555555] leading-[1.9] text-[15px]\`}>{startup.description || 'No description provided.'}</p>
                {startup.tech_stack?.length > 0 && (
                  <div className="mt-6">
                    <div className={\`\${F.space} text-[10px] tracking-[0.2em] uppercase text-[#AAAAAA] mb-3\`}>Tech Stack</div>
                    <div className="flex flex-wrap gap-2">
                      {startup.tech_stack.map((t: string, i: number) => (
                        <span key={i} className={\`\${F.space} text-[11px] tracking-[0.1em] uppercase border border-[#1C1C1C] px-2.5 py-1 text-[#1C1C1C]\`}>{t}</span>
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
                      <span className={\`\${F.space} text-[11px] tracking-[0.15em] uppercase text-[#AAAAAA]\`}>{k}</span>
                      <span className={\`\${F.space} font-bold text-[#1C1C1C] text-[13px] capitalize\`}>{v ?? '—'}</span>
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
              <div key={m.id}
                className="col-span-12 sm:col-span-6 lg:col-span-4 border-2 border-[#1C1C1C] bg-white p-6 flex items-center gap-4 hover:bg-[#F5F4F0] transition-colors cursor-pointer"
                onClick={() => router.push(\`/profile/\${m.id}\`)}>
                <div className="w-12 h-12 flex-shrink-0">
                  <Avatar name={m.name} avatarUrl={m.avatar_url} size="md" />
                </div>
                <div className="min-w-0">
                  <div className={\`\${F.space} font-bold text-[#1C1C1C] truncate\`}>{m.name}</div>
                  <div className={\`\${F.space} text-[11px] tracking-[0.1em] uppercase text-[#888888]\`}>{m.role}</div>
                </div>
              </div>
            ))}
            {(startup.members ?? []).length === 0 && (
              <div className="col-span-12 py-16 text-center">
                <div className={\`\${F.bebas} text-[#EEEEEE]\`} style={{ fontSize: '5rem', lineHeight: 1 }}>00</div>
                <div className={\`\${F.space} text-[#AAAAAA] mt-3\`}>No team members listed yet.</div>
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
                  <div className={\`\${F.space} font-bold text-[#1C1C1C] text-[16px] mb-1\`}>{r.title}</div>
                  <p className={\`\${F.serif} text-[#666666] text-sm leading-[1.7]\`}>{r.description}</p>
                  {r.skills_required?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {r.skills_required.map((s: string, i: number) => (
                        <span key={i} className={\`\${F.space} text-[10px] tracking-[0.1em] uppercase border border-[#1C1C1C] px-2 py-0.5 text-[#1C1C1C]\`}>{s}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => router.push(\`/roles\`)}
                  className={\`\${F.space} font-bold text-[11px] tracking-wide bg-[#F7941D] text-white px-5 py-3 hover:bg-[#1C1C1C] transition-colors flex-shrink-0\`}>
                  Apply
                </button>
              </div>
            ))}
            {(startup.open_roles ?? []).length === 0 && (
              <div className="py-16 text-center border-2 border-[#1C1C1C] bg-white">
                <div className={\`\${F.space} text-[#AAAAAA]\`}>No open roles at the moment.</div>
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
                      <div className={\`\${F.space} font-bold text-[#1C1C1C] text-[14px]\`}>{r.reviewer_name}</div>
                      <div className={\`\${F.space} text-[#888888] text-[11px]\`}>{new Date(r.created_at).toLocaleDateString('en-IN')}</div>
                    </div>
                    <div className={\`\${F.bebas} text-[#F7941D] leading-none\`} style={{ fontSize: '2rem' }}>{r.rating}/5</div>
                  </div>
                  <p className={\`\${F.serif} text-[#555555] text-[14px] leading-[1.8]\`}>{r.comment}</p>
                </div>
              ))}
              {reviews.length === 0 && (
                <div className="border-2 border-[#1C1C1C] bg-white py-16 text-center">
                  <div className={\`\${F.space} text-[#AAAAAA]\`}>No reviews yet. Be the first.</div>
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
                <div key={label} className={\`border-2 border-[#1C1C1C] \${i > 0 ? '-ml-0.5' : ''} bg-white px-8 py-6\`}>
                  <div className={\`\${F.bebas} text-[#F7941D] leading-none\`} style={{ fontSize: '3rem' }}>{value}</div>
                  <div className={\`\${F.space} text-[10px] tracking-[0.2em] uppercase text-[#888888] mt-1\`}>{label}</div>
                </div>
              ))
            ) : (
              <div className="col-span-4 border-2 border-[#1C1C1C] bg-white py-16 text-center">
                <div className={\`\${F.space} text-[#AAAAAA]\`}>Analytics unavailable.</div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
`;

/* ─────────────────────────────────────────────────────────────────────────
   startups/[id]/manage/page.tsx
   ───────────────────────────────────────────────────────────────────────── */
const managePage = `'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { api } from '../../../../lib/axios';
import { DataPanel, Tag } from '../../../../components/DataPanel';
import SubNav from '../../../../components/SubNav';

const F = {
  display: "font-[family-name:var(--font-playfair)]",
  space:   "font-[family-name:var(--font-space)]",
  serif:   "font-[family-name:var(--font-serif)]",
  bebas:   "font-[family-name:var(--font-bebas)]",
};

const STAGES = ['idea', 'prototype', 'mvp', 'scaling', 'funded'];

export default function ManageStartup({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [startup,       setStartup]       = useState<any>(null);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [name,          setName]          = useState('');
  const [tagline,       setTagline]       = useState('');
  const [description,   setDescription]   = useState('');
  const [stage,         setStage]         = useState('');
  const [domain,        setDomain]        = useState('');
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  const [githubLoading, setGithubLoading] = useState(false);
  const [apps,          setApps]          = useState<{ [roleId: string]: any[] }>({});
  const [saveMsg,       setSaveMsg]       = useState('');

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    try {
      const res = await api.get(\`/startups/\${id}\`);
      const s = res.data.data;
      setStartup(s); setName(s.name); setTagline(s.tagline || '');
      setDescription(s.description || ''); setStage(s.stage || '');
      setDomain(s.domain || ''); setGithubRepoUrl(s.github_repo_url || '');
      const appsMap: any = {};
      for (const role of s.open_roles) {
        const appsRes = await api.get(\`/roles/\${role.id}/applications\`);
        appsMap[role.id] = appsRes.data.data;
      }
      setApps(appsMap);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleUpdate = async () => {
    setSaving(true); setSaveMsg('');
    try {
      await api.put(\`/startups/\${id}\`, { name, tagline, description, stage, domain });
      setSaveMsg('Saved successfully.');
      fetchData();
    } catch { setSaveMsg('Save failed. Please try again.'); }
    finally { setSaving(false); }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!confirm('Remove this member?')) return;
    try { await api.delete(\`/startups/\${id}/members/\${userId}\`); fetchData(); }
    catch { /* silent */ }
  };

  const handleAppStatus = async (roleId: number, appId: number, status: string) => {
    try { await api.patch(\`/roles/\${roleId}/applications/\${appId}\`, { status }); fetchData(); }
    catch { /* silent */ }
  };

  const handleLinkRepo = async () => {
    if (!githubRepoUrl) return;
    setGithubLoading(true);
    try { await api.post(\`/startups/\${id}/github\`, { github_repo_url: githubRepoUrl }); fetchData(); }
    catch (err: any) { alert(err.response?.data?.error || 'Failed to link repository.'); }
    finally { setGithubLoading(false); }
  };

  const handleUnlinkRepo = async () => {
    if (!confirm('Unlink this repository?')) return;
    setGithubLoading(true);
    try { await api.delete(\`/startups/\${id}/github\`); setGithubRepoUrl(''); fetchData(); }
    catch { /* silent */ } finally { setGithubLoading(false); }
  };

  const TABS = [
    { key: 'overview', label: 'Overview',  href: \`/startups/\${id}\` },
    { key: 'manage',   label: 'Manage',    href: \`/startups/\${id}/manage\` },
    { key: 'progress', label: 'Progress',  href: \`/startups/\${id}/progress\` },
    { key: 'pitch',    label: 'Pitch Deck',href: \`/startups/\${id}/pitch\` },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F4F0]">
      <div className={\`\${F.bebas} text-[#F7941D] tracking-widest\`} style={{ fontSize: '2rem' }}>Loading</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-[#1C1C1C]">

      {/* Top bar */}
      <header className="bg-[#1C1C1C] border-b-2 border-[#F7941D] sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 bg-[#F7941D]" />
            <span className={\`\${F.space} font-bold text-white text-lg tracking-[0.05em]\`}>ECOSYSTEM</span>
          </a>
          <div className={\`\${F.space} text-white/30 text-[11px] tracking-[0.2em] uppercase hidden md:block\`}>{startup?.name ?? 'Manage'}</div>
        </div>
      </header>

      <SubNav
        backLabel="Startups"
        backHref="/startups"
        entityName={startup?.name}
        tabs={TABS}
        activeTab="manage"
      />

      <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-12 flex flex-col gap-10">

        {/* ─ Edit Details ─ */}
        <DataPanel eyebrow="Settings" title="Edit Startup Details"
          action={
            <button onClick={handleUpdate} disabled={saving}
              className={\`\${F.space} font-bold text-[12px] tracking-[0.1em] uppercase bg-[#F7941D] text-white px-5 py-2.5 hover:bg-[#1C1C1C] disabled:opacity-40 transition-colors\`}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          }>
          {saveMsg && (
            <p className={\`\${F.space} text-[12px] mb-4 \${saveMsg.includes('failed') ? 'eco-error' : 'text-[#1C1C1C] border-l-4 border-[#F7941D] pl-3'}\`}>{saveMsg}</p>
          )}
          <div className="grid grid-cols-12 gap-5">
            <div className="col-span-12 md:col-span-6">
              <label className="eco-label">Startup Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="eco-input off-white" />
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className="eco-label">Tagline</label>
              <input type="text" value={tagline} onChange={e => setTagline(e.target.value)} className="eco-input off-white" />
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className="eco-label">Domain / Industry</label>
              <input type="text" value={domain} onChange={e => setDomain(e.target.value)} className="eco-input off-white" />
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className="eco-label">Stage</label>
              <select value={stage} onChange={e => setStage(e.target.value)} className="eco-input off-white">
                <option value="">Select stage…</option>
                {STAGES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div className="col-span-12">
              <label className="eco-label">Description</label>
              <textarea rows={5} value={description} onChange={e => setDescription(e.target.value)} className="eco-input off-white" />
            </div>
          </div>
        </DataPanel>

        {/* ─ GitHub ─ */}
        <DataPanel eyebrow="Integrations" title="GitHub Repository">
          <div className="flex items-center gap-3">
            <input type="url" value={githubRepoUrl} onChange={e => setGithubRepoUrl(e.target.value)}
              placeholder="https://github.com/org/repo"
              className="eco-input off-white flex-1" />
            <button onClick={handleLinkRepo} disabled={githubLoading}
              className={\`\${F.space} font-bold text-[12px] tracking-wide uppercase bg-[#1C1C1C] text-white px-5 py-3.5 hover:bg-[#F7941D] disabled:opacity-40 transition-colors flex-shrink-0\`}>
              {githubLoading ? '…' : 'Link'}
            </button>
            {startup?.github_repo_url && (
              <button onClick={handleUnlinkRepo} disabled={githubLoading}
                className={\`\${F.space} font-bold text-[12px] tracking-wide uppercase border border-[#CC0000] text-[#CC0000] hover:bg-[#CC0000] hover:text-white px-5 py-3.5 disabled:opacity-40 transition-colors flex-shrink-0\`}>
                Unlink
              </button>
            )}
          </div>
        </DataPanel>

        {/* ─ Members ─ */}
        <DataPanel eyebrow="Team" title={\`Members (\${startup?.members?.length ?? 0})\`} noPadding>
          {(startup?.members ?? []).length === 0 ? (
            <div className="p-8 text-center">
              <p className={\`\${F.space} text-[#AAAAAA] text-[12px] tracking-widest uppercase\`}>No members yet.</p>
            </div>
          ) : (
            <div className="divide-y-2 divide-[#F5F4F0]">
              {startup.members.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#F5F4F0] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#F5F4F0] border-2 border-[#1C1C1C] flex items-center justify-center flex-shrink-0">
                      <span className={\`\${F.bebas} text-[#1C1C1C] text-xl leading-none\`}>{m.name?.charAt(0)}</span>
                    </div>
                    <div>
                      <div className={\`\${F.space} font-bold text-[#1C1C1C] text-[14px]\`}>{m.name}</div>
                      <div className={\`\${F.space} text-[11px] tracking-[0.1em] uppercase text-[#888888]\`}>{m.role}</div>
                    </div>
                  </div>
                  {m.role !== 'founder' && (
                    <button onClick={() => handleRemoveMember(m.id)}
                      className={\`\${F.space} text-[11px] tracking-wide font-bold border border-[#CC0000] text-[#CC0000] hover:bg-[#CC0000] hover:text-white px-3 py-1.5 transition-colors\`}>
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </DataPanel>

        {/* ─ Applications ─ */}
        {startup?.open_roles?.length > 0 && (
          <DataPanel eyebrow="Recruitment" title="Role Applications" noPadding>
            <div className="divide-y-2 divide-[#F5F4F0]">
              {startup.open_roles.map((role: any) => {
                const roleApps: any[] = apps[role.id] ?? [];
                return (
                  <div key={role.id}>
                    <div className="px-6 py-3 bg-[#F5F4F0] border-b border-[#E0E0E0]">
                      <div className={\`\${F.space} font-bold text-[#1C1C1C] text-[13px] tracking-wide\`}>{role.title}</div>
                      <div className={\`\${F.space} text-[#888888] text-[11px]\`}>{roleApps.length} application(s)</div>
                    </div>
                    {roleApps.length === 0 ? (
                      <div className="px-6 py-5">
                        <p className={\`\${F.serif} italic text-[#AAAAAA] text-[13px]\`}>No applications yet.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-[#F0F0F0]">
                        {roleApps.map((app: any) => (
                          <div key={app.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-[#F5F4F0] transition-colors">
                            <div>
                              <div className={\`\${F.space} font-bold text-[#1C1C1C] text-[14px]\`}>{app.applicant_name}</div>
                              {app.cover_note && (
                                <p className={\`\${F.serif} text-[#888888] text-[12px] mt-0.5 line-clamp-1\`}>{app.cover_note}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={\`\${F.space} text-[10px] font-bold tracking-[0.1em] uppercase px-2 py-0.5 border \${app.status === 'accepted' ? 'border-[#1C1C1C] text-[#1C1C1C]' : app.status === 'rejected' ? 'border-[#CC0000] text-[#CC0000]' : 'border-[#888888] text-[#888888]'}\`}>
                                {app.status}
                              </span>
                              {app.status === 'pending' && (
                                <>
                                  <button onClick={() => handleAppStatus(role.id, app.id, 'accepted')}
                                    className={\`\${F.space} text-[11px] font-bold bg-[#1C1C1C] text-white px-3 py-1.5 hover:bg-[#F7941D] transition-colors\`}>
                                    Accept
                                  </button>
                                  <button onClick={() => handleAppStatus(role.id, app.id, 'rejected')}
                                    className={\`\${F.space} text-[11px] font-bold border border-[#CC0000] text-[#CC0000] hover:bg-[#CC0000] hover:text-white px-3 py-1.5 transition-colors\`}>
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </DataPanel>
        )}

      </div>
    </div>
  );
}
`;

/* ─────────────────────────────────────────────────────────────────────────
   startups/[id]/progress/page.tsx
   ───────────────────────────────────────────────────────────────────────── */
const progressPage = `'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/axios';
import { use } from 'react';
import { DataPanel } from '../../../../components/DataPanel';
import SubNav from '../../../../components/SubNav';

const F = {
  display: "font-[family-name:var(--font-playfair)]",
  space:   "font-[family-name:var(--font-space)]",
  serif:   "font-[family-name:var(--font-serif)]",
  bebas:   "font-[family-name:var(--font-bebas)]",
};

const STAGES = ['idea', 'prototype', 'mvp', 'scaling', 'funded'];

export default function StartupProgress({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [milestones, setMilestones] = useState<any[]>([]);
  const [startup,    setStartup]    = useState<any>(null);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [newTitle,   setNewTitle]   = useState('');
  const [newDesc,    setNewDesc]    = useState('');
  const [newStage,   setNewStage]   = useState('idea');

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [msRes, stRes] = await Promise.all([
        api.get(\`/startups/\${id}/milestones\`),
        api.get(\`/startups/\${id}\`),
      ]);
      setMilestones(msRes.data.data);
      setStartup(stRes.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!newTitle || !newStage) return;
    try {
      await api.post(\`/startups/\${id}/milestones\`, { title: newTitle, description: newDesc, stage: newStage });
      setShowForm(false); setNewTitle(''); setNewDesc('');
      fetchData();
    } catch (err) { console.error(err); }
  };

  const setComplete = async (milId: number) => {
    try { await api.patch(\`/startups/\${id}/milestones/\${milId}\`, { completed: true }); fetchData(); }
    catch (err) { console.error(err); }
  };

  const killMilestone = async (milId: number) => {
    try { await api.delete(\`/startups/\${id}/milestones/\${milId}\`); fetchData(); }
    catch (err) { console.error(err); }
  };

  const TABS = [
    { key: 'overview', label: 'Overview',  href: \`/startups/\${id}\` },
    { key: 'manage',   label: 'Manage',    href: \`/startups/\${id}/manage\` },
    { key: 'progress', label: 'Progress',  href: \`/startups/\${id}/progress\` },
    { key: 'pitch',    label: 'Pitch Deck',href: \`/startups/\${id}/pitch\` },
  ];

  const isOwner = startup?.my_role === 'founder' || startup?.my_role === 'member';
  const completed = milestones.filter(m => m.completed_at).length;
  const pct = milestones.length > 0 ? Math.round((completed / milestones.length) * 100) : 0;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F4F0]">
      <div className={\`\${F.bebas} text-[#F7941D] tracking-widest\`} style={{ fontSize: '2rem' }}>Loading</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-[#1C1C1C]">

      {/* Top bar */}
      <header className="bg-[#1C1C1C] border-b-2 border-[#F7941D] sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 bg-[#F7941D]" />
            <span className={\`\${F.space} font-bold text-white text-lg tracking-[0.05em]\`}>ECOSYSTEM</span>
          </a>
          <div className={\`\${F.space} text-white/30 text-[11px] tracking-[0.2em] uppercase hidden md:block\`}>{startup?.name ?? 'Progress'}</div>
        </div>
      </header>

      <SubNav
        backLabel="Startups"
        backHref="/startups"
        entityName={startup?.name}
        tabs={TABS}
        activeTab="progress"
      />

      <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-12 flex flex-col gap-10">

        {/* Stats row */}
        <div className="grid grid-cols-3 border-2 border-[#1C1C1C] divide-x-2 divide-[#1C1C1C]">
          {[
            { v: milestones.length, l: 'Total Milestones' },
            { v: completed,         l: 'Completed'         },
            { v: pct + '%',         l: 'Progress'          },
          ].map(({ v, l }) => (
            <div key={l} className="bg-white px-8 py-6">
              <div className={\`\${F.bebas} text-[#F7941D] leading-none\`} style={{ fontSize: '3rem' }}>{v}</div>
              <div className={\`\${F.space} text-[10px] tracking-[0.2em] uppercase text-[#888888] mt-1\`}>{l}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div>
          <div className={\`\${F.space} text-[10px] tracking-[0.2em] uppercase text-[#888888] mb-2\`}>Completion — {pct}%</div>
          <div className="eco-progress-bar">
            <div className="eco-progress-bar-fill" style={{ width: pct + '%' }} />
          </div>
        </div>

        {/* Add Milestone */}
        {isOwner && (
          <DataPanel eyebrow="Add" title="New Milestone"
            action={
              <button onClick={() => setShowForm(s => !s)}
                className={\`\${F.space} font-bold text-[12px] tracking-wide uppercase bg-[#F7941D] text-white px-5 py-2.5 hover:bg-[#1C1C1C] transition-colors\`}>
                {showForm ? 'Cancel' : '+ Add'}
              </button>
            }>
            {showForm && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="eco-label">Title *</label>
                  <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. MVP Launch"
                    className="eco-input off-white" />
                </div>
                <div>
                  <label className="eco-label">Description</label>
                  <textarea rows={3} value={newDesc} onChange={e => setNewDesc(e.target.value)}
                    placeholder="What does completing this milestone mean?"
                    className="eco-input off-white" />
                </div>
                <div>
                  <label className="eco-label">Stage *</label>
                  <select value={newStage} onChange={e => setNewStage(e.target.value)} className="eco-input off-white">
                    {STAGES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <button onClick={handleCreate}
                  className={\`\${F.space} font-bold text-[13px] tracking-[0.1em] uppercase bg-[#1C1C1C] text-white px-6 py-4 hover:bg-[#F7941D] transition-colors\`}>
                  Create Milestone
                </button>
              </div>
            )}
          </DataPanel>
        )}

        {/* Milestone list */}
        <DataPanel eyebrow="Timeline" title={\`All Milestones (\${milestones.length})\`} noPadding>
          {milestones.length === 0 ? (
            <div className="py-16 text-center">
              <div className={\`\${F.bebas} text-[#EEEEEE]\`} style={{ fontSize: '5rem', lineHeight: 1 }}>00</div>
              <div className={\`\${F.space} text-[#AAAAAA] mt-3 text-sm\`}>No milestones yet. Create the first one above.</div>
            </div>
          ) : (
            <div className="divide-y-2 divide-[#F5F4F0]">
              {milestones.map((m, i) => (
                <div key={m.id} className={\`px-6 py-5 flex items-start gap-5 hover:bg-[#F5F4F0] transition-colors \${m.completed_at ? 'opacity-60' : ''}\`}>
                  {/* Step number */}
                  <div className={\`\${F.bebas} flex-shrink-0 w-10 text-right leading-none mt-0.5 \${m.completed_at ? 'text-[#CCCCCC]' : 'text-[#F7941D]'}\`}
                    style={{ fontSize: '1.8rem' }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <div className={\`\${F.space} font-bold text-[#1C1C1C] text-[15px] \${m.completed_at ? 'line-through text-[#888888]' : ''}\`}>{m.title}</div>
                      <span className={\`\${F.space} text-[10px] font-bold tracking-[0.1em] uppercase px-2 py-0.5 border \${m.completed_at ? 'border-[#DDDDDD] text-[#888888]' : 'border-[#F7941D] text-[#F7941D]'}\`}>
                        {m.stage}
                      </span>
                      {m.completed_at && (
                        <span className={\`\${F.space} text-[10px] uppercase tracking-wide text-[#888888]\`}>
                          ✓ {new Date(m.completed_at).toLocaleDateString('en-IN')}
                        </span>
                      )}
                    </div>
                    {m.description && (
                      <p className={\`\${F.serif} text-[#888888] text-[13px] leading-[1.7]\`}>{m.description}</p>
                    )}
                  </div>

                  {/* Actions */}
                  {isOwner && !m.completed_at && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => setComplete(m.id)}
                        className={\`\${F.space} font-bold text-[11px] tracking-wide bg-[#1C1C1C] text-white px-3 py-2 hover:bg-[#F7941D] transition-colors\`}>
                        Done
                      </button>
                      <button onClick={() => killMilestone(m.id)}
                        className={\`\${F.space} font-bold text-[11px] tracking-wide border border-[#DDDDDD] text-[#888888] hover:border-[#CC0000] hover:text-[#CC0000] px-3 py-2 transition-colors\`}>
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DataPanel>

      </div>
    </div>
  );
}
`;

/* ─────────────────────────────────────────────────────────────────────────
   startups/[id]/pitch/page.tsx
   ───────────────────────────────────────────────────────────────────────── */
const pitchPage = `'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { api } from '../../../../lib/axios';
import { useAuth } from '../../../../lib/auth';
import { DataPanel } from '../../../../components/DataPanel';
import SubNav from '../../../../components/SubNav';

const F = {
  display: "font-[family-name:var(--font-playfair)]",
  space:   "font-[family-name:var(--font-space)]",
  serif:   "font-[family-name:var(--font-serif)]",
  bebas:   "font-[family-name:var(--font-bebas)]",
};

export default function PitchDeck({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();

  const [deck,        setDeck]        = useState<any>(null);
  const [startup,     setStartup]     = useState<any>(null);
  const [loading,     setLoading]     = useState(true);
  const [generating,  setGenerating]  = useState(false);
  const [streamText,  setStreamText]  = useState('');
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    fetchDeck();
    api.get(\`/startups/\${id}\`).then(r => setStartup(r.data.data)).catch(() => {});
  }, [id]);

  const fetchDeck = async () => {
    try { const res = await api.get(\`/ai/pitch/\${id}\`); setDeck(res.data.data.content); }
    catch { /* no deck yet */ } finally { setLoading(false); }
  };

  const handleGenerate = async () => {
    setGenerating(true); setDeck(null); setStreamText('');
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(\`\${baseUrl}/ai/pitch/\${id}/generate\`, {
        method: 'POST',
        headers: { 'Authorization': \`Bearer \${token}\`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ startup_id: id }),
      });
      if (!response.body) throw new Error('No body');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\\n\\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = JSON.parse(line.slice(6));
          if (data.error) throw new Error(data.error);
          if (data.chunk) setStreamText(p => p + data.chunk);
          if (data.done) fetchDeck();
        }
      }
    } catch (err: any) { alert(err.message || 'Generation failed'); }
    finally { setGenerating(false); }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!deck?.slides) return;
      if (e.key === 'ArrowRight' && activeSlide < deck.slides.length - 1) setActiveSlide(a => a + 1);
      if (e.key === 'ArrowLeft'  && activeSlide > 0)                       setActiveSlide(a => a - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeSlide, deck]);

  const TABS = [
    { key: 'overview', label: 'Overview',  href: \`/startups/\${id}\` },
    { key: 'manage',   label: 'Manage',    href: \`/startups/\${id}/manage\` },
    { key: 'progress', label: 'Progress',  href: \`/startups/\${id}/progress\` },
    { key: 'pitch',    label: 'Pitch Deck',href: \`/startups/\${id}/pitch\` },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F4F0]">
      <div className={\`\${F.bebas} text-[#F7941D] tracking-widest\`} style={{ fontSize: '2rem' }}>Loading</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-[#1C1C1C]">

      {/* Top bar */}
      <header className="bg-[#1C1C1C] border-b-2 border-[#F7941D] sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 bg-[#F7941D]" />
            <span className={\`\${F.space} font-bold text-white text-lg tracking-[0.05em]\`}>ECOSYSTEM</span>
          </a>
          <div className={\`\${F.space} text-white/30 text-[11px] tracking-[0.2em] uppercase hidden md:block\`}>{startup?.name ?? 'Pitch Deck'}</div>
        </div>
      </header>

      <SubNav
        backLabel="Startups"
        backHref="/startups"
        entityName={startup?.name}
        tabs={TABS}
        activeTab="pitch"
      />

      <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-12">

        {/* Generate bar */}
        <div className="flex items-center justify-between mb-8 p-6 border-2 border-[#1C1C1C] bg-white">
          <div>
            <div className={\`\${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-0.5\`}>AI-Powered</div>
            <div className={\`\${F.space} font-bold text-[#1C1C1C] text-[16px]\`}>
              {deck ? 'Pitch Deck Generated' : 'No pitch deck yet'}
            </div>
            <p className={\`\${F.serif} text-[#888888] text-[13px] mt-0.5\`}>
              {deck ? 'Use ← → arrow keys to navigate slides.' : 'Generate a structured investor pitch deck using AI.'}
            </p>
          </div>
          <div className="flex gap-3">
            {deck && (
              <button onClick={() => window.print()}
                className={\`\${F.space} font-bold text-[12px] tracking-wide uppercase border-2 border-[#1C1C1C] text-[#1C1C1C] px-5 py-3 hover:bg-[#1C1C1C] hover:text-white transition-colors\`}>
                Export PDF
              </button>
            )}
            <button onClick={handleGenerate} disabled={generating}
              className={\`\${F.space} font-bold text-[12px] tracking-wide uppercase bg-[#F7941D] text-white px-6 py-3 hover:bg-[#1C1C1C] disabled:opacity-40 transition-colors\`}>
              {generating ? 'Generating…' : deck ? 'Regenerate' : 'Generate Deck'}
            </button>
          </div>
        </div>

        {/* Stream preview */}
        {generating && streamText && (
          <DataPanel eyebrow="Generating" title="AI is writing your pitch…">
            <pre className={\`\${F.serif} text-[#555555] text-[13px] leading-[1.8] whitespace-pre-wrap\`}>{streamText}</pre>
          </DataPanel>
        )}

        {/* Slide deck */}
        {deck?.slides && (
          <div>
            {/* Slide nav dots */}
            <div className="flex gap-1.5 mb-6 items-center justify-center">
              {deck.slides.map((_: any, i: number) => (
                <button key={i} onClick={() => setActiveSlide(i)}
                  className={\`transition-all \${i === activeSlide ? 'w-6 h-2 bg-[#F7941D]' : 'w-2 h-2 bg-[#DDDDDD] hover:bg-[#888888]'}\`} />
              ))}
            </div>

            {/* Active slide */}
            {(() => {
              const slide = deck.slides[activeSlide];
              if (!slide) return null;
              return (
                <div className="border-2 border-[#1C1C1C] bg-white min-h-[400px] flex flex-col">
                  {/* Slide header */}
                  <div className="border-b-2 border-[#1C1C1C] px-10 py-6 flex items-center justify-between bg-[#1C1C1C]">
                    <div>
                      <div className={\`\${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-1\`}>
                        Slide {activeSlide + 1} of {deck.slides.length}
                      </div>
                      <h2 className={\`\${F.display} font-black italic text-white text-2xl\`}>{slide.title}</h2>
                    </div>
                    <div className={\`\${F.bebas} text-white/20 leading-none\`} style={{ fontSize: '5rem' }}>
                      {String(activeSlide + 1).padStart(2, '0')}
                    </div>
                  </div>

                  {/* Slide body */}
                  <div className="flex-1 p-10">
                    {slide.content && (
                      <p className={\`\${F.serif} text-[#555555] text-base leading-[1.9] mb-6\`}>{slide.content}</p>
                    )}
                    {slide.bullets?.length > 0 && (
                      <ul className="flex flex-col gap-3">
                        {slide.bullets.map((b: string, i: number) => (
                          <li key={i} className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 bg-[#F7941D] mt-2 flex-shrink-0" />
                            <span className={\`\${F.serif} text-[#555555] text-[15px] leading-[1.7]\`}>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {slide.metric && (
                      <div className="mt-6 inline-block border-l-4 border-[#F7941D] pl-4">
                        <div className={\`\${F.bebas} text-[#F7941D] leading-none\`} style={{ fontSize: '3rem' }}>{slide.metric}</div>
                        {slide.metric_label && <div className={\`\${F.space} text-[#888888] text-xs uppercase tracking-wider mt-1\`}>{slide.metric_label}</div>}
                      </div>
                    )}
                  </div>

                  {/* Nav arrows */}
                  <div className="border-t-2 border-[#1C1C1C] flex">
                    <button onClick={() => setActiveSlide(a => Math.max(0, a - 1))} disabled={activeSlide === 0}
                      className={\`\${F.space} flex-1 py-4 border-r-2 border-[#1C1C1C] text-[12px] font-bold tracking-wide uppercase hover:bg-[#F5F4F0] disabled:opacity-30 transition-colors\`}>
                      ← Prev
                    </button>
                    <button onClick={() => setActiveSlide(a => Math.min(deck.slides.length - 1, a + 1))} disabled={activeSlide === deck.slides.length - 1}
                      className={\`\${F.space} flex-1 py-4 text-[12px] font-bold tracking-wide uppercase hover:bg-[#F5F4F0] disabled:opacity-30 transition-colors\`}>
                      Next →
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* All slides overview */}
            {deck.slides.length > 1 && (
              <div className="mt-8 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {deck.slides.map((s: any, i: number) => (
                  <button key={i} onClick={() => setActiveSlide(i)}
                    className={\`border-2 p-3 text-left transition-colors \${i === activeSlide ? 'border-[#F7941D] bg-[#FFF8F0]' : 'border-[#E0E0E0] bg-white hover:border-[#1C1C1C]'}\`}>
                    <div className={\`\${F.bebas} text-xl leading-none \${i === activeSlide ? 'text-[#F7941D]' : 'text-[#DDDDDD]'}\`}>{String(i + 1).padStart(2, '0')}</div>
                    <div className={\`\${F.space} text-[10px] uppercase tracking-wide truncate mt-1 text-[#888888]\`}>{s.title}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty */}
        {!deck && !generating && (
          <div className="border-2 border-[#1C1C1C] bg-white py-24 text-center">
            <div className={\`\${F.bebas} text-[#EEEEEE]\`} style={{ fontSize: '8rem', lineHeight: 1 }}>AI</div>
            <div className={\`\${F.space} font-bold text-[#1C1C1C] mt-4 mb-2\`}>No pitch deck generated yet.</div>
            <p className={\`\${F.serif} text-[#888888] text-sm mb-6\`}>Click "Generate Deck" to create an AI-powered investor presentation.</p>
            <button onClick={handleGenerate}
              className={\`\${F.space} font-bold text-[13px] tracking-[0.1em] uppercase bg-[#F7941D] text-white px-8 py-4 hover:bg-[#1C1C1C] transition-colors\`}>
              Generate Deck
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
`;

/* ─────────────────────────────────────────────────────────────────────────
   profile/me/edit/page.tsx
   ───────────────────────────────────────────────────────────────────────── */
const profileEdit = `'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../../lib/axios';
import Avatar from '../../../../components/Avatar';
import { DataPanel, Tag } from '../../../../components/DataPanel';

const F = {
  display: "font-[family-name:var(--font-playfair)]",
  space:   "font-[family-name:var(--font-space)]",
  serif:   "font-[family-name:var(--font-serif)]",
  bebas:   "font-[family-name:var(--font-bebas)]",
};

export default function ProfileEdit() {
  const router = useRouter();
  const [saving,      setSaving]      = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [userRole,    setUserRole]    = useState<'student' | 'mentor'>('student');
  const [name,        setName]        = useState('');
  const [bio,         setBio]         = useState('');
  const [githubUrl,   setGithubUrl]   = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [avatarUrl,   setAvatarUrl]   = useState('');
  const [skills,      setSkills]      = useState<string[]>([]);
  const [skillInput,  setSkillInput]  = useState('');
  const [interests,   setInterests]   = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState('');
  const [domains,     setDomains]     = useState<string[]>([]);
  const [domainInput, setDomainInput] = useState('');
  const [college,     setCollege]     = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('1');
  const [cgpa,        setCgpa]        = useState('');
  const [company,     setCompany]     = useState('');
  const [designation, setDesignation] = useState('');
  const [expertise,   setExpertise]   = useState('');
  const [yearsOfExp,  setYearsOfExp]  = useState('');
  const [saveMsg,     setSaveMsg]     = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get('/profile/me').then(res => {
      const data = res.data.data;
      setUserRole(data.role); setName(data.name);
      const p = data.profile || {};
      setBio(p.bio || ''); setGithubUrl(p.github_url || ''); setLinkedinUrl(p.linkedin_url || ''); setAvatarUrl(p.avatar_url || '');
      const parse = (v: any) => Array.isArray(v) ? v : typeof v === 'string' ? JSON.parse(v) : [];
      setSkills(parse(p.skills)); setInterests(parse(p.interests)); setDomains(parse(p.preferred_domains));
      if (data.role === 'student') {
        setCollege(p.college || ''); setYearOfStudy(p.year_of_study || '1'); setCgpa(p.cgpa ? String(p.cgpa) : '');
      } else {
        setCompany(p.company || ''); setDesignation(p.designation || ''); setExpertise(p.expertise || '');
        setYearsOfExp(p.years_of_experience ? String(p.years_of_experience) : '');
      }
      setInitialLoad(false);
    }).catch(console.error);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const fd = new FormData(); fd.append('avatar', file);
    try { const res = await api.post('/profile/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); setAvatarUrl(res.data.data.avatar_url); }
    catch (err) { console.error(err); }
  };

  const addTag = (input: string, setter: any, items: string[], clearInput: () => void) => {
    const v = input.trim();
    if (v && !items.includes(v)) setter([...items, v]);
    clearInput();
  };

  const removeTag = (idx: number, setter: any, items: string[]) => setter(items.filter((_: any, i: number) => i !== idx));

  const onTagKey = (e: React.KeyboardEvent<HTMLInputElement>, input: string, setter: any, items: string[], clearInput: () => void) => {
    if (e.key === 'Enter') { e.preventDefault(); addTag(input, setter, items, clearInput); }
  };

  const handleSubmit = async () => {
    setSaving(true); setSaveMsg('');
    try {
      const payload: any = { bio, avatar_url: avatarUrl, github_url: githubUrl, linkedin_url: linkedinUrl, skills, interests, preferred_domains: domains };
      if (userRole === 'student') { payload.college = college; payload.year_of_study = yearOfStudy; if (cgpa) payload.cgpa = cgpa; }
      else { payload.company = company; payload.designation = designation; payload.expertise = expertise; if (yearsOfExp) payload.years_of_experience = Number(yearsOfExp); }
      await api.put('/profile/me', payload);
      setSaveMsg('Profile saved successfully.');
      setTimeout(() => router.push('/profile/me'), 1200);
    } catch { setSaveMsg('Save failed. Please try again.'); }
    finally { setSaving(false); }
  };

  if (initialLoad) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F4F0]">
      <div className={\`\${F.bebas} text-[#F7941D] tracking-widest\`} style={{ fontSize: '2rem' }}>Loading</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-[#1C1C1C]">

      {/* Top bar */}
      <header className="bg-[#1C1C1C] border-b-2 border-[#F7941D] sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 bg-[#F7941D]" />
              <span className={\`\${F.space} font-bold text-white text-lg tracking-[0.05em]\`}>ECOSYSTEM</span>
            </a>
            <span className={\`\${F.space} text-white/30 text-[11px] tracking-wide uppercase hidden md:block\`}>/ Edit Profile</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()}
              className={\`\${F.space} text-[12px] text-white/60 hover:text-white transition-colors border border-white/15 px-4 py-2\`}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={saving}
              className={\`\${F.space} font-bold text-[12px] tracking-wide uppercase bg-[#F7941D] text-white px-5 py-2 hover:bg-white hover:text-[#1C1C1C] disabled:opacity-40 transition-colors\`}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[900px] mx-auto px-6 lg:px-0 py-12 flex flex-col gap-8">

        {saveMsg && (
          <div className={\`\${F.space} text-[12px] \${saveMsg.includes('failed') ? 'eco-error' : 'border-l-4 border-[#F7941D] pl-3 text-[#1C1C1C]'} py-2\`}>{saveMsg}</div>
        )}

        {/* Avatar */}
        <DataPanel eyebrow="Identity" title="Profile Photo">
          <div className="flex items-center gap-8">
            <div className="relative cursor-pointer group w-24 h-24 border-2 border-[#1C1C1C] overflow-hidden flex-shrink-0"
              onClick={() => fileInputRef.current?.click()}>
              <Avatar name={name} avatarUrl={avatarUrl} size="xl" />
              <div className="absolute inset-0 bg-[#1C1C1C]/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <span className={\`\${F.space} text-white text-[10px] font-bold tracking-widest uppercase\`}>Change</span>
              </div>
            </div>
            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
            <p className={\`\${F.serif} text-[#888888] text-[13px] leading-[1.7]\`}>
              Click to upload a new photo. Allowed formats: JPG, PNG. Max size: 2 MB.
            </p>
          </div>
        </DataPanel>

        {/* Bio + Links */}
        <DataPanel eyebrow="Profile" title="Basic Information">
          <div className="flex flex-col gap-5">
            <div>
              <label className="eco-label">Bio</label>
              <textarea rows={4} value={bio} onChange={e => setBio(e.target.value)}
                placeholder="Tell the ecosystem about yourself…"
                className="eco-input off-white" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="eco-label">GitHub URL</label>
                <input type="url" value={githubUrl} onChange={e => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/you"
                  className="eco-input off-white" />
              </div>
              <div>
                <label className="eco-label">LinkedIn URL</label>
                <input type="url" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/you"
                  className="eco-input off-white" />
              </div>
            </div>
          </div>
        </DataPanel>

        {/* Skills / Interests / Domains */}
        <DataPanel eyebrow="Expertise" title="Skills, Interests & Domains">
          <div className="flex flex-col gap-7">
            {([ 
              { label: 'Skills', items: skills, setter: setSkills, input: skillInput, setInput: setSkillInput },
              { label: 'Interests', items: interests, setter: setInterests, input: interestInput, setInput: setInterestInput },
              { label: 'Preferred Domains', items: domains, setter: setDomains, input: domainInput, setInput: setDomainInput },
            ] as const).map(({ label, items, setter, input, setInput }) => (
              <div key={label}>
                <label className="eco-label">{label}</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(items as string[]).map((s: string, i: number) => (
                    <Tag key={i} label={s} onRemove={() => removeTag(i, setter, items as string[])} />
                  ))}
                </div>
                <input type="text" value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => onTagKey(e, input, setter, items as string[], () => setInput(''))}
                  placeholder="Type and press Enter to add"
                  className="eco-input off-white" />
              </div>
            ))}
          </div>
        </DataPanel>

        {/* Role-specific */}
        {userRole === 'student' && (
          <DataPanel eyebrow="Academic" title="Student Information">
            <div className="flex flex-col gap-5">
              <div>
                <label className="eco-label">College / University</label>
                <input type="text" value={college} onChange={e => setCollege(e.target.value)} className="eco-input off-white" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="eco-label">Year of Study</label>
                  <select value={yearOfStudy} onChange={e => setYearOfStudy(e.target.value)} className="eco-input off-white">
                    {[['1','1st Year'],['2','2nd Year'],['3','3rd Year'],['4','4th Year'],['alumni','Alumni']].map(([v,l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="eco-label">CGPA (optional)</label>
                  <input type="number" step="0.01" max="10" value={cgpa} onChange={e => setCgpa(e.target.value)} className="eco-input off-white" />
                </div>
              </div>
            </div>
          </DataPanel>
        )}

        {userRole === 'mentor' && (
          <DataPanel eyebrow="Professional" title="Mentor Information">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="eco-label">Company</label>
                <input type="text" value={company} onChange={e => setCompany(e.target.value)} className="eco-input off-white" />
              </div>
              <div>
                <label className="eco-label">Designation</label>
                <input type="text" value={designation} onChange={e => setDesignation(e.target.value)} className="eco-input off-white" />
              </div>
              <div>
                <label className="eco-label">Area of Expertise</label>
                <input type="text" value={expertise} onChange={e => setExpertise(e.target.value)} className="eco-input off-white" />
              </div>
              <div>
                <label className="eco-label">Years of Experience</label>
                <input type="number" value={yearsOfExp} onChange={e => setYearsOfExp(e.target.value)} className="eco-input off-white" />
              </div>
            </div>
          </DataPanel>
        )}

      </div>
    </div>
  );
}
`;

/* ─────────────────────────────────────────────────────────────────────────
   profile/setup/page.tsx
   ───────────────────────────────────────────────────────────────────────── */
const profileSetup = `'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/axios';
import { DataPanel, Tag } from '../../../components/DataPanel';

const F = {
  display: "font-[family-name:var(--font-playfair)]",
  space:   "font-[family-name:var(--font-space)]",
  serif:   "font-[family-name:var(--font-serif)]",
  bebas:   "font-[family-name:var(--font-bebas)]",
};

const STEPS = [
  { key: 1, label: 'Your Story'      },
  { key: 2, label: 'Skills & Domains' },
  { key: 3, label: 'Background'       },
];

export default function ProfileSetup() {
  const router = useRouter();
  const [step,          setStep]          = useState(1);
  const [saving,        setSaving]        = useState(false);
  const [userRole,      setUserRole]      = useState<'student' | 'mentor'>('student');
  const [bio,           setBio]           = useState('');
  const [githubUrl,     setGithubUrl]     = useState('');
  const [linkedinUrl,   setLinkedinUrl]   = useState('');
  const [avatarUrl,     setAvatarUrl]     = useState('');
  const [skills,        setSkills]        = useState<string[]>([]);
  const [skillInput,    setSkillInput]    = useState('');
  const [interests,     setInterests]     = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState('');
  const [domains,       setDomains]       = useState<string[]>([]);
  const [domainInput,   setDomainInput]   = useState('');
  const [college,       setCollege]       = useState('');
  const [yearOfStudy,   setYearOfStudy]   = useState('1');
  const [cgpa,          setCgpa]          = useState('');
  const [company,       setCompany]       = useState('');
  const [designation,   setDesignation]   = useState('');
  const [expertise,     setExpertise]     = useState('');
  const [yearsOfExp,    setYearsOfExp]    = useState('');
  const [error,         setError]         = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get('/auth/me').then(res => setUserRole(res.data.data.role)).catch(console.error);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const fd = new FormData(); fd.append('avatar', file);
    try { const res = await api.post('/profile/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); setAvatarUrl(res.data.data.avatar_url); }
    catch { /* silent */ }
  };

  const addTag = (input: string, setter: any, items: string[], clearInput: () => void) => {
    const v = input.trim();
    if (v && !items.includes(v)) setter([...items, v]);
    clearInput();
  };

  const removeTag = (idx: number, setter: any, items: string[]) => setter(items.filter((_: any, i: number) => i !== idx));

  const onTagKey = (e: React.KeyboardEvent<HTMLInputElement>, input: string, setter: any, items: string[], clearInput: () => void) => {
    if (e.key === 'Enter') { e.preventDefault(); addTag(input, setter, items, clearInput); }
  };

  const handleSubmit = async () => {
    if (skills.length === 0) { setError('Add at least one skill before continuing.'); return; }
    setSaving(true); setError('');
    try {
      const payload: any = { bio, avatar_url: avatarUrl, github_url: githubUrl, linkedin_url: linkedinUrl, skills, interests, preferred_domains: domains };
      if (userRole === 'student') { payload.college = college; payload.year_of_study = yearOfStudy; if (cgpa) payload.cgpa = cgpa; }
      else { payload.company = company; payload.designation = designation; payload.expertise = expertise; if (yearsOfExp) payload.years_of_experience = Number(yearsOfExp); }
      await api.put('/profile/me', payload);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-[#1C1C1C]">

      {/* Top bar */}
      <header className="bg-[#1C1C1C] border-b-2 border-[#F7941D]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 bg-[#F7941D]" />
            <span className={\`\${F.space} font-bold text-white text-lg tracking-[0.05em]\`}>ECOSYSTEM</span>
          </a>
          <div className={\`\${F.space} text-[11px] tracking-[0.15em] uppercase text-white/40\`}>Profile Setup</div>
        </div>
      </header>

      {/* Step indicator */}
      <div className="border-b-2 border-[#1C1C1C] bg-white">
        <div className="max-w-[900px] mx-auto px-6 lg:px-0">
          <div className="flex divide-x-2 divide-[#1C1C1C]">
            {STEPS.map(s => (
              <button key={s.key} onClick={() => s.key < step && setStep(s.key)}
                className={\`\${F.space} flex-1 py-4 font-bold text-[11px] tracking-[0.15em] uppercase flex items-center justify-center gap-2 transition-colors
                  \${step === s.key ? 'bg-[#1C1C1C] text-white' : s.key < step ? 'bg-[#F5F4F0] text-[#888888] hover:text-[#1C1C1C] cursor-pointer' : 'bg-white text-[#CCCCCC] cursor-not-allowed'}\`}>
                <span className={step === s.key ? 'text-[#F7941D]' : s.key < step ? 'text-[#F7941D]' : 'text-inherit'}>
                  {String(s.key).padStart(2, '0')}
                </span>
                <span className="hidden sm:block">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-6 lg:px-0 py-12 flex flex-col gap-8">

        {error && <div className="eco-error">{error}</div>}

        {/* Step 1: Story */}
        {step === 1 && (
          <>
            <div>
              <div className={\`\${F.space} text-[11px] tracking-[0.25em] uppercase text-[#F7941D] mb-3\`}>Step 01</div>
              <h1 className={\`\${F.display} font-black italic text-[#1C1C1C] mb-2\`} style={{ fontSize: 'clamp(28px, 3vw, 40px)' }}>
                Tell us your story.
              </h1>
              <p className={\`\${F.serif} text-[#888888] text-[15px] leading-[1.8]\`}>
                Your profile is your identity in the ecosystem. Make it count.
              </p>
            </div>

            {/* Avatar upload */}
            <DataPanel eyebrow="Photo" title="Profile Picture">
              <div className="flex items-center gap-6">
                <div className="relative cursor-pointer group w-24 h-24 border-2 border-[#1C1C1C] overflow-hidden bg-[#F5F4F0] flex items-center justify-center flex-shrink-0"
                  onClick={() => fileInputRef.current?.click()}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    : <div className={\`\${F.bebas} text-[#CCCCCC] text-4xl\`}>+</div>
                  }
                  <div className="absolute inset-0 bg-[#1C1C1C]/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <span className={\`\${F.space} text-white text-[10px] font-bold tracking-widest uppercase\`}>Upload</span>
                  </div>
                </div>
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
                <p className={\`\${F.serif} text-[#888888] text-[13px] leading-[1.7]\`}>
                  Upload a professional headshot. JPG or PNG, max 2 MB. You can skip this for now.
                </p>
              </div>
            </DataPanel>

            <DataPanel eyebrow="About" title="Your Bio & Links">
              <div className="flex flex-col gap-5">
                <div>
                  <label className="eco-label">Bio *</label>
                  <textarea rows={5} value={bio} onChange={e => setBio(e.target.value)}
                    placeholder="Describe yourself, your goals, and what you bring to the ecosystem…"
                    className="eco-input off-white" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="eco-label">GitHub (optional)</label>
                    <input type="url" value={githubUrl} onChange={e => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/you" className="eco-input off-white" />
                  </div>
                  <div>
                    <label className="eco-label">LinkedIn (optional)</label>
                    <input type="url" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/you" className="eco-input off-white" />
                  </div>
                </div>
              </div>
            </DataPanel>
          </>
        )}

        {/* Step 2: Skills */}
        {step === 2 && (
          <>
            <div>
              <div className={\`\${F.space} text-[11px] tracking-[0.25em] uppercase text-[#F7941D] mb-3\`}>Step 02</div>
              <h1 className={\`\${F.display} font-black italic text-[#1C1C1C] mb-2\`} style={{ fontSize: 'clamp(28px, 3vw, 40px)' }}>
                What can you build?
              </h1>
              <p className={\`\${F.serif} text-[#888888] text-[15px] leading-[1.8]\`}>
                Skills help us match you with the right startups, mentors, and teammates.
              </p>
            </div>

            <DataPanel eyebrow="Expertise" title="Skills, Interests & Domains">
              <div className="flex flex-col gap-7">
                {([
                  { label: 'Skills *', items: skills, setter: setSkills, input: skillInput, setInput: setSkillInput },
                  { label: 'Interests', items: interests, setter: setInterests, input: interestInput, setInput: setInterestInput },
                  { label: 'Preferred Domains', items: domains, setter: setDomains, input: domainInput, setInput: setDomainInput },
                ] as const).map(({ label, items, setter, input, setInput }) => (
                  <div key={label}>
                    <label className="eco-label">{label}</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(items as string[]).map((s: string, i: number) => (
                        <Tag key={i} label={s} onRemove={() => removeTag(i, setter, items as string[])} />
                      ))}
                    </div>
                    <input type="text" value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => onTagKey(e, input, setter, items as string[], () => setInput(''))}
                      placeholder="Type and press Enter to add…"
                      className="eco-input off-white" />
                  </div>
                ))}
              </div>
            </DataPanel>
          </>
        )}

        {/* Step 3: Background */}
        {step === 3 && (
          <>
            <div>
              <div className={\`\${F.space} text-[11px] tracking-[0.25em] uppercase text-[#F7941D] mb-3\`}>Step 03</div>
              <h1 className={\`\${F.display} font-black italic text-[#1C1C1C] mb-2\`} style={{ fontSize: 'clamp(28px, 3vw, 40px)' }}>
                {userRole === 'mentor' ? 'Your professional background.' : 'Your academic background.'}
              </h1>
            </div>

            {userRole === 'student' && (
              <DataPanel eyebrow="Academic" title="Student Details">
                <div className="flex flex-col gap-5">
                  <div>
                    <label className="eco-label">College / University</label>
                    <input type="text" value={college} onChange={e => setCollege(e.target.value)} className="eco-input off-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="eco-label">Year of Study</label>
                      <select value={yearOfStudy} onChange={e => setYearOfStudy(e.target.value)} className="eco-input off-white">
                        {[['1','1st Year'],['2','2nd Year'],['3','3rd Year'],['4','4th Year'],['alumni','Alumni']].map(([v,l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="eco-label">CGPA (optional)</label>
                      <input type="number" step="0.01" max="10" value={cgpa} onChange={e => setCgpa(e.target.value)} className="eco-input off-white" />
                    </div>
                  </div>
                </div>
              </DataPanel>
            )}

            {userRole === 'mentor' && (
              <DataPanel eyebrow="Professional" title="Mentor Details">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="eco-label">Company</label>
                    <input type="text" value={company} onChange={e => setCompany(e.target.value)} className="eco-input off-white" />
                  </div>
                  <div>
                    <label className="eco-label">Designation</label>
                    <input type="text" value={designation} onChange={e => setDesignation(e.target.value)} className="eco-input off-white" />
                  </div>
                  <div>
                    <label className="eco-label">Area of Expertise</label>
                    <input type="text" value={expertise} onChange={e => setExpertise(e.target.value)} className="eco-input off-white" />
                  </div>
                  <div>
                    <label className="eco-label">Years of Experience</label>
                    <input type="number" value={yearsOfExp} onChange={e => setYearsOfExp(e.target.value)} className="eco-input off-white" />
                  </div>
                </div>
              </DataPanel>
            )}
          </>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-4 border-t-2 border-[#1C1C1C]">
          <button
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            className={\`\${F.space} font-bold text-[12px] tracking-[0.1em] uppercase border-2 border-[#1C1C1C] text-[#1C1C1C] px-6 py-3.5 hover:bg-[#1C1C1C] hover:text-white disabled:opacity-30 transition-colors\`}>
            ← Back
          </button>

          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)}
              className={\`\${F.space} font-bold text-[13px] tracking-[0.1em] uppercase bg-[#F7941D] text-white px-8 py-3.5 hover:bg-[#1C1C1C] transition-colors\`}>
              Continue →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving}
              className={\`\${F.space} font-bold text-[13px] tracking-[0.1em] uppercase bg-[#1C1C1C] text-white px-8 py-3.5 hover:bg-[#F7941D] disabled:opacity-40 transition-colors\`}>
              {saving ? 'Saving…' : 'Complete Setup →'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
`;

/* ─── Write all files ─────────────────────────────────────────────────── */
const files = {
  'admin/verifications/page.tsx':    adminVerifications,
  'startups/[id]/page.tsx':          startupPage,
  'startups/[id]/manage/page.tsx':   managePage,
  'startups/[id]/progress/page.tsx': progressPage,
  'startups/[id]/pitch/page.tsx':    pitchPage,
  'profile/me/edit/page.tsx':        profileEdit,
  'profile/setup/page.tsx':          profileSetup,
};

for (const [rel, content] of Object.entries(files)) {
  const dest = path.join(base, rel);
  fs.writeFileSync(dest, content, { encoding: 'utf8' });
  console.log('Written:', rel);
}
console.log('Done.');
