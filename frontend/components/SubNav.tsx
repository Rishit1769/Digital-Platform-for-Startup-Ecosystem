'use client';

import { useRouter } from 'next/navigation';

const F = {
  space: "font-[family-name:var(--font-space)]",
  bebas: "font-[family-name:var(--font-bebas)]",
  serif: "font-[family-name:var(--font-serif)]",
};

interface SubNavTab {
  key: string;
  label: string;
  href: string;
  /** Number badge shown next to label */
  count?: number;
}

interface SubNavProps {
  /** Breadcrumb back label */
  backLabel?: string;
  backHref?: string;
  /** Entity name shown in the sub-nav bar */
  entityName?: string;
  eyebrow?: string;
  tabs: SubNavTab[];
  activeTab: string;
}

export default function SubNav({
  backLabel = 'Back',
  backHref = '/',
  entityName,
  eyebrow,
  tabs,
  activeTab,
}: SubNavProps) {
  const router = useRouter();

  return (
    <>
      {/* Breadcrumb */}
      <div className="border-b-2 border-[#1C1C1C] bg-[#FFFFFF]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push(backHref)}
            className={`${F.space} text-[11px] tracking-[0.2em] uppercase text-[#888888] hover:text-[#F7941D] transition-colors flex items-center gap-1.5`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {backLabel}
          </button>
          {entityName && (
            <>
              <span className="text-[#DDDDDD]">/</span>
              {eyebrow && <span className={`${F.space} text-[11px] tracking-[0.2em] uppercase text-[#888888]`}>{eyebrow}</span>}
              {eyebrow && <span className="text-[#DDDDDD]">/</span>}
              <span className={`${F.space} text-[11px] tracking-[0.2em] uppercase text-[#1C1C1C] font-semibold max-w-[200px] truncate`}>
                {entityName}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Tab row */}
      <div className="border-b-2 border-[#1C1C1C] bg-[#FFFFFF] sticky top-[57px] z-30">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14">
          <div className="flex divide-x-2 divide-[#1C1C1C] overflow-x-auto">
            {tabs.map(({ key, label, href, count }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => router.push(href)}
                  className={`${F.space} font-bold text-[11px] tracking-[0.15em] uppercase px-6 py-4 flex-shrink-0 transition-colors flex items-center gap-2
                    ${isActive
                      ? 'bg-[#1C1C1C] text-white'
                      : 'bg-[#FFFFFF] text-[#AAAAAA] hover:text-[#1C1C1C] hover:bg-[#F5F4F0]'
                    }`}
                >
                  <span className={isActive ? 'text-[#F7941D]' : 'text-inherit'}>
                    {String(tabs.indexOf({ key, label, href, count }) + 1).padStart(2, '0')}
                  </span>
                  <span>{label}</span>
                  {count !== undefined && (
                    <span className={`${F.bebas} text-sm leading-none px-1.5 py-0.5 ${isActive ? 'text-[#F7941D]' : 'text-[#CCCCCC]'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
