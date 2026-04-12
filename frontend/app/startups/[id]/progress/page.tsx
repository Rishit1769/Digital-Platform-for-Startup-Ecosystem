'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/axios';
import { use } from 'react';
import { DataPanel } from '../../../../components/DataPanel';
import SubNav from '../../../../components/SubNav';

const F = {
  display: "font-[family-name:var(--font-playfair)]",
  space:   "font-[family-name:var(--font-space)]",
  serif:   "font-[family-name:var(--font-serif)]",
  bebas:   "font-[family-name:var(--font-bebas)]",
};

const STAGES = ['idea', 'prototype', 'mvp', 'scaling', 'funded'];

export default function StartupProgress({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [milestones, setMilestones] = useState<any[]>([]);
  const [startup,    setStartup]    = useState<any>(null);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [newTitle,   setNewTitle]   = useState('');
  const [newDesc,    setNewDesc]    = useState('');
  const [newStage,   setNewStage]   = useState('idea');

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [msRes, stRes] = await Promise.all([
        api.get(`/startups/${id}/milestones`),
        api.get(`/startups/${id}`),
      ]);
      setMilestones(msRes.data.data);
      setStartup(stRes.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!newTitle || !newStage) return;
    try {
      await api.post(`/startups/${id}/milestones`, { title: newTitle, description: newDesc, stage: newStage });
      setShowForm(false); setNewTitle(''); setNewDesc('');
      fetchData();
    } catch (err) { console.error(err); }
  };

  const setComplete = async (milId: number) => {
    try { await api.patch(`/startups/${id}/milestones/${milId}`, { completed: true }); fetchData(); }
    catch (err) { console.error(err); }
  };

  const killMilestone = async (milId: number) => {
    try { await api.delete(`/startups/${id}/milestones/${milId}`); fetchData(); }
    catch (err) { console.error(err); }
  };

  const TABS = [
    { key: 'overview', label: 'Overview',  href: `/startups/${id}` },
    { key: 'manage',   label: 'Manage',    href: `/startups/${id}/manage` },
    { key: 'progress', label: 'Progress',  href: `/startups/${id}/progress` },
    { key: 'pitch',    label: 'Pitch Deck',href: `/startups/${id}/pitch` },
  ];

  const isOwner = startup?.my_role === 'founder' || startup?.my_role === 'member';
  const completed = milestones.filter(m => m.completed_at).length;
  const pct = milestones.length > 0 ? Math.round((completed / milestones.length) * 100) : 0;

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
          <div className={`${F.space} text-white/30 text-[11px] tracking-[0.2em] uppercase hidden md:block`}>{startup?.name ?? 'Progress'}</div>
        </div>
      </header>

      <SubNav
        backLabel="Startups"
        backHref="/startups"
        entityName={startup?.name}
        tabs={TABS}
        activeTab="progress"
      />

      <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-12 flex flex-col gap-10">

        {/* Stats row */}
        <div className="grid grid-cols-3 border-2 border-[#1C1C1C] divide-x-2 divide-[#1C1C1C]">
          {[
            { v: milestones.length, l: 'Total Milestones' },
            { v: completed,         l: 'Completed'         },
            { v: pct + '%',         l: 'Progress'          },
          ].map(({ v, l }) => (
            <div key={l} className="bg-white px-8 py-6">
              <div className={`${F.bebas} text-[#F7941D] leading-none`} style={{ fontSize: '3rem' }}>{v}</div>
              <div className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#888888] mt-1`}>{l}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div>
          <div className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#888888] mb-2`}>Completion — {pct}%</div>
          <div className="eco-progress-bar">
            <div className="eco-progress-bar-fill" style={{ width: pct + '%' }} />
          </div>
        </div>

        {/* Add Milestone */}
        {isOwner && (
          <DataPanel eyebrow="Add" title="New Milestone"
            action={
              <button onClick={() => setShowForm(s => !s)}
                className={`${F.space} font-bold text-[12px] tracking-wide uppercase bg-[#F7941D] text-white px-5 py-2.5 hover:bg-[#1C1C1C] transition-colors`}>
                {showForm ? 'Cancel' : '+ Add'}
              </button>
            }>
            {showForm && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="eco-label">Title *</label>
                  <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. MVP Launch"
                    className="eco-input off-white" />
                </div>
                <div>
                  <label className="eco-label">Description</label>
                  <textarea rows={3} value={newDesc} onChange={e => setNewDesc(e.target.value)}
                    placeholder="What does completing this milestone mean?"
                    className="eco-input off-white" />
                </div>
                <div>
                  <label className="eco-label">Stage *</label>
                  <select value={newStage} onChange={e => setNewStage(e.target.value)} className="eco-input off-white">
                    {STAGES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <button onClick={handleCreate}
                  className={`${F.space} font-bold text-[13px] tracking-[0.1em] uppercase bg-[#1C1C1C] text-white px-6 py-4 hover:bg-[#F7941D] transition-colors`}>
                  Create Milestone
                </button>
              </div>
            )}
          </DataPanel>
        )}

        {/* Milestone list */}
        <DataPanel eyebrow="Timeline" title={`All Milestones (${milestones.length})`} noPadding>
          {milestones.length === 0 ? (
            <div className="py-16 text-center">
              <div className={`${F.bebas} text-[#EEEEEE]`} style={{ fontSize: '5rem', lineHeight: 1 }}>00</div>
              <div className={`${F.space} text-[#AAAAAA] mt-3 text-sm`}>No milestones yet. Create the first one above.</div>
            </div>
          ) : (
            <div className="divide-y-2 divide-[#F5F4F0]">
              {milestones.map((m, i) => (
                <div key={m.id} className={`px-6 py-5 flex items-start gap-5 hover:bg-[#F5F4F0] transition-colors ${m.completed_at ? 'opacity-60' : ''}`}>
                  {/* Step number */}
                  <div className={`${F.bebas} flex-shrink-0 w-10 text-right leading-none mt-0.5 ${m.completed_at ? 'text-[#CCCCCC]' : 'text-[#F7941D]'}`}
                    style={{ fontSize: '1.8rem' }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <div className={`${F.space} font-bold text-[#1C1C1C] text-[15px] ${m.completed_at ? 'line-through text-[#888888]' : ''}`}>{m.title}</div>
                      <span className={`${F.space} text-[10px] font-bold tracking-[0.1em] uppercase px-2 py-0.5 border ${m.completed_at ? 'border-[#DDDDDD] text-[#888888]' : 'border-[#F7941D] text-[#F7941D]'}`}>
                        {m.stage}
                      </span>
                      {m.completed_at && (
                        <span className={`${F.space} text-[10px] uppercase tracking-wide text-[#888888]`}>
                          ✓ {new Date(m.completed_at).toLocaleDateString('en-IN')}
                        </span>
                      )}
                    </div>
                    {m.description && (
                      <p className={`${F.serif} text-[#888888] text-[13px] leading-[1.7]`}>{m.description}</p>
                    )}
                  </div>

                  {/* Actions */}
                  {isOwner && !m.completed_at && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => setComplete(m.id)}
                        className={`${F.space} font-bold text-[11px] tracking-wide bg-[#1C1C1C] text-white px-3 py-2 hover:bg-[#F7941D] transition-colors`}>
                        Done
                      </button>
                      <button onClick={() => killMilestone(m.id)}
                        className={`${F.space} font-bold text-[11px] tracking-wide border border-[#DDDDDD] text-[#888888] hover:border-[#CC0000] hover:text-[#CC0000] px-3 py-2 transition-colors`}>
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DataPanel>

      </div>
    </div>
  );
}
