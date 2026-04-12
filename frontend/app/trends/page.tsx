'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/axios';
import { useAuth } from '../../lib/auth';

export default function TrendRadar() {
  const { user } = useAuth();
  
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAgo, setUpdatedAgo] = useState('Recently');
  
  // Pivot state
  const [myStartups, setMyStartups] = useState<any[]>([]);
  const [selectedStartup, setSelectedStartup] = useState<number | null>(null);
  const [pivots, setPivots] = useState<any[]>([]);
  const [pivotLoading, setPivotLoading] = useState(false);

  useEffect(() => {
    fetchTrends();
    if (user?.role === 'student') fetchMyStartups();
  }, [user]);

  const fetchTrends = async () => {
    try {
      const res = await api.get('/ai/trend-radar');
      setTrends(res.data.data);
      // setUpdatedAgo logic omitted for brevity
    } catch(err) { console.error(err); } finally { setLoading(false); }
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

  if (loading) return <div className="min-h-screen pt-20 text-center flex flex-col items-center"><div className="animate-spin w-12 h-12 border-b-2 border-purple-600 rounded-full mb-4"></div><p className="font-bold text-gray-500">Gemini is scanning market trends...</p></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-20">
      
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">

          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">Startup Trend Radar 2025</h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">AI-analyzed landscape of the fastest-growing sectors in the startup ecosystem.</p>
          
          <div className="absolute right-8 top-12">
            <button onClick={()=>{setLoading(true); fetchTrends();}} className="text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
          {trends.map((t, i) => (
             <div key={i} className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition group">
                <div className="flex justify-between items-start mb-4">
                   <div className="text-4xl">{t.emoji}</div>
                   {t.growth_signal === 'high' && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">HIGH</span>}
                   {t.growth_signal === 'medium' && <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">MEDIUM</span>}
                   {t.growth_signal === 'rising' && <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase animate-pulse">RISING</span>}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t.name}</h3>
                <div className="flex items-center gap-1 mb-3 text-orange-400">
                   {'★'.repeat(Math.round(t.opportunity_score/2))}{'☆'.repeat(5-Math.round(t.opportunity_score/2))} 
                   <span className="text-xs text-gray-400 ml-1">({t.opportunity_score}/10)</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 h-10 line-clamp-2">{t.why_trending}</p>
                
                <div className="mb-4">
                  <div className="text-xs font-bold text-gray-400 uppercase mb-2">Examples</div>
                  <div className="flex flex-wrap gap-1">
                    {t.example_startups.map((ex: string, idx: number) => <span key={idx} className="text-xs border px-2 py-0.5 rounded text-gray-600 dark:text-gray-400">{ex}</span>)}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase mb-2">Skills Needed</div>
                  <div className="flex flex-wrap gap-1">
                    {t.skills_needed.map((sk: string, idx: number) => <span key={idx} className="text-[10px] bg-blue-50 text-blue-600 dark:bg-blue-900/30 px-2 py-0.5 rounded font-bold uppercase">{sk}</span>)}
                  </div>
                </div>
             </div>
          ))}
        </div>

        {myStartups.length > 0 && (
          <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full filter blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
            
            <div className="relative z-10 md:w-2/3">
               <h2 className="text-3xl font-extrabold mb-4 flex items-center gap-3">
                 Strategic Pivot Analysis
               </h2>
               <p className="text-indigo-200 mb-8 max-w-xl text-lg">Compare your startup's core competencies against the trend radar to discover high-growth expansion opportunities.</p>
               
               <div className="flex flex-col sm:flex-row gap-4 mb-8">
                 <select onChange={e=>setSelectedStartup(parseInt(e.target.value))} value={selectedStartup || ''} className="bg-indigo-950/50 border border-indigo-500/30 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold backdrop-blur-sm">
                   {myStartups.map(s => <option key={s.id} value={s.id}>{s.name} ({s.domain})</option>)}
                 </select>
                 <button onClick={analyzePivot} disabled={pivotLoading} className="px-8 py-3 bg-white text-indigo-900 font-extrabold rounded-xl shadow-lg hover:bg-indigo-50 transition disabled:opacity-50">
                    {pivotLoading ? 'Running AI Engine...' : 'Analyze My Startup'}
                 </button>
               </div>
            </div>

            {pivots.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10 mt-8 pt-8 border-t border-indigo-500/30">
                {pivots.map((p, i) => (
                  <div key={i} className="bg-indigo-950/40 border border-indigo-500/30 p-6 rounded-2xl backdrop-blur-md">
                     <div className="flex justify-between items-center mb-3">
                       <h3 className="text-xl font-bold text-white">{p.pivot_to}</h3>
                       <div className="w-12 h-12 rounded-full border-4 border-indigo-500/50 flex items-center justify-center text-sm font-bold bg-indigo-900">
                         {p.skill_overlap_pct}%
                       </div>
                     </div>
                     <p className="text-sm text-indigo-200 leading-relaxed mb-4">{p.reason}</p>
                     <div className="text-xs font-bold text-indigo-300 uppercase tracking-widest flex justify-between items-center">
                        Skill Match
                        <span className="text-orange-400">Score: {p.opportunity_score}/10</span>
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
