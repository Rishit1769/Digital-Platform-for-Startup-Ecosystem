'use client';

import { useRouter } from 'next/navigation';

const CATEGORY_COLORS: Record<string, string> = {
  announcement: 'bg-blue-700',
  event: 'bg-purple-700',
  opportunity: 'bg-green-700',
  update: 'bg-orange-700',
  general: 'bg-gray-700',
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
}

function NewsCard({ item, large = false }: { item: any; large?: boolean }) {
  const catColor = CATEGORY_COLORS[item.category] || 'bg-gray-700';

  return (
    <div className={`group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-shadow flex flex-col ${large ? '' : ''}`}>
      {/* Image area */}
      <div className={`relative overflow-hidden ${large ? 'h-56' : 'h-44'} bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600`}>
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900/40 dark:to-indigo-800/40">
            <span className="text-5xl opacity-30">📰</span>
          </div>
        )}
        {/* Date badge overlay */}
        <div className="absolute top-3 left-3 bg-gray-900/80 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1.5 rounded-lg tracking-wide">
          {formatDate(item.created_at)}
        </div>
        {/* Category badge */}
        <div className={`absolute top-3 right-3 ${catColor} text-white text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider`}>
          {item.category}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className={`font-bold text-gray-900 dark:text-white leading-snug ${large ? 'text-base' : 'text-sm'} line-clamp-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors`}>
          {item.title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-3 flex-1 leading-relaxed">
          {item.content}
        </p>
      </div>
    </div>
  );
}

interface PressNewsSectionProps {
  news: any[];
  title?: string;
  subtitle?: string;
}

export default function PressNewsSection({ news, title = 'In the Press', subtitle = 'LATEST COVERAGE & ANNOUNCEMENTS' }: PressNewsSectionProps) {
  if (!news || news.length === 0) return null;

  // First 3 in top row, rest in second row
  const topRow = news.slice(0, 3);
  const bottomRow = news.slice(3, 5);

  return (
    <section className="w-full">
      {/* Section header — press-style */}
      <div className="flex items-start gap-3 mb-6">
        <div className="w-1 h-12 bg-blue-700 rounded-full shrink-0 mt-0.5" />
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">{title}</h2>
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-0.5">{subtitle}</p>
        </div>
      </div>

      {/* Top row: 3 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
        {topRow.map((item: any) => (
          <NewsCard key={item.id} item={item} />
        ))}
      </div>

      {/* Bottom row: up to 2 wider cards */}
      {bottomRow.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {bottomRow.map((item: any) => (
            <NewsCard key={item.id} item={item} large />
          ))}
        </div>
      )}
    </section>
  );
}
