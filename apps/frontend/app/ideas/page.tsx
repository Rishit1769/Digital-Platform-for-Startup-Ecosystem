'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const F = {
  display: "font-[family-name:var(--font-playfair)]",
  space:   "font-[family-name:var(--font-space)]",
  serif:   "font-[family-name:var(--font-serif)]",
  bebas:   "font-[family-name:var(--font-bebas)]",
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const DOMAINS = ['All', 'FinTech', 'EdTech', 'HealthTech', 'AI/ML', 'SaaS', 'E-commerce', 'Web3', 'Logistics'];
const SORTS: [string, string][] = [['recent', 'Latest'], ['upvotes', 'Most Voted'], ['feedback', 'Most Discussed']];

async function publicFetch(path: string, params?: Record<string, string>) {
  const qs = params ? `?${new URLSearchParams(params)}` : '';
  const res = await fetch(`${API_BASE}${path}${qs}`);
  const json = await res.json();
  return json.success ? json.data : null;
}

async function authedFetch(path: string, method = 'GET', body?: any) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) { window.location.href = '/login'; throw new Error('Unauthenticated'); }
  return res.json();
}

export default function IdeasPage() {
  const router = useRouter();
  const [ideas,     setIdeas]     = useState<any[]>([]);
  const [recentStartups, setRecentStartups] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [domain,    setDomain]    = useState('All');
  const [sort,      setSort]      = useState('recent');
  const [search,    setSearch]    = useState('');
  const [debSearch, setDebSearch] = useState('');
  const [scrolled,  setScrolled]  = useState(false);

  const [showModal,  setShowModal]  = useState(false);
  const [newTitle,   setNewTitle]   = useState('');
  const [newDesc,    setNewDesc]    = useState('');
  const [newDomain,  setNewDomain]  = useState('');
  const [posting,    setPosting]    = useState(false);

  const [expandedId,    setExpandedId]    = useState<number | null>(null);
  const [ideaDetails,   setIdeaDetails]   = useState<any>(null);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [submittingFb,  setSubmittingFb]  = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchIdeas = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string> = { sort, limit: '30' };
    if (domain && domain !== 'All') params.domain = domain;
    if (debSearch) params.search = debSearch;
    const data = await publicFetch('/public/ideas', params);
    setIdeas(data ?? []);
    setLoading(false);
  }, [sort, domain, debSearch]);

  useEffect(() => { fetchIdeas(); }, [fetchIdeas]);

  useEffect(() => {
    publicFetch('/public/startups', { sort: 'recent', limit: '4' })
      .then((data) => setRecentStartups(data ?? []))
      .catch(() => setRecentStartups([]));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handlePostIdea = async () => {
    if (!newTitle.trim() || !newDesc.trim()) return;
    setPosting(true);
    try {
      await authedFetch('/ideas', 'POST', { title: newTitle, description: newDesc, domain: newDomain });
      setShowModal(false); setNewTitle(''); setNewDesc(''); setNewDomain('');
      fetchIdeas();
    } catch (err: any) { if (err.message !== 'Unauthenticated') console.error(err); }
    finally { setPosting(false); }
  };

  const handleUpvote = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try { await authedFetch(`/ideas/${id}/upvote`, 'POST'); fetchIdeas(); }
    catch (err: any) { if (err.message !== 'Unauthenticated') console.error(err); }
  };

  const expandIdea = async (id: number) => {
    if (expandedId === id) { setExpandedId(null); setIdeaDetails(null); return; }
    setExpandedId(id); setIdeaDetails(null);
    try {
      const res = await fetch(`${API_BASE}/ideas/${id}`, { credentials: 'include' });
      if (res.ok) { const j = await res.json(); setIdeaDetails(j.data); return; }
      const idea = ideas.find(i => i.id === id);
      setIdeaDetails(idea ? { ...idea, feedback: [] } : null);
    } catch { /* swallow */ }
  };

  const submitFeedback = async (ideaId: number) => {
    if (!feedbackInput.trim() || submittingFb) return;
    setSubmittingFb(true);
    try {
      await authedFetch(`/ideas/${ideaId}/feedback`, 'POST', { comment: feedbackInput });
      setFeedbackInput('');
      const res = await fetch(`${API_BASE}/ideas/${ideaId}`, { credentials: 'include' });
      if (res.ok) { const j = await res.json(); setIdeaDetails(j.data); }
      fetchIdeas();
    } catch (err: any) { if (err.message !== 'Unauthenticated') console.error(err); }
    finally { setSubmittingFb(false); }
  };

  const initials = (name: string) =>
    (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="bg-[#FFFFFF] min-h-screen overflow-x-hidden">

      {/* ══ Navbar ══ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 bg-[#FFFFFF] transition-all duration-150 ${scrolled ? 'border-b-2 border-[#1C1C1C]' : 'border-b border-[#E8E8E8]'}`}>
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="w-3.5 h-3.5 bg-[#F7941D] flex-shrink-0 transition-transform group-hover:rotate-45 duration-300" />
              <span className={`${F.space} font-bold text-[#1C1C1C] text-lg tracking-[0.05em]`}>ECOSYSTEM</span>
            </a>
            <span className="text-[#E0E0E0] hidden sm:block">|</span>
            <span className={`${F.space} text-[11px] tracking-[0.2em] uppercase text-[#888888] hidden sm:block`}>Ideas</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="/startups" className={`${F.space} text-[13px] font-medium text-[#1C1C1C] hover:text-[#F7941D] transition-colors tracking-wide hidden md:block`}>Startups</a>
            <a href="/mentors"  className={`${F.space} text-[13px] font-medium text-[#1C1C1C] hover:text-[#F7941D] transition-colors tracking-wide hidden md:block`}>Mentors</a>
            <button onClick={() => router.push('/login')}
              className={`${F.space} text-[13px] font-medium text-[#1C1C1C] hover:text-[#F7941D] transition-colors tracking-wide`}>
              Sign In
            </button>
            <button onClick={() => setShowModal(true)}
              className={`${F.space} text-[13px] font-bold bg-[#F7941D] text-white px-5 py-2.5 tracking-wide hover:bg-[#1C1C1C] transition-colors duration-200`}>
              Pitch Idea
            </button>
          </div>
        </div>
      </nav>

      {/* ══ Breadcrumb ══ */}
      <div className="pt-[64px] border-b-2 border-[#1C1C1C]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-4 flex items-center gap-4">
          <a href="/" className={`${F.space} text-[11px] tracking-[0.2em] uppercase text-[#888888] hover:text-[#F7941D] transition-colors`}>← Ecosystem</a>
          <span className="text-[#DDDDDD]">/</span>
          <span className={`${F.space} text-[11px] tracking-[0.2em] uppercase text-[#1C1C1C]`}>Ideas</span>
        </div>
      </div>

      {/* ══ Hero ══ */}
      <div className="bg-[#F5F4F0] border-b-2 border-[#1C1C1C]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 grid grid-cols-12">
          <div className="col-span-12 lg:col-span-7 py-16 lg:border-r-2 border-[#1C1C1C] lg:pr-14">
            <div className={`${F.space} text-[11px] tracking-[0.25em] uppercase text-[#F7941D] mb-4`}>— Incubation Room</div>
            <h1 className={`${F.display} font-black italic text-[#1C1C1C] leading-[0.92]`}
              style={{ fontSize: 'clamp(44px, 6vw, 80px)' }}>
              Validate Before<br />You Build.
            </h1>
            <p className={`${F.serif} text-[#666666] text-base leading-[1.8] mt-6 max-w-xl`}>
              Browse the idea board. Upvote what's worth building. Add feedback, fork concepts, or stress-test your hypothesis with peer review.
            </p>
          </div>
          <div className="col-span-12 lg:col-span-5 py-16 lg:pl-14 flex flex-col justify-center gap-6">
            <div className="relative">
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search ideas…"
                className={`${F.space} w-full text-[14px] text-[#1C1C1C] placeholder-[#BBBBBB] bg-[#FFFFFF] border-b-2 border-[#1C1C1C] py-3 pr-10 focus:outline-none focus:border-[#F7941D] transition-colors`} />
              <svg className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAAAAA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeWidth={2} d="M21 21l-5-5m0 0A7 7 0 1 0 5 5a7 7 0 0 0 11 11z"/>
              </svg>
            </div>
            <div className="flex gap-1">
              {SORTS.map(([val, label]) => (
                <button key={val} onClick={() => setSort(val)}
                  className={`${F.space} text-[11px] tracking-[0.15em] uppercase px-4 py-2 border-2 transition-colors ${sort === val ? 'border-[#1C1C1C] bg-[#1C1C1C] text-white' : 'border-[#DDDDDD] text-[#888888] hover:border-[#1C1C1C] hover:text-[#1C1C1C]'}`}>
                  {label}
                </button>
              ))}
            </div>
            <button onClick={() => setShowModal(true)}
              className={`${F.space} text-[13px] font-bold bg-[#F7941D] text-white px-8 py-4 tracking-wide hover:bg-[#1C1C1C] transition-colors w-fit`}>
              + Pitch an Idea
            </button>
          </div>
        </div>
      </div>

      {/* ══ Domain filter bar ══ */}
      <div className="bg-[#FFFFFF] border-b-2 border-[#1C1C1C] sticky top-[64px] z-40">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-4 flex items-center gap-2 flex-wrap">
          {DOMAINS.map(d => (
            <button key={d} onClick={() => setDomain(d)}
              className={`${F.space} text-[11px] tracking-[0.12em] uppercase px-4 py-1.5 border transition-colors ${domain === d ? 'border-[#F7941D] bg-[#F7941D] text-white' : 'border-[#E0E0E0] text-[#666666] hover:border-[#1C1C1C] hover:text-[#1C1C1C]'}`}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* ══ Ideas list ══ */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-16">
        {loading ? (
          <div className="border-t-2 border-[#1C1C1C]">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border-b border-[#E0E0E0] py-8 animate-pulse grid grid-cols-12 gap-4">
                <div className="col-span-1 h-10 bg-[#F0F0F0]" />
                <div className="col-span-9 space-y-2"><div className="h-5 bg-[#F0F0F0] w-2/3" /><div className="h-3 bg-[#F0F0F0] w-full" /></div>
                <div className="col-span-2 h-14 bg-[#F0F0F0]" />
              </div>
            ))}
          </div>
        ) : ideas.length === 0 ? (
          <div className="border-t-2 border-[#1C1C1C] py-24 text-center">
            <div className={`${F.bebas} text-[8rem] text-[#EEEEEE] leading-none`}>0</div>
            <p className={`${F.space} text-[#AAAAAA] text-sm tracking-wide mt-4`}>
              No ideas yet.{' '}
              <button onClick={() => setShowModal(true)} className="text-[#F7941D] hover:underline">Be the first to pitch one.</button>
            </p>
          </div>
        ) : (
          <div className="border-t-2 border-[#1C1C1C]">
            {ideas.map((idea, idx) => (
              <div key={idea.id} className="border-b border-[#E0E0E0]">
                {/* ─ Idea row ─ */}
                <div className="grid grid-cols-12 items-start gap-4 py-8 cursor-pointer hover:bg-[#F5F4F0] -mx-6 lg:-mx-14 px-6 lg:px-14 transition-colors group"
                  onClick={() => expandIdea(idea.id)}>
                  <div className={`col-span-1 ${F.bebas} text-[2.5rem] text-[#EEEEEE] leading-none group-hover:text-[#F7941D] transition-colors`}>
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <div className="col-span-8 lg:col-span-9">
                    <div className="flex items-start gap-3 mb-2 flex-wrap">
                      <h3 className={`${F.space} font-bold text-[#1C1C1C] text-[17px] tracking-tight leading-snug`}>{idea.title}</h3>
                      {idea.domain && (
                        <span className={`${F.space} text-[10px] tracking-[0.15em] uppercase border border-[#1C1C1C] px-2 py-0.5 text-[#1C1C1C] flex-shrink-0 mt-0.5`}>{idea.domain}</span>
                      )}
                    </div>
                    <p className={`${F.serif} text-[#666666] text-[15px] leading-[1.7] line-clamp-2`}>{idea.description}</p>
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <div className={`${F.bebas} w-6 h-6 bg-[#1C1C1C] text-white text-[0.65rem] flex items-center justify-center flex-shrink-0`}>
                          {initials(idea.poster_name)}
                        </div>
                        <span className={`${F.space} text-[12px] font-medium text-[#666666]`}>{idea.poster_name}</span>
                      </div>
                      <span className={`${F.space} text-[12px] text-[#AAAAAA]`}>{idea.feedback_count} {idea.feedback_count === 1 ? 'comment' : 'comments'}</span>
                      <span className={`${F.space} text-[11px] text-[#CCCCCC]`}>
                        {new Date(idea.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-3 lg:col-span-2 flex flex-col items-end gap-2">
                    <button onClick={(e) => handleUpvote(idea.id, e)}
                      className={`${F.space} flex flex-col items-center border-2 border-[#1C1C1C] px-4 py-3 hover:border-[#F7941D] hover:bg-[#F7941D] group/btn transition-colors`}>
                      <span className="text-lg leading-none group-hover/btn:text-white">↑</span>
                      <span className={`${F.bebas} text-[1.6rem] leading-none`}>{idea.upvotes}</span>
                    </button>
                    <span className={`${F.space} text-[10px] uppercase tracking-wide text-[#AAAAAA]`}>
                      {expandedId === idea.id ? 'Close ↑' : 'Open ↓'}
                    </span>
                  </div>
                </div>

                {/* ─ Expanded detail ─ */}
                {expandedId === idea.id && (
                  <div className="bg-[#F5F4F0] border-t border-[#E0E0E0] px-6 lg:px-20 py-10">
                    <p className={`${F.serif} text-[#444444] text-[16px] leading-[1.85] whitespace-pre-wrap mb-10 max-w-3xl`}>
                      {ideaDetails?.description ?? idea.description}
                    </p>
                    <div className="border-t-2 border-[#1C1C1C] pt-8">
                      <div className={`${F.space} text-[11px] tracking-[0.2em] uppercase text-[#F7941D] mb-6`}>
                        Feedback ({ideaDetails?.feedback?.length ?? idea.feedback_count})
                      </div>
                      <div className="flex gap-3 mb-8 max-w-2xl">
                        <input type="text" value={feedbackInput} onChange={e => setFeedbackInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && submitFeedback(idea.id)}
                          placeholder="What do you think? (Sign in to post)"
                          className={`${F.space} flex-1 text-[14px] text-[#1C1C1C] placeholder-[#BBBBBB] bg-[#FFFFFF] border-b-2 border-[#1C1C1C] py-3 focus:outline-none focus:border-[#F7941D] transition-colors`} />
                        <button onClick={() => submitFeedback(idea.id)} disabled={submittingFb || !feedbackInput.trim()}
                          className={`${F.space} text-[13px] font-bold bg-[#1C1C1C] text-white px-6 py-3 hover:bg-[#F7941D] transition-colors disabled:opacity-40`}>
                          Post
                        </button>
                      </div>
                      {ideaDetails?.feedback?.length > 0 ? (
                        <div className="space-y-0 max-w-2xl">
                          {ideaDetails.feedback.map((fb: any) => (
                            <div key={fb.id} className="border-b border-[#E0E0E0] py-5 flex gap-4">
                              <div className={`${F.bebas} w-8 h-8 flex-shrink-0 bg-[#1C1C1C] text-white text-[0.7rem] flex items-center justify-center`}>
                                {initials(fb.name)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <span className={`${F.space} font-bold text-[#1C1C1C] text-sm`}>{fb.name}</span>
                                  <span className={`${F.space} text-[11px] text-[#CCCCCC]`}>
                                    {new Date(fb.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                  </span>
                                </div>
                                <p className={`${F.serif} text-[#555555] text-[15px] leading-[1.7]`}>{fb.comment}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : ideaDetails ? (
                        <p className={`${F.serif} italic text-[#AAAAAA] text-sm`}>No feedback yet — be the first to respond.</p>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {recentStartups.length > 0 && (
          <div className="mt-14 border-t-2 border-[#1C1C1C] pt-8">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#F7941D] mb-1`}>Also Trending</div>
                <h2 className={`${F.space} font-bold text-[#1C1C1C] text-xl`}>Recent Startups</h2>
              </div>
              <a href="/startups" className={`${F.space} text-[12px] text-[#888888] hover:text-[#F7941D] transition-colors`}>View All</a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {recentStartups.map((s: any) => (
                <a
                  key={s.id}
                  href={`/startups/${s.id}`}
                  className="bg-white border-2 border-[#1C1C1C] p-5 hover:border-[#F7941D] transition-colors"
                >
                  <div className={`${F.space} text-[10px] tracking-[0.15em] uppercase text-[#F7941D] mb-2`}>{s.stage || 'idea'}</div>
                  <div className={`${F.space} font-bold text-[#1C1C1C] text-[15px]`}>{s.name}</div>
                  <div className={`${F.serif} text-[#666666] text-[13px] mt-2 line-clamp-2`}>{s.tagline || s.description || 'Explore this startup profile.'}</div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══ Post Idea Modal ══ */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1C1C1C]/70 p-4">
          <div className="bg-[#FFFFFF] border-2 border-[#1C1C1C] w-full max-w-xl">
            <div className="border-b-2 border-[#1C1C1C] px-8 py-6 flex items-center justify-between">
              <div>
                <div className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#F7941D] mb-1`}>Incubation Room</div>
                <h2 className={`${F.space} font-bold text-[#1C1C1C] text-xl`}>Share a New Idea</h2>
              </div>
              <button onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center border border-[#E0E0E0] hover:border-[#1C1C1C] text-[#888888] hover:text-[#1C1C1C] transition-colors text-xl">
                ×
              </button>
            </div>
            <div className="px-8 py-8 space-y-6">
              <div>
                <label className={`${F.space} text-[11px] tracking-[0.15em] uppercase text-[#888888] block mb-2`}>Title *</label>
                <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  placeholder="E.g. AI-driven supply chain optimization"
                  className={`${F.space} w-full text-[14px] text-[#1C1C1C] placeholder-[#CCCCCC] border-b-2 border-[#1C1C1C] py-3 focus:outline-none focus:border-[#F7941D] bg-transparent transition-colors`} />
              </div>
              <div>
                <label className={`${F.space} text-[11px] tracking-[0.15em] uppercase text-[#888888] block mb-2`}>Domain</label>
                <select value={newDomain} onChange={e => setNewDomain(e.target.value)}
                  className={`${F.space} w-full text-[14px] text-[#1C1C1C] border-b-2 border-[#1C1C1C] py-3 focus:outline-none focus:border-[#F7941D] bg-transparent transition-colors`}>
                  <option value="">Select domain</option>
                  {DOMAINS.filter(d => d !== 'All').map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className={`${F.space} text-[11px] tracking-[0.15em] uppercase text-[#888888] block mb-2`}>Description *</label>
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={5}
                  placeholder="Problem you're solving, why now, initial hypothesis…"
                  className={`${F.space} w-full text-[14px] text-[#1C1C1C] placeholder-[#CCCCCC] border-2 border-[#1C1C1C] p-4 focus:outline-none focus:border-[#F7941D] bg-transparent transition-colors resize-none`} />
              </div>
            </div>
            <div className="border-t-2 border-[#1C1C1C] px-8 py-5 flex items-center justify-between gap-4">
              <p className={`${F.space} text-[11px] text-[#AAAAAA]`}>Sign in required to post.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)}
                  className={`${F.space} text-[13px] font-medium text-[#888888] hover:text-[#1C1C1C] px-5 py-2.5 border border-[#E0E0E0] hover:border-[#1C1C1C] transition-colors`}>
                  Cancel
                </button>
                <button onClick={handlePostIdea} disabled={posting || !newTitle.trim() || !newDesc.trim()}
                  className={`${F.space} text-[13px] font-bold bg-[#F7941D] text-white px-8 py-2.5 hover:bg-[#1C1C1C] transition-colors disabled:opacity-40 disabled:cursor-not-allowed`}>
                  {posting ? 'Posting…' : 'Post to Room'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ CTA footer ══ */}
      <div className="bg-[#F7941D] border-t-2 border-[#1C1C1C] py-16">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className={`${F.space} text-[11px] tracking-[0.25em] uppercase text-[#1C1C1C]/60 mb-2`}>Ideas → Startups</div>
            <h2 className={`${F.display} font-black italic text-[#1C1C1C]`} style={{ fontSize: 'clamp(28px, 3.5vw, 48px)' }}>
              The best ideas get built here.
            </h2>
          </div>
          <div className="flex gap-4 flex-shrink-0">
            <button onClick={() => router.push('/register')}
              className={`${F.space} text-[13px] font-bold bg-[#1C1C1C] text-white px-8 py-4 tracking-wide hover:bg-white hover:text-[#1C1C1C] transition-colors`}>
              Join Ecosystem
            </button>
            <button onClick={() => router.push('/login')}
              className={`${F.space} text-[13px] font-bold border-2 border-[#1C1C1C] text-[#1C1C1C] px-8 py-4 tracking-wide hover:bg-[#1C1C1C] hover:text-white transition-colors`}>
              Sign In
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
