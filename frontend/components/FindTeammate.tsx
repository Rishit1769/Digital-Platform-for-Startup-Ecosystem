'use client';

import { useState } from 'react';
import { api } from '../lib/axios';
import Avatar from './Avatar';
import { useRouter } from 'next/navigation';

const F = {
  display: "font-[family-name:var(--font-playfair)]",
  space:   "font-[family-name:var(--font-space)]",
  serif:   "font-[family-name:var(--font-serif)]",
  bebas:   "font-[family-name:var(--font-bebas)]",
};

function parseJson(val: any): any[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') { try { return JSON.parse(val); } catch (e) {} }
  return [];
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

  return (
    <div>
      <button
        onClick={search}
        disabled={loading}
        className={`${F.space} px-6 py-2.5 bg-[#1C1C1C] text-white font-bold text-sm tracking-[0.05em] border-2 border-[#1C1C1C] hover:bg-[#333] transition disabled:opacity-50 flex items-center gap-2 mb-6`}
      >
        {loading ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent inline-block"></span> : null}
        Search Marketplace
      </button>

      {searched && !loading && users.length === 0 && (
        <div className={`${F.space} text-center py-10 text-[#888888] border-2 border-dashed border-[#1C1C1C] bg-[#F5F4F0]`}>
          No students found matching those skills.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((u: any) => {
          const userSkills = parseJson(u.skills).slice(0, 3);
          return (
            <div key={u.id} className="bg-white border-2 border-[#1C1C1C] p-5 flex flex-col items-center text-center">
              <Avatar name={u.name} avatarUrl={u.avatar_url} size="lg" verified={!!u.is_verified} />
              <h3 className={`${F.space} mt-3 font-bold text-[#1C1C1C]`}>{u.name}</h3>
              {u.college && <p className={`${F.space} text-xs text-[#888888] mt-0.5 truncate w-full`}>{u.college}</p>}
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {userSkills.map((s: string, i: number) => (
                  <span key={i} className={`${F.space} px-2 py-0.5 text-xs bg-[#F5F4F0] text-[#1C1C1C] border border-[#1C1C1C]`}>{s}</span>
                ))}
              </div>
              <button
                onClick={() => router.push(`/profile/${u.id}`)}
                className={`${F.space} mt-4 w-full py-2 bg-[#F5F4F0] border-2 border-[#1C1C1C] text-sm font-bold text-[#1C1C1C] hover:bg-[#F7941D] hover:text-white hover:border-[#F7941D] transition`}
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

  return (
    <div>
      <button
        onClick={search}
        disabled={loading}
        className={`${F.space} px-6 py-2.5 bg-[#003580] text-white font-bold text-sm tracking-[0.05em] border-2 border-[#1C1C1C] hover:bg-[#002a6a] transition disabled:opacity-50 flex items-center gap-2 mb-6`}
      >
        {loading ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent inline-block"></span> : null}
        Find with AI
      </button>

      {loading && (
        <div className={`${F.space} text-center py-12 border-2 border-[#003580] bg-white`}>
          <div className="animate-spin w-10 h-10 border-4 border-[#003580] border-t-transparent mx-auto mb-4"></div>
          <p className="text-[#003580] font-bold text-sm tracking-[0.1em] uppercase">Finding your ideal teammates...</p>
        </div>
      )}

      {!loading && error && (
        <div className={`${F.space} bg-white border-2 border-[#1C1C1C] p-5 text-center`}>
          <p className="font-bold text-[#1C1C1C]">AI Search Failed</p>
          <p className="text-sm mt-1 text-[#888888]">{error}</p>
        </div>
      )}

      {!loading && searched && !error && matches.length === 0 && (
        <div className={`${F.space} text-center py-10 text-[#888888] border-2 border-dashed border-[#1C1C1C]`}>
          No matches found. Complete your profile or add different skills.
        </div>
      )}

      <div className="space-y-4">
        {matches.map((m: any, idx: number) => {
          const d = m.student_details;
          if (!d) return null;
          const userSkills = parseJson(d.skills).slice(0, 4);
          return (
            <div key={idx} className="bg-white border-2 border-[#1C1C1C] p-5">
              <div className="flex items-start gap-4">
                <Avatar name={d.name} avatarUrl={d.avatar_url} size="md" />
                <div className="flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className={`${F.space} font-bold text-[#1C1C1C]`}>{d.name}</h3>
                    <span className={`${F.space} text-sm font-bold text-white bg-[#F7941D] px-3 py-0.5`}>
                      {m.compatibility_score}% match
                    </span>
                  </div>
                  {d.college && <p className={`${F.space} text-xs text-[#888888] mt-0.5`}>{d.college}</p>}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {userSkills.map((s: string, i: number) => (
                      <span key={i} className={`${F.space} px-2 py-0.5 text-xs bg-[#F5F4F0] text-[#1C1C1C] border border-[#1C1C1C]`}>{s}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className={`${F.space} text-[10px] font-bold tracking-[0.2em] uppercase text-[#F7941D] mb-1`}>Why they fit</p>
                  <ul className="space-y-1">
                    {(m.match_reasons || []).map((r: string, i: number) => (
                      <li key={i} className={`${F.space} text-xs text-[#444444] flex gap-1.5`}><span className="text-[#F7941D] mt-0.5">✓</span>{r}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className={`${F.space} text-[10px] font-bold tracking-[0.2em] uppercase text-[#F7941D] mb-1`}>Suggested collabs</p>
                  <div className="flex flex-wrap gap-1">
                    {(m.suggested_topics || []).map((t: string, i: number) => (
                      <span key={i} className={`${F.space} px-2 py-0.5 text-xs bg-[#F5F4F0] border border-[#1C1C1C] text-[#1C1C1C]`}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => router.push(`/profile/${d.student_id}`)}
                className={`${F.space} mt-4 w-full py-2 bg-[#F5F4F0] border-2 border-[#1C1C1C] text-sm font-bold text-[#1C1C1C] hover:bg-[#F7941D] hover:text-white hover:border-[#F7941D] transition`}
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
    <div className="bg-white border-2 border-[#1C1C1C] p-6">
      <div className="border-b-2 border-[#1C1C1C] pb-4 mb-6">
        <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-1`}>Collaboration</div>
        <h2 className={`${F.display} text-2xl font-bold text-[#1C1C1C]`}>Find a Teammate</h2>
        <p className={`${F.space} text-sm text-[#888888] mt-1`}>Find the right co-builder for your startup</p>
      </div>

      <div className="mb-6">
        <label className={`${F.space} block text-xs font-bold tracking-[0.15em] uppercase text-[#1C1C1C] mb-2`}>Skills needed in teammate</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. React, Python, UI Design..."
            className={`${F.space} flex-1 border-2 border-[#1C1C1C] bg-[#F5F4F0] px-4 py-2.5 text-sm text-[#1C1C1C] focus:outline-none focus:border-[#F7941D]`}
          />
          <button
            onClick={addSkill}
            className={`${F.space} px-4 py-2.5 bg-[#1C1C1C] text-white font-bold text-sm border-2 border-[#1C1C1C] hover:bg-[#333] transition`}
          >
            Add
          </button>
        </div>
        {skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {skills.map((s, i) => (
              <span key={i} className={`${F.space} inline-flex items-center gap-1 px-3 py-1 bg-[#F5F4F0] text-[#1C1C1C] border-2 border-[#1C1C1C] text-sm font-bold`}>
                {s}
                <button onClick={() => setSkills(skills.filter((_, idx) => idx !== i))} className="ml-1 hover:text-[#F7941D] font-bold leading-none">&times;</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="border-b-2 border-[#1C1C1C] mb-6">
        <div className="flex gap-0">
          <button
            onClick={() => setActiveTab('manual')}
            className={`${F.space} px-5 py-2.5 text-sm font-bold border-r-2 border-[#1C1C1C] transition ${activeTab === 'manual' ? 'bg-[#1C1C1C] text-white' : 'bg-white text-[#1C1C1C] hover:bg-[#F5F4F0]'}`}
          >
            Browse Marketplace
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`${F.space} px-5 py-2.5 text-sm font-bold transition ${activeTab === 'ai' ? 'bg-[#003580] text-white' : 'bg-white text-[#1C1C1C] hover:bg-[#F5F4F0]'}`}
          >
            AI-Powered Match
          </button>
        </div>
      </div>

      {activeTab === 'manual' ? (
        <ManualResults skills={skills} />
      ) : (
        <AITeammateResults skills={skills} />
      )}
    </div>
  );
}
