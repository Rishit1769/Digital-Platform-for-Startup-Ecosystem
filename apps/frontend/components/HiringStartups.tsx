'use client';

import { useState } from 'react';
import { api } from '../lib/axios';
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

const DOMAINS = ['All Domains', 'AI/ML', 'FinTech', 'EdTech', 'HealthTech', 'SaaS', 'E-Commerce', 'CleanTech', 'Other'];
const STAGES = ['All Stages', 'idea', 'mvp', 'seed', 'series-a', 'growth'];

const STAGE_LABELS: Record<string, string> = {
  idea: 'IDEA', mvp: 'MVP', seed: 'SEED', 'series-a': 'SERIES A', growth: 'GROWTH',
};

export default function HiringStartups() {
  const router = useRouter();
  const [startups, setStartups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [domain, setDomain] = useState('All Domains');
  const [stage, setStage] = useState('All Stages');

  const search = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (domain !== 'All Domains') params.set('domain', domain);
      if (stage !== 'All Stages') params.set('stage', stage);
      const res = await api.get(`/startups/hiring?${params.toString()}`);
      setStartups(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border-2 border-[#1C1C1C] p-6">
      <div className="border-b-2 border-[#1C1C1C] pb-4 mb-6">
        <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-1`}>Opportunities</div>
        <h2 className={`${F.display} text-2xl font-bold text-[#1C1C1C]`}>Hiring Startups</h2>
        <p className={`${F.space} text-sm text-[#888888] mt-1`}>Discover startups actively looking for team members</p>
      </div>

      <div className="flex flex-wrap gap-3 items-end mb-6">
        <div>
          <label className={`${F.space} text-xs font-bold tracking-[0.15em] uppercase text-[#1C1C1C] block mb-1.5`}>Domain</label>
          <select
            value={domain}
            onChange={e => setDomain(e.target.value)}
            className={`${F.space} border-2 border-[#1C1C1C] bg-[#F5F4F0] px-4 py-2.5 text-sm text-[#1C1C1C] focus:outline-none focus:border-[#F7941D]`}
          >
            {DOMAINS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className={`${F.space} text-xs font-bold tracking-[0.15em] uppercase text-[#1C1C1C] block mb-1.5`}>Stage</label>
          <select
            value={stage}
            onChange={e => setStage(e.target.value)}
            className={`${F.space} border-2 border-[#1C1C1C] bg-[#F5F4F0] px-4 py-2.5 text-sm text-[#1C1C1C] focus:outline-none focus:border-[#F7941D]`}
          >
            {STAGES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <button
          onClick={search}
          disabled={loading}
          className={`${F.space} px-6 py-2.5 bg-[#1C1C1C] text-white font-bold text-sm border-2 border-[#1C1C1C] hover:bg-[#333] transition disabled:opacity-50 flex items-center gap-2`}
        >
          {loading ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent inline-block"></span> : null}
          Search
        </button>
      </div>

      {searched && !loading && startups.length === 0 && (
        <div className={`${F.space} text-center py-10 text-[#888888] border-2 border-dashed border-[#1C1C1C] bg-[#F5F4F0]`}>
          No hiring startups found. Check back later or adjust your filters.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {startups.map((s: any) => {
          const openRoles = parseJson(s.open_roles).filter((r: any) => r && r.title);
          return (
            <div key={s.id} className="bg-[#F5F4F0] border-2 border-[#1C1C1C] p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  {s.logo_url ? (
                    <img src={s.logo_url} className="w-12 h-12 border-2 border-[#1C1C1C] object-cover" alt={s.name} />
                  ) : (
                    <div className="w-12 h-12 bg-[#1C1C1C] flex items-center justify-center text-white text-xl font-bold">
                      {s.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <div>
                    <h3 className={`${F.space} font-bold text-[#1C1C1C]`}>{s.name}</h3>
                    <p className={`${F.space} text-xs text-[#888888]`}>{s.domain}</p>
                  </div>
                </div>
                <span className={`${F.space} text-xs font-bold bg-[#F7941D] text-white px-2.5 py-1`}>{STAGE_LABELS[s.stage] || s.stage?.toUpperCase()}</span>
              </div>

              {s.tagline && (
                <p className={`${F.serif} mt-3 text-sm text-[#444444] line-clamp-2`}>{s.tagline}</p>
              )}

              {openRoles.length > 0 && (
                <div className="mt-4">
                  <p className={`${F.space} text-[10px] font-bold tracking-[0.2em] uppercase text-[#F7941D] mb-2`}>Open Roles ({openRoles.length})</p>
                  <div className="space-y-2">
                    {openRoles.slice(0, 3).map((role: any, i: number) => {
                      const roleSkills = parseJson(role.skills_required).slice(0, 3);
                      return (
                        <div key={i} className="flex items-center justify-between bg-white border-2 border-[#1C1C1C] px-3 py-2">
                          <span className={`${F.space} text-sm font-bold text-[#1C1C1C]`}>{role.title}</span>
                          <div className="flex gap-1">
                            {roleSkills.map((sk: string, j: number) => (
                              <span key={j} className={`${F.space} text-xs px-1.5 py-0.5 bg-[#F5F4F0] border border-[#1C1C1C] text-[#1C1C1C]`}>{sk}</span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {openRoles.length > 3 && (
                      <p className={`${F.space} text-xs text-[#888888] text-center`}>+{openRoles.length - 3} more roles</p>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={() => router.push(`/startups/${s.id}`)}
                className={`${F.space} mt-4 w-full py-2 bg-white border-2 border-[#1C1C1C] text-sm font-bold text-[#1C1C1C] hover:bg-[#F7941D] hover:text-white hover:border-[#F7941D] transition`}
              >
                View Startup
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
