'use client';

import { useState } from 'react';
import { api } from '../lib/axios';
import Avatar from './Avatar';
import { useRouter } from 'next/navigation';

function SkillTag({ skill, onRemove }: { skill: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-full text-sm font-medium">
      {skill}
      <button onClick={onRemove} className="ml-1 hover:text-red-500 transition font-bold leading-none">&times;</button>
    </span>
  );
}

function ManualResults({ skills }: { skills: string[] }) {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({ role: 'student', limit: '20' });
      if (skills.length > 0) params.set('skills', skills.join(','));
      const res = await api.get(`/discover/users?${params.toString()}`);
      setUsers(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const parseJson = (val: any) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') { try { return JSON.parse(val); } catch (e) {} }
    return [];
  };

  return (
    <div>
      <button
        onClick={search}
        disabled={loading}
        className="mb-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition disabled:opacity-50 flex items-center gap-2"
      >
        {loading ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block"></span> : '🔍'}
        Search Marketplace
      </button>

      {searched && !loading && users.length === 0 && (
        <div className="text-center py-10 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          No students found matching those skills. Try different skills.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((u: any) => {
          const userSkills = parseJson(u.skills).slice(0, 3);
          return (
            <div key={u.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex flex-col items-center text-center shadow-sm hover:shadow-md transition">
              <Avatar name={u.name} avatarUrl={u.avatar_url} size="lg" verified={!!u.is_verified} />
              <h3 className="mt-3 font-bold text-gray-900 dark:text-white">{u.name}</h3>
              {u.college && <p className="text-xs text-gray-500 mt-0.5 truncate w-full">{u.college}</p>}
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {userSkills.map((s: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-md">{s}</span>
                ))}
              </div>
              <button
                onClick={() => router.push(`/profile/${u.id}`)}
                className="mt-4 w-full py-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 transition"
              >
                View Profile
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AITeammateResults({ skills }: { skills: string[] }) {
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const search = async () => {
    setLoading(true);
    setSearched(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (skills.length > 0) params.set('skills', skills.join(','));
      const res = await api.get(`/ai/recommend-teammates?${params.toString()}`);
      setMatches(res.data.data || []);
    } catch (e: any) {
      setError(e.response?.data?.error || 'AI search failed. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  const parseJson = (val: any) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') { try { return JSON.parse(val); } catch (e) {} }
    return [];
  };

  return (
    <div>
      <button
        onClick={search}
        disabled={loading}
        className="mb-6 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold transition disabled:opacity-50 flex items-center gap-2"
      >
        {loading ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block"></span> : '✨'}
        Find with AI
      </button>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 bg-purple-50 dark:bg-purple-900/10 rounded-3xl border border-purple-100 dark:border-purple-900/30">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-purple-600 font-bold animate-pulse">Gemini is finding your ideal teammates...</p>
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 text-red-600 p-5 rounded-2xl border border-red-100 text-center">
          <p className="font-bold">AI Search Failed</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {!loading && searched && !error && matches.length === 0 && (
        <div className="text-center py-10 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          No matches found. Complete your profile or add different skills.
        </div>
      )}

      <div className="space-y-4">
        {matches.map((m: any, idx: number) => {
          const d = m.student_details;
          if (!d) return null;
          const userSkills = parseJson(d.skills).slice(0, 4);
          return (
            <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-start gap-4">
                <Avatar name={d.name} avatarUrl={d.avatar_url} size="md" />
                <div className="flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="font-bold text-gray-900 dark:text-white">{d.name}</h3>
                    <span className="text-sm font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-300 px-3 py-0.5 rounded-full">
                      {m.compatibility_score}% match
                    </span>
                  </div>
                  {d.college && <p className="text-xs text-gray-500 mt-0.5">{d.college}</p>}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {userSkills.map((s: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-md">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Why they fit</p>
                  <ul className="space-y-1">
                    {(m.match_reasons || []).map((r: string, i: number) => (
                      <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex gap-1.5"><span className="text-green-500 mt-0.5">✓</span>{r}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Suggested collabs</p>
                  <div className="flex flex-wrap gap-1">
                    {(m.suggested_topics || []).map((t: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => router.push(`/profile/${d.student_id}`)}
                className="mt-4 w-full py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-xl font-medium transition text-sm"
              >
                View Profile
              </button>
            </div>
          );
        })}
      </div>
      {matches.length > 0 && (
        <p className="text-xs text-center text-gray-400 mt-4">✨ Powered by Gemini AI</p>
      )}
    </div>
  );
}

export default function FindTeammate() {
  const [skills, setSkills] = useState<string[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual');

  const addSkill = () => {
    const trimmed = inputVal.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-xl">🤝</div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Find a Teammate</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Find the right co-builder for your startup</p>
        </div>
      </div>

      {/* Skill input */}
      <div className="mt-5">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Skills needed in your teammate</label>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. React, Python, UI Design..."
            className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addSkill}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
          >
            Add
          </button>
        </div>
        {skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {skills.map((s, i) => (
              <SkillTag key={i} skill={s} onRemove={() => setSkills(skills.filter((_, idx) => idx !== i))} />
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('manual')}
            className={`pb-3 text-sm font-bold border-b-2 transition ${activeTab === 'manual' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            🏪 Browse Marketplace
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-1.5 ${activeTab === 'ai' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            ✨ AI-Powered Match
          </button>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === 'manual' ? (
          <ManualResults skills={skills} />
        ) : (
          <AITeammateResults skills={skills} />
        )}
      </div>
    </div>
  );
}
