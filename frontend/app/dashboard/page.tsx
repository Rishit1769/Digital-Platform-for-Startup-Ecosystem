'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, setToken } from '../../lib/axios';
import SkillHeatmap from '../../components/SkillHeatmap';
import TrendRadar from '../../components/TrendRadar';
import FindTeammate from '../../components/FindTeammate';
import FindMentor from '../../components/FindMentor';
import HiringStartups from '../../components/HiringStartups';
import PressNewsSection from '../../components/PressNewsSection';
import { XPBar } from '../../components/GamificationWidgets';

const F = {
  display: "font-[family-name:var(--font-playfair)]",
  space:   "font-[family-name:var(--font-space)]",
  serif:   "font-[family-name:var(--font-serif)]",
  bebas:   "font-[family-name:var(--font-bebas)]",
};

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile]             = useState<any>(null);
  const [gamification, setGamification]   = useState<any>(null);
  const [loading, setLoading]             = useState(true);
  const [feedParams, setFeedParams]       = useState<any>({});
  const [skillGaps, setSkillGaps]         = useState<any[]>([]);
  const [trends, setTrends]               = useState<any[]>([]);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [news, setNews]                   = useState<any[]>([]);

  useEffect(() => {
    api.get('/profile/me').then(res => {
      const data = res.data.data;
      if (data.role === 'admin')  { router.push('/admin');  return; }
      if (data.role === 'mentor') { router.push('/mentor'); return; }
      const p = data.profile;
      if (!p || Object.keys(p).length === 0 || !p.bio || !p.skills) {
        router.push('/profile/setup');
        return;
      }
      setProfile(data);
      fetchAllData();
    }).catch(err => console.error(err));
  }, [router]);

  const fetchAllData = async () => {
    try {
      api.get('/gamification/me').then(res => setGamification(res.data.data)).catch(console.error);
      api.get('/news?limit=8').then(res => setNews(res.data.data || [])).catch(console.error);
      api.get('/dashboard/feed').then(res => setFeedParams(res.data.data)).catch(console.error);
      api.get('/analytics/skill-gaps').then(res => setSkillGaps(res.data.data)).catch(console.error);
      api.get('/ai/trend-radar')
        .then(res => { setTrends(res.data.data); setTrendsLoading(false); })
        .catch(() => setTrendsLoading(false));
    } finally {
      setLoading(false);
    }
  };

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
              <span className={`${F.space} text-[11px] tracking-[0.15em] uppercase text-white/40`}>Student Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {(['Startups', 'Ideas', 'Mentors', 'Calendar'] as string[]).map(label => (
              <a key={label} href={'/' + label.toLowerCase()}
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
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-8 flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-5">
            {profile.profile?.avatar_url ? (
              <img src={profile.profile.avatar_url} className="w-14 h-14 border-2 border-[#1C1C1C] object-cover" alt="Avatar" />
            ) : (
              <div className="w-14 h-14 bg-[#F7941D] border-2 border-[#1C1C1C] flex items-center justify-center">
                <span className={`${F.bebas} text-white text-2xl`}>{profile.name.charAt(0)}</span>
              </div>
            )}
            <div>
              <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-0.5`}>
                {profile.startup_intent === 'has_startup' ? 'Founder' : 'Builder'} · Student
              </div>
              <h1 className={`${F.display} font-black italic text-[#1C1C1C] leading-none`} style={{ fontSize: 'clamp(22px, 2.5vw, 32px)' }}>
                Welcome back, {profile.name.split(' ')[0]}.
              </h1>
            </div>
          </div>
          {gamification && (
            <div className="flex-shrink-0">
              <XPBar gamification={gamification} />
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-10">
        <div className="grid grid-cols-12 gap-8">

          {/* Left column 8/12 */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-10">

            <section>
              <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-[#1C1C1C]">
                <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D]`}>Market Signals</div>
                <div className="flex-1 h-[1px] bg-[#E0E0E0]" />
              </div>
              <h2 className={`${F.space} font-bold text-[#1C1C1C] text-xl mb-5`}>Trending Domains</h2>
              <TrendRadar data={trends} loading={trendsLoading} />
            </section>

            <section>
              <div className="border-b-2 border-[#1C1C1C] mb-5 pb-3">
                <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-1`}>Ecosystem Intelligence</div>
                <h2 className={`${F.space} font-bold text-[#1C1C1C] text-xl`}>Skill Gap Heatmap</h2>
              </div>
              <SkillHeatmap data={skillGaps} />
            </section>

            <section>
              <div className="flex items-end justify-between mb-5 pb-3 border-b-2 border-[#1C1C1C]">
                <div>
                  <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-1`}>New Activity</div>
                  <h2 className={`${F.space} font-bold text-[#1C1C1C] text-xl`}>Recent Startups</h2>
                </div>
                <a href="/startups" className={`${F.space} text-[12px] font-medium text-[#1C1C1C] hover:text-[#F7941D] transition-colors border-b border-[#1C1C1C] hover:border-[#F7941D] pb-0.5`}>View All</a>
              </div>
              {feedParams.new_startups?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {feedParams.new_startups.map((s: any) => (
                    <div key={s.id} className="bg-[#FFFFFF] p-6 border-2 border-[#1C1C1C] hover:border-[#F7941D] transition-colors">
                      <div className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#F7941D] mb-2`}>New Startup</div>
                      <h3 className={`${F.space} font-bold text-[#1C1C1C] text-lg`}>{s.name}</h3>
                      <p className={`${F.serif} text-[#666666] text-sm leading-relaxed mt-2`}>{s.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#FFFFFF] border-2 border-[#E0E0E0] p-8 text-center">
                  <p className={`${F.space} text-[#AAAAAA] text-[12px] tracking-widest uppercase`}>No new startups tracked yet.</p>
                </div>
              )}
            </section>

            {profile.startup_intent === 'has_startup' && (
              <section>
                <div className="border-b-2 border-[#1C1C1C] mb-5 pb-3">
                  <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-1`}>Team Building</div>
                  <h2 className={`${F.space} font-bold text-[#1C1C1C] text-xl`}>Find a Teammate</h2>
                </div>
                <FindTeammate />
              </section>
            )}

            {profile.startup_intent === 'finding_startup' && (
              <section>
                <div className="border-b-2 border-[#1C1C1C] mb-5 pb-3">
                  <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-1`}>Opportunities</div>
                  <h2 className={`${F.space} font-bold text-[#1C1C1C] text-xl`}>Startups Hiring</h2>
                </div>
                <HiringStartups />
              </section>
            )}

            <section>
              <div className="border-b-2 border-[#1C1C1C] mb-5 pb-3">
                <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-1`}>Guidance</div>
                <h2 className={`${F.space} font-bold text-[#1C1C1C] text-xl`}>Find a Mentor</h2>
              </div>
              <FindMentor />
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

          {/* Sidebar 4/12 */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">

            <div className="bg-[#FFFFFF] border-2 border-[#1C1C1C]">
              <div className="bg-[#1C1C1C] px-6 py-4">
                <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D]`}>Schedule</div>
                <h3 className={`${F.space} font-bold text-white text-base mt-0.5`}>Upcoming Meetings</h3>
              </div>
              <div className="p-6">
                {feedParams.upcoming_meetings?.length ? (
                  <div className="flex flex-col gap-3">
                    {feedParams.upcoming_meetings.map((m: any) => (
                      <div key={m.id} className="flex gap-3 items-start border-l-4 border-[#F7941D] pl-4 py-1">
                        <div className="flex-1">
                          <div className={`${F.space} font-bold text-[#1C1C1C] text-[13px]`}>{m.title}</div>
                          <div className={`${F.serif} text-[#F7941D] text-[12px] mt-0.5`}>{m.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`${F.space} text-[#AAAAAA] text-[12px] tracking-widest uppercase text-center py-4`}>No meetings scheduled</p>
                )}
                <a href="/meetings" className={`${F.space} text-[11px] font-medium text-[#888888] hover:text-[#F7941D] transition-colors block mt-4 text-center`}>View Calendar</a>
              </div>
            </div>

            <div className="bg-[#FFFFFF] border-2 border-[#1C1C1C]">
              <div className="px-6 py-4 border-b-2 border-[#1C1C1C] flex items-center justify-between">
                <div>
                  <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D]`}>AI Matched</div>
                  <h3 className={`${F.space} font-bold text-[#1C1C1C] text-base mt-0.5`}>Suggested Mentors</h3>
                </div>
                <a href="/mentors" className={`${F.space} text-[11px] font-medium text-[#888888] hover:text-[#F7941D] transition-colors`}>Find more</a>
              </div>
              <div className="p-4 flex flex-col gap-3">
                {feedParams.top_mentors?.length ? feedParams.top_mentors.map((m: any) => (
                  <div key={m.id} className="flex items-center gap-4 p-4 border-2 border-[#E0E0E0] hover:border-[#F7941D] transition-colors cursor-pointer"
                    onClick={() => router.push('/mentors')}>
                    {m.avatar_url ? (
                      <img src={m.avatar_url} className="w-10 h-10 border border-[#1C1C1C] object-cover flex-shrink-0" alt={m.name} />
                    ) : (
                      <div className="w-10 h-10 bg-[#F7941D] border border-[#1C1C1C] flex items-center justify-center flex-shrink-0">
                        <span className={`${F.bebas} text-white text-lg`}>{m.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className={`${F.space} font-bold text-[#1C1C1C] text-[13px]`}>{m.name}</div>
                      <div className={`${F.serif} italic text-[#888888] text-[12px] truncate`}>{m.designation} @ {m.company}</div>
                    </div>
                  </div>
                )) : (
                  <p className={`${F.space} text-[#AAAAAA] text-[12px] tracking-widest uppercase text-center py-4`}>No suggestions available</p>
                )}
              </div>
            </div>

            <div className="bg-[#003580] border-2 border-[#1C1C1C] p-6">
              <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-4`}>Quick Links</div>
              <div className="flex flex-col gap-2">
                {([
                  ['My Profile',   '/profile'],
                  ['Office Hours', '/office-hours'],
                  ['Analytics',    '/analytics'],
                  ['Discover',     '/discover'],
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
