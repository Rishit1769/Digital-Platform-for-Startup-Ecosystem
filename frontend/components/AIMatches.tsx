'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/axios';

export default function AIMatches({ isStudent }: { isStudent: boolean }) {
  const [matchType, setMatchType] = useState<'mentors' | 'cofounders'>('mentors');
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
     fetchMatches();
  }, [matchType]);

  const fetchMatches = async () => {
    if (!isStudent && matchType === 'mentors') return; // Mentors only for students or skip auth error
    setLoading(true);
    setError('');
    setMatches([]);
    
    try {
      const endpoint = matchType === 'mentors' ? '/ai/recommend-mentors' : '/ai/recommend-cofounders';
      const res = await api.get(endpoint);
      setMatches(res.data.data);
    } catch(err: any) {
      setError(err.response?.data?.error || 'AI generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
          <span>✨</span> AI Recommended Matches
        </h2>
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button onClick={()=>setMatchType('mentors')} className={`px-4 py-1.5 text-sm font-bold rounded-md transition ${matchType === 'mentors' ? 'bg-white dark:bg-gray-700 shadow text-blue-600' : 'text-gray-500'}`}>Mentors</button>
          <button onClick={()=>setMatchType('cofounders')} className={`px-4 py-1.5 text-sm font-bold rounded-md transition ${matchType === 'cofounders' ? 'bg-white dark:bg-gray-700 shadow text-purple-600' : 'text-gray-500'}`}>Co-founders</button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
           <p className="text-blue-600 font-bold animate-pulse">Gemini is analyzing your profile...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 text-center">
          <h3 className="font-bold">Error Loading AI Matches</h3>
          <p className="text-sm mt-1">{error}</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-10 text-gray-500">No proper matches found. Complete your profile.</div>
      ) : (
        <div className="space-y-6">

          {matches.map((m, i) => {
            const data = matchType === 'mentors' ? m.mentor_details : m.student_details;
            if (!data) return null;
            const targetId = matchType === 'mentors' ? data.mentor_id : data.student_id;
            
            return (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-6 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500"></div>
                
                <div className="md:w-1/4 flex flex-col items-center text-center border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-700 pb-6 md:pb-0 md:pr-6">
                   <div className="relative w-24 h-24 flex items-center justify-center mb-4">
                     <svg className="absolute w-full h-full transform -rotate-90">
                       <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-100 dark:text-gray-700" />
                       <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="276" strokeDashoffset={276 - (276 * m.compatibility_score) / 100} className="text-blue-600 drop-shadow-md" />
                     </svg>
                     <div className="text-xl font-extrabold text-gray-900 dark:text-white">{m.compatibility_score}%</div>
                   </div>
                   <h3 className="font-bold text-lg dark:text-white">{data.name}</h3>
                   <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1">{matchType === 'mentors' ? data.designation : 'Student'}</p>
                   {data.company && <p className="text-sm text-blue-600 font-medium mt-1">@ {data.company}</p>}
                   <button onClick={() => window.location.href=`/profile/${targetId}`} className="mt-4 px-6 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 rounded-lg text-sm font-bold w-full transition">View Profile</button>
                </div>
                
                <div className="flex-1 flex flex-col justify-center">
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    Why this match
                  </h4>
                  <ul className="space-y-2 mb-6">
                    {m.match_reasons.map((r: string, idx: number) => (
                      <li key={idx} className="flex gap-2 text-gray-700 dark:text-gray-300">
                         <span className="text-blue-500 mt-1">•</span>
                         <span>{r}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 rounded-xl">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Suggested Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {m.suggested_topics.map((t: string, idx: number) => (
                         <span key={idx} className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-3 py-1 rounded text-sm font-medium text-gray-600 dark:text-gray-300">{t}</span>
                      ))}
                    </div>
                  </div>
                  
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
