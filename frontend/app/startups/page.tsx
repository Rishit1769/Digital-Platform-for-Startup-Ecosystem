'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const F = {
  display: "font-[family-name:var(--font-playfair)]",
  space:   "font-[family-name:var(--font-space)]",
  serif:   "font-[family-name:var(--font-serif)]",
  bebas:   "font-[family-name:var(--font-bebas)]",
};

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const DOMAINS = ['FinTech', 'EdTech', 'HealthTech', 'E-commerce', 'AI/ML', 'SaaS', 'Web3', 'ClimTech', 'Logistics'];
const STAGES  = ['Pre-Seed', 'Seed', 'Series A', 'Scaling'];
const SORTS: [string, string][] = [['recent', 'Latest'], ['upvotes', 'Most Voted'], ['members', 'Largest Team']];

const STAGE_COLORS: Record<string, string> = {
  'idea':     '#888888',
  'pre-seed': '#F7941D',
  'Pre-Seed': '#F7941D',
  'seed':     '#003580',
  'Seed':     '#003580',
  'Series A': '#1C1C1C',
  'scaling':  '#1C6B1C',
  'Scaling':  '#1C6B1C',
};

export default function StartupsDirectory() {
  const router = useRouter();

  const [startups, setStartups] = useState<any[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);

  const [search,   setSearch]   = useState('');
  const [debSearch, setDebSearch] = useState('');
  const [domain,   setDomain]   = useState('');
  const [stage,    setStage]    = useState('');
  const [sort,     setSort]     = useState('recent');
  const [page,     setPage]     = useState(1);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setDebSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchStartups = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ sort, limit: '24', page: String(page) });
    if (debSearch) params.set('search', debSearch);
    if (domain)    params.set('domain', domain);
    if (stage)     params.set('stage', stage);
    try {
      const res = await fetch(`${API}/public/startups?${params}`);
      const json = await res.json();
      if (json.success) { setStartups(json.data); setTotal(json.total || 0); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [debSearch, domain, stage, sort, page]);

  useEffect(() => { fetchStartups(); }, [fetchStartups]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const clearFilters = () => { setDomain(''); setStage(''); setSearch(''); setSort('recent'); setPage(1); };
  const hasFilters = domain || stage || debSearch || sort !== 'recent';

  const parseExpertise = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') {
      try { const a = JSON.parse(val); if (Array.isArray(a)) return a.slice(0, 3).join(', '); } catch {}
      return val;
    }
    if (Array.isArray(val)) return val.slice(0, 3).join(', ');
    return '';
  };

  return (
    <div className="bg-[#FFFFFF] min-h-screen overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 bg-[#FFFFFF] transition-all duration-150 ${scrolled ? 'border-b-2 border-[#1C1C1C]' : 'border-b border-[#E8E8E8]'}`}>
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="w-3.5 h-3.5 bg-[#F7941D] flex-shrink-0 transition-transform group-hover:rotate-45 duration-300" />
              <span className={`${F.space} font-bold text-[#1C1C1C] text-lg tracking-[0.05em]`}>ECOSYSTEM</span>
            </a>
            <span className="text-[#E0E0E0] hidden sm:block">|</span>
            <span className={`${F.space} text-[11px] tracking-[0.2em] uppercase text-[#888888] hidden sm:block`}>Startups</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="/mentors" className={`${F.space} text-[13px] font-medium text-[#1C1C1C] hover:text-[#F7941D] transition-colors tracking-wide hidden md:block`}>Mentors</a>
            <a href="/ideas"   className={`${F.space} text-[13px] font-medium text-[#1C1C1C] hover:text-[#F7941D] transition-colors tracking-wide hidden md:block`}>Ideas</a>
            <button onClick={() => router.push('/login')}
              className={`${F.space} text-[13px] font-medium text-[#1C1C1C] hover:text-[#F7941D] transition-colors tracking-wide`}>
              Sign In
            </button>
            <button onClick={() => router.push('/register')}
              className={`${F.space} text-[13px] font-bold bg-[#F7941D] text-white px-5 py-2.5 tracking-wide hover:bg-[#1C1C1C] transition-colors duration-200`}>
              Join
            </button>
          </div>
        </div>
      </nav>

      {/* ── Breadcrumb (below fixed nav) ── */}
      <div className="pt-[64px] border-b-2 border-[#1C1C1C]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-4 flex items-center gap-4">
          <a href="/" className={`${F.space} text-[11px] tracking-[0.2em] uppercase text-[#888888] hover:text-[#F7941D] transition-colors`}>
            ← Ecosystem
          </a>
          <span className="text-[#DDDDDD]">/</span>
          <span className={`${F.space} text-[11px] tracking-[0.2em] uppercase text-[#1C1C1C]`}>Startups</span>
        </div>
      </div>

      {/* ── Hero header ── */}
      <div className="bg-[#F5F4F0] border-b-2 border-[#1C1C1C]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 grid grid-cols-12">

          <div className="col-span-12 lg:col-span-7 py-16 lg:border-r-2 border-[#1C1C1C] lg:pr-14">
            <div className={`${F.space} text-[11px] tracking-[0.25em] uppercase text-[#F7941D] mb-4`}>— Directory</div>
            <h1 className={`${F.display} font-black italic text-[#1C1C1C] leading-[0.92]`}
              style={{ fontSize: 'clamp(44px, 6vw, 80px)' }}>
              The Startup<br />Directory.
            </h1>
            <p className={`${F.serif} text-[#666666] text-base leading-[1.8] mt-6 max-w-xl`}>
              Every startup built inside the ecosystem — from first pitch to funded product. Filter by domain, stage, or team size.
            </p>
          </div>

          <div className="col-span-12 lg:col-span-5 py-16 lg:pl-14 flex flex-col justify-center gap-6">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search startups…"
                className={`${F.space} w-full text-[14px] text-[#1C1C1C] placeholder-[#BBBBBB] bg-[#FFFFFF] border-b-2 border-[#1C1C1C] py-3 pr-10 focus:outline-none focus:border-[#F7941D] transition-colors`}
              />
              <svg className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAAAAA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeWidth={2} d="M21 21l-5-5m0 0A7 7 0 1 0 5 5a7 7 0 0 0 11 11z"/>
              </svg>
            </div>

            {/* Sort tabs */}
            <div className="flex gap-1">
              {SORTS.map(([val, label]) => (
                <button key={val} onClick={() => { setSort(val); setPage(1); }}
                  className={`${F.space} text-[11px] tracking-[0.15em] uppercase px-4 py-2 border-2 transition-colors ${sort === val ? 'border-[#1C1C1C] bg-[#1C1C1C] text-white' : 'border-[#DDDDDD] text-[#888888] hover:border-[#1C1C1C] hover:text-[#1C1C1C]'}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Count */}
            <div className={`${F.space} text-[11px] tracking-[0.15em] uppercase text-[#AAAAAA]`}>
              {total > 0 ? `${total} startup${total !== 1 ? 's' : ''} total` : loading ? 'Loading…' : 'No results'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-[#FFFFFF] border-b-2 border-[#1C1C1C] sticky top-[64px] z-40">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-4 flex items-center gap-3 flex-wrap">
          <span className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#AAAAAA] mr-2`}>Domain</span>
          {DOMAINS.map(d => (
            <button key={d} onClick={() => { setDomain(p => p === d ? '' : d); setPage(1); }}
              className={`${F.space} text-[11px] tracking-[0.12em] uppercase px-3 py-1.5 border transition-colors ${domain === d ? 'border-[#F7941D] bg-[#F7941D] text-white' : 'border-[#E0E0E0] text-[#666666] hover:border-[#1C1C1C] hover:text-[#1C1C1C]'}`}>
              {d}
            </button>
          ))}
          <span className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#AAAAAA] ml-3 mr-2`}>Stage</span>
          {STAGES.map(s => (
            <button key={s} onClick={() => { setStage(p => p === s ? '' : s); setPage(1); }}
              className={`${F.space} text-[11px] tracking-[0.12em] uppercase px-3 py-1.5 border transition-colors ${stage === s ? 'border-[#003580] bg-[#003580] text-white' : 'border-[#E0E0E0] text-[#666666] hover:border-[#1C1C1C] hover:text-[#1C1C1C]'}`}>
              {s}
            </button>
          ))}
          {hasFilters && (
            <button onClick={clearFilters}
              className={`${F.space} text-[11px] tracking-wide uppercase text-[#F7941D] hover:text-[#1C1C1C] transition-colors ml-auto`}>
              Clear ×
            </button>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-16">

        {loading ? (
          <div className="border-t-2 border-[#1C1C1C]">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border-b border-[#E0E0E0] py-7 grid grid-cols-12 gap-4 animate-pulse">
                <div className="col-span-1 h-8 bg-[#F0F0F0]" />
                <div className="col-span-4 h-4 bg-[#F0F0F0]" />
                <div className="col-span-3 h-4 bg-[#F0F0F0]" />
                <div className="col-span-2 h-4 bg-[#F0F0F0]" />
                <div className="col-span-2 h-4 bg-[#F0F0F0]" />
              </div>
            ))}
          </div>
        ) : startups.length === 0 ? (
          <div className="border-t-2 border-[#1C1C1C] py-24 text-center">
            <div className={`${F.bebas} text-[8rem] text-[#EEEEEE] leading-none`}>0</div>
            <p className={`${F.space} text-[#AAAAAA] text-sm tracking-wide mt-4`}>
              No startups match your filters.{' '}
              <button onClick={clearFilters} className="text-[#F7941D] hover:underline">Clear all</button>
            </p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="border-t-2 border-[#1C1C1C] grid grid-cols-12 items-center py-3 mb-0">
              {(['#', 'Startup', 'Domain', 'Stage', 'Team', 'Votes'] as string[]).map((h, i) => (
                <div key={h} className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#AAAAAA] ${i===0?'col-span-1':i===1?'col-span-4':i===2?'col-span-2':i===3?'col-span-2':i===4?'col-span-1':'col-span-2 text-right'}`}>
                  {h}
                </div>
              ))}
            </div>

            {/* Rows */}
            {startups.map((s, idx) => (
              <a key={s.id} href={`/startups/${s.id}`}
                className="group grid grid-cols-12 items-center border-b border-[#E0E0E0] py-6 hover:bg-[#F5F4F0] -mx-6 lg:-mx-14 px-6 lg:px-14 transition-colors">

                <div className={`col-span-1 ${F.bebas} text-[2rem] text-[#DDDDDD] leading-none group-hover:text-[#F7941D] transition-colors`}>
                  {String((page - 1) * 24 + idx + 1).padStart(2, '0')}
                </div>

                <div className="col-span-4 pl-1">
                  <div className={`${F.space} font-bold text-[#1C1C1C] text-[15px] tracking-tight group-hover:text-[#F7941D] transition-colors`}>
                    {s.name}
                  </div>
                  {s.tagline && (
                    <div className={`${F.serif} italic text-[#888888] text-[13px] mt-0.5 line-clamp-1`}>{s.tagline}</div>
                  )}
                  {s.founder_name && (
                    <div className={`${F.space} text-[11px] text-[#AAAAAA] mt-0.5 tracking-wide`}>by {s.founder_name}</div>
                  )}
                </div>

                <div className="col-span-2">
                  {s.domain && (
                    <span className={`${F.space} text-[11px] tracking-[0.12em] uppercase border border-[#1C1C1C] px-2 py-0.5 text-[#1C1C1C]`}>
                      {s.domain}
                    </span>
                  )}
                </div>

                <div className="col-span-2">
                  {s.stage && (
                    <span className={`${F.space} text-[11px] font-bold tracking-wide uppercase`}
                      style={{ color: STAGE_COLORS[s.stage] ?? '#888' }}>
                      {s.stage}
                    </span>
                  )}
                </div>

                <div className={`col-span-1 ${F.bebas} text-[1.6rem] text-[#1C1C1C] leading-none`}>
                  {s.member_count ?? 0}
                </div>

                <div className="col-span-2 text-right flex items-center justify-end gap-2">
                  <span className={`${F.bebas} text-[#F7941D] text-[2rem] leading-none`}>{s.upvote_count ?? 0}</span>
                  <span className={`${F.space} text-[#AAAAAA] text-[11px] group-hover:text-[#F7941D] transition-colors`}>→</span>
                </div>

              </a>
            ))}

            {/* Pagination */}
            {total > 24 && (
              <div className="border-t-2 border-[#1C1C1C] mt-0 pt-8 flex items-center justify-between">
                <span className={`${F.space} text-[11px] tracking-wide text-[#AAAAAA]`}>
                  Page {page} of {Math.ceil(total / 24)}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className={`${F.space} text-[13px] font-medium px-5 py-2 border-2 border-[#1C1C1C] text-[#1C1C1C] hover:bg-[#F7941D] hover:border-[#F7941D] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed`}>
                    ← Prev
                  </button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 24)}
                    className={`${F.space} text-[13px] font-medium px-5 py-2 border-2 border-[#1C1C1C] text-[#1C1C1C] hover:bg-[#F7941D] hover:border-[#F7941D] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed`}>
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── CTA Footer ── */}
      <div className="bg-[#1C1C1C] border-t-2 border-[#1C1C1C] py-20">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className={`${F.space} text-[11px] tracking-[0.25em] uppercase text-[#F7941D] mb-3`}>Ready to build?</div>
            <h2 className={`${F.display} font-black italic text-white`} style={{ fontSize: 'clamp(28px, 3.5vw, 48px)' }}>
              Your startup belongs here.
            </h2>
          </div>
          <div className="flex gap-4 flex-shrink-0">
            <button onClick={() => router.push('/register')}
              className={`${F.space} text-[13px] font-bold bg-[#F7941D] text-white px-8 py-4 tracking-wide hover:bg-white hover:text-[#1C1C1C] transition-colors`}>
              Join Ecosystem
            </button>
            <button onClick={() => router.push('/login')}
              className={`${F.space} text-[13px] font-bold border-2 border-white text-white px-8 py-4 tracking-wide hover:bg-white hover:text-[#1C1C1C] transition-colors`}>
              Sign In
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
