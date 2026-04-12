'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, setToken } from '../../lib/axios';
import PressNewsSection from '../../components/PressNewsSection';
import { XPBar } from '../../components/GamificationWidgets';
import Avatar from '../../components/Avatar';

export default function MentorDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [gamification, setGamification] = useState<any>(null);
  const [feedParams, setFeedParams] = useState<any>({});
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/profile/me').then(res => {
      const data = res.data.data;
      if (data.role === 'admin') { router.push('/admin'); return; }
      if (data.role === 'student') { router.push('/dashboard'); return; }
      const p = data.profile;
      if (!p || Object.keys(p).length === 0 || !p.bio) {
        router.push('/profile/setup');
        return;
      }
      setProfile(data);
      api.get('/gamification/me').then(r => setGamification(r.data.data)).catch(console.error);
      api.get('/dashboard/feed').then(r => setFeedParams(r.data.data)).catch(console.error);
      api.get('/news?limit=8').then(r => setNews(r.data.data || [])).catch(console.error);
      setLoading(false);
    }).catch(err => { console.error(err); setLoading(false); });
  }, [router]);

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
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const parseJson = (val: any) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') { try { return JSON.parse(val); } catch (e) {} }
    return [];
  };

  const expertise = parseJson(profile.profile?.expertise).slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 pt-8 pb-12 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-start flex-wrap gap-4">
          <div className="flex gap-5 items-center">
            <Avatar name={profile.name} avatarUrl={profile.profile?.avatar_url} size="lg" verified={!!profile.is_verified} />
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Welcome, {profile.name}!</h1>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full font-semibold capitalize tracking-wide bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 text-sm">
                  Mentor
                </span>
                {profile.profile?.designation && profile.profile?.company && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">{profile.profile.designation} @ {profile.profile.company}</span>
                )}
                {gamification && (
                  <div className="ml-2">
                    <XPBar gamification={gamification} />
                  </div>
                )}
              </div>
              {expertise.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {expertise.map((e: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-md text-xs font-medium">{e}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => router.push('/calendar')}
              className="px-4 py-2 border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition"
            >
              📅 Calendar
            </button>
            <button
              onClick={() => router.push('/settings')}
              className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-medium px-4 py-2 transition text-sm border border-gray-200 dark:border-gray-700 rounded-xl"
            >
              ⚙️ Settings
            </button>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 font-medium px-4 py-2 transition text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-[-1.5rem]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">

            {/* Quick Actions */}
            <section className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'My Sessions', icon: '🗓️', href: '/office-hours' },
                { label: 'Meetings', icon: '🤝', href: '/meetings' },
                { label: 'Discover Students', icon: '🔍', href: '/discover' },
                { label: 'My Profile', icon: '👤', href: '/profile' },
                { label: 'Analytics', icon: '📊', href: '/analytics' },
                { label: 'Kanban Board', icon: '📋', href: '/calendar' },
              ].map(a => (
                <button
                  key={a.label}
                  onClick={() => router.push(a.href)}
                  className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 text-left hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition group"
                >
                  <div className="text-3xl mb-2">{a.icon}</div>
                  <div className="text-sm font-bold text-gray-700 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">{a.label}</div>
                </button>
              ))}
            </section>

            {/* Upcoming Sessions */}
            {feedParams.upcoming_meetings?.length > 0 && (
              <section className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Upcoming Sessions</h2>
                <div className="space-y-3">
                  {feedParams.upcoming_meetings.map((m: any) => (
                    <div key={m.id} className="flex gap-4 items-start p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl">
                      <div className="bg-indigo-500 text-white p-2 rounded-lg mt-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">{m.title}</div>
                        <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">{m.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* News */}
            {news.length > 0 && (
              <section>
                <PressNewsSection news={news} />
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm text-center">
              <Avatar name={profile.name} avatarUrl={profile.profile?.avatar_url} size="lg" verified={!!profile.is_verified} />
              <h3 className="mt-4 font-extrabold text-gray-900 dark:text-white">{profile.name}</h3>
              {profile.profile?.designation && (
                <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-0.5">{profile.profile.designation}</p>
              )}
              {profile.profile?.years_of_experience && (
                <p className="text-xs text-gray-500 mt-1">{profile.profile.years_of_experience} years of experience</p>
              )}
              <button
                onClick={() => router.push('/profile')}
                className="mt-4 w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-xl font-semibold text-sm transition"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
