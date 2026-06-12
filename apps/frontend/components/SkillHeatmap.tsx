import React from 'react';

export default function SkillHeatmap({ data }: { data: { skill: string, count: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-[#FFFFFF] border-2 border-[#1C1C1C] p-8 text-center">
        <p className="font-[family-name:var(--font-space)] text-[12px] tracking-[0.1em] uppercase text-[#999999]">
          No skill gaps data available.
        </p>
      </div>
    );
  }

  const getTier = (count: number) => {
    if (count < 5) {
      return {
        dot: 'bg-[#FF5B5B]',
        pill: 'border-[#902D2D] text-[#FF7373] bg-[#2A1F29]',
      };
    }
    if (count <= 15) {
      return {
        dot: 'bg-[#F2B600]',
        pill: 'border-[#8A6B11] text-[#F2C94C] bg-[#2A2415]',
      };
    }
    return {
      dot: 'bg-[#17C964]',
      pill: 'border-[#1F6D46] text-[#76E3A8] bg-[#16261F]',
    };
  };

  return (
    <div className="w-full flex flex-col gap-5">
      <div className="relative border-2 border-[#2B3A55] bg-[linear-gradient(130deg,#1C2A40_0%,#1A263B_72%,#162033_100%)] px-7 py-8 overflow-hidden">
        <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rotate-12 border border-white/10" />
        <div className="pointer-events-none absolute -left-10 -bottom-10 h-24 w-24 border border-white/10" />

        <div className="flex flex-wrap gap-3">
          {data.map((item, i) => {
            const tier = getTier(item.count);
            return (
              <div
                key={i}
                title={`${item.count} users have this skill`}
                className={`group relative border px-5 py-2.5 text-[15px] font-semibold tracking-[0.01em] transition-transform hover:-translate-y-0.5 ${tier.pill}`}
              >
                {item.skill}
                <div className="pointer-events-none absolute left-1/2 top-[-10px] hidden -translate-x-1/2 -translate-y-full border-2 border-[#1C1C1C] bg-[#F5F4F0] px-2.5 py-1 text-[11px] font-[family-name:var(--font-space)] tracking-[0.08em] uppercase text-[#1C1C1C] group-hover:block">
                  {item.count} user{item.count !== 1 ? 's' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-5 text-[15px]">
          <div className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 bg-[#FF5B5B]" />
            <span className="font-[family-name:var(--font-serif)] text-[#8E8E8E]">Scarce (&lt;5)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 bg-[#F2B600]" />
            <span className="font-[family-name:var(--font-serif)] text-[#8E8E8E]">Medium (5-15)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 bg-[#17C964]" />
            <span className="font-[family-name:var(--font-serif)] text-[#8E8E8E]">Common (&gt;15)</span>
          </div>
        </div>
        <p className="font-[family-name:var(--font-serif)] text-[18px] leading-none md:text-[32px]">
          <span className="text-[#33A1FF]">These skills are scarce</span>
          <span className="text-[#1C1C1C]"> - </span>
          <span className="text-[#33A1FF]">consider learning them!</span>
        </p>
      </div>
    </div>
  );
}
