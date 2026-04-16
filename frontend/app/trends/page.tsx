'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/axios';
import { useAuth } from '../../lib/auth';

const F = {
  display: 'font-[family-name:var(--font-playfair)]',
  space: 'font-[family-name:var(--font-space)]',
  serif: 'font-[family-name:var(--font-serif)]',
  bebas: 'font-[family-name:var(--font-bebas)]',
};

type PublicStats = {
  founders: number;
  startups: number;
  ideas: number;
  funding: number;
};

function formatCurrencyShort(value: number) {
  if (!Number.isFinite(value)) return '0';
  if (value >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return `${Math.round(value)}`;
}

export default function TrendRadar() {
  const { user } = useAuth();
  
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PublicStats | null>(null);
  
  // Pivot state
  const [myStartups, setMyStartups] = useState<any[]>([]);
  const [selectedStartup, setSelectedStartup] = useState<number | null>(null);
  const [pivots, setPivots] = useState<any[]>([]);
  const [pivotLoading, setPivotLoading] = useState(false);

  useEffect(() => {
    fetchTrends();
    fetchStats();
    if (user?.role === 'student') fetchMyStartups();
  }, [user]);

  const fetchTrends = async () => {
    try {
      const res = await api.get('/ai/trend-radar');
      setTrends(res.data.data);
    } catch(err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/public/stats');
      setStats(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyStartups = async () => {
     try {
       const res = await api.get('/startups');
       // Assuming /startups lists all, but usually we filter by created_by or member
       const mine = res.data.data.filter((s:any) => s.my_role === 'founder' || s.my_role === 'member');
       setMyStartups(mine);
       if (mine.length > 0) setSelectedStartup(mine[0].id);
     } catch(err) {}
  };

  const analyzePivot = async () => {
    if (!selectedStartup) return;
    setPivotLoading(true);
    setPivots([]);
    try {
      const res = await api.post('/ai/trend-radar/suggest-pivot', { startup_id: selectedStartup });
      setPivots(res.data.data);
    } catch(err: any) { alert(err.response?.data?.error || 'Analysis failed'); } finally { setPivotLoading(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F4F0] pt-24 px-6 lg:px-14">
        <div className="max-w-[1440px] mx-auto border-2 border-[#1C1C1C] bg-[#FFFFFF] min-h-[420px] flex flex-col items-center justify-center text-center p-8">
          <div className="w-12 h-12 border-2 border-[#1C1C1C] border-t-[#F7941D] animate-spin mb-5" />
          <p className={`${F.space} text-[12px] tracking-[0.2em] uppercase text-[#777777]`}>AI engine is scanning market signals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F4F0] pt-20 pb-20">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-14">
        <div className="border-2 border-[#1C1C1C] bg-[#FFFFFF]">
          <div className="grid grid-cols-12">
            <div className="col-span-12 lg:col-span-8 border-b-2 lg:border-b-0 lg:border-r-2 border-[#1C1C1C] bg-[#1C1C1C] relative overflow-hidden p-8 lg:p-10 min-h-[320px]">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg,transparent,transparent 59px,rgba(255,255,255,0.04) 59px,rgba(255,255,255,0.04) 60px),repeating-linear-gradient(90deg,transparent,transparent 59px,rgba(255,255,255,0.04) 59px,rgba(255,255,255,0.04) 60px)',
                }}
              />
              <div className={`${F.bebas} absolute right-6 top-3 text-white opacity-[0.08]`} style={{ fontSize: '6rem', lineHeight: 1 }}>2026</div>

              <div className="relative z-10 max-w-2xl">
                <div className={`${F.space} text-[11px] tracking-[0.25em] uppercase text-[#F7941D] mb-4`}>Trend Radar</div>
                <h1 className={`${F.display} italic font-black text-white leading-[0.9] mb-6`} style={{ fontSize: 'clamp(38px, 5vw, 72px)' }}>
                  Where founders
                  <br />
                  should move next.
                </h1>
                <p className={`${F.serif} text-white/65 text-[16px] leading-[1.8]`}>
                  Live AI trend intelligence from ecosystem activity, startup momentum, and opportunity signals across high-growth verticals.
                </p>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 bg-[#F5F4F0] p-8 lg:p-10 flex flex-col justify-between">
              <div>
                <div className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#777777] mb-4`}>Live Ecosystem Pulse</div>
                <div className="space-y-4 border-y-2 border-[#1C1C1C] py-5">
                  {([
                    [stats ? `${stats.startups}` : '-', 'Startups Active'],
                    [stats ? `${stats.ideas}` : '-', 'Ideas Pitched'],
                    [stats ? `INR ${formatCurrencyShort(stats.funding)}` : '-', 'Funding Raised'],
                  ] as [string, string][]).map(([value, label]) => (
                    <div key={label}>
                      <div className={`${F.bebas} text-[2.4rem] leading-none text-[#F7941D]`}>{value}</div>
                      <div className={`${F.space} text-[10px] tracking-[0.18em] uppercase text-[#666666] mt-0.5`}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setLoading(true);
                  fetchTrends();
                  fetchStats();
                }}
                className={`${F.space} mt-8 text-[12px] font-bold tracking-[0.1em] uppercase border-2 border-[#1C1C1C] px-4 py-3 hover:bg-[#1C1C1C] hover:text-white transition-colors`}
              >
                Refresh Report
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 border-2 border-[#1C1C1C] bg-[#FFFFFF]">
          <div className="px-6 lg:px-10 py-6 border-b-2 border-[#1C1C1C] flex items-center justify-between gap-6 flex-wrap">
            <div>
              <div className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#F7941D] mb-1`}>AI Ranked Sectors</div>
              <h2 className={`${F.space} font-bold text-[#1C1C1C] text-[24px]`}>Top opportunities this cycle</h2>
            </div>
            <div className={`${F.space} text-[11px] tracking-[0.2em] uppercase text-[#777777]`}>{trends.length} sectors tracked</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-0">
          {trends.map((t, i) => (
             <div key={i} className="p-6 lg:p-7 border-b-2 border-[#1C1C1C] md:[&:nth-child(odd)]:border-r-0 md:[&:nth-child(even)]:border-l-2 xl:[&:nth-child(3n+2)]:border-x-2 xl:[&:nth-child(3n+1)]:border-l-0 xl:[&:nth-child(3n)]:border-r-0">
                <div className="flex justify-between items-start mb-4">
                   <div className="text-4xl">{t.emoji}</div>
                   <span className={`${F.space} text-[10px] font-bold px-2.5 py-1 uppercase tracking-[0.15em] ${
                     t.growth_signal === 'high'
                       ? 'bg-[#DDF5E5] text-[#146C3B]'
                       : t.growth_signal === 'medium'
                       ? 'bg-[#FFF1D8] text-[#A56300]'
                       : 'bg-[#E8EDF7] text-[#003580]'
                   }`}>
                     {String(t.growth_signal || 'stable')}
                   </span>
                </div>

                <h3 className={`${F.space} text-xl font-bold text-[#1C1C1C] mb-2`}>{t.name}</h3>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-[6px] w-full bg-[#E6E6E6]">
                    <div className="h-full bg-[#1C1C1C]" style={{ width: `${Math.min(100, ((t.opportunity_score || 0) / 10) * 100)}%` }} />
                  </div>
                  <div className={`${F.bebas} text-[1.8rem] leading-none text-[#F7941D] min-w-[2.2rem] text-right`}>{t.opportunity_score || 0}</div>
                </div>

                <p className={`${F.serif} text-[15px] leading-[1.6] text-[#555555] mb-5 min-h-[68px]`}>{t.why_trending}</p>
                
                <div className="mb-4">
                  <div className={`${F.space} text-[10px] font-bold text-[#777777] tracking-[0.15em] uppercase mb-2`}>Examples</div>
                  <div className="flex flex-wrap gap-1">
                    {(t.example_startups || []).map((ex: string, idx: number) => (
                      <span key={idx} className={`${F.space} text-[10px] border border-[#1C1C1C] px-2 py-0.5 text-[#444444]`}>
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className={`${F.space} text-[10px] font-bold text-[#777777] tracking-[0.15em] uppercase mb-2`}>Skills Needed</div>
                  <div className="flex flex-wrap gap-1">
                    {(t.skills_needed || []).map((sk: string, idx: number) => (
                      <span key={idx} className={`${F.space} text-[10px] bg-[#F7941D]/10 text-[#C36A00] px-2 py-0.5 font-bold uppercase`}>
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
             </div>
          ))}
        </div>
        </div>

        {myStartups.length > 0 && (
          <div className="mt-8 border-2 border-[#1C1C1C] bg-[#003580] text-white p-8 md:p-10 relative overflow-hidden">
            <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(255,255,255,0.05) 39px,rgba(255,255,255,0.05) 40px)' }} />
            
            <div className="relative z-10 md:w-2/3">
               <h2 className={`${F.space} text-3xl font-bold mb-4 flex items-center gap-3`}>
                 Strategic Pivot Analysis
               </h2>
               <p className={`${F.serif} text-white/75 mb-8 max-w-xl text-[17px] leading-[1.7]`}>Compare your startup's core strengths with this radar and discover expansion moves that match your current team capability.</p>
               
               <div className="flex flex-col sm:flex-row gap-4 mb-8">
                 <select onChange={e=>setSelectedStartup(parseInt(e.target.value, 10))} value={selectedStartup || ''} className={`${F.space} bg-[#002a66] border-2 border-white/35 text-white px-4 py-3 focus:outline-none focus:border-[#F7941D]`}>
                   {myStartups.map(s => <option key={s.id} value={s.id}>{s.name} ({s.domain})</option>)}
                 </select>
                 <button onClick={analyzePivot} disabled={pivotLoading} className={`${F.space} px-8 py-3 bg-[#F7941D] text-white font-bold tracking-[0.08em] uppercase hover:bg-[#1C1C1C] transition-colors disabled:opacity-50`}>
                    {pivotLoading ? 'Running AI Engine...' : 'Analyze My Startup'}
                 </button>
               </div>
            </div>

            {pivots.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 relative z-10 mt-8 pt-8 border-t border-white/20">
                {pivots.map((p, i) => (
                  <div key={i} className="bg-[#01255c] border-2 border-white/20 p-6">
                     <div className="flex justify-between items-center mb-3">
                       <h3 className={`${F.space} text-xl font-bold text-white`}>{p.pivot_to}</h3>
                       <div className={`${F.space} w-12 h-12 border-2 border-white/30 flex items-center justify-center text-sm font-bold bg-[#003580]`}>
                         {p.skill_overlap_pct}%
                       </div>
                     </div>
                     <p className={`${F.serif} text-sm text-white/75 leading-relaxed mb-4`}>{p.reason}</p>
                     <div className={`${F.space} text-[10px] font-bold text-white/70 uppercase tracking-[0.14em] flex justify-between items-center`}>
                        Skill Match
                        <span className="text-[#F7941D]">Score: {p.opportunity_score}/10</span>
                     </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
