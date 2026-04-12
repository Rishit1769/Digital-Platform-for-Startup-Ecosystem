'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, setToken } from '../../lib/axios';
import PressNewsSection from '../../components/PressNewsSection';

const F = {
  display: "font-[family-name:var(--font-playfair)]",
  space:   "font-[family-name:var(--font-space)]",
  serif:   "font-[family-name:var(--font-serif)]",
  bebas:   "font-[family-name:var(--font-bebas)]",
};

const QUICK_ACTIONS = [
  { label: 'Office Hours',   href: '/office-hours',  desc: 'Manage your availability'   },
  { label: 'My Sessions',    href: '/meetings',       desc: 'View booked sessions'        },
  { label: 'Student Feed',   href: '/discover',       desc: 'Browse active students'      },
  { label: 'Startup Ideas',  href: '/ideas',          desc: 'Review submitted ideas'      },
  { label: 'Leaderboard',    href: '/leaderboard',    desc: 'Ecosystem rankings'          },
  { label: 'Analytics',      href: '/analytics',      desc: 'Platform insights'           },
];

export default function MentorDashboard() {
  const router = useRouter();
  const [profile, setProfile]   = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [news, setNews]         = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/profile/me').then(res => {
      const data = res.data.data;
      if (data.role !== 'mentor') { router.push('/dashboard'); return; }
      setProfile(data);
      Promise.all([
        api.get('/meetings?limit=5').catch(() => ({ data: { data: [] } })),
        api.get('/news?limit=8').catch(() => ({ data: { data: [] } })),
      ]).then(([mtg, nws]) => {
        setSessions(mtg.data.data || []);
        setNews(nws.data.data || []);
      }).finally(() => setLoading(false));
    }).catch(err => { console.error(err); setLoading(false); });
  }, [router]);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch { /* silent */ }
    finally { setToken(null); window.location.href = '/login'; }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#F5F4F0]">
        <div className={`${F.bebas} text-[#F7941D] tracking-widest`} style={{ fontSize: '2rem' }}>Loading</div>
      </div>
    );
  }

  const p = profile.profile || {};
  const expertiseTags: string[] = Array.isArray(p.expertise)
    ? p.expertise
    : (p.expertise ? p.expertise.split(',').map((s: string) => s.trim()) : []);

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-[#1C1C1C]">

      {/* Header */}
      <header className="bg-[#1C1C1C] border-b-2 border-[#F7941D]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="/" className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 bg-[#F7941D]" />
              <span className={`${F.space} font-bold text-white text-lg tracking-[0.05em]`}>ECOSYSTEM</span>
            </a>
            <div className="hidden md:flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-[#F7941D]" />
              <span className={`${F.space} text-[11px] tracking-[0.15em] uppercase text-white/40`}>Mentor Portal</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {(['Office Hours', 'Students', 'Ideas'] as string[]).map(label => (
              <a key={label} href={'/' + label.toLowerCase().replace(' ', '-')}
                className={`${F.space} hidden lg:block text-[12px] font-medium text-white/50 hover:text-white transition-colors tracking-wide`}>{label}</a>
            ))}
            <button onClick={() => router.push('/settings')}
              className={`${F.space} text-[12px] text-white/50 hover:text-white transition-colors border border-white/15 hover:border-white/40 px-4 py-2`}>
              Settings
            </button>
            <button onClick={handleLogout}
              className={`${F.space} text-[12px] font-bold bg-[#F7941D] text-white px-4 py-2 hover:bg-white hover:text-[#1C1C1C] transition-colors`}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Welcome strip */}
      <div className="bg-[#FFFFFF] border-b-2 border-[#1C1C1C]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-8 flex items-start justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-5">
            {p.avatar_url ? (
              <img src={p.avatar_url} className="w-14 h-14 border-2 border-[#1C1C1C] object-cover" alt="Avatar" />
            ) : (
              <div className="w-14 h-14 bg-[#003580] border-2 border-[#1C1C1C] flex items-center justify-center">
                <span className={`${F.bebas} text-white text-2xl`}>{profile.name.charAt(0)}</span>
              </div>
            )}
            <div>
              <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-0.5`}>Mentor</div>
              <h1 className={`${F.display} font-black italic text-[#1C1C1C] leading-none`} style={{ fontSize: 'clamp(22px, 2.5vw, 32px)' }}>
                {profile.name}
              </h1>
              {(p.designation || p.company) && (
                <p className={`${F.serif} italic text-[#888888] text-sm mt-0.5`}>
                  {[p.designation, p.company].filter(Boolean).join(' at ')}
                </p>
              )}
              {expertiseTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {expertiseTags.slice(0, 4).map(tag => (
                    <span key={tag} className={`${F.space} text-[10px] font-medium border border-[#1C1C1C] px-2 py-0.5 uppercase tracking-widest`}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => router.push('/profile')}
              className={`${F.space} text-[12px] font-bold border-2 border-[#1C1C1C] px-5 py-2 hover:bg-[#1C1C1C] hover:text-white transition-colors`}>
              Edit Profile
            </button>
            <button onClick={() => router.push('/office-hours')}
              className={`${F.space} text-[12px] font-bold bg-[#F7941D] text-white px-5 py-2 border-2 border-[#F7941D] hover:bg-[#1C1C1C] hover:border-[#1C1C1C] transition-colors`}>
              Set Office Hours
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-10">
        <div className="grid grid-cols-12 gap-8">

          {/* Left column */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-10">

            <section>
              <div className="border-b-2 border-[#1C1C1C] mb-5 pb-3">
                <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-1`}>Navigation</div>
                <h2 className={`${F.space} font-bold text-[#1C1C1C] text-xl`}>Quick Actions</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {QUICK_ACTIONS.map(action => (
                  <a key={action.label} href={action.href}
                    className="group bg-[#FFFFFF] border-2 border-[#1C1C1C] p-5 hover:bg-[#F7941D] transition-colors">
                    <div className={`${F.space} font-bold text-[#1C1C1C] group-hover:text-white text-[15px] mb-1 transition-colors`}>{action.label}</div>
                    <div className={`${F.serif} italic text-[#888888] group-hover:text-white/80 text-[12px] transition-colors`}>{action.desc}</div>
                  </a>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-end justify-between mb-5 pb-3 border-b-2 border-[#1C1C1C]">
                <div>
                  <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-1`}>Schedule</div>
                  <h2 className={`${F.space} font-bold text-[#1C1C1C] text-xl`}>Upcoming Sessions</h2>
                </div>
                <a href="/meetings" className={`${F.space} text-[12px] font-medium text-[#1C1C1C] hover:text-[#F7941D] transition-colors border-b border-[#1C1C1C] hover:border-[#F7941D] pb-0.5`}>View All</a>
              </div>
              {sessions.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {sessions.map((s: any) => (
                    <div key={s.id} className="bg-[#FFFFFF] p-5 border-2 border-[#1C1C1C] border-l-[6px] border-l-[#F7941D]">
                      <div className={`${F.space} font-bold text-[#1C1C1C] text-[14px]`}>{s.title}</div>
                      <div className={`${F.serif} italic text-[#888888] text-[12px] mt-1`}>{s.time || 'Time TBD'}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#FFFFFF] border-2 border-[#E0E0E0] p-8 text-center">
                  <p className={`${F.space} text-[#AAAAAA] text-[12px] tracking-widest uppercase`}>No upcoming sessions</p>
                </div>
              )}
            </section>

            {news.length > 0 && (
              <section>
                <div className="border-b-2 border-[#1C1C1C] mb-5 pb-3">
                  <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-1`}>Ecosystem Feed</div>
                  <h2 className={`${F.space} font-bold text-[#1C1C1C] text-xl`}>Latest News</h2>
                </div>
                <PressNewsSection news={news} />
              </section>
            )}

          </div>

          {/* Sidebar */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">

            {p.bio && (
              <div className="bg-[#1C1C1C] border-2 border-[#1C1C1C] p-6">
                <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-4`}>About</div>
                <p className={`${F.serif} text-white/80 text-sm leading-relaxed`}>{p.bio}</p>
                {p.linkedin_url && (
                  <a href={p.linkedin_url} target="_blank" rel="noreferrer"
                    className={`${F.space} text-[12px] font-medium text-[#F7941D] hover:text-white transition-colors block mt-4`}>
                    LinkedIn Profile
                  </a>
                )}
              </div>
            )}

            <div className="bg-[#003580] border-2 border-[#1C1C1C] p-6">
              <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-4`}>Resources</div>
              <div className="flex flex-col gap-2">
                {([
                  ['Mentor Guidelines', '/docs/mentor-guide'],
                  ['Student Profiles',  '/discover'],
                  ['Session History',   '/meetings?tab=history'],
                  ['Review Startups',   '/startups'],
                  ['Ecosystem Stats',   '/analytics'],
                ] as [string, string][]).map(([label, href]) => (
                  <a key={label} href={href}
                    className={`${F.space} text-[13px] text-white/60 hover:text-white transition-colors py-1.5 border-b border-white/[0.08] hover:border-[#F7941D] last:border-0`}>
                    {label}
                  </a>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
