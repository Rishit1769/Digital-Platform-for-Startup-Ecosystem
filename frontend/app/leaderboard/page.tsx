'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/axios';

function LevelBadge({ level }: { level: number }) {
   const colors = ['bg-gray-100 text-gray-800', 'bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-purple-100 text-purple-800', 'bg-pink-100 text-pink-800', 'bg-yellow-100 text-yellow-800', 'bg-red-100 text-red-800'];
   const names = ['Newcomer', 'Explorer', 'Builder', 'Innovator', 'Founder', 'Visionary', 'Legend'];
   return (
       <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${colors[Math.min(level-1, 6)]}`}>
          Lvl {level} {names[Math.min(level-1, 6)]}
       </span>
   );
}

export default function LeaderboardPage() {
   const [tab, setTab] = useState<'students' | 'mentors' | 'startups'>('students');
   const [data, setData] = useState<any[]>([]);
   const [myRank, setMyRank] = useState(0);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
       setLoading(true);
       api.get(`/leaderboard/${tab}?limit=20`)
          .then(res => setData(res.data.data))
          .catch(console.error)
          .finally(() => setLoading(false));
   }, [tab]);

   useEffect(() => {
       api.get('/leaderboard/my-rank').then(res => setMyRank(res.data.rank)).catch(console.error);
   }, []);

   const renderList = () => {
      if (loading) return <div className="py-20 text-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div></div>;
      
      const top3 = data.slice(0, 3);
      const rest = data.slice(3);

      return (
         <div className="max-w-5xl mx-auto space-y-12">
            {/* Podium */}
            <div className="flex flex-col md:flex-row justify-center items-end gap-6 pt-10">
               {/* 2nd Place */}
               {top3[1] && (
                 <div className="flex flex-col items-center flex-1 order-2 md:order-1 transform translate-y-8">
                   <div className="text-4xl mb-2">🥈</div>
                   <img src={top3[1].avatar_url || top3[1].logo_url || 'https://via.placeholder.com/150'} className="w-20 h-20 rounded-full border-4 border-gray-200 shadow-lg object-cover" />
                   <div className="font-bold mt-3 text-lg dark:text-white truncate max-w-full">{top3[1].name}</div>
                   {tab !== 'startups' && <LevelBadge level={top3[1].level} />}
                   <div className="text-sm text-gray-500 mt-1 font-mono">{top3[1].total_xp || top3[1].score || 0} PTS</div>
                 </div>
               )}
               {/* 1st Place */}
               {top3[0] && (
                 <div className="flex flex-col items-center flex-1 order-1 md:order-2 z-10 scale-110">
                   <div className="text-5xl mb-2">👑</div>
                   <img src={top3[0].avatar_url || top3[0].logo_url || 'https://via.placeholder.com/150'} className="w-28 h-28 rounded-full border-4 border-yellow-400 shadow-2xl object-cover" />
                   <div className="font-extrabold mt-3 text-xl text-yellow-600 dark:text-yellow-400 truncate max-w-full">{top3[0].name}</div>
                   {tab !== 'startups' && <LevelBadge level={top3[0].level} />}
                   <div className="text-lg text-yellow-600 mt-1 font-mono font-bold animate-pulse">{top3[0].total_xp || top3[0].score || 0} PTS</div>
                 </div>
               )}
               {/* 3rd Place */}
               {top3[2] && (
                 <div className="flex flex-col items-center flex-1 order-3 transform translate-y-12">
                   <div className="text-4xl mb-2">🥉</div>
                   <img src={top3[2].avatar_url || top3[2].logo_url || 'https://via.placeholder.com/150'} className="w-16 h-16 rounded-full border-4 border-orange-300 shadow-lg object-cover" />
                   <div className="font-bold mt-3 text-base dark:text-white truncate max-w-full">{top3[2].name}</div>
                   {tab !== 'startups' && <LevelBadge level={top3[2].level} />}
                   <div className="text-sm text-gray-500 mt-1 font-mono">{top3[2].total_xp || top3[2].score || 0} PTS</div>
                 </div>
               )}
            </div>

            {/* Rest of the list */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
               {rest.map((user, idx) => (
                  <div key={user.user_id || user.id} className="flex items-center p-4 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-750 transition">
                     <div className="w-12 text-center font-bold text-gray-400 dark:text-gray-500 text-lg">#{idx + 4}</div>
                     <img src={user.avatar_url || user.logo_url || 'https://via.placeholder.com/150'} className="w-12 h-12 rounded-full object-cover shadow-sm mx-4" />
                     <div className="flex-1">
                        <div className="font-bold text-gray-900 dark:text-white text-lg">{user.name}</div>
                        {tab !== 'startups' && <LevelBadge level={user.level} />}
                        {tab === 'startups' && <span className="text-xs text-gray-400 uppercase tracking-wide">{user.domain}</span>}
                     </div>
                     <div className="text-right">
                        <div className="font-mono text-xl font-bold dark:text-white">{user.total_xp || user.score || 0}</div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">PTS</div>
                     </div>
                     {user.current_streak >= 3 && (
                        <div className="ml-4 flex items-center text-orange-500 font-bold" title={`${user.current_streak} day streak`}>
                           🔥 <span className="text-xs">{user.current_streak}</span>
                        </div>
                     )}
                  </div>
               ))}
               {rest.length === 0 && top3.length === 0 && (
                 <div className="p-10 text-center text-gray-500">No participants yet.</div>
               )}
            </div>
         </div>
      );
   };

   return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6">
         <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
               <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4 tracking-tight">Hall of Fame</h1>
               <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">Compete, collaborate, and consistently deliver to rise through the ranks. Top your category to gain exclusive benefits and visibility in the CloudCampus ecosystem.</p>
            </div>

            {/* Tabs */}
            <div className="flex justify-center mb-10">
               <div className="bg-white dark:bg-gray-800 p-1 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 flex gap-1">
                  {['students', 'mentors', 'startups'].map((t) => (
                     <button
                        key={t}
                        onClick={() => setTab(t as any)}
                        className={`px-6 py-2.5 rounded-full text-sm font-bold capitalize transition-all ${tab === t ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                     >
                        {t}
                     </button>
                  ))}
               </div>
            </div>

            {renderList()}

            {myRank > 0 && (
               <div className="max-w-5xl mx-auto mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-6 flex justify-between items-center shadow-inner">
                  <div>
                     <h3 className="font-bold text-blue-900 dark:text-blue-100 text-lg">Your Journey</h3>
                     <p className="text-blue-700 dark:text-blue-300 text-sm">Keep interacting to climb the ranks!</p>
                  </div>
                  <div className="text-right">
                     <span className="block text-2xl font-extrabold text-blue-600 dark:text-blue-400">#{myRank}</span>
                     <span className="text-xs uppercase font-bold text-blue-500 tracking-wider">Current Rank</span>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
}
