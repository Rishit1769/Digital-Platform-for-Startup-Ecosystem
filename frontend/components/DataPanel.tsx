import React from 'react';

const F = {
  space: "font-[family-name:var(--font-space)]",
  display: "font-[family-name:var(--font-playfair)]",
  serif: "font-[family-name:var(--font-serif)]",
};

interface DataPanelProps {
  /** Small orange all-caps label above the title */
  eyebrow?: string;
  /** Bold panel heading */
  title?: string;
  /** Optional element rendered top-right of the header */
  action?: React.ReactNode;
  children: React.ReactNode;
  /** Additional wrapper classes */
  className?: string;
  /** Use off-white background instead of white */
  offWhite?: boolean;
  /** Remove internal padding from body */
  noPadding?: boolean;
}

export function DataPanel({
  eyebrow,
  title,
  action,
  children,
  className = '',
  offWhite = false,
  noPadding = false,
}: DataPanelProps) {
  const hasHeader = eyebrow || title || action;
  return (
    <div className={`border-2 border-[#1C1C1C] ${offWhite ? 'bg-[#F5F4F0]' : 'bg-[#FFFFFF]'} ${className}`}>
      {hasHeader && (
        <div className="border-b-2 border-[#1C1C1C] px-6 py-4 flex items-center justify-between gap-4">
          <div>
            {eyebrow && (
              <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-0.5`}>{eyebrow}</div>
            )}
            {title && (
              <div className={`${F.space} font-bold text-[#1C1C1C] text-[15px]`}>{title}</div>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>{children}</div>
    </div>
  );
}

interface DataCardProps {
  /** Metric value (rendered in Bebas Neue, large) */
  value: string | number;
  label: string;
  /** Optional accent color for the value (default: #F7941D) */
  accent?: string;
  className?: string;
}

export function DataCard({ value, label, accent = '#F7941D', className = '' }: DataCardProps) {
  return (
    <div className={`border-2 border-[#1C1C1C] bg-[#FFFFFF] px-8 py-6 ${className}`}>
      <div
        className="font-[family-name:var(--font-bebas)] leading-none"
        style={{ fontSize: '3rem', color: accent }}
      >
        {value}
      </div>
      <div className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#888888] mt-1`}>{label}</div>
    </div>
  );
}

/** A horizontal rule section divider used inside DataPanels */
export function PanelDivider({ label }: { label?: string }) {
  return (
    <div className={`${F.space} flex items-center gap-3 text-[10px] tracking-[0.25em] uppercase text-[#AAAAAA] my-6`}>
      <div className="flex-1 h-px bg-[#E0E0E0]" />
      {label && <span>{label}</span>}
      {label && <div className="flex-1 h-px bg-[#E0E0E0]" />}
    </div>
  );
}

/** Tag chip - flat, no rounded corners */
export function Tag({
  label,
  onRemove,
  accent = false,
}: {
  label: string;
  onRemove?: () => void;
  accent?: boolean;
}) {
  return (
    <span
      className={`font-[family-name:var(--font-space)] text-[11px] tracking-[0.1em] uppercase px-2.5 py-1 flex items-center gap-1.5
        ${accent
          ? 'bg-[#F7941D] text-white border border-[#F7941D]'
          : 'bg-transparent text-[#1C1C1C] border border-[#1C1C1C]'
        }`}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="leading-none hover:text-[#F7941D] transition-colors"
          aria-label={`Remove ${label}`}
        >
          ×
        </button>
      )}
    </span>
  );
}
