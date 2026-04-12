'use client';

import React from 'react';

const F = {
  display: "font-[family-name:var(--font-playfair)]",
  space:   "font-[family-name:var(--font-space)]",
  serif:   "font-[family-name:var(--font-serif)]",
  bebas:   "font-[family-name:var(--font-bebas)]",
};

interface DashboardLayoutProps {
  /** Slot rendered inside the dark top bar (right-hand side) */
  topBarRight?: React.ReactNode;
  /** Optional left-side identity block replacement (defaults to ECOSYSTEM logo) */
  topBarLeft?: React.ReactNode;
  /** Hero eyebrow label (orange, all-caps) */
  eyebrow?: string;
  /** Main page heading (Playfair italic) */
  title?: string;
  /** Sub-heading body text */
  subtitle?: string;
  /** Optional buttons/actions rendered beside the heading */
  headerActions?: React.ReactNode;
  /** Whether to render the dark hero header section */
  showHero?: boolean;
  /** Hero background override (default: #003580) */
  heroBg?: string;
  children: React.ReactNode;
  /** Remove the max-w container + padding (for full-bleed child) */
  fullBleed?: boolean;
}

export default function DashboardLayout({
  topBarRight,
  topBarLeft,
  eyebrow,
  title,
  subtitle,
  headerActions,
  showHero = false,
  heroBg = '#003580',
  children,
  fullBleed = false,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F5F4F0] text-[#1C1C1C]">

      {/* ── Top bar ── */}
      <header className="bg-[#1C1C1C] border-b-2 border-[#F7941D] sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-4 flex items-center justify-between">
          {topBarLeft ?? (
            <a href="/" className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 bg-[#F7941D]" />
              <span className={`${F.space} font-bold text-white text-lg tracking-[0.05em]`}>ECOSYSTEM</span>
            </a>
          )}
          {topBarRight && (
            <div className="flex items-center gap-3">
              {topBarRight}
            </div>
          )}
        </div>
      </header>

      {/* ── Optional hero strip ── */}
      {showHero && (title || eyebrow) && (
        <div className="border-b-2 border-[#1C1C1C]" style={{ backgroundColor: heroBg }}>
          <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-14">
            <div className="grid grid-cols-12 gap-6 items-end">
              <div className="col-span-12 lg:col-span-8">
                {eyebrow && (
                  <div className={`${F.space} text-[11px] tracking-[0.25em] uppercase text-[#F7941D] mb-4`}>{eyebrow}</div>
                )}
                {title && (
                  <h1
                    className={`${F.display} font-black italic text-white leading-[0.92]`}
                    style={{ fontSize: 'clamp(36px, 4.5vw, 60px)' }}
                  >
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className={`${F.serif} text-white/50 text-base leading-[1.8] mt-4 max-w-xl`}>{subtitle}</p>
                )}
              </div>
              {headerActions && (
                <div className="col-span-12 lg:col-span-4 flex items-end justify-start lg:justify-end gap-3 mt-6 lg:mt-0">
                  {headerActions}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Body ── */}
      {fullBleed ? (
        <div>{children}</div>
      ) : (
        <main className="max-w-[1440px] mx-auto px-6 lg:px-14 py-12">
          {children}
        </main>
      )}
    </div>
  );
}
