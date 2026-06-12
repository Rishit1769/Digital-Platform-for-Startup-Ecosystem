import React from 'react';

const F = {
  space: "font-[family-name:var(--font-space)]",
  serif: "font-[family-name:var(--font-serif)]",
};

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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border-2 border-[#1C1C1C] p-5 animate-pulse">
              <div className="h-4 w-24 bg-[#E6E6E6] mb-4" />
              <div className="h-6 w-2/3 bg-[#EFEFEF] mb-3" />
              <div className="h-3 w-full bg-[#EFEFEF] mb-2" />
              <div className="h-3 w-4/5 bg-[#EFEFEF] mb-4" />
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-[#EFEFEF] border border-[#DDDDDD]" />
                <div className="h-6 w-20 bg-[#EFEFEF] border border-[#DDDDDD]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white border-2 border-[#1C1C1C] p-8 text-center">
        <p className={`${F.space} text-[#888888] text-[12px] tracking-[0.15em] uppercase`}>No trend data available right now.</p>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.map((item, i) => (
          <div key={i} className="bg-white border-2 border-[#1C1C1C] p-5 flex flex-col min-h-[240px]">
            <div className="flex justify-between items-start gap-3 mb-4">
              <h3 className={`${F.space} font-bold text-lg text-[#1C1C1C] leading-tight`}>{item.name}</h3>
              <span className={`${F.space} px-2 py-1 text-[10px] font-bold uppercase tracking-[0.15em] ${
                item.growth_signal?.toLowerCase() === 'high'
                  ? 'bg-[#1C1C1C] text-white'
                  : item.growth_signal?.toLowerCase() === 'medium'
                    ? 'bg-[#003580] text-white'
                    : 'bg-[#F7941D] text-white'
              }`}>
                {item.growth_signal}
              </span>
            </div>

            <p className={`${F.serif} text-sm text-[#666666] mb-4 flex-grow leading-relaxed`}>
              {item.why_trending}
            </p>

            <div>
              <div className={`${F.space} text-[10px] uppercase tracking-[0.2em] font-bold text-[#888888] mb-2`}>Pioneers</div>
              <div className="flex flex-wrap gap-2">
                {item.example_startups?.map((s, j) => (
                  <span key={j} className={`${F.space} text-[11px] px-2 py-1 bg-[#F5F4F0] border border-[#1C1C1C] text-[#1C1C1C] font-medium`}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
