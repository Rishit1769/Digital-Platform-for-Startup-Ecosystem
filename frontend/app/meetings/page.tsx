'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/axios';

const F = {
  display: "font-[family-name:var(--font-playfair)]",
  space:   "font-[family-name:var(--font-space)]",
  serif:   "font-[family-name:var(--font-serif)]",
  bebas:   "font-[family-name:var(--font-bebas)]",
};

type TabKey = 'upcoming' | 'incoming' | 'outgoing' | 'past';

const TAB_LABELS: { key: TabKey; label: string }[] = [
  { key: 'upcoming', label: '01  Upcoming'  },
  { key: 'incoming', label: '02  Incoming'  },
  { key: 'outgoing', label: '03  Outgoing'  },
  { key: 'past',     label: '04  Archive'   },
];

const STATUS_CODE: Record<string, string> = {
  pending:   'PENDING',
  confirmed: 'CONFIRMED',
  rejected:  'REJECTED',
  cancelled: 'CANCELLED',
  completed: 'DONE',
};

const STATUS_STYLE: Record<string, string> = {
  PENDING:   'text-[#888888]  border-[#DDDDDD]',
  CONFIRMED: 'text-[#F7941D] border-[#F7941D]',
  REJECTED:  'text-[#1C1C1C] border-[#1C1C1C]',
  CANCELLED: 'text-[#888888] border-[#888888]',
  DONE:      'text-[#003580] border-[#003580]',
};

function parseSlots(str: string): string[] {
  try { return JSON.parse(str); } catch { return []; }
}

function fmtDate(dt: string) {
  const d = new Date(dt);
  return {
    date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  };
}

export default function MeetingsPage() {
  const [meetings,      setMeetings]      = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [activeTab,     setActiveTab]     = useState<TabKey>('upcoming');
  const [currentUser,   setCurrentUser]   = useState<any>(null);
  const [confirmModal,  setConfirmModal]  = useState<any>(null);
  const [selectedSlot,  setSelectedSlot]  = useState('');
  const [expandedId,    setExpandedId]    = useState<number | null>(null);

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [meRes, meetRes] = await Promise.all([api.get('/profile/me'), api.get('/meetings')]);
      const userId   = meRes.data.data.id;
      setCurrentUser(meRes.data.data);
      const all: any[] = meetRes.data.data;
      let filtered: any[] = [];
      if (activeTab === 'incoming') filtered = all.filter(m => m.attendee_id === userId && m.status === 'pending');
      if (activeTab === 'outgoing') filtered = all.filter(m => m.organizer_id === userId && m.status === 'pending');
      if (activeTab === 'upcoming') filtered = all.filter(m => m.status === 'confirmed');
      if (activeTab === 'past')     filtered = all.filter(m => ['rejected', 'cancelled', 'completed'].includes(m.status));
      setMeetings(filtered);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAction = async (id: number, action: string, body?: any) => {
    try {
      if (action === 'confirm') await api.patch(`/meetings/${id}/confirm`, body);
      else                      await api.patch(`/meetings/${id}/${action}`, body);
      setConfirmModal(null);
      fetchData();
    } catch (err: any) { alert(err.response?.data?.error || 'Action failed'); }
  };

  return (
    <div className="bg-[#FFFFFF] min-h-screen">

      {/* ── Back nav ── */}
      <div className="border-b-2 border-[#1C1C1C]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-4 flex items-center gap-4">
          <a href="/" className={`${F.space} text-[11px] tracking-[0.2em] uppercase text-[#888888] hover:text-[#F7941D] transition-colors`}>
            ← Ecosystem
          </a>
          <span className="text-[#DDDDDD]">/</span>
          <span className={`${F.space} text-[11px] tracking-[0.2em] uppercase text-[#1C1C1C]`}>Meetings</span>
        </div>
      </div>

      {/* ── Header ── */}
      <div className="bg-[#003580] border-b-2 border-[#1C1C1C]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-14">
          <div className="grid grid-cols-12">
            <div className="col-span-12 lg:col-span-7">
              <div className={`${F.space} text-[11px] tracking-[0.25em] uppercase text-[#F7941D] mb-4`}>Sessions & Syncs</div>
              <h1 className={`${F.display} font-black italic text-white leading-[0.92]`}
                style={{ fontSize: 'clamp(40px, 5vw, 68px)' }}>
                My Meetings.
              </h1>
              <p className={`${F.serif} text-white/50 text-base leading-[1.8] mt-5 max-w-lg`}>
                Scheduled syncs, mentor sessions, and peer reviews. Every meeting is structured, documented, and tracked.
              </p>
            </div>
            <div className="col-span-12 lg:col-span-4 lg:col-start-9 flex items-end justify-end mt-8 lg:mt-0">
              <a href="/office-hours"
                className={`${F.space} font-bold text-[12px] tracking-[0.1em] uppercase bg-[#F7941D] text-white px-6 py-3.5 hover:bg-white hover:text-[#1C1C1C] transition-colors`}>
                Book Office Hours
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab row — editorial step indicator ── */}
      <div className="border-b-2 border-[#1C1C1C] bg-[#FFFFFF]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14">
          <div className="flex divide-x-2 divide-[#1C1C1C] overflow-x-auto border-r-0">
            {TAB_LABELS.map(({ key, label }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`${F.space} font-bold text-[11px] tracking-[0.15em] uppercase px-7 py-4 flex-shrink-0 transition-colors
                  ${activeTab === key ? 'bg-[#1C1C1C] text-white' : 'bg-[#FFFFFF] text-[#AAAAAA] hover:text-[#1C1C1C] hover:bg-[#F5F4F0]'}`}>
                <span className={activeTab === key ? 'text-[#F7941D]' : 'text-inherit'}>{label.slice(0, 2)}</span>
                <span className="ml-2">{label.slice(4)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Timetable ── */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-14">

        {/* Table header */}
        <div className="border-t-2 border-[#1C1C1C] hidden md:grid grid-cols-12 pb-3 pt-4">
          {(['Title', 'With', 'Scheduled', 'Status', 'Action'] as string[]).map((h, i) => (
            <div key={h}
              className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#AAAAAA]
                ${i===0?'col-span-3':i===1?'col-span-3':i===2?'col-span-3':i===3?'col-span-1':'col-span-2 text-right'}`}>
              {h}
            </div>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="border-t border-[#E0E0E0]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border-b border-[#E8E8E8] py-5 grid grid-cols-12 gap-4">
                <div className="col-span-3 h-3 bg-[#F0F0F0] animate-pulse" />
                <div className="col-span-3 h-3 bg-[#F5F5F5] animate-pulse" />
                <div className="col-span-3 h-3 bg-[#F0F0F0] animate-pulse" />
                <div className="col-span-1 h-3 bg-[#F5F5F5] animate-pulse" />
                <div className="col-span-2 h-3 bg-[#F0F0F0] animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && meetings.length === 0 && (
          <div className="border-t-2 border-[#1C1C1C] text-center py-20">
            <div className={`${F.bebas} text-[#EEEEEE]`} style={{ fontSize: '6rem', lineHeight: 1 }}>00</div>
            <div className={`${F.space} font-bold text-[#1C1C1C] mt-3 mb-1`}>No meetings in this category</div>
            <p className={`${F.serif} italic text-[#888888] text-sm`}>
              {activeTab === 'upcoming' ? 'No confirmed sessions scheduled.' : 'Nothing here yet.'}
            </p>
          </div>
        )}

        {/* Rows */}
        {!loading && meetings.map((m) => {
          const isOrganizer = currentUser?.id === m.organizer_id;
          const otherName   = isOrganizer ? m.attendee_name : m.organizer_name;
          const statusCode  = STATUS_CODE[m.status] ?? m.status.toUpperCase();
          const statusClass = STATUS_STYLE[statusCode] ?? STATUS_STYLE['PENDING'];
          const isExpanded  = expandedId === m.id;
          const confirmed   = m.confirmed_slot ? fmtDate(m.confirmed_slot) : null;

          return (
            <div key={m.id} className="border-b border-[#E8E8E8]">

              {/* Main row */}
              <div
                className="py-5 grid grid-cols-12 items-start md:items-center gap-4 hover:bg-[#F5F4F0] -mx-6 lg:-mx-14 px-6 lg:px-14 transition-colors cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : m.id)}>

                <div className="col-span-12 md:col-span-3">
                  <div className={`${F.space} font-bold text-[#1C1C1C] text-[14px]`}>{m.title}</div>
                  <div className={`${F.serif} italic text-[#888888] text-xs mt-0.5 md:hidden`}>With {otherName}</div>
                </div>

                <div className={`hidden md:block col-span-3 ${F.serif} text-[#555555] text-sm`}>{otherName}</div>

                <div className="hidden md:block col-span-3">
                  {confirmed ? (
                    <div>
                      <div className={`${F.bebas} text-[#F7941D] text-[1.4rem] leading-none`}>{confirmed.date}</div>
                      <div className={`${F.space} text-[#888888] text-[10px] tracking-wide`}>{confirmed.time}</div>
                    </div>
                  ) : (
                    <div className={`${F.space} text-[#AAAAAA] text-[11px] tracking-wide`}>TBD</div>
                  )}
                </div>

                <div className="hidden md:block col-span-1">
                  <span className={`${F.space} text-[9px] font-bold tracking-[0.15em] border px-2 py-0.5 ${statusClass}`}>
                    {statusCode}
                  </span>
                </div>

                <div className="col-span-12 md:col-span-2 flex items-center justify-between md:justify-end gap-2">
                  {/* Mobile status */}
                  <span className={`md:hidden ${F.space} text-[9px] font-bold tracking-[0.15em] border px-2 py-0.5 ${statusClass}`}>
                    {statusCode}
                  </span>
                  <span className={`${F.space} text-[#CCCCCC] text-xs`}>{isExpanded ? '↑' : '↓'}</span>
                </div>

              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="bg-[#F5F4F0] border-t border-[#E0E0E0] px-6 lg:px-14 py-6 -mx-6 lg:-mx-14 grid grid-cols-12 gap-6">

                  {/* Slots */}
                  <div className="col-span-12 md:col-span-7">
                    <div className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#AAAAAA] mb-3`}>
                      {m.status === 'confirmed' || m.status === 'completed' ? 'Confirmed Slot' : 'Proposed Times'}
                    </div>
                    {m.status === 'confirmed' || m.status === 'completed' ? (
                      <div className="border-l-[3px] border-[#F7941D] pl-4">
                        <div className={`${F.bebas} text-[#1C1C1C] text-[2rem] leading-none`}>{confirmed?.date}</div>
                        <div className={`${F.space} text-[#888888] text-sm tracking-wide`}>{confirmed?.time}</div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {parseSlots(m.proposed_slots).map((s: string, i: number) => {
                          const dt = fmtDate(s);
                          return (
                            <div key={i} className="flex items-center gap-4 border-b border-[#E8E8E8] pb-2">
                              <span className={`${F.bebas} text-[#888888] text-xl leading-none`}>{String(i+1).padStart(2,'0')}</span>
                              <span className={`${F.space} text-[13px] font-medium text-[#1C1C1C]`}>{dt.date} — {dt.time}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {m.meeting_link && (
                      <a href={m.meeting_link} target="_blank" rel="noopener noreferrer"
                        className={`${F.space} inline-block mt-4 text-[11px] tracking-[0.15em] uppercase text-[#F7941D] border-b border-[#F7941D] pb-0.5 hover:text-[#1C1C1C] hover:border-[#1C1C1C] transition-colors`}>
                        Join Call →
                      </a>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-span-12 md:col-span-5 flex flex-col gap-2 justify-center items-start md:items-end">
                    {activeTab === 'incoming' && (
                      <>
                        <button onClick={() => { setConfirmModal(m); setSelectedSlot(''); }}
                          className={`${F.space} font-bold text-[11px] tracking-[0.15em] uppercase bg-[#F7941D] text-white px-6 py-3 hover:bg-[#1C1C1C] transition-colors w-full md:w-auto`}>
                          Pick Slot & Confirm
                        </button>
                        <button onClick={() => handleAction(m.id, 'reject')}
                          className={`${F.space} font-bold text-[11px] tracking-[0.15em] uppercase bg-transparent text-[#888888] border border-[#DDDDDD] px-6 py-3 hover:border-[#1C1C1C] hover:text-[#1C1C1C] transition-colors w-full md:w-auto`}>
                          Reject
                        </button>
                      </>
                    )}
                    {activeTab === 'outgoing' && (
                      <button onClick={() => handleAction(m.id, 'cancel')}
                        className={`${F.space} font-bold text-[11px] tracking-[0.15em] uppercase bg-transparent text-[#888888] border border-[#DDDDDD] px-6 py-3 hover:border-[#1C1C1C] hover:text-[#1C1C1C] transition-colors w-full md:w-auto`}>
                        Cancel Request
                      </button>
                    )}
                    {activeTab === 'upcoming' && (
                      <button onClick={() => handleAction(m.id, 'complete')}
                        className={`${F.space} font-bold text-[11px] tracking-[0.15em] uppercase bg-[#003580] text-white px-6 py-3 hover:bg-[#1C1C1C] transition-colors w-full md:w-auto`}>
                        Mark Complete
                      </button>
                    )}
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Confirm slot modal ── */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-[#1C1C1C]/60">
          <div className="bg-[#FFFFFF] w-full md:max-w-xl border-2 border-[#1C1C1C] relative">

            {/* Modal header */}
            <div className="border-b-2 border-[#1C1C1C] px-8 py-5 flex items-center justify-between">
              <div>
                <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-1`}>Step 3 — Confirm</div>
                <div className={`${F.space} font-bold text-[#1C1C1C] text-lg`}>Select a Time Slot</div>
              </div>
              <button onClick={() => setConfirmModal(null)}
                className={`${F.space} text-[#888888] hover:text-[#1C1C1C] transition-colors text-xl leading-none`}>✕</button>
            </div>

            {/* Slot options */}
            <div className="px-8 py-6">
              <p className={`${F.serif} text-[#666666] text-sm leading-[1.7] mb-6`}>
                Select one of the proposed windows below to lock in the session. Your peer will receive a calendar notification automatically.
              </p>
              <div className="flex flex-col gap-0 border-2 border-[#1C1C1C]">
                {parseSlots(confirmModal.proposed_slots).map((s: string, i: number) => {
                  const dt = fmtDate(s);
                  return (
                    <label key={i}
                      className={`flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors ${i > 0 ? 'border-t-2 border-[#1C1C1C]' : ''}
                        ${selectedSlot === s ? 'bg-[#F7941D]' : 'hover:bg-[#F5F4F0]'}`}>
                      <input type="radio" name="slot" value={s} checked={selectedSlot === s}
                        onChange={() => setSelectedSlot(s)}
                        className="sr-only" />
                      <div className={`w-3.5 h-3.5 border-2 flex-shrink-0 ${selectedSlot === s ? 'border-white bg-white' : 'border-[#1C1C1C]'}`}>
                        {selectedSlot === s && <div className="w-full h-full bg-[#F7941D] scale-50" />}
                      </div>
                      <div>
                        <div className={`${F.bebas} text-[1.5rem] leading-none ${selectedSlot === s ? 'text-white' : 'text-[#1C1C1C]'}`}>{dt.date}</div>
                        <div className={`${F.space} text-[11px] tracking-wide ${selectedSlot === s ? 'text-white/70' : 'text-[#888888]'}`}>{dt.time}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Action bar */}
            <div className="border-t-2 border-[#1C1C1C] px-8 py-5 flex items-center justify-end gap-3">
              <button onClick={() => setConfirmModal(null)}
                className={`${F.space} font-medium text-[12px] tracking-[0.1em] uppercase text-[#888888] hover:text-[#1C1C1C] transition-colors`}>
                Cancel
              </button>
              <button
                onClick={() => handleAction(confirmModal.id, 'confirm', { confirmed_slot: selectedSlot })}
                disabled={!selectedSlot}
                className={`${F.space} font-bold text-[12px] tracking-[0.1em] uppercase px-7 py-3 transition-colors
                  ${selectedSlot ? 'bg-[#1C1C1C] text-white hover:bg-[#F7941D]' : 'bg-[#E0E0E0] text-[#AAAAAA] cursor-not-allowed'}`}>
                Confirm & Schedule
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}


export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing' | 'upcoming' | 'past'>('upcoming');

  const [currentUser, setCurrentUser] = useState<any>(null);

  // Modals
  const [confirmModal, setConfirmModal] = useState<any>(null); // holds meeting obj
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const meRes = await api.get('/profile/me');
      const userId = meRes.data.data.id;
      setCurrentUser(meRes.data.data);

      const res = await api.get('/meetings');
      const allMeets = res.data.data;

      let filtered: any[] = [];
      if (activeTab === 'incoming') filtered = allMeets.filter((m:any) => m.attendee_id === userId && m.status === 'pending');
      if (activeTab === 'outgoing') filtered = allMeets.filter((m:any) => m.organizer_id === userId && m.status === 'pending');
      if (activeTab === 'upcoming') filtered = allMeets.filter((m:any) => m.status === 'confirmed');
      if (activeTab === 'past') filtered = allMeets.filter((m:any) => ['rejected', 'cancelled', 'completed'].includes(m.status));

      setMeetings(filtered);
    } catch(err) { console.error(err); } finally { setLoading(false); }
  };

  const handleAction = async (id: number, action: string, body?: any) => {
    try {
      if (action === 'confirm') {
        await api.patch(`/meetings/${id}/confirm`, body);
        setConfirmModal(null);
      } else {
        await api.patch(`/meetings/${id}/${action}`, body);
      }
      fetchData();
    } catch(err: any) { alert(err.response?.data?.error || 'Action failed'); }
  };

  const getStatusBadge = (status: string) => {
    const map: any = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      completed: 'bg-blue-100 text-blue-800'
    };
    return <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide \${map[status]}`}>{status}</span>;
  };

  const parseSlots = (str: string) => {
    try { return JSON.parse(str); } catch { return []; }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-20">
      
      <div className="bg-white dark:bg-gray-800 py-10 px-4 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">My Meetings</h1>
            <p className="text-gray-500 mt-2">Manage your networking and syncs.</p>
          </div>
          <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
            {['incoming', 'outgoing', 'upcoming', 'past'].map(t => (
              <button 
                key={t} onClick={() => setActiveTab(t as any)} 
                className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition whitespace-nowrap \${activeTab === t ? 'bg-white dark:bg-gray-800 shadow text-blue-600' : 'text-gray-500 dark:text-gray-300'}`}
              >{t}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {loading ? <div className="text-center py-20 text-blue-600 font-bold">Loading...</div> : (
          <div className="space-y-4">
            {meetings.length === 0 && <div className="text-center bg-white dark:bg-gray-800 rounded-3xl py-12 text-gray-500 shadow-sm border border-gray-100 dark:border-gray-700">No meetings found in this tab.</div>}
            
            {meetings.map(m => {
              const isOrganizer = currentUser?.id === m.organizer_id;
              const otherName = isOrganizer ? m.attendee_name : m.organizer_name;
              
              return (
                <div key={m.id} className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-6 transition hover:shadow-md">
                  <div className="flex-1 w-full">
                    <div className="flex justify-between items-start mb-2">
                       <h3 className="text-xl font-bold dark:text-white">{m.title}</h3>
                       {getStatusBadge(m.status)}
                    </div>
                    <p className="text-gray-500 text-sm">With <strong>{otherName}</strong></p>
                    
                    <div className="mt-4 bg-gray-50 dark:bg-gray-700 p-3 rounded-xl border border-gray-100 dark:border-gray-600">
                      {m.status === 'confirmed' || m.status === 'completed' ? (
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Scheduled: {new Date(m.confirmed_slot).toLocaleString()}
                        </div>
                      ) : (
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-200 text-opacity-80">
                          Proposed Times:<br/>
                          {parseSlots(m.proposed_slots).map((s:string, i:number) => <span key={i} className="block mt-1 text-xs">• {new Date(s).toLocaleString()}</span>)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
                    {activeTab === 'incoming' && (
                      <>
                        <button onClick={() => setConfirmModal(m)} className="px-5 py-2 bg-green-500 text-white font-bold rounded-xl shadow w-full">Confirm Slot</button>
                        <button onClick={() => handleAction(m.id, 'reject')} className="px-5 py-2 bg-red-100 text-red-600 font-bold rounded-xl w-full">Reject</button>
                      </>
                    )}
                    {activeTab === 'outgoing' && (
                      <button onClick={() => handleAction(m.id, 'cancel')} className="px-5 py-2 bg-gray-200 text-gray-700 font-bold rounded-xl w-full">Cancel Request</button>
                    )}
                    {activeTab === 'upcoming' && (
                      <>
                        {m.meeting_link && <a href={m.meeting_link} target="_blank" rel="noopener noreferrer" className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl shadow w-full text-center block">Join Call</a>}
                        <button onClick={() => handleAction(m.id, 'complete')} className="px-5 py-2 bg-purple-100 text-purple-700 font-bold rounded-xl w-full mt-2">Mark Complete</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirm Slot Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-3xl p-8 shadow-2xl relative">
            <button onClick={() => setConfirmModal(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">✕</button>
            <h2 className="text-2xl font-bold mb-4 dark:text-white">Confirm Time</h2>
            <p className="text-gray-500 text-sm mb-6">Select one of the proposed slots to lock in this meeting. Your calendar will be generated automatically preventing double-bookings.</p>
            
            <div className="space-y-3">
              {parseSlots(confirmModal.proposed_slots).map((s:string, i:number) => (
                <label key={i} className={`block p-4 border rounded-xl cursor-pointer transition \${selectedSlot === s ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'dark:border-gray-600'}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="slot" value={s} checked={selectedSlot === s} onChange={() => setSelectedSlot(s)} className="w-5 h-5 text-blue-600" />
                    <span className="font-bold text-gray-700 dark:text-gray-200">{new Date(s).toLocaleString()}</span>
                  </div>
                </label>
              ))}
            </div>

            <button onClick={() => handleAction(confirmModal.id, 'confirm', { confirmed_slot: selectedSlot })} disabled={!selectedSlot} className="w-full mt-6 py-3 bg-blue-600 disabled:opacity-50 text-white font-bold rounded-xl hover:bg-blue-700">Confirm & Schedule</button>
          </div>
        </div>
      )}
    </div>
  );
}
