'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const F = {
  display: "font-[family-name:var(--font-playfair)]",
  space:   "font-[family-name:var(--font-space)]",
  serif:   "font-[family-name:var(--font-serif)]",
  bebas:   "font-[family-name:var(--font-bebas)]",
};

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function publicFetch(path: string) {
  const res = await fetch(`${API}${path}`);
  const json = await res.json();
  return json.success ? json.data : null;
}

/* ─── static-only content (no DB equivalent) ─────────────────────── */
const features = [
  { num: '01', title: 'Idea Pitching',         desc: 'Submit, validate, and iterate on startup ideas with AI feedback and structured peer review.',    route: '/ideas'      },
  { num: '02', title: 'Milestone Tracking',    desc: 'Public milestone boards with live GitHub integration. Accountability is the architecture.',       route: '/startups'   },
  { num: '03', title: 'Identity Verification', desc: 'Verified founder badges and institutional credential checks — no ghost profiles.',                route: '/register'   },
  { num: '04', title: 'Smart Calendar',        desc: 'Kanban task boards synced with mentor session scheduling and deadline tracking.',                  route: '/calendar'   },
  { num: '05', title: 'Trend Radar',           desc: 'Live market-signal aggregation across 12 startup verticals, updated in real time.',               route: '/trends'     },
  { num: '06', title: 'Analytics Suite',       desc: 'Cohort tracking, engagement metrics, and ecosystem health dashboards for admins and founders.',   route: '/analytics'  },
];

const testimonials = [
  { quote: '"The matchmaking algorithm found me a technical co-founder in 48 hours. We closed our seed round four months later."', name: 'Arjun Mehta',  startup: 'NeuralPitch — CEO'    },
  { quote: '"Office hours with domain mentors compressed six months of learning into three weeks."',                               name: 'Priya Nair',   startup: 'MedStack — Founder'   },
  { quote: '"Milestone tracking kept our team honest. The public accountability layer changed how we ship."',                      name: 'Vikram Singh', startup: 'GridBridge — CTO'     },
  { quote: '"I came in with an idea on a napkin. I left with a team, a pitch deck, and my first pilot customer."',                name: 'Aisha Rahman', startup: 'PayRoute — Founder'   },
];

/* ─────────────────────────────────────────────────────────────────── */

export default function Home() {
  const router = useRouter();

  // UI state
  const [scrolled,         setScrolled]         = useState(false);
  const [slideIndex,       setSlideIndex]        = useState(0);
  const [testimonialIndex, setTestimonialIndex]  = useState(0);
  const [apiStatus,        setApiStatus]         = useState<'checking' | 'connected' | 'error'>('checking');

  // DB-fetched state
  const [stats,       setStats]       = useState<any>(null);
  const [showcase,    setShowcase]    = useState<any[]>([]);
  const [mentors,     setMentors]     = useState<any[]>([]);
  const [sessions,    setSessions]    = useState<any[]>([]);
  const [trendData,   setTrendData]   = useState<any[]>([]);
  const [ticker,      setTicker]      = useState<string[]>([]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    // Fire all public fetches in parallel
    Promise.all([
      fetch(`${API}/health`).then(r => r.json()).then(d => setApiStatus(d.success ? 'connected' : 'error')).catch(() => setApiStatus('error')),
      publicFetch('/public/stats').then(d => d && setStats(d)),
      publicFetch('/public/showcase').then(d => d && setShowcase(d)),
      publicFetch('/public/mentors').then(d => d && setMentors(d)),
      publicFetch('/public/sessions').then(d => d && setSessions(d)),
      publicFetch('/public/ticker').then(d => d && setTicker(d)),
      publicFetch('/ai/trend-radar').then(d => d && setTrendData(Array.isArray(d) ? d : [])),
    ]);
  }, []);

  const maxTrend = trendData.length ? Math.max(...trendData.map((t: any) => t.opportunity_score ?? 1)) : 10;
  const displayShowcase = showcase.length ? showcase : [];
  const displayMentors = mentors.length ? mentors : [];
  const displaySessions = sessions.length ? sessions : [];
  const displayTicker = ticker.length ? ticker : ['▪ Loading live data…'];


  return (
    <div className="bg-[#FFFFFF] text-[#1C1C1C] overflow-x-hidden">

      {/* ══════════════════════════════════════════
          01  NAVBAR
      ══════════════════════════════════════════ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 bg-[#FFFFFF] transition-all duration-150 ${scrolled ? 'border-b-2 border-[#1C1C1C]' : ''}`}>
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-4 flex items-center justify-between">

          {/* Logo */}
          <a href="/" className={`flex items-center gap-2.5 group`}>
            <div className="w-3.5 h-3.5 bg-[#F7941D] flex-shrink-0 transition-transform group-hover:rotate-45 duration-300" />
            <span className={`${F.space} font-bold text-[#1C1C1C] text-lg tracking-[0.05em]`}>ECOSYSTEM</span>
          </a>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-10">
            {([['Startups', '/startups'], ['Mentors', '/mentors'], ['Ideas', '/ideas']] as [string,string][]).map(([label, href]) => (
              <a key={label} href={href}
                className={`${F.space} text-[13px] font-medium text-[#1C1C1C] tracking-[0.1em] uppercase relative group hover:text-[#F7941D] transition-colors duration-150`}>
                {label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-[1.5px] bg-[#F7941D] group-hover:w-full transition-all duration-200" />
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-5">
            {apiStatus === 'connected' && (
              <div className="hidden sm:flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-[#F7941D]" />
                <span className={`${F.space} text-[11px] tracking-[0.15em] uppercase text-[#888888]`}>Live</span>
              </div>
            )}
            <button onClick={() => router.push('/login')}
              className={`${F.space} text-[13px] font-medium text-[#1C1C1C] hover:text-[#F7941D] transition-colors tracking-wide`}>
              Sign In
            </button>
            <button onClick={() => router.push('/register')}
              className={`${F.space} text-[13px] font-bold bg-[#F7941D] text-white px-5 py-2.5 tracking-wide hover:bg-[#1C1C1C] transition-colors duration-200`}>
              Register
            </button>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════
          02  HERO
      ══════════════════════════════════════════ */}
      <section className="pt-20 bg-[#FFFFFF] border-b-2 border-[#1C1C1C]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14">
          <div className="grid grid-cols-12">

            {/* Left: cols 1–7 */}
            <div className="col-span-12 lg:col-span-7 flex flex-col justify-center py-20 lg:py-24 lg:pr-14 relative">
              {/* Orange vertical rule between columns */}
              <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-[2px] bg-[#F7941D]" />

              <div className="mb-5">
                <span className={`${F.space} text-[11px] font-semibold tracking-[0.25em] uppercase text-[#F7941D]`}>
                  Digital Platform for Startup Ecosystem
                </span>
              </div>

              <h1 className={`${F.display} font-black italic text-[#1C1C1C] leading-[0.9] mb-8`}
                style={{ fontSize: 'clamp(60px, 9vw, 116px)' }}>
                Build.<br />Scale.<br />Ship.
              </h1>

              <p className={`${F.serif} text-[#555555] text-[17px] leading-[1.8] max-w-lg mb-12`}>
                The definitive platform for founders, mentors, and the next generation of startups. Pitch with precision. Track with discipline. Build with intent.
              </p>

              <div className="flex flex-col sm:flex-row items-start">
                <button onClick={() => router.push('/register')}
                  className={`${F.space} font-bold text-[13px] tracking-[0.1em] uppercase bg-[#F7941D] text-white px-8 py-4 hover:bg-[#1C1C1C] transition-colors duration-200`}>
                  Join Ecosystem
                </button>
                <button onClick={() => router.push('/showcase')}
                  className={`${F.space} font-bold text-[13px] tracking-[0.1em] uppercase bg-[#FFFFFF] text-[#1C1C1C] px-8 py-4 border-2 border-[#1C1C1C] hover:bg-[#1C1C1C] hover:text-white transition-colors duration-200`}>
                  Explore Directory
                </button>
              </div>
            </div>

            {/* Right: cols 8–12 — Editorial dark panel */}
            <div className="hidden lg:flex col-span-5 flex-col border-l-2 border-[#1C1C1C]">
              {/* Main dark block */}
              <div className="flex-1 bg-[#1C1C1C] relative overflow-hidden min-h-[480px]">
                {/* Graph-paper grid */}
                <div className="absolute inset-0"
                  style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 59px,rgba(255,255,255,0.04) 59px,rgba(255,255,255,0.04) 60px),repeating-linear-gradient(90deg,transparent,transparent 59px,rgba(255,255,255,0.04) 59px,rgba(255,255,255,0.04) 60px)' }} />

                {/* Large background letterform */}
                <div className={`${F.bebas} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-[0.04]`}
                  style={{ fontSize: '22rem', lineHeight: 1 }}>E</div>

                {/* Status */}
                {apiStatus === 'connected' && (
                  <div className="absolute top-7 left-7 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#F7941D]" />
                    <span className={`${F.space} text-white text-[10px] tracking-[0.2em] uppercase opacity-60`}>System Live</span>
                  </div>
                )}

                {/* Year watermark */}
                <div className={`${F.bebas} absolute top-7 right-7 text-white opacity-10`} style={{ fontSize: '5rem', lineHeight: 1 }}>2026</div>

                {/* Stat */}
                <div className="absolute bottom-8 left-7">
                  <div className={`${F.bebas} text-[#F7941D] leading-none`} style={{ fontSize: '5.5rem' }}>{stats?.founders ?? '—'}</div>
                  <div className={`${F.space} text-white text-[10px] tracking-[0.2em] uppercase opacity-50 mt-1`}>Active Founders This Month</div>
                </div>
              </div>

              {/* Stat bar */}
              <div className="bg-[#F5F4F0] border-t-2 border-[#1C1C1C] grid grid-cols-3 divide-x-2 divide-[#1C1C1C]">
                {([
                [stats ? `${stats.startups}` : '—', 'Startups Active'],
                [stats ? `${stats.ideas}` : '—', 'Ideas Pitched'],
                [stats ? `${stats.funding}` : '—', 'Funding Raised'],
              ] as [string,string][]).map(([val, label]) => (
                  <div key={label} className="px-5 py-5">
                    <div className={`${F.bebas} text-[#F7941D] text-[2rem] leading-none`}>{val}</div>
                    <div className={`${F.space} text-[#777777] text-[9px] tracking-[0.15em] uppercase mt-1`}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          03  TICKER
      ══════════════════════════════════════════ */}
      <div className="bg-[#F7941D] border-b-2 border-[#1C1C1C] overflow-hidden">
        <div className="flex items-stretch">
          <div className="flex-shrink-0 bg-[#1C1C1C] px-6 flex items-center border-r-2 border-[#1C1C1C]">
            <span className={`${F.space} text-white text-[10px] font-bold tracking-[0.25em] uppercase`}>Live</span>
          </div>
          <div className="overflow-hidden flex-1 py-3">
            <div className="eco-marquee">
              {[...displayTicker, ...displayTicker].map((item, i) => (
                <span key={i} className={`${F.space} text-white text-[13px] font-medium tracking-wide`}>{item}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          04  STARTUP SHOWCASE SLIDESHOW
      ══════════════════════════════════════════ */}
      <section className="bg-[#F5F4F0] border-b-2 border-[#1C1C1C] py-20">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14">

          {/* Header row */}
          <div className="flex items-end justify-between mb-12 pb-6 border-b-2 border-[#1C1C1C]">
            <div>
              <div className={`${F.space} text-[11px] tracking-[0.25em] uppercase text-[#F7941D] mb-3`}>Featured Work</div>
              <h2 className={`${F.space} font-bold text-[#1C1C1C]`} style={{ fontSize: 'clamp(26px, 3vw, 40px)' }}>From the Ecosystem</h2>
            </div>
            <div className="flex items-center gap-6">
              <button onClick={() => setSlideIndex(p => (p - 1 + Math.max(displayShowcase.length, 1)) % Math.max(displayShowcase.length, 1))}
                className={`${F.space} text-[13px] font-medium text-[#1C1C1C] hover:text-[#F7941D] transition-colors tracking-wide`}>
                ← Prev
              </button>
              <span className={`${F.bebas} text-[#888888] text-xl tracking-widest`}>
                {String(slideIndex + 1).padStart(2, '0')} / {String(Math.max(displayShowcase.length, 1)).padStart(2, '0')}
              </span>
              <button onClick={() => setSlideIndex(p => (p + 1) % Math.max(displayShowcase.length, 1))}
                className={`${F.space} text-[13px] font-medium text-[#1C1C1C] hover:text-[#F7941D] transition-colors tracking-wide`}>
                Next →
              </button>
            </div>
          </div>

          {/* Photo strip */}
          <div className="grid grid-cols-12 border-2 border-[#1C1C1C]">

            {/* Feature panel */}
            <div className="col-span-12 lg:col-span-8 border-b-2 lg:border-b-0 lg:border-r-2 border-[#1C1C1C] flex flex-col">
              <div className="bg-[#1C1C1C] flex-1 relative overflow-hidden" style={{ minHeight: 320 }}>
                <div className="absolute inset-0"
                  style={{ backgroundImage: 'repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(255,255,255,0.03) 39px,rgba(255,255,255,0.03) 40px)' }} />
                <div className={`${F.bebas} absolute inset-0 flex items-center justify-center text-white opacity-[0.05]`}
                  style={{ fontSize: '14rem', lineHeight: 1 }}>
                  {displayShowcase[slideIndex]?.name?.charAt(0) ?? 'E'}
                </div>
                {/* Left accent rule */}
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#F7941D]" />
                <div className={`${F.space} absolute top-6 right-6 text-[#F7941D] text-[10px] tracking-[0.2em] uppercase`}>
                  {displayShowcase[slideIndex]?.domain ?? ''}
                </div>
              </div>
              <div className="p-8 bg-[#FFFFFF] border-t-2 border-[#1C1C1C]">
                <div className={`${F.space} font-bold text-2xl text-[#1C1C1C] mb-2`}>
                  {displayShowcase[slideIndex]?.name ?? 'Loading…'}
                </div>
                <div className={`${F.serif} italic text-[#666666] text-base leading-relaxed`}>
                  {displayShowcase[slideIndex]?.tagline ?? ''}
                </div>
              </div>
            </div>

            {/* Side list */}
            <div className="col-span-12 lg:col-span-4 flex flex-col divide-y-2 divide-[#1C1C1C]">
              {displayShowcase.slice(0, 4).map((item, i) => (
                <button key={i} onClick={() => setSlideIndex(i)}
                  className={`p-7 text-left transition-colors flex-1 ${i === slideIndex ? 'bg-[#F7941D]' : 'bg-[#FFFFFF] hover:bg-[#F5F4F0]'}`}>
                  <div className={`${F.bebas} text-5xl leading-none ${i === slideIndex ? 'text-white' : 'text-[#DDDDDD]'}`}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className={`${F.space} font-bold text-sm mt-2 ${i === slideIndex ? 'text-white' : 'text-[#1C1C1C]'}`}>
                    {item.name}
                  </div>
                  <div className={`${F.space} text-[11px] tracking-wide mt-0.5 ${i === slideIndex ? 'text-white/70' : 'text-[#888888]'}`}>
                    {item.member_count != null ? `${item.member_count} member${item.member_count !== 1 ? 's' : ''}` : item.domain ?? ''}
                  </div>
                </button>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          05  AI MATCHMAKING
      ══════════════════════════════════════════ */}
      <section className="bg-[#F5F4F0] border-b-2 border-[#1C1C1C] py-24">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14">
          <div className="mb-16">
            <div className={`${F.space} text-[11px] tracking-[0.25em] uppercase text-[#F7941D] mb-4`}>01 — The Network</div>
            <h2 className={`${F.space} font-bold text-[#1C1C1C] max-w-xl`} style={{ fontSize: 'clamp(30px, 4vw, 48px)' }}>
              Stop searching.<br />Start building.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 border-t-2 border-[#1C1C1C] divide-y-2 md:divide-y-0 md:divide-x-2 divide-[#1C1C1C]">
            {[
              { label: 'Find Teammates', heading: 'Assemble your founding team.',   body: 'AI-ranked matches based on skill complement, domain overlap, and commitment level. Filter by role, stack, and availability.', href: '/discover', cta: 'Browse Profiles' },
              { label: 'Find Mentors',   heading: 'Get the right room.',             body: 'Domain experts with verified track records. Book structured office hours, not casual coffee chats. Every session has an agenda.', href: '/mentors',  cta: 'View Mentors'  },
              { label: 'Discover Ideas', heading: 'Validate before you build.',      body: 'Browse the idea board. Add co-authorship, fork concepts, or stress-test your hypothesis with AI feedback before committing.',      href: '/ideas',    cta: 'Explore Ideas' },
            ].map((col) => (
              <div key={col.label} className="px-8 py-10 flex flex-col gap-4">
                <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D]`}>{col.label}</div>
                <h3 className={`${F.space} font-bold text-[#1C1C1C] text-xl leading-snug`}>{col.heading}</h3>
                <p className={`${F.serif} text-[#555555] text-[16px] leading-[1.8] flex-1`}>{col.body}</p>
                <a href={col.href}
                  className={`${F.space} text-[13px] font-semibold text-[#1C1C1C] hover:text-[#F7941D] transition-colors tracking-wide group w-fit`}>
                  {col.cta} →
                  <span className="block h-[1.5px] bg-[#1C1C1C] group-hover:bg-[#F7941D] w-0 group-hover:w-full transition-all duration-300 mt-0.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          06  TREND RADAR
      ══════════════════════════════════════════ */}
      <section className="bg-[#FFFFFF] border-b-2 border-[#1C1C1C] py-24">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14">
          <div className="grid grid-cols-12">

            {/* Left label */}
            <div className="col-span-12 lg:col-span-4 mb-14 lg:mb-0 flex flex-col justify-between lg:pr-14">
              <div>
                <div className={`${F.space} text-[11px] tracking-[0.25em] uppercase text-[#F7941D] mb-4`}>02 — Market Trends</div>
                <h2 className={`${F.space} font-bold text-[#1C1C1C]`} style={{ fontSize: 'clamp(26px, 3vw, 42px)' }}>
                  Where capital<br />is pointing.
                </h2>
                <p className={`${F.serif} text-[#666666] text-base leading-[1.8] mt-6`}>
                  Real-time signal aggregation across startup activity, idea submissions, and mentor engagement — weighted by vertical.
                </p>
              </div>
              <a href="/trends"
                className={`mt-8 lg:mt-0 ${F.space} text-[13px] font-semibold text-[#1C1C1C] hover:text-[#F7941D] transition-colors border-b border-[#1C1C1C] hover:border-[#F7941D] pb-0.5 w-fit`}>
                Full Trend Report →
              </a>
            </div>

            {/* Right: data grid */}
            <div className="col-span-12 lg:col-span-8 lg:border-l-2 border-[#1C1C1C] lg:pl-14">
              <div className="border-t-2 border-[#1C1C1C]">
                {trendData.map((item) => (
                  <div key={item.name} className="border-b border-[#E0E0E0] py-[14px] grid grid-cols-12 items-center gap-3">
                    <div className={`col-span-4 ${F.space} text-sm font-medium text-[#1C1C1C] tracking-tight`}>{item.name}</div>
                    <div className="col-span-5 h-[3px] bg-[#E8E8E8] relative">
                      <div className="h-full bg-[#1C1C1C] transition-all duration-700" style={{ width: `${((item.opportunity_score ?? 1) / maxTrend) * 100}%` }} />
                    </div>
                    <div className={`col-span-1 ${F.bebas} text-[1.6rem] text-[#1C1C1C] leading-none`}>{item.opportunity_score ?? '—'}</div>
                    <div className={`col-span-2 text-right ${F.space} text-[11px] font-bold tracking-wide text-[#F7941D]`}>{item.growth_signal}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          07  PUBLIC MENTOR SESSIONS
      ══════════════════════════════════════════ */}
      <section className="bg-[#003580] border-b-2 border-[#1C1C1C] py-24">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14">

          <div className="mb-12 pb-8 border-b border-white/15">
            <div className={`${F.space} text-[11px] tracking-[0.25em] uppercase text-[#F7941D] mb-4`}>03 — Mentor Sessions</div>
            <div className="flex items-end justify-between">
              <h2 className={`${F.space} font-bold text-white`} style={{ fontSize: 'clamp(26px, 3vw, 44px)' }}>
                Open sessions.<br />Join the room.
              </h2>
              <a href="/office-hours"
                className={`hidden md:inline ${F.space} text-[13px] font-medium text-white hover:text-[#F7941D] transition-colors border-b border-white/30 hover:border-[#F7941D] pb-0.5`}>
                All Office Hours →
              </a>
            </div>
          </div>

          {displaySessions.length === 0 ? (
            <div className="py-12 text-center">
              <p className={`${F.space} text-white/30 text-[13px] tracking-widest uppercase`}>No sessions scheduled — check back soon.</p>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="grid grid-cols-12 pb-3">
                {(['Session', 'Mentor', 'Date', 'Time', 'Action'] as string[]).map((h, i) => (
                  <div key={h}
                    className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-white/35 ${i===0?'col-span-4':i===1?'col-span-3':i===2?'col-span-2':i===3?'col-span-1':'col-span-2 text-right'}`}>
                    {h}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {displaySessions.map((s, i) => (
                <div key={s.id ?? i} className="grid grid-cols-12 items-center py-5 border-t border-white/10 -mx-5 px-5 hover:bg-white/[0.04] transition-colors">
                  <div className="col-span-4">
                    <div className={`${F.space} font-bold text-white text-sm`}>{s.title}</div>
                    {s.description && (
                      <div className={`${F.serif} italic text-white/40 text-xs mt-0.5 line-clamp-1`}>{s.description}</div>
                    )}
                  </div>
                  <div className={`col-span-3 ${F.serif} italic text-white/60 text-sm`}>{s.mentor_name}</div>
                  <div className={`col-span-2 ${F.bebas} text-[#F7941D] text-[1.5rem] leading-none`}>
                    {s.session_date ? new Date(s.session_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'TBD'}
                  </div>
                  <div className={`col-span-1 ${F.space} text-white/40 text-sm`}>{s.session_time ?? '—'}</div>
                  <div className="col-span-2 text-right">
                    <a href={s.meet_link} target="_blank" rel="noopener noreferrer"
                      className={`${F.space} text-[11px] font-semibold tracking-wide text-white hover:text-[#F7941D] transition-colors`}>
                      Join →
                    </a>
                  </div>
                </div>
              ))}
            </>
          )}

        </div>
      </section>

      {/* ══════════════════════════════════════════
          09  PLATFORM MODULES
      ══════════════════════════════════════════ */}
      <section className="bg-[#FFFFFF] border-b-2 border-[#1C1C1C] py-24">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14">
          <div className="mb-12">
            <div className={`${F.space} text-[11px] tracking-[0.25em] uppercase text-[#F7941D] mb-4`}>05 — Platform Modules</div>
            <h2 className={`${F.space} font-bold text-[#1C1C1C]`} style={{ fontSize: 'clamp(26px, 3vw, 44px)' }}>
              Infrastructure for serious builders.
            </h2>
          </div>

          <div className="border-t-2 border-[#1C1C1C]">
            {features.map((f) => (
              <a key={f.num} href={f.route}
                className="group block border-b border-[#E0E0E0] hover:bg-[#F5F4F0] transition-colors -mx-6 lg:-mx-14 px-6 lg:px-14">
                <div className="py-7 grid grid-cols-12 items-center">
                  <div className={`col-span-1 ${F.bebas} text-[#F7941D] group-hover:text-[#1C1C1C] transition-colors leading-none`}
                    style={{ fontSize: '2.8rem' }}>{f.num}</div>
                  <div className="col-span-4 lg:col-span-3 pl-2 col-start-2">
                    <div className={`${F.space} font-bold text-[#1C1C1C] text-[15px] tracking-tight`}>{f.title}</div>
                  </div>
                  <div className="hidden lg:block col-span-6 col-start-6">
                    <div className={`${F.serif} text-[#666666] text-[15px] leading-relaxed`}>{f.desc}</div>
                  </div>
                  <div className="col-span-1 col-start-12 text-right">
                    <span className={`${F.space} text-[#BBBBBB] group-hover:text-[#F7941D] transition-colors text-lg`}>→</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          10  TESTIMONIALS
      ══════════════════════════════════════════ */}
      <section className="bg-[#003580] border-b-2 border-[#1C1C1C] py-24">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14">
          <div className={`${F.space} text-[11px] tracking-[0.25em] uppercase text-[#F7941D] mb-16`}>06 — Field Notes</div>

          <div className="max-w-4xl mx-auto text-center">
            <blockquote
              className={`${F.display} italic text-white leading-[1.45] mb-10`}
              style={{ fontSize: 'clamp(20px, 2.4vw, 32px)' }}>
              {testimonials[testimonialIndex].quote}
            </blockquote>
            <div className={`${F.space} text-[11px] tracking-[0.2em] uppercase text-[#F7941D]`}>
              {testimonials[testimonialIndex].name}
            </div>
            <div className={`${F.space} text-[10px] tracking-[0.15em] uppercase text-white/40 mt-1`}>
              {testimonials[testimonialIndex].startup}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-8 mt-12">
              <button onClick={() => setTestimonialIndex(p => (p - 1 + testimonials.length) % testimonials.length)}
                className={`${F.space} text-[13px] text-white/40 hover:text-white transition-colors tracking-wide`}>← Prev</button>
              <span className={`${F.bebas} text-white/30 text-lg tracking-widest`}>
                {String(testimonialIndex + 1).padStart(2, '0')} / {String(testimonials.length).padStart(2, '0')}
              </span>
              <button onClick={() => setTestimonialIndex(p => (p + 1) % testimonials.length)}
                className={`${F.space} text-[13px] text-white/40 hover:text-white transition-colors tracking-wide`}>Next →</button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          11  CTA
      ══════════════════════════════════════════ */}
      <section className="bg-[#F7941D] border-b-2 border-[#1C1C1C] py-24">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14">
          <div className="grid grid-cols-12 items-center">
            <div className="col-span-12 lg:col-span-8">
              <h2 className={`${F.display} font-black italic text-[#1C1C1C] leading-[0.9] mb-6`}
                style={{ fontSize: 'clamp(48px, 7vw, 96px)' }}>
                The grid is open.
              </h2>
              <p className={`${F.serif} text-[#1C1C1C]/75 text-[17px] leading-[1.8] max-w-lg`}>
                Set up your profile, sync your GitHub, and find your co-founder. The ecosystem is live and the clock is running.
              </p>
            </div>
            <div className="col-span-12 lg:col-span-3 lg:col-start-10 flex lg:justify-end mt-10 lg:mt-0">
              <button onClick={() => router.push('/register')}
                className={`${F.space} font-bold text-[13px] tracking-[0.1em] uppercase bg-[#1C1C1C] text-white px-10 py-5 hover:bg-white hover:text-[#1C1C1C] transition-colors duration-200 border-2 border-[#1C1C1C]`}>
                Initialize Profile
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          12  FOOTER
      ══════════════════════════════════════════ */}
      <footer className="bg-[#1C1C1C]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-16">
          <div className="grid grid-cols-12 gap-8 pb-12 border-b border-white/[0.08]">

            {/* Wordmark */}
            <div className="col-span-12 lg:col-span-4">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-3.5 h-3.5 bg-[#F7941D]" />
                <span className={`${F.space} font-bold text-white text-lg tracking-[0.05em]`}>ECOSYSTEM</span>
              </div>
              <p className={`${F.serif} text-white/40 text-[14px] leading-[1.75] max-w-xs`}>
                A comprehensive platform for founders, mentors, and innovators to pitch ideas, track progress, and build the future.
              </p>
            </div>

            {/* Links */}
            <div className="col-span-6 lg:col-span-3 lg:col-start-6">
              <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-white/25 mb-5`}>Platform</div>
              <div className="flex flex-col gap-3">
                {([['Dashboard', '/dashboard'], ['Startups', '/startups'], ['Ideas', '/ideas'], ['Mentors', '/mentors'], ['Trends', '/trends']] as [string,string][]).map(([label, href]) => (
                  <a key={label} href={href}
                    className={`${F.space} text-[13px] text-white/50 hover:text-white transition-colors tracking-wide w-fit link-underline`}>
                    {label}
                  </a>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="col-span-6 lg:col-span-3 lg:col-start-10">
              <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-white/25 mb-5`}>System</div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 ${apiStatus === 'connected' ? 'bg-[#F7941D]' : 'bg-white/20'}`} />
                  <span className={`${F.space} text-[13px] text-white/50`}>
                    {apiStatus === 'connected' ? 'All Systems Live' : apiStatus === 'error' ? 'API Offline' : 'Checking…'}
                  </span>
                </div>
                <a href="mailto:support@ecosystem.dev"
                  className={`${F.space} text-[13px] text-white/50 hover:text-white transition-colors`}>
                  support@ecosystem.dev
                </a>
              </div>
            </div>

          </div>

          {/* Bottom strip */}
          <div className="pt-5 border-t border-[#F7941D]/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <span className={`${F.serif} text-white/25 text-[12px]`}>
              © 2026 Digital Platform for Startup Ecosystem. All rights reserved.
            </span>
            <span className={`${F.serif} text-white/20 text-[12px]`}>
              Build v2.4.0 — April 2026
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}

