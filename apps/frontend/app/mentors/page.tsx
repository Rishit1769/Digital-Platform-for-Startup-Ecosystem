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

export default function MentorsDirectory() {
  const router = useRouter();

  const [mentors,  setMentors]  = useState<any[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [debSearch, setDebSearch] = useState('');
  const [page,     setPage]     = useState(1);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setDebSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchMentors = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '20', page: String(page) });
    if (debSearch) params.set('search', debSearch);
    try {
      const res  = await fetch(`${API}/public/mentors-list?${params}`);
      const json = await res.json();
      if (json.success) { setMentors(json.data); setTotal(json.total || 0); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [debSearch, page]);

  useEffect(() => { fetchMentors(); }, [fetchMentors]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const parseExpertise = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val.slice(0, 4);
    if (typeof val === 'string') {
      try { const a = JSON.parse(val); if (Array.isArray(a)) return a.slice(0, 4); } catch {}
      return val.split(',').map(s => s.trim()).slice(0, 4);
    }
    return [];
  };

  const initials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

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
            <span className={`${F.space} text-[11px] tracking-[0.2em] uppercase text-[#888888] hidden sm:block`}>Mentors</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="/startups" className={`${F.space} text-[13px] font-medium text-[#1C1C1C] hover:text-[#F7941D] transition-colors tracking-wide hidden md:block`}>Startups</a>
            <a href="/ideas"    className={`${F.space} text-[13px] font-medium text-[#1C1C1C] hover:text-[#F7941D] transition-colors tracking-wide hidden md:block`}>Ideas</a>
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

      {/* ── Breadcrumb ── */}
      <div className="pt-[64px] border-b-2 border-[#1C1C1C]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-4 flex items-center gap-4">
          <a href="/" className={`${F.space} text-[11px] tracking-[0.2em] uppercase text-[#888888] hover:text-[#F7941D] transition-colors`}>
            ← Ecosystem
          </a>
          <span className="text-[#DDDDDD]">/</span>
          <span className={`${F.space} text-[11px] tracking-[0.2em] uppercase text-[#1C1C1C]`}>Mentors</span>
        </div>
      </div>

      {/* ── Hero header ── */}
      <div className="bg-[#003580] border-b-2 border-[#1C1C1C]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 grid grid-cols-12">

          <div className="col-span-12 lg:col-span-7 py-16 lg:border-r-2 border-white/10 lg:pr-14">
            <div className={`${F.space} text-[11px] tracking-[0.25em] uppercase text-[#F7941D] mb-4`}>— Mentorship</div>
            <h1 className={`${F.display} font-black italic text-white leading-[0.92]`}
              style={{ fontSize: 'clamp(44px, 6vw, 80px)' }}>
              Get the<br />Right Room.
            </h1>
            <p className={`${F.serif} text-white/60 text-base leading-[1.8] mt-6 max-w-xl`}>
              Domain experts with verified track records. Book structured office hours with mentors who have been where you're going.
            </p>
          </div>

          <div className="col-span-12 lg:col-span-5 py-16 lg:pl-14 flex flex-col justify-center gap-6">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or expertise…"
                className={`${F.space} w-full text-[14px] text-[#1C1C1C] placeholder-[#AAAAAA] bg-[#FFFFFF] border-b-2 border-white py-3 pr-10 focus:outline-none focus:border-[#F7941D] transition-colors px-4`}
              />
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAAAAA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeWidth={2} d="M21 21l-5-5m0 0A7 7 0 1 0 5 5a7 7 0 0 0 11 11z"/>
              </svg>
            </div>
            <div className={`${F.space} text-[11px] tracking-[0.15em] uppercase text-white/40`}>
              {total > 0 ? `${total} mentor${total !== 1 ? 's' : ''} in the network` : loading ? 'Loading…' : 'No results'}
            </div>
          </div>

        </div>
      </div>

      {/* ── Mentor List ── */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-16">

        {loading ? (
          <div className="border-t-2 border-[#1C1C1C]">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border-b border-[#E0E0E0] py-8 grid grid-cols-12 gap-4 animate-pulse">
                <div className="col-span-1 aspect-square bg-[#F0F0F0]" />
                <div className="col-span-4 space-y-2">
                  <div className="h-4 bg-[#F0F0F0] w-3/4" />
                  <div className="h-3 bg-[#F0F0F0] w-1/2" />
                </div>
                <div className="col-span-4 h-4 bg-[#F0F0F0]" />
                <div className="col-span-3 h-4 bg-[#F0F0F0]" />
              </div>
            ))}
          </div>
        ) : mentors.length === 0 ? (
          <div className="border-t-2 border-[#1C1C1C] py-24 text-center">
            <div className={`${F.bebas} text-[8rem] text-[#EEEEEE] leading-none`}>0</div>
            <p className={`${F.space} text-[#AAAAAA] text-sm tracking-wide mt-4`}>
              No mentors found.{' '}
              {search && <button onClick={() => setSearch('')} className="text-[#F7941D] hover:underline">Clear search</button>}
            </p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="border-t-2 border-[#1C1C1C] grid grid-cols-12 items-center py-3">
              {(['Mentor', 'Role', 'Expertise', 'Availability'] as string[]).map((h, i) => (
                <div key={h} className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#AAAAAA] ${i===0?'col-span-3':i===1?'col-span-3':i===2?'col-span-4':'col-span-2 text-right'}`}>
                  {h}
                </div>
              ))}
            </div>

            {mentors.map((m, idx) => {
              const tags = parseExpertise(m.expertise);
              const isOpen = Number(m.upcoming_slots) > 0;
              return (
                <div key={m.id}
                  className="group border-b border-[#E0E0E0] py-7 grid grid-cols-12 items-center -mx-6 lg:-mx-14 px-6 lg:px-14 hover:bg-[#F5F4F0] transition-colors">

                  {/* Mentor name + company */}
                  <div className="col-span-3 flex items-center gap-4">
                    {/* Monogram avatar */}
                    <div className={`${F.bebas} w-10 h-10 flex-shrink-0 bg-[#1C1C1C] text-white flex items-center justify-center text-[1.1rem] group-hover:bg-[#F7941D] transition-colors`}>
                      {initials(m.name)}
                    </div>
                    <div>
                      <div className={`${F.space} font-bold text-[#1C1C1C] text-sm tracking-tight`}>{m.name}</div>
                      {m.company && (
                        <div className={`${F.space} text-[11px] text-[#AAAAAA] tracking-wide mt-0.5`}>{m.company}</div>
                      )}
                    </div>
                  </div>

                  {/* Designation */}
                  <div className="col-span-3">
                    {m.designation ? (
                      <span className={`${F.serif} italic text-[#666666] text-sm`}>{m.designation}</span>
                    ) : (
                      <span className={`${F.space} text-[#CCCCCC] text-sm`}>—</span>
                    )}
                  </div>

                  {/* Expertise tags */}
                  <div className="col-span-4 flex flex-wrap gap-1.5">
                    {tags.length > 0 ? tags.map((tag, i) => (
                      <span key={i} className={`${F.space} text-[10px] tracking-[0.1em] uppercase border border-[#E0E0E0] px-2 py-0.5 text-[#666666] group-hover:border-[#1C1C1C] transition-colors`}>
                        {tag}
                      </span>
                    )) : (
                      <span className={`${F.serif} italic text-[#CCCCCC] text-sm`}>General Mentorship</span>
                    )}
                  </div>

                  {/* Slot status + CTA */}
                  <div className="col-span-2 flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 ${isOpen ? 'bg-[#1C8C1C]' : 'bg-[#CCCCCC]'}`} />
                      <span className={`${F.bebas} text-[1.4rem] leading-none ${isOpen ? 'text-[#1C1C1C]' : 'text-[#CCCCCC]'}`}>
                        {isOpen ? 'OPEN' : 'FULL'}
                      </span>
                    </div>
                    {isOpen && (
                      <a href="/office-hours"
                        className={`${F.space} text-[11px] font-semibold tracking-wide text-[#F7941D] hover:text-[#1C1C1C] transition-colors`}>
                        Book Slot →
                      </a>
                    )}
                  </div>

                </div>
              );
            })}

            {/* Pagination */}
            {total > 20 && (
              <div className="border-t-2 border-[#1C1C1C] mt-0 pt-8 flex items-center justify-between">
                <span className={`${F.space} text-[11px] tracking-wide text-[#AAAAAA]`}>
                  Page {page} of {Math.ceil(total / 20)}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className={`${F.space} text-[13px] font-medium px-5 py-2 border-2 border-[#1C1C1C] text-[#1C1C1C] hover:bg-[#F7941D] hover:border-[#F7941D] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed`}>
                    ← Prev
                  </button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)}
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
      <div className="bg-[#003580] border-t-2 border-[#1C1C1C] py-20">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className={`${F.space} text-[11px] tracking-[0.25em] uppercase text-[#F7941D] mb-3`}>Open office hours</div>
            <h2 className={`${F.display} font-black italic text-white`} style={{ fontSize: 'clamp(28px, 3.5vw, 48px)' }}>
              The right mentor<br />changes everything.
            </h2>
          </div>
          <div className="flex gap-4 flex-shrink-0">
            <button onClick={() => router.push('/office-hours')}
              className={`${F.space} text-[13px] font-bold bg-[#F7941D] text-white px-8 py-4 tracking-wide hover:bg-white hover:text-[#1C1C1C] transition-colors`}>
              Browse Sessions
            </button>
            <button onClick={() => router.push('/login')}
              className={`${F.space} text-[13px] font-bold border-2 border-white text-white px-8 py-4 tracking-wide hover:bg-white hover:text-[#003580] transition-colors`}>
              Sign In
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
