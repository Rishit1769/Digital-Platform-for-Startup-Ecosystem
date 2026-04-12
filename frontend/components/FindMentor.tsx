'use client';

import { useState } from 'react';
import { api } from '../lib/axios';
import Avatar from './Avatar';
import { useRouter } from 'next/navigation';

function parseJson(val: any): any[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') { try { return JSON.parse(val); } catch (e) {} }
  return [];
}

function ManualMentors() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [domain, setDomain] = useState('');
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const searchMentors = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({ role: 'mentor', limit: '20' });
      if (search.trim()) params.set('search', search.trim());
      if (domain.trim()) params.set('domains', domain.trim());
      const res = await api.get(`/discover/users?${params.toString()}`);
      setMentors(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && searchMentors()}
          placeholder="Search by name or keyword..."
          className="flex-1 min-w-[200px] px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="text"
          value={domain}
          onChange={e => setDomain(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && searchMentors()}
          placeholder="Domain (e.g. AI/ML, FinTech)..."
          className="flex-1 min-w-[180px] px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={searchMentors}
          disabled={loading}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block"></span> : '🔍'}
          Search
        </button>
      </div>

      {searched && !loading && mentors.length === 0 && (
        <div className="text-center py-10 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          No mentors found. Try different keywords.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {mentors.map((m: any) => {
          const expertise = parseJson(m.expertise).slice(0, 3);
          return (
            <div key={m.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition">
              <Avatar name={m.name} avatarUrl={m.avatar_url} size="md" verified={!!m.is_verified} />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 dark:text-white truncate">{m.name}</h3>
                {m.designation && m.company && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{m.designation} at {m.company}</p>
                )}
                {m.years_of_experience && (
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">{m.years_of_experience} yrs experience</p>
                )}
                <div className="mt-2 flex flex-wrap gap-1">
                  {expertise.map((e: string, i: number) => (
                    <span key={i} className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-md">{e}</span>
                  ))}
                </div>
                <button
                  onClick={() => router.push(`/profile/${m.id}`)}
                  className="mt-3 w-full py-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-lg font-medium transition"
                >
                  View Profile & Book Session
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AIRecommendedMentors() {
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetched, setFetched] = useState(false);

  const fetchMatches = async () => {
    setLoading(true);
    setError('');
    setFetched(true);
    try {
      const res = await api.get('/ai/recommend-mentors');
      setMatches(res.data.data || []);
    } catch (e: any) {
      setError(e.response?.data?.error || 'AI recommendation failed. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {!fetched ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">Gemini AI will analyze your profile and skills to find the best mentor match for you.</p>
          <button
            onClick={fetchMatches}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold transition flex items-center gap-2 mx-auto"
          >
            ✨ Get AI Recommendations
          </button>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-900/30">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-indigo-600 font-bold animate-pulse">Gemini is finding ideal mentors for you...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-5 rounded-2xl border border-red-100 text-center">
          <p className="font-bold">Recommendation Failed</p>
          <p className="text-sm mt-1">{error}</p>
          <button onClick={fetchMatches} className="mt-3 text-sm underline">Try again</button>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-10 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          No suitable mentors found. Complete your profile for better matches.
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((m: any, idx: number) => {
            const d = m.mentor_details;
            if (!d) return null;
            const expertise = parseJson(d.expertise).slice(0, 4);
            return (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition">
                <div className="flex items-start gap-4">
                  <Avatar name={d.name} avatarUrl={d.avatar_url} size="md" verified={!!d.is_verified} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="font-bold text-gray-900 dark:text-white">{d.name}</h3>
                      <span className="text-sm font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-300 px-3 py-0.5 rounded-full">
                        {m.compatibility_score}% match
                      </span>
                    </div>
                    {d.designation && d.company && (
                      <p className="text-xs text-gray-500 mt-0.5">{d.designation} at {d.company}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {expertise.map((e: string, i: number) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-md">{e}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Why this mentor</p>
                    <ul className="space-y-1">
                      {(m.match_reasons || []).map((r: string, i: number) => (
                        <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex gap-1.5"><span className="text-green-500 mt-0.5">✓</span>{r}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Discuss topics</p>
                    <div className="flex flex-wrap gap-1">
                      {(m.suggested_topics || []).map((t: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/profile/${d.mentor_id}`)}
                  className="mt-4 w-full py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-xl font-medium transition text-sm"
                >
                  View Profile & Book Session
                </button>
              </div>
            );
          })}
          <p className="text-xs text-center text-gray-400 mt-4">✨ Powered by Gemini AI</p>
        </div>
      )}
    </div>
  );
}

export default function FindMentor() {
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-xl">🎓</div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Find a Mentor</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Connect with experienced mentors who can guide your journey</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-5 border-b border-gray-100 dark:border-gray-700">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('manual')}
            className={`pb-3 text-sm font-bold border-b-2 transition ${activeTab === 'manual' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            🗂️ Browse Mentors
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-1.5 ${activeTab === 'ai' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            ✨ AI Recommended
          </button>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === 'manual' ? <ManualMentors /> : <AIRecommendedMentors />}
      </div>
    </div>
  );
}
