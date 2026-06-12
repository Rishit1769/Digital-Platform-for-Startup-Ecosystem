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
          className={`${F.space} flex-1 min-w-[200px] border-2 border-[#1C1C1C] bg-[#F5F4F0] px-4 py-2.5 text-sm text-[#1C1C1C] focus:outline-none focus:border-[#F7941D]`}
        />
        <input
          type="text"
          value={domain}
          onChange={e => setDomain(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && searchMentors()}
          placeholder="Domain (e.g. AI/ML, FinTech)..."
          className={`${F.space} flex-1 min-w-[180px] border-2 border-[#1C1C1C] bg-[#F5F4F0] px-4 py-2.5 text-sm text-[#1C1C1C] focus:outline-none focus:border-[#F7941D]`}
        />
        <button
          onClick={searchMentors}
          disabled={loading}
          className={`${F.space} px-6 py-2.5 bg-[#1C1C1C] text-white font-bold text-sm border-2 border-[#1C1C1C] hover:bg-[#333] transition disabled:opacity-50 flex items-center gap-2`}
        >
          {loading ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent inline-block"></span> : null}
          Search
        </button>
      </div>

      {searched && !loading && mentors.length === 0 && (
        <div className={`${F.space} text-center py-10 text-[#888888] border-2 border-dashed border-[#1C1C1C]`}>
          No mentors found. Try different keywords.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {mentors.map((m: any) => {
          const expertise = parseJson(m.expertise).slice(0, 3);
          return (
            <div key={m.id} className="bg-white border-2 border-[#1C1C1C] p-5 flex items-start gap-4">
              <Avatar name={m.name} avatarUrl={m.avatar_url} size="md" verified={!!m.is_verified} />
              <div className="flex-1 min-w-0">
                <h3 className={`${F.space} font-bold text-[#1C1C1C] truncate`}>{m.name}</h3>
                {m.designation && m.company && (
                  <p className={`${F.space} text-xs text-[#888888] mt-0.5 truncate`}>{m.designation} at {m.company}</p>
                )}
                {m.years_of_experience && (
                  <p className={`${F.space} text-xs text-[#F7941D] font-bold mt-0.5`}>{m.years_of_experience} yrs experience</p>
                )}
                <div className="mt-2 flex flex-wrap gap-1">
                  {expertise.map((e: string, i: number) => (
                    <span key={i} className={`${F.space} text-xs px-2 py-0.5 bg-[#F5F4F0] text-[#1C1C1C] border border-[#1C1C1C]`}>{e}</span>
                  ))}
                </div>
                <button
                  onClick={() => router.push(`/profile/${m.id}`)}
                  className={`${F.space} mt-3 w-full py-1.5 text-xs bg-[#F5F4F0] border-2 border-[#1C1C1C] text-[#1C1C1C] font-bold hover:bg-[#F7941D] hover:text-white hover:border-[#F7941D] transition`}
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
          <p className={`${F.space} text-[#888888] mb-4 text-sm`}>AI will analyze your profile and skills to find the best mentor match for you.</p>
          <button
            onClick={fetchMatches}
            className={`${F.space} px-6 py-3 bg-[#003580] text-white font-bold text-sm border-2 border-[#1C1C1C] hover:bg-[#002a6a] transition mx-auto flex items-center gap-2`}
          >
            Get AI Recommendations
          </button>
        </div>
      ) : loading ? (
        <div className={`${F.space} text-center py-12 border-2 border-[#003580] bg-white`}>
          <div className="animate-spin w-10 h-10 border-4 border-[#003580] border-t-transparent mx-auto mb-4"></div>
          <p className="text-[#003580] font-bold text-sm tracking-[0.1em] uppercase">Finding ideal mentors for you...</p>
        </div>
      ) : error ? (
        <div className={`${F.space} bg-white border-2 border-[#1C1C1C] p-5 text-center`}>
          <p className="font-bold text-[#1C1C1C]">Recommendation Failed</p>
          <p className="text-sm mt-1 text-[#888888]">{error}</p>
          <button onClick={fetchMatches} className={`${F.space} mt-3 text-sm underline text-[#F7941D]`}>Try again</button>
        </div>
      ) : matches.length === 0 ? (
        <div className={`${F.space} text-center py-10 text-[#888888] border-2 border-dashed border-[#1C1C1C]`}>
          No suitable mentors found. Complete your profile for better matches.
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((m: any, idx: number) => {
            const d = m.mentor_details;
            if (!d) return null;
            const expertise = parseJson(d.expertise).slice(0, 4);
            return (
              <div key={idx} className="bg-white border-2 border-[#1C1C1C] p-5">
                <div className="flex items-start gap-4">
                  <Avatar name={d.name} avatarUrl={d.avatar_url} size="md" verified={!!d.is_verified} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className={`${F.space} font-bold text-[#1C1C1C]`}>{d.name}</h3>
                      <span className={`${F.space} text-sm font-bold text-white bg-[#F7941D] px-3 py-0.5`}>
                        {m.compatibility_score}% match
                      </span>
                    </div>
                    {d.designation && d.company && (
                      <p className={`${F.space} text-xs text-[#888888] mt-0.5`}>{d.designation} at {d.company}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {expertise.map((e: string, i: number) => (
                        <span key={i} className={`${F.space} text-xs px-2 py-0.5 bg-[#F5F4F0] text-[#1C1C1C] border border-[#1C1C1C]`}>{e}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className={`${F.space} text-[10px] font-bold tracking-[0.2em] uppercase text-[#F7941D] mb-1`}>Why this mentor</p>
                    <ul className="space-y-1">
                      {(m.match_reasons || []).map((r: string, i: number) => (
                        <li key={i} className={`${F.space} text-xs text-[#444444] flex gap-1.5`}><span className="text-[#F7941D] mt-0.5">✓</span>{r}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className={`${F.space} text-[10px] font-bold tracking-[0.2em] uppercase text-[#F7941D] mb-1`}>Discuss topics</p>
                    <div className="flex flex-wrap gap-1">
                      {(m.suggested_topics || []).map((t: string, i: number) => (
                        <span key={i} className={`${F.space} px-2 py-0.5 text-xs bg-[#F5F4F0] border border-[#1C1C1C] text-[#1C1C1C]`}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/profile/${d.mentor_id}`)}
                  className={`${F.space} mt-4 w-full py-2 bg-[#F5F4F0] border-2 border-[#1C1C1C] text-sm font-bold text-[#1C1C1C] hover:bg-[#F7941D] hover:text-white hover:border-[#F7941D] transition`}
                >
                  View Profile & Book Session
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function FindMentor() {
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual');

  return (
    <div className="bg-white border-2 border-[#1C1C1C] p-6">
      <div className="border-b-2 border-[#1C1C1C] pb-4 mb-6">
        <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-1`}>Guidance</div>
        <h2 className={`${F.display} text-2xl font-bold text-[#1C1C1C]`}>Find a Mentor</h2>
        <p className={`${F.space} text-sm text-[#888888] mt-1`}>Connect with experienced mentors in your domain</p>
      </div>

      <div className="border-b-2 border-[#1C1C1C] mb-6">
        <div className="flex gap-0">
          <button
            onClick={() => setActiveTab('manual')}
            className={`${F.space} px-5 py-2.5 text-sm font-bold border-r-2 border-[#1C1C1C] transition ${activeTab === 'manual' ? 'bg-[#1C1C1C] text-white' : 'bg-white text-[#1C1C1C] hover:bg-[#F5F4F0]'}`}
          >
            Browse Mentors
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`${F.space} px-5 py-2.5 text-sm font-bold transition ${activeTab === 'ai' ? 'bg-[#003580] text-white' : 'bg-white text-[#1C1C1C] hover:bg-[#F5F4F0]'}`}
          >
            AI Recommended
          </button>
        </div>
      </div>

      {activeTab === 'manual' ? <ManualMentors /> : <AIRecommendedMentors />}
    </div>
  );
}
