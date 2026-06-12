'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/axios';

const F = {
  display: "font-[family-name:var(--font-playfair)]",
  space:   "font-[family-name:var(--font-space)]",
  serif:   "font-[family-name:var(--font-serif)]",
  bebas:   "font-[family-name:var(--font-bebas)]",
};

const stage2tab: Record<string,string> = {
  '':         'All',
  'Pre-Seed': 'Pre-Seed',
  'Seed':     'Seed',
  'Scaling':  'Scaling',
};
const tabs = ['All', 'Pre-Seed', 'Seed', 'Scaling'];

export default function Showcase() {
  const router    = useRouter();
  const [startups, setStartups] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [sort,     setSort]     = useState('upvotes');
  const [domain,   setDomain]   = useState('');
  const [stageTab, setStageTab] = useState('All');

  const domains = ['FinTech', 'EdTech', 'HealthTech', 'E-commerce', 'AI/ML', 'SaaS', 'Web3'];

  useEffect(() => { fetchStartups(); }, [sort, domain, stageTab]);

  const fetchStartups = async () => {
    setLoading(true);
    try {
      const stage = Object.entries(stage2tab).find(([,v]) => v === stageTab)?.[0] ?? '';
      let query = `/showcase?sort=${sort}`;
      if (domain) query += `&domain=${domain}`;
      if (stage)  query += `&stage=${stage}`;
      const res = await api.get(query);
      setStartups(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleUpvote = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try { await api.post(`/startups/${id}/upvote`); fetchStartups(); }
    catch (err) { console.error(err); }
  };

  return (
    <div className="bg-[#FFFFFF] min-h-screen">

      {/* ── Back nav ── */}
      <div className="border-b-2 border-[#1C1C1C] bg-[#FFFFFF]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-4 flex items-center gap-4">
          <a href="/" className={`${F.space} text-[11px] tracking-[0.2em] uppercase text-[#888888] hover:text-[#F7941D] transition-colors`}>
            ← Ecosystem
          </a>
          <span className="text-[#DDDDDD]">/</span>
          <span className={`${F.space} text-[11px] tracking-[0.2em] uppercase text-[#1C1C1C]`}>Directory</span>
        </div>
      </div>

      {/* ── Section header ── */}
      <div className="bg-[#F5F4F0] border-b-2 border-[#1C1C1C]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-16">
          <div className="grid grid-cols-12">
            <div className="col-span-12 lg:col-span-8">
              <div className={`${F.space} text-[11px] tracking-[0.25em] uppercase text-[#F7941D] mb-4`}>07 — Directory</div>
              <h1 className={`${F.display} font-black italic text-[#1C1C1C] leading-[0.92]`}
                style={{ fontSize: 'clamp(44px, 6vw, 80px)' }}>
                The Startup<br />Showcase.
              </h1>
              <p className={`${F.serif} text-[#666666] text-[16px] leading-[1.8] mt-6 max-w-xl`}>
                Discover the latest products and startups built by the ecosystem. Every entry is live, verified, and open for investment or collaboration.
              </p>
            </div>
            <div className="col-span-12 lg:col-span-4 flex items-end justify-end mt-8 lg:mt-0">
              <button onClick={() => router.push('/startups/new')}
                className={`${F.space} font-bold text-[13px] tracking-[0.1em] uppercase bg-[#F7941D] text-white px-7 py-3.5 hover:bg-[#1C1C1C] transition-colors`}>
                Launch Startup
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="border-b-2 border-[#1C1C1C] bg-[#FFFFFF]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14">
          <div className="flex flex-col md:flex-row items-start md:items-stretch justify-between gap-0 border-b border-[#E0E0E0]">

            {/* Stage tabs */}
            <div className="flex divide-x-2 divide-[#1C1C1C] border-r-0 md:border-r-2 border-[#1C1C1C] overflow-x-auto">
              {tabs.map(t => (
                <button key={t} onClick={() => setStageTab(t)}
                  className={`${F.space} font-bold text-[12px] tracking-[0.12em] uppercase px-6 py-4 transition-colors min-w-[80px]
                    ${stageTab === t ? 'bg-[#F7941D] text-white' : 'bg-[#FFFFFF] text-[#888888] hover:text-[#1C1C1C] hover:bg-[#F5F4F0]'}`}>
                  {t}
                </button>
              ))}
            </div>

            {/* Domain filter + sort */}
            <div className="flex items-stretch divide-x divide-[#E0E0E0] overflow-x-auto">
              <div className="flex items-center gap-2 px-5 py-3">
                <span className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#AAAAAA] mr-2`}>Domain</span>
                {['', ...domains].map(d => (
                  <button key={d || 'all'} onClick={() => setDomain(d)}
                    className={`${F.space} text-[11px] font-medium px-3 py-1 border transition-colors
                      ${domain === d ? 'bg-[#1C1C1C] text-white border-[#1C1C1C]' : 'bg-transparent text-[#888888] border-[#E0E0E0] hover:border-[#1C1C1C] hover:text-[#1C1C1C]'}`}>
                    {d || 'All'}
                  </button>
                ))}
              </div>
              <div className="flex items-center px-5">
                <select value={sort} onChange={e => setSort(e.target.value)}
                  className={`${F.space} text-[12px] tracking-wide text-[#1C1C1C] bg-transparent border-none outline-none cursor-pointer`}>
                  <option value="upvotes">Most Upvoted</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-2 border-[#1C1C1C]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border-b border-r border-[#E0E0E0] last:border-b-0">
                <div className="bg-[#F5F4F0] h-48 animate-pulse" />
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-[#E8E8E8] animate-pulse w-1/3" />
                  <div className="h-3 bg-[#F0F0F0] animate-pulse w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : startups.length === 0 ? (
          <div className="border-2 border-[#1C1C1C] py-20 text-center">
            <div className={`${F.bebas} text-[#DDDDDD] mb-4`} style={{ fontSize: '6rem', lineHeight: 1 }}>00</div>
            <h3 className={`${F.space} font-bold text-[#1C1C1C] text-xl mb-2`}>No startups found</h3>
            <p className={`${F.serif} text-[#888888] italic mb-6`}>Be the first to launch in this category.</p>
            <button onClick={() => router.push('/startups/new')}
              className={`${F.space} font-bold text-[12px] tracking-[0.1em] uppercase bg-[#F7941D] text-white px-6 py-3 hover:bg-[#1C1C1C] transition-colors`}>
              Launch Startup
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-2 border-[#1C1C1C]">
            {startups.map((s, i) => (
              <div key={s.id}
                onClick={() => router.push(`/startups/${s.id}`)}
                className={`group border-[#E0E0E0] cursor-pointer
                  ${i % 3 !== 2 ? 'border-r' : ''}
                  ${i < startups.length - (startups.length % 3 || 3) ? 'border-b' : ''}
                  flex flex-col`}>

                {/* Photo block */}
                <div className="bg-[#1C1C1C] h-48 relative overflow-hidden startup-card-img flex-shrink-0">
                  {s.logo_url ? (
                    <img src={s.logo_url} alt={s.name}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" />
                  ) : (
                    <>
                      <div className="absolute inset-0"
                        style={{ backgroundImage: 'repeating-linear-gradient(135deg,transparent,transparent 9px,rgba(255,255,255,0.02) 9px,rgba(255,255,255,0.02) 10px)' }} />
                      <div className={`${F.bebas} absolute inset-0 flex items-center justify-center text-white opacity-10`}
                        style={{ fontSize: '8rem', lineHeight: 1 }}>
                        {s.name.charAt(0)}
                      </div>
                    </>
                  )}
                  {/* Domain badge */}
                  <div className="absolute bottom-4 left-4">
                    <span className={`${F.space} text-[10px] font-bold tracking-[0.15em] uppercase bg-[#F7941D] text-white px-2.5 py-1`}>
                      {s.domain}
                    </span>
                  </div>
                  {/* Activity badge */}
                  <div className="absolute top-4 right-4">
                    <ActivityBadge startupId={s.id} />
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 border-t border-[#E0E0E0] flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-3 flex-1">
                    <div>
                      <h3 className={`${F.space} font-bold text-[#1C1C1C] text-lg group-hover:text-[#F7941D] transition-colors`}>{s.name}</h3>
                      <p className={`${F.serif} text-[#777777] text-[13px] leading-relaxed mt-1 line-clamp-2`}>{s.tagline}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#F0F0F0]">
                    <div className="flex items-center gap-3">
                      <span className={`${F.space} text-[11px] tracking-wide border border-[#E0E0E0] text-[#666666] px-2 py-0.5`}>
                        {s.stage}
                      </span>
                      <span className={`${F.space} text-[11px] text-[#AAAAAA]`}>{s.member_count} member{s.member_count !== 1 && 's'}</span>
                    </div>
                    <button onClick={(e) => handleUpvote(s.id, e)}
                      className={`flex items-center gap-1.5 border border-[#E0E0E0] px-3 py-1.5 hover:border-[#F7941D] hover:text-[#F7941D] transition-colors group/up`}>
                      <svg className="w-3.5 h-3.5 text-[#AAAAAA] group-hover/up:text-[#F7941D]" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"/>
                      </svg>
                      <span className={`${F.bebas} text-[1.1rem] text-[#888888] group-hover/up:text-[#F7941D] leading-none`}>{s.upvote_count}</span>
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

function ActivityBadge({ startupId }: { startupId: number }) {
  const [signal, setSignal] = useState<string | null>(null);

  useEffect(() => {
    api.get(`/startups/${startupId}/activity-score`)
      .then(res => { if (res.data.data.signal && res.data.data.signal !== 'Unlinked') setSignal(res.data.data.signal); })
      .catch(() => {});
  }, [startupId]);

  if (!signal) return null;

  const signalStyle: Record<string, string> = {
    'Very Active': 'bg-[#1C1C1C] text-[#F7941D]',
    'Active':      'bg-[#1C1C1C] text-white',
    'Moderate':    'bg-[#1C1C1C] text-white/60',
    'Low':         'bg-[#1C1C1C] text-white/30',
  };

  return (
    <span className={`font-[family-name:var(--font-space)] text-[9px] font-bold tracking-[0.15em] uppercase px-2 py-1 ${signalStyle[signal] ?? signalStyle['Low']}`}>
      {signal}
    </span>
  );
}
