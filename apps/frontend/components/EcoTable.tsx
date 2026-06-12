import React from 'react';

const F = {
  space: "font-[family-name:var(--font-space)]",
  serif: "font-[family-name:var(--font-serif)]",
  bebas: "font-[family-name:var(--font-bebas)]",
};

interface ColDef {
  label: string;
  /** Tailwind col-span-* class, e.g. "col-span-3" */
  span: string;
  align?: 'left' | 'right' | 'center';
}

interface EcoTableProps {
  cols: ColDef[];
  children: React.ReactNode;
  /** Rendered when children is empty */
  empty?: string;
  /** Show skeleton rows while loading */
  loading?: boolean;
  loadingRows?: number;
}

export default function EcoTable({
  cols,
  children,
  empty = 'No records found.',
  loading = false,
  loadingRows = 5,
}: EcoTableProps) {
  const alignClass = (a?: 'left' | 'right' | 'center') =>
    a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left';

  return (
    <div className="w-full">
      {/* Column headers */}
      <div className="border-t-2 border-[#1C1C1C] hidden md:grid grid-cols-12 pt-4 pb-3">
        {cols.map((c, i) => (
          <div
            key={i}
            className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#AAAAAA] ${c.span} ${alignClass(c.align)}`}
          >
            {c.label}
          </div>
        ))}
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="border-t border-[#E0E0E0]">
          {Array.from({ length: loadingRows }).map((_, i) => (
            <div key={i} className="border-b border-[#E8E8E8] py-5 grid grid-cols-12 gap-4">
              {cols.map((c, j) => (
                <div key={j} className={`${c.span} h-3 animate-pulse ${j % 2 === 0 ? 'bg-[#F0F0F0]' : 'bg-[#F5F5F5]'}`} />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && React.Children.count(children) === 0 && (
        <div className="border-t-2 border-[#1C1C1C] text-center py-20">
          <div className={`${F.bebas} text-[#EEEEEE]`} style={{ fontSize: '5rem', lineHeight: 1 }}>00</div>
          <div className={`${F.space} font-bold text-[#1C1C1C] mt-3 text-sm`}>{empty}</div>
        </div>
      )}

      {/* Rows */}
      {!loading && children}
    </div>
  );
}

/** A single EcoTable row — wraps `grid grid-cols-12` with hover + border-b */
export function EcoRow({
  children,
  onClick,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={`border-b border-[#E8E8E8] py-5 grid grid-cols-12 items-center gap-4
        -mx-6 lg:-mx-14 px-6 lg:px-14 transition-colors
        ${onClick ? 'cursor-pointer hover:bg-[#F5F4F0]' : ''}
        ${className}`}
    >
      {children}
    </div>
  );
}

/** Inline status badge — flat bordered, no rounded */
export function StatusBadge({
  label,
  color = 'neutral',
}: {
  label: string;
  color?: 'orange' | 'blue' | 'red' | 'neutral' | 'dark';
}) {
  const map = {
    orange: 'text-[#F7941D] border-[#F7941D]',
    blue:   'text-[#003580] border-[#003580]',
    red:    'text-[#CC0000] border-[#CC0000]',
    dark:   'text-[#1C1C1C] border-[#1C1C1C]',
    neutral:'text-[#888888] border-[#DDDDDD]',
  };
  return (
    <span className={`font-[family-name:var(--font-space)] text-[9px] font-bold tracking-[0.15em] border px-2 py-0.5 uppercase ${map[color]}`}>
      {label}
    </span>
  );
}
