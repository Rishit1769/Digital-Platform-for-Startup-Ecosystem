'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { api } from '../../../../lib/axios';
import { useAuth } from '../../../../lib/auth';
import { DataPanel } from '../../../../components/DataPanel';
import SubNav from '../../../../components/SubNav';

const F = {
  display: "font-[family-name:var(--font-playfair)]",
  space:   "font-[family-name:var(--font-space)]",
  serif:   "font-[family-name:var(--font-serif)]",
  bebas:   "font-[family-name:var(--font-bebas)]",
};

export default function PitchDeck({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();

  const [deck,        setDeck]        = useState<any>(null);
  const [startup,     setStartup]     = useState<any>(null);
  const [loading,     setLoading]     = useState(true);
  const [generating,  setGenerating]  = useState(false);
  const [streamText,  setStreamText]  = useState('');
  const [activeSlide, setActiveSlide] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [outline, setOutline] = useState<any>(null);
  const [outlineLoading, setOutlineLoading] = useState(false);
  const [pitchPdfObject, setPitchPdfObject] = useState('');

  useEffect(() => {
    fetchDeck();
    api.get(`/startups/${id}`).then(r => setStartup(r.data.data)).catch(() => {});
  }, [id]);

  const fetchDeck = async () => {
    try { const res = await api.get(`/ai/pitch/${id}`); setDeck(res.data.data.content); }
    catch { /* no deck yet */ } finally { setLoading(false); }
  };

  const handleGenerate = async () => {
    setGenerating(true); setDeck(null); setStreamText('');
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${baseUrl}/ai/pitch/${id}/generate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ startup_id: id }),
      });
      if (!response.body) throw new Error('No body');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = JSON.parse(line.slice(6));
          if (data.error) throw new Error(data.error);
          if (data.chunk) setStreamText(p => p + data.chunk);
          if (data.done) fetchDeck();
        }
      }
    } catch (err: any) { alert(err.message || 'Generation failed'); }
    finally { setGenerating(false); }
  };

  const handleAnalyzePitch = async () => {
    setAnalyzing(true);
    try {
      const res = await api.post(`/startups/${id}/analyze-pitch`, {
        pitch_pdf_object_name: pitchPdfObject || undefined,
      });
      setAnalysis(res.data?.data || null);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Pitch analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateOutline = async () => {
    setOutlineLoading(true);
    try {
      const res = await api.post(`/startups/${id}/generate-outline`);
      setOutline(res.data?.data || null);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Outline generation failed');
    } finally {
      setOutlineLoading(false);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!deck?.slides) return;
      if (e.key === 'ArrowRight' && activeSlide < deck.slides.length - 1) setActiveSlide(a => a + 1);
      if (e.key === 'ArrowLeft'  && activeSlide > 0)                       setActiveSlide(a => a - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeSlide, deck]);

  const TABS = [
    { key: 'overview', label: 'Overview',  href: `/startups/${id}` },
    { key: 'manage',   label: 'Manage',    href: `/startups/${id}/manage` },
    { key: 'progress', label: 'Progress',  href: `/startups/${id}/progress` },
    { key: 'pitch',    label: 'Pitch Deck',href: `/startups/${id}/pitch` },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F4F0]">
      <div className={`${F.bebas} text-[#F7941D] tracking-widest`} style={{ fontSize: '2rem' }}>Loading</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-[#1C1C1C]">

      {/* Top bar */}
      <header className="bg-[#1C1C1C] border-b-2 border-[#F7941D] sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 bg-[#F7941D]" />
            <span className={`${F.space} font-bold text-white text-lg tracking-[0.05em]`}>ECOSYSTEM</span>
          </a>
          <div className={`${F.space} text-white/30 text-[11px] tracking-[0.2em] uppercase hidden md:block`}>{startup?.name ?? 'Pitch Deck'}</div>
        </div>
      </header>

      <SubNav
        backLabel="Startups"
        backHref="/startups"
        entityName={startup?.name}
        tabs={TABS}
        activeTab="pitch"
      />

      <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-12">

        <div className="grid grid-cols-12 gap-6 mb-8">
          <div className="col-span-12 lg:col-span-6">
            <DataPanel eyebrow="AI Analyzer" title="Pitch Deck Evaluation">
              <div className="flex flex-col gap-3">
                <div>
                  <label className="eco-label">Pitch PDF MinIO object path</label>
                  <input
                    type="text"
                    value={pitchPdfObject}
                    onChange={e => setPitchPdfObject(e.target.value)}
                    className="eco-input off-white"
                    placeholder="startups/pitch_12.pdf"
                  />
                </div>
                <button onClick={handleAnalyzePitch} disabled={analyzing} className="eco-btn eco-btn-primary">
                  {analyzing ? 'Analyzing…' : 'Analyze Pitch'}
                </button>
              </div>

              {analysis && (
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    ['Clarity', analysis.clarity],
                    ['Market Size', analysis.market_size],
                    ['Value Prop', analysis.value_proposition],
                  ].map(([label, value]: any) => (
                    <div key={label} className="border border-[#1C1C1C] p-3 bg-[#F5F4F0]">
                      <div className={`${F.space} text-[10px] uppercase tracking-[0.12em] text-[#888888]`}>{label}</div>
                      <div className={`${F.bebas} text-[#F7941D] text-3xl leading-none`}>{value?.score ?? 0}</div>
                      <p className={`${F.serif} text-xs text-[#555555] mt-1`}>{value?.summary || ''}</p>
                    </div>
                  ))}
                </div>
              )}
            </DataPanel>
          </div>

          <div className="col-span-12 lg:col-span-6">
            <DataPanel eyebrow="AI Generator" title="10-Slide Outline">
              <button onClick={handleGenerateOutline} disabled={outlineLoading} className="eco-btn eco-btn-primary mb-4">
                {outlineLoading ? 'Generating…' : 'Generate Outline'}
              </button>

              {outline?.slides?.length > 0 && (
                <div className="max-h-[260px] overflow-auto pr-1 flex flex-col gap-2">
                  {outline.slides.map((s: any) => (
                    <div key={s.slide_number} className="border border-[#1C1C1C] p-3 bg-white">
                      <div className={`${F.space} text-[10px] uppercase tracking-[0.12em] text-[#F7941D]`}>Slide {s.slide_number}</div>
                      <div className={`${F.space} font-bold text-sm text-[#1C1C1C]`}>{s.title}</div>
                      <div className={`${F.serif} text-xs text-[#666666] mt-1`}>{s.objective}</div>
                    </div>
                  ))}
                </div>
              )}
            </DataPanel>
          </div>
        </div>

        {/* Generate bar */}
        <div className="flex items-center justify-between mb-8 p-6 border-2 border-[#1C1C1C] bg-white">
          <div>
            <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-0.5`}>AI-Powered</div>
            <div className={`${F.space} font-bold text-[#1C1C1C] text-[16px]`}>
              {deck ? 'Pitch Deck Generated' : 'No pitch deck yet'}
            </div>
            <p className={`${F.serif} text-[#888888] text-[13px] mt-0.5`}>
              {deck ? 'Use ← → arrow keys to navigate slides.' : 'Generate a structured investor pitch deck using AI.'}
            </p>
          </div>
          <div className="flex gap-3">
            {deck && (
              <button onClick={() => window.print()}
                className={`${F.space} font-bold text-[12px] tracking-wide uppercase border-2 border-[#1C1C1C] text-[#1C1C1C] px-5 py-3 hover:bg-[#1C1C1C] hover:text-white transition-colors`}>
                Export PDF
              </button>
            )}
            <button onClick={handleGenerate} disabled={generating}
              className={`${F.space} font-bold text-[12px] tracking-wide uppercase bg-[#F7941D] text-white px-6 py-3 hover:bg-[#1C1C1C] disabled:opacity-40 transition-colors`}>
              {generating ? 'Generating…' : deck ? 'Regenerate' : 'Generate Deck'}
            </button>
          </div>
        </div>

        {/* Stream preview */}
        {generating && streamText && (
          <DataPanel eyebrow="Generating" title="AI is writing your pitch…">
            <pre className={`${F.serif} text-[#555555] text-[13px] leading-[1.8] whitespace-pre-wrap`}>{streamText}</pre>
          </DataPanel>
        )}

        {/* Slide deck */}
        {deck?.slides && (
          <div>
            {/* Slide nav dots */}
            <div className="flex gap-1.5 mb-6 items-center justify-center">
              {deck.slides.map((_: any, i: number) => (
                <button key={i} onClick={() => setActiveSlide(i)}
                  className={`transition-all ${i === activeSlide ? 'w-6 h-2 bg-[#F7941D]' : 'w-2 h-2 bg-[#DDDDDD] hover:bg-[#888888]'}`} />
              ))}
            </div>

            {/* Active slide */}
            {(() => {
              const slide = deck.slides[activeSlide];
              if (!slide) return null;
              return (
                <div className="border-2 border-[#1C1C1C] bg-white min-h-[400px] flex flex-col">
                  {/* Slide header */}
                  <div className="border-b-2 border-[#1C1C1C] px-10 py-6 flex items-center justify-between bg-[#1C1C1C]">
                    <div>
                      <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-1`}>
                        Slide {activeSlide + 1} of {deck.slides.length}
                      </div>
                      <h2 className={`${F.display} font-black italic text-white text-2xl`}>{slide.title}</h2>
                    </div>
                    <div className={`${F.bebas} text-white/20 leading-none`} style={{ fontSize: '5rem' }}>
                      {String(activeSlide + 1).padStart(2, '0')}
                    </div>
                  </div>

                  {/* Slide body */}
                  <div className="flex-1 p-10">
                    {slide.content && (
                      <p className={`${F.serif} text-[#555555] text-base leading-[1.9] mb-6`}>{slide.content}</p>
                    )}
                    {slide.bullets?.length > 0 && (
                      <ul className="flex flex-col gap-3">
                        {slide.bullets.map((b: string, i: number) => (
                          <li key={i} className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 bg-[#F7941D] mt-2 flex-shrink-0" />
                            <span className={`${F.serif} text-[#555555] text-[15px] leading-[1.7]`}>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {slide.metric && (
                      <div className="mt-6 inline-block border-l-4 border-[#F7941D] pl-4">
                        <div className={`${F.bebas} text-[#F7941D] leading-none`} style={{ fontSize: '3rem' }}>{slide.metric}</div>
                        {slide.metric_label && <div className={`${F.space} text-[#888888] text-xs uppercase tracking-wider mt-1`}>{slide.metric_label}</div>}
                      </div>
                    )}
                  </div>

                  {/* Nav arrows */}
                  <div className="border-t-2 border-[#1C1C1C] flex">
                    <button onClick={() => setActiveSlide(a => Math.max(0, a - 1))} disabled={activeSlide === 0}
                      className={`${F.space} flex-1 py-4 border-r-2 border-[#1C1C1C] text-[12px] font-bold tracking-wide uppercase hover:bg-[#F5F4F0] disabled:opacity-30 transition-colors`}>
                      ← Prev
                    </button>
                    <button onClick={() => setActiveSlide(a => Math.min(deck.slides.length - 1, a + 1))} disabled={activeSlide === deck.slides.length - 1}
                      className={`${F.space} flex-1 py-4 text-[12px] font-bold tracking-wide uppercase hover:bg-[#F5F4F0] disabled:opacity-30 transition-colors`}>
                      Next →
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* All slides overview */}
            {deck.slides.length > 1 && (
              <div className="mt-8 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {deck.slides.map((s: any, i: number) => (
                  <button key={i} onClick={() => setActiveSlide(i)}
                    className={`border-2 p-3 text-left transition-colors ${i === activeSlide ? 'border-[#F7941D] bg-[#FFF8F0]' : 'border-[#E0E0E0] bg-white hover:border-[#1C1C1C]'}`}>
                    <div className={`${F.bebas} text-xl leading-none ${i === activeSlide ? 'text-[#F7941D]' : 'text-[#DDDDDD]'}`}>{String(i + 1).padStart(2, '0')}</div>
                    <div className={`${F.space} text-[10px] uppercase tracking-wide truncate mt-1 text-[#888888]`}>{s.title}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty */}
        {!deck && !generating && (
          <div className="border-2 border-[#1C1C1C] bg-white py-24 text-center">
            <div className={`${F.bebas} text-[#EEEEEE]`} style={{ fontSize: '8rem', lineHeight: 1 }}>AI</div>
            <div className={`${F.space} font-bold text-[#1C1C1C] mt-4 mb-2`}>No pitch deck generated yet.</div>
            <p className={`${F.serif} text-[#888888] text-sm mb-6`}>Click "Generate Deck" to create an AI-powered investor presentation.</p>
            <button onClick={handleGenerate}
              className={`${F.space} font-bold text-[13px] tracking-[0.1em] uppercase bg-[#F7941D] text-white px-8 py-4 hover:bg-[#1C1C1C] transition-colors`}>
              Generate Deck
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
