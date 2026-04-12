'use client';

import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

const levelNames = ['Newcomer', 'Explorer', 'Builder', 'Innovator', 'Founder', 'Visionary', 'Legend'];

export default function LevelUpToast() {
  const [xpData, setXpData] = useState<any>(null);

  useEffect(() => {
    const handleLevelUp = (e: any) => {
      setXpData(e.detail);
      
      // Fire confetti
      const duration = 4000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#3B82F6', '#8B5CF6']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#3B82F6', '#8B5CF6']
        });

        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();

      // Auto dismiss
      setTimeout(() => setXpData(null), 5000);
    };

    window.addEventListener('levelUp', handleLevelUp);
    return () => window.removeEventListener('levelUp', handleLevelUp);
  }, []);

  if (!xpData) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
       <div className="bg-white dark:bg-gray-900 border-4 border-yellow-400 p-10 rounded-3xl shadow-2xl text-center transform scale-110 pointer-events-auto">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500 mb-2 drop-shadow-sm">You Leveled Up!</h2>
          <p className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
             Level {xpData.newLevel} &mdash; {levelNames[Math.min(xpData.newLevel - 1, 6)]}
          </p>
          
          {xpData.newBadges?.length > 0 && (
             <div className="mt-6 border-t border-gray-100 dark:border-gray-800 pt-6">
                <p className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-widest">New Badges Earned</p>
                <div className="flex justify-center gap-3">
                   {xpData.newBadges.map((b: string) => (
                      <span key={b} className="bg-yellow-50 text-yellow-800 font-bold px-3 py-1.5 rounded-xl border border-yellow-100">
                         {b.replace(/_/g, ' ')}
                      </span>
                   ))}
                </div>
             </div>
          )}
       </div>
    </div>
  );
}
