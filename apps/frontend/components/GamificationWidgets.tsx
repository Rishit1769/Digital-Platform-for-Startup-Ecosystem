'use client';

const badgeDescriptions: Record<string, { icon: string, name: string, hint: string }> = {
   'first_idea': { icon: '🧠', name: 'Idea Spark', hint: 'Published your first idea concept.' },
   'team_player': { icon: '🫱‍🫲', name: 'Team Builder', hint: 'Actively collaborated with startup teammates.' },
   'mentor_magnet': { icon: '🧭', name: 'Mentor Connected', hint: 'Booked meaningful mentor guidance sessions.' },
   'streak_master': { icon: '⚡', name: 'Momentum', hint: 'Stayed consistently active over time.' },
   'innovator': { icon: '🚀', name: 'Innovation Driver', hint: 'Pushed ideas from concept toward execution.' },
   'connector': { icon: '🌐', name: 'Network Catalyst', hint: 'Expanded your ecosystem and connections.' },
   'ai_pioneer': { icon: '🛰️', name: 'AI Navigator', hint: 'Used AI tooling to improve startup decisions.' },
   'verified_founder': { icon: '🛡️', name: 'Verified Founder', hint: 'Identity and founder profile are verified.' },
   'verified_mentor': { icon: '🎯', name: 'Verified Mentor', hint: 'Mentor profile is reviewed and verified.' },
   'community_voice': { icon: '📣', name: 'Community Voice', hint: 'Actively contributed quality feedback.' },
   'execution_focus': { icon: '📌', name: 'Execution Focus', hint: 'Maintained progress on key startup milestones.' },
   'launch_ready': { icon: '🏁', name: 'Launch Ready', hint: 'Prepared startup profile for public showcase.' },
};

export function BadgesGrid({ badges }: { badges: string[] }) {
   if (!badges) return null;
   
   return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
         {Object.keys(badgeDescriptions).map(b => {
             const earned = badges.includes(b);
             const info = badgeDescriptions[b];
             return (
               <div key={b} className={`relative p-5 border-2 border-[#1C1C1C] flex flex-col items-center text-center transition-all group min-h-[130px] ${earned ? 'bg-white' : 'bg-[#E7E7E7] opacity-75'}`}>
                  <div className={`text-4xl mb-2 ${earned ? '' : 'opacity-35'}`}>{info.icon}</div>
                  <h4 className={`text-sm font-bold tracking-wide ${earned ? 'text-[#1C1C1C]' : 'text-[#8A8A8A]'}`}>{earned ? info.name : 'Locked Badge'}</h4>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 w-56 bg-[#1C1C1C] text-white text-xs p-2.5 border border-[#F7941D] shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                     <div className="font-bold mb-1">{info.name}</div>
                     <div className="text-white/75">{info.hint}</div>
                     <div className="mt-1 font-bold text-[#F7941D]">{earned ? 'Unlocked' : 'Locked'}</div>
                  </div>
               </div>
             );
         })}
      </div>
   );
}
