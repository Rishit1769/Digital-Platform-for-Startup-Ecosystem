import React from 'react';

export default function SkillHeatmap({ data }: { data: { skill: string, count: number }[] }) {
  if (!data || data.length === 0) return <div className="text-gray-500">No skill gaps data available.</div>;

  const getTagColor = (count: number) => {
    if (count < 5) return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50';
    if (count <= 15) return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/50';
    return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50';
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 md:gap-3 p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
        <div className="absolute opacity-5 right-0 bottom-0 pointer-events-none transform translate-x-1/4 translate-y-1/4">
          <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 22h20L12 2zm0 3.5l7.5 15h-15L12 5.5z"/>
          </svg>
        </div>
        
        {data.map((item, i) => (
          <div
            key={i}
            title={`${item.count} users have this skill`}
            className={`group relative cursor-help px-4 py-2 border rounded-xl text-sm font-semibold transition-all hover:scale-105 shadow-sm ${getTagColor(item.count)}`}
          >
            {item.skill}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block px-2 py-1 bg-gray-900 text-white text-xs rounded z-10 whitespace-nowrap">
              {item.count} user{item.count !== 1 ? 's' : ''}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400"></span> <span className="text-gray-600 dark:text-gray-300">Scarce (&lt;5)</span></div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-400"></span> <span className="text-gray-600 dark:text-gray-300">Medium (5-15)</span></div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-400"></span> <span className="text-gray-600 dark:text-gray-300">Common (&gt;15)</span></div>
        </div>
        <div className="text-blue-600 dark:text-blue-400 font-medium">These skills are scarce — consider learning them!</div>
      </div>
    </div>
  );
}
