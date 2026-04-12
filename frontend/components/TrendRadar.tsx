import React from 'react';
import SkeletonLoader from './SkeletonLoader';

interface TrendProps {
  name: string;
  growth_signal: string;
  why_trending: string;
  example_startups: string[];
}

export default function TrendRadar({ data, loading }: { data: TrendProps[], loading: boolean }) {
  if (loading) {
    return (
      <div className="w-full overflow-x-hidden">
        <div className="flex w-full gap-4 pb-4">
          <SkeletonLoader type="radar" count={3} />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) return <div className="text-gray-500 py-8 text-center">No trend data available right now.</div>;

  return (
    <div className="w-full relative">
      <div className="flex overflow-x-auto pb-6 -mx-2 px-2 snap-x hide-scrollbar">
        {data.map((item, i) => (
          <div key={i} className="snap-center shrink-0 w-80 mr-4 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-100 dark:border-gray-700/50 rounded-2xl shadow p-6 flex flex-col relative overflow-hidden transition hover:-translate-y-1 hover:shadow-lg">
            <div className={`absolute top-0 right-0 w-16 h-16 transform translate-x-8 -translate-y-8 rounded-full blur-2xl ${item.growth_signal?.toLowerCase() === 'high' ? 'bg-red-500/20' : 'bg-blue-500/20'}`}></div>
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight">{item.name}</h3>
              <span className={`px-2 py-1 text-xs font-bold rounded uppercase tracking-wider ${
                item.growth_signal?.toLowerCase() === 'high' 
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                {item.growth_signal}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 flex-grow relative z-10">
              {item.why_trending}
            </p>
            
            <div className="relative z-10">
              <div className="text-xs uppercase tracking-wider font-semibold text-gray-400 mb-2">Pioneers</div>
              <div className="flex flex-wrap gap-2">
                {item.example_startups?.map((s, j) => (
                  <span key={j} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-200 font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="text-right text-xs text-gray-400 font-medium tracking-wide">
        Powered by Gemini AI ✦
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
