'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/axios';
import { use } from 'react';

export default function MentorImpact({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [data, setData] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const imRes = await api.get(`/analytics/mentor/${id}`);
      setData(imRes.data.data);
      const prRes = await api.get(`/profile/${id}`);
      setProfile(prRes.data.data);
    } catch(err) { console.error(err); } finally { setLoading(false); }
  };

  if(loading || !data || !profile) return <div className="p-10 text-center">Loading Mentor Impact...</div>;

  const score = data.impact_score;
  const badgeColor = score > 100 ? 'bg-yellow-400 text-yellow-900 shadow-yellow-400/50' : 
                     score > 50 ? 'bg-gray-300 text-gray-800 shadow-gray-300/50' : 
                     'bg-orange-300 text-orange-900 shadow-orange-300/50';
  
  const badgeName = score > 100 ? 'Gold' : score > 50 ? 'Silver' : 'Bronze';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-8">
      <div className="max-w-5xl mx-auto">
        
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 shadow flex flex-col md:flex-row gap-8 items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <div className={`w-32 h-32 rounded-full flex flex-col items-center justify-center shadow-lg border-4 border-white dark:border-gray-800 ${badgeColor}`}>
               <span className="text-3xl font-black">{score}</span>
               <span className="text-xs font-bold uppercase tracking-widest opacity-80 mt-1">{badgeName} Tier</span>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">{profile.name}'s Impact</h1>
              <p className="text-gray-500 font-medium">Measuring ecosystem contribution through mentorship.</p>
              
              <div className="flex gap-1 mt-3">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className={`w-5 h-5 ${i < Math.round(data.avg_peer_review_rating) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                ))}
              </div>
            </div>
          </div>
          
          <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow w-full md:w-auto transition" onClick={() => window.location.href='/office-hours'}>Book Office Hour</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
           <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border shadow-sm text-center border-gray-100 dark:border-gray-700">
             <div className="text-gray-500 text-xs font-bold uppercase mb-2">Total Mentees</div>
             <div className="text-3xl font-bold text-gray-900 dark:text-white">{data.total_mentees}</div>
           </div>
           <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border shadow-sm text-center border-gray-100 dark:border-gray-700">
             <div className="text-gray-500 text-xs font-bold uppercase mb-2">Meetings Done</div>
             <div className="text-3xl font-bold text-blue-600">{data.total_meetings_completed}</div>
           </div>
           <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border shadow-sm text-center border-gray-100 dark:border-gray-700">
             <div className="text-gray-500 text-xs font-bold uppercase mb-2">Office Hours</div>
             <div className="text-3xl font-bold text-purple-600">{data.total_office_hours_booked}</div>
           </div>
           <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border shadow-sm text-center border-gray-100 dark:border-gray-700">
             <div className="text-gray-500 text-xs font-bold uppercase mb-2">Avg Rating</div>
             <div className="text-3xl font-bold text-yellow-500">{data.avg_peer_review_rating}</div>
           </div>
        </div>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Startups Mentored</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
           {data.startups_mentored.length === 0 && <p className="text-gray-500">No startups mentored yet.</p>}
           {data.startups_mentored.map((s:any) => (
             <div key={s.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center text-center hover:shadow-md transition">
               <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                 {s.logo_url ? <img src={s.logo_url} className="w-full h-full object-cover" /> : <span className="text-xl font-bold text-gray-400">{s.name.charAt(0)}</span>}
               </div>
               <h4 className="font-bold text-gray-900 dark:text-white">{s.name}</h4>
               <span className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded mt-2">{s.domain}</span>
             </div>
           ))}
        </div>

      </div>
    </div>
  );
}
