'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, setToken } from '../../lib/axios';
import SkillHeatmap from '../../components/SkillHeatmap';
import TrendRadar from '../../components/TrendRadar';
import UserCard from '../../components/UserCard';
import FindTeammate from '../../components/FindTeammate';
import FindMentor from '../../components/FindMentor';
import HiringStartups from '../../components/HiringStartups';
import PressNewsSection from '../../components/PressNewsSection';

import { XPBar } from '../../components/GamificationWidgets';

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [gamification, setGamification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [feedParams, setFeedParams] = useState<any>({});
  const [skillGaps, setSkillGaps] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [news, setNews] = useState<any[]>([]);

  useEffect(() => {
    // 1. Fetch Auth & Profile status
    api.get('/profile/me').then(res => {
      const data = res.data.data;
      // Role guards
      if (data.role === 'admin') { router.push('/admin'); return; }
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
      
      // 2. Fetch Dashboard Feed
      api.get('/dashboard/feed').then(res => setFeedParams(res.data.data)).catch(console.error);
      
      // 3. Fetch Skill Gaps
      api.get('/analytics/skill-gaps').then(res => setSkillGaps(res.data.data)).catch(console.error);
      
      // 4. Fetch Trend Radar (Gemini)
      api.get('/ai/trend-radar').then(res => {
        setTrends(res.data.data);
        setTrendsLoading(false);
      }).catch(err => {
        console.error(err);
        setTrendsLoading(false);
      });

    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      setToken(null);
      window.location.href = '/login';
    }
  };

  if (loading || !profile) {
    return <div className="min-h-screen flex justify-center items-center dark:bg-gray-900 bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Top Banner */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 pt-8 pb-12 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-start">
          <div className="flex gap-6 items-center">
            {profile.profile.avatar_url ? (
              <img src={profile.profile.avatar_url} className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow shadow-blue-500/20" alt="Avatar"/>
            ) : (
              <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-500 text-white rounded-full flex justify-center items-center text-2xl font-bold shadow-lg border-4 border-white dark:border-gray-800">
                {profile.name.charAt(0)}
              </div>
            )}
            
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Welcome back, {profile.name}! 👋</h1>
              <div className="flex items-center gap-3 mt-4 text-sm flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-full font-semibold capitalize tracking-wide ${profile.role === 'mentor' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'}`}>
                  {profile.role}
                </span>
                
                {gamification && (
                   <div className="ml-4">
                      <XPBar gamification={gamification} />
                   </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/settings')}
              className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-medium px-4 py-2 transition text-sm border border-gray-200 dark:border-gray-700 rounded-xl"
            >
              ⚙️ Settings
            </button>
            <button 
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 font-medium px-4 py-2 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-[-1.5rem]">
        
        {/* Trend Radar */}
        <section className="mb-12">
          <div className="flex justify-between items-end mb-4 px-2">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                Trending Domains 2025
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Discover high-growth fields for your next breakthrough.</p>
            </div>
          </div>
          <TrendRadar data={trends} loading={trendsLoading} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Column (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Skill Gaps Heatmap */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Ecosystem Skill Heatmap</h2>
              <SkillHeatmap data={skillGaps} />
            </section>

            {/* Recent Startups Placeholder */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Startups</h2>
                <button className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">View All</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {feedParams.new_startups?.length ? feedParams.new_startups.map((s: any) => (
                  <div key={s.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow transition">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl mb-3 flex items-center justify-center text-indigo-600">🚀</div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{s.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{s.description}</p>
                  </div>
                )) : (
                  <div className="col-span-2 bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 text-center text-gray-500 border border-gray-100 dark:border-gray-700/50">No new startups tracked yet.</div>
                )}
              </div>
            </section>

            {/* Find Teammate — only for students who have a startup */}
            {profile.startup_intent === 'has_startup' && (
              <section>
                <FindTeammate />
              </section>
            )}

            {/* Find a Startup — only for students looking for a startup */}
            {profile.startup_intent === 'finding_startup' && (
              <section>
                <HiringStartups />
              </section>
            )}

            {/* Find a Mentor — for all students */}
            <section>
              <FindMentor />
            </section>

            {/* In the Press — News Section */}
            {news.length > 0 && (
              <section>
                <PressNewsSection news={news} />
              </section>
            )}
          </div>

          {/* Sidebar Column (1/3) */}
          <div className="space-y-8">

            {/* Upcoming Meetings */}
            <section className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Upcoming Meetings</h2>
              {feedParams.upcoming_meetings?.length ? (
                <div className="space-y-4">
                  {feedParams.upcoming_meetings.map((m: any) => (
                    <div key={m.id} className="flex gap-4 items-start p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl">
                      <div className="bg-blue-500 text-white p-2 rounded-lg mt-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">{m.title}</div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">{m.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl">No meetings scheduled</div>
              )}
            </section>

            {/* Suggested Connections */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex justify-between items-center">
                <span>Suggested Mentors</span>
                <span className="text-xs text-blue-600 hover:underline cursor-pointer">Find more</span>
              </h2>
              <div className="space-y-4">
                {feedParams.top_mentors?.length ? feedParams.top_mentors.map((m: any) => (
                  <div key={m.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 transition hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer">
                    {m.avatar_url ? (
                      <img src={m.avatar_url} className="w-12 h-12 rounded-full object-cover"/>
                    ) : (
                      <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">{m.name.charAt(0)}</div>
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">{m.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate w-32">{m.designation} @ {m.company}</div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    </button>
                  </div>
                )) : (
                  <div className="text-center py-6 text-sm text-gray-500 border border-dashed rounded-xl border-gray-300 dark:border-gray-700">No suggestions available</div>
                )}
              </div>
            </section>


          </div>
        </div>
      </div>
    </div>
  );
}
