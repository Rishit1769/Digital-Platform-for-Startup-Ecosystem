'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/axios';
import confetti from 'canvas-confetti';

const levelNames = ['Newcomer', 'Explorer', 'Builder', 'Innovator', 'Founder', 'Visionary', 'Legend'];
const levelThresholds = [0, 200, 500, 1000, 2000, 4000, 8000];

export function XPBar({ gamification }: { gamification: any }) {
   if (!gamification) return null;

   const { level, total_xp } = gamification;
   const nextLimit = levelThresholds[level] || 8000;
   const prevLimit = levelThresholds[level - 1] || 0;
   
   const range = nextLimit - prevLimit;
   const passed = total_xp - prevLimit;
   const pct = level >= 7 ? 100 : Math.min(100, Math.max(0, (passed / range) * 100));

   return (
     <div className="relative group flex items-center">
       <div className="flex flex-col items-end">
          <div className="flex items-center gap-2 mb-1">
             <span className="text-xs font-bold text-gray-500 uppercase">Level {level} &mdash; {levelNames[Math.min(level-1, 6)]}</span>
          </div>
          <div className="w-32 h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
             <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000" style={{ width: `${pct}%` }}></div>
          </div>
       </div>

       {/* Tooltip */}
       <div className="absolute top-10 right-0 w-48 bg-gray-900 text-white text-xs rounded-xl p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          <div className="font-bold mb-1">{total_xp} / {level >= 7 ? 'Max' : nextLimit} XP</div>
          <div className="text-gray-400">{level >= 7 ? 'Highest level reached!' : `${nextLimit - total_xp} XP to Level ${level + 1}`}</div>
       </div>
     </div>
   );
}

export function StreakWidget({ gamification }: { gamification: any }) {
   if (!gamification) return null;
   const { current_streak, last_active_date } = gamification;
   
   const isToday = last_active_date && new Date(last_active_date).toISOString().split('T')[0] === new Date().toISOString().split('T')[0];

   return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
         <div className={`absolute top-[-20px] right-[-20px] w-24 h-24 rounded-full filter blur-xl opacity-20 transition duration-1000 ${isToday ? 'bg-orange-500' : 'bg-gray-500'}`}></div>
         
         <div className={`text-5xl mb-2 transition transform group-hover:scale-110 ${isToday ? 'text-orange-500' : 'text-gray-400 grayscale'}`}>
            🔥
         </div>
         <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">{current_streak}</h3>
         <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">Day Streak</p>
         
         {!isToday && (
            <p className="text-xs text-orange-600 font-bold bg-orange-50 mt-4 px-3 py-1 rounded-full animate-pulse">Action required to keep streak alive!</p>
         )}
      </div>
   );
}

const badgeDescriptions: Record<string, { icon: string, name: string, hint: string }> = {
   'first_idea': { icon: '💡', name: 'First Idea', hint: 'Post your first startup idea on the platform.' },
   'team_player': { icon: '🤝', name: 'Team Player', hint: 'Join at least 3 active startups as a member.' },
   'mentor_magnet': { icon: '🎓', name: 'Mentor Magnet', hint: 'Complete 5+ office hour or 1:1 mentor meetings.' },
   'streak_master': { icon: '🔥', name: 'Streak Master', hint: 'Log in for 7 consecutive days.' },
   'innovator': { icon: '🚀', name: 'Innovator', hint: 'Receive 10+ upvotes on your posted ideas.' },
   'connector': { icon: '🔗', name: 'Connector', hint: 'Invite and onboard 5+ members into your own startups.' },
   'ai_pioneer': { icon: '🤖', name: 'AI Pioneer', hint: 'Use the Gemini AI Pitch Deck Generator for your startup.' },
};

export function BadgesGrid({ badges }: { badges: string[] }) {
   if (!badges) return null;
   
   return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
         {Object.keys(badgeDescriptions).map(b => {
             const earned = badges.includes(b);
             const info = badgeDescriptions[b];
             return (
               <div key={b} className={`relative p-4 rounded-2xl border flex flex-col items-center text-center transition-all group ${earned ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 grayscale opacity-60'}`}>
                  <div className={`text-3xl mb-2 ${earned ? '' : 'opacity-40'}`}>{info.icon}</div>
                  <h4 className={`text-sm font-bold ${earned ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>{earned ? info.name : '???'}</h4>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 w-48 bg-gray-900 text-white text-xs rounded-lg p-2 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                     <div className="font-bold mb-1">{info.name}</div>
                     <div className="text-gray-300">{info.hint}</div>
                     <div className="mt-1 font-bold text-blue-400">{earned ? '✓ Unlocked' : 'Locked'}</div>
                  </div>
               </div>
             );
         })}
      </div>
   );
}
