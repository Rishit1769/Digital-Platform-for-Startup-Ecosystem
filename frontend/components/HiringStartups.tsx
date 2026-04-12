'use client';

import { useState } from 'react';
import { api } from '../lib/axios';
import { useRouter } from 'next/navigation';

function parseJson(val: any): any[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') { try { return JSON.parse(val); } catch (e) {} }
  return [];
}

const DOMAINS = ['All Domains', 'AI/ML', 'FinTech', 'EdTech', 'HealthTech', 'SaaS', 'E-Commerce', 'CleanTech', 'Other'];
const STAGES = ['All Stages', 'idea', 'mvp', 'seed', 'series-a', 'growth'];

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

  const STAGE_COLORS: Record<string, string> = {
    idea: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    mvp: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    seed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    'series-a': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    growth: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-xl">🚀</div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Find a Startup</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Discover startups actively looking for team members</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-5 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Domain</label>
          <select
            value={domain}
            onChange={e => setDomain(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {DOMAINS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Stage</label>
          <select
            value={stage}
            onChange={e => setStage(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {STAGES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <button
          onClick={search}
          disabled={loading}
          className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block"></span> : '🔍'}
          Search Hiring Startups
        </button>
      </div>

      {/* Results */}
      <div className="mt-6">
        {searched && !loading && startups.length === 0 && (
          <div className="text-center py-10 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            No hiring startups found. Check back later or adjust your filters.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {startups.map((s: any) => {
            const openRoles = parseJson(s.open_roles).filter((r: any) => r && r.title);
            const stageClass = STAGE_COLORS[s.stage] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
            return (
              <div key={s.id} className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {s.logo_url ? (
                      <img src={s.logo_url} className="w-12 h-12 rounded-xl object-cover" alt={s.name} />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-tr from-green-500 to-teal-400 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-sm">
                        {s.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{s.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{s.domain}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${stageClass}`}>{s.stage}</span>
                </div>

                {s.tagline && (
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{s.tagline}</p>
                )}

                {openRoles.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Open Roles ({openRoles.length})</p>
                    <div className="space-y-2">
                      {openRoles.slice(0, 3).map((role: any, i: number) => {
                        const roleSkills = parseJson(role.skills_required).slice(0, 3);
                        return (
                          <div key={i} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl px-3 py-2 border border-gray-100 dark:border-gray-700">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{role.title}</span>
                            <div className="flex gap-1">
                              {roleSkills.map((sk: string, j: number) => (
                                <span key={j} className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 rounded">{sk}</span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      {openRoles.length > 3 && (
                        <p className="text-xs text-gray-400 text-center">+{openRoles.length - 3} more roles</p>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => router.push(`/startups/${s.id}`)}
                  className="mt-4 w-full py-2 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-700 dark:text-green-300 rounded-xl font-medium text-sm transition"
                >
                  View Startup & Apply
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
