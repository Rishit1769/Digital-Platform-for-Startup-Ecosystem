'use client';

import { useRouter } from 'next/navigation';

const F = {
  display: "font-[family-name:var(--font-playfair)]",
  space:   "font-[family-name:var(--font-space)]",
  serif:   "font-[family-name:var(--font-serif)]",
};

const CATEGORY_COLORS: Record<string, string> = {
  announcement: 'bg-[#003580] text-white',
  event: 'bg-[#1C1C1C] text-white',
  opportunity: 'bg-[#1C1C1C] text-white',
  update: 'bg-[#F7941D] text-white',
  general: 'bg-[#1C1C1C] text-white',
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
}

function NewsCard({ item, large = false }: { item: any; large?: boolean }) {
  const catColor = CATEGORY_COLORS[item.category] || 'bg-[#1C1C1C] text-white';

  return (
    <div className={`group relative bg-white border-2 border-[#1C1C1C] overflow-hidden flex flex-col ${large ? '' : ''}`}>
      <div className={`relative overflow-hidden ${large ? 'h-56' : 'h-44'} bg-[#1C1C1C]`}>
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className={`${F.display} text-6xl text-white/20 italic`}>NEWS</span>
          </div>
        )}
        <div className={`${F.space} absolute top-3 left-3 bg-[#1C1C1C] text-white text-[11px] font-bold px-2.5 py-1.5 tracking-[0.08em]`}>
          {formatDate(item.created_at)}
        </div>
        <div className={`${F.space} absolute top-3 right-3 ${catColor} text-[11px] font-bold px-2.5 py-1 uppercase tracking-[0.12em]`}>
          {item.category}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className={`${F.display} font-bold italic text-[#1C1C1C] leading-snug ${large ? 'text-[29px]' : 'text-[18px]'} line-clamp-3 group-hover:text-[#003580] transition-colors`}>
          {item.title}
        </h3>
        <p className={`${F.serif} text-sm text-[#666666] mt-2 line-clamp-3 flex-1 leading-relaxed`}>
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
      <div className="flex items-start gap-3 mb-6">
        <div className="w-1 h-14 bg-[#F7941D] shrink-0 mt-0.5" />
        <div>
          <h2 className={`${F.display} text-4xl md:text-5xl font-black italic text-[#1C1C1C] tracking-tight`}>{title}</h2>
          <p className={`${F.space} text-[11px] font-bold text-[#003580] uppercase tracking-[0.18em] mt-1`}>{subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
        {topRow.map((item: any) => (
          <NewsCard key={item.id} item={item} />
        ))}
      </div>

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
