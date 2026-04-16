'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/axios';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const F = {
  display: "font-[family-name:var(--font-playfair)]",
  space:   "font-[family-name:var(--font-space)]",
  serif:   "font-[family-name:var(--font-serif)]",
  bebas:   "font-[family-name:var(--font-bebas)]",
};

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initCodeClient: (config: {
            client_id: string;
            scope: string;
            ux_mode: 'popup';
            access_type?: 'offline';
            prompt?: 'consent' | 'select_account' | 'none';
            callback: (response: { code?: string; error?: string }) => void;
          }) => { requestCode: () => void };
        };
      };
    };
  }
}

// ─── Meeting Kanban ────────────────────────────────────────────────────────────

function DraggableCard({ event }: { event: any }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: event,
  });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  const statusLabel: Record<string, string> = {
    pending: 'PENDING',
    confirmed: 'CONFIRMED',
    office_hour: 'OFFICE HOUR',
    completed: 'DONE',
  };
  const statusColor: Record<string, string> = {
    pending: 'bg-[#F7941D] text-white',
    confirmed: 'bg-[#003580] text-white',
    office_hour: 'bg-[#1C1C1C] text-white',
    completed: 'bg-[#888888] text-white',
  };
  const key = event.type === 'office_hour' ? 'office_hour' : event.status;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-white border-2 border-[#1C1C1C] p-3 mb-2 cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className={`${F.space} font-bold text-[#1C1C1C] text-sm line-clamp-1`}>{event.title}</div>
      <div className={`${F.space} text-[#888888] text-xs mt-1 truncate`}>with {event.with}</div>
      <div className={`${F.space} inline-block mt-2 text-[10px] font-bold tracking-[0.15em] px-2 py-0.5 ${statusColor[key] || 'bg-[#888888] text-white'}`}>
        {statusLabel[key] || key?.toUpperCase()}
      </div>
    </div>
  );
}

function DroppableLane({ id, title, events, accent }: { id: string; title: string; events: any[]; accent: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div className="mt-2">
      <div className={`${F.space} text-[10px] font-bold tracking-[0.2em] uppercase mb-2 ${accent}`}>{title}</div>
      <div
        ref={setNodeRef}
        className={`min-h-[80px] p-2 border-2 transition-colors ${isOver ? 'border-[#F7941D] bg-[#FFF8F0]' : 'border-dashed border-[#CCCCCC] bg-[#F5F4F0]'}`}
      >
        {events.map(ev => <DraggableCard key={ev.id} event={ev} />)}
      </div>
    </div>
  );
}

function MeetingKanban() {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [userRole, setUserRole] = useState<'student' | 'mentor' | 'admin'>('student');

  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarEmail, setCalendarEmail] = useState<string | null>(null);
  const [calendarConnecting, setCalendarConnecting] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [participantSearch, setParticipantSearch] = useState('');
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [form, setForm] = useState({
    attendee_id: '',
    title: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    meeting_link: '',
  });

  useEffect(() => {
    fetchCalendarData();
  }, [weekOffset]);

  useEffect(() => {
    fetchCandidates();
  }, [participantSearch]);

  const loadGoogleIdentityScript = () => {
    return new Promise<void>((resolve, reject) => {
      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }
      const existing = document.querySelector<HTMLScriptElement>('script[data-google-calendar="true"]');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Failed to load Google script.')));
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.googleCalendar = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google script.'));
      document.head.appendChild(script);
    });
  };

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const [eventsRes, statusRes, meRes] = await Promise.all([
        api.get('/calendar/events'),
        api.get('/calendar/google/status'),
        api.get('/profile/me'),
      ]);
      setEvents(eventsRes.data.data || []);
      setCalendarConnected(!!statusRes.data.data?.connected);
      setCalendarEmail(statusRes.data.data?.email || null);
      setUserRole(meRes.data.data?.role || 'student');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidates = async () => {
    try {
      const params = participantSearch ? `?search=${encodeURIComponent(participantSearch)}` : '';
      const res = await api.get(`/calendar/meeting-candidates${params}`);
      setParticipants(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const connectGoogleCalendar = async () => {
    if (!googleClientId) {
      alert('NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing in frontend env.');
      return;
    }
    setCalendarConnecting(true);
    try {
      await loadGoogleIdentityScript();
      const codeClient = window.google!.accounts.oauth2.initCodeClient({
        client_id: googleClientId,
        scope: 'openid email profile https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar',
        ux_mode: 'popup',
        access_type: 'offline',
        prompt: 'consent',
        callback: async (response: { code?: string; error?: string }) => {
          try {
            if (!response.code) {
              throw new Error(response.error || 'Google authorization failed.');
            }
            await api.post('/calendar/google/connect', { code: response.code });
            await fetchCalendarData();
          } catch (err: any) {
            alert(err.response?.data?.error || err.message || 'Google Calendar connect failed.');
          } finally {
            setCalendarConnecting(false);
          }
        },
      });
      codeClient.requestCode();
    } catch (err: any) {
      setCalendarConnecting(false);
      alert(err.message || 'Google Calendar connect failed.');
    }
  };

  const disconnectGoogleCalendar = async () => {
    try {
      await api.post('/calendar/google/disconnect');
      await fetchCalendarData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to disconnect Google Calendar.');
    }
  };

  const currentWeekDays = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1 + weekOffset * 7);
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const isoDate = d.toISOString().split('T')[0];
      return {
        isoDate,
        dayStr: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dateStr: d.getDate(),
      };
    });
  };

  const eventsForDay = (isoDate: string) => {
    return events
      .filter((e) => e.date && e.date.startsWith(isoDate) && (e.status === 'confirmed' || e.type === 'office_hour'))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const submitSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.attendee_id || !form.title || !form.date || !form.start_time) {
      alert('Please fill attendee, title, date and start time.');
      return;
    }

    const startIso = new Date(`${form.date}T${form.start_time}`).toISOString();
    const endIso = form.end_time
      ? new Date(`${form.date}T${form.end_time}`).toISOString()
      : new Date(new Date(`${form.date}T${form.start_time}`).getTime() + 30 * 60000).toISOString();

    setScheduleLoading(true);
    try {
      await api.post('/meetings/schedule', {
        attendee_id: Number(form.attendee_id),
        title: form.title,
        description: form.description || null,
        start_time: startIso,
        end_time: endIso,
        meeting_link: form.meeting_link || null,
      });
      setShowModal(false);
      setForm({ attendee_id: '', title: '', description: '', date: '', start_time: '', end_time: '', meeting_link: '' });
      await fetchCalendarData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to schedule meeting.');
    } finally {
      setScheduleLoading(false);
    }
  };

  if (loading) {
    return <div className={`${F.space} text-center py-20 text-[#F7941D] font-bold tracking-[0.2em] uppercase`}>Loading calendar...</div>;
  }

  const days = currentWeekDays();
  const targetLabel = userRole === 'mentor' ? 'Students' : 'Mentors';

  return (
    <div className="flex flex-col flex-1">
      <div className="bg-white border-2 border-[#1C1C1C] p-5 mb-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-1`}>Google Calendar</div>
          {calendarConnected ? (
            <p className={`${F.space} text-sm text-[#1C1C1C]`}>Connected as {calendarEmail || 'your account'}.</p>
          ) : (
            <p className={`${F.space} text-sm text-[#888888]`}>Connect once to sync confirmed meetings directly into both calendars.</p>
          )}
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={calendarConnected ? disconnectGoogleCalendar : connectGoogleCalendar}
            disabled={calendarConnecting}
            className={`${F.space} px-5 py-2.5 border-2 border-[#1C1C1C] font-bold text-[12px] tracking-[0.12em] uppercase ${calendarConnected ? 'bg-white text-[#1C1C1C] hover:bg-[#F5F4F0]' : 'bg-[#1C1C1C] text-white hover:bg-[#F7941D]'} transition-colors disabled:opacity-40`}
          >
            {calendarConnecting ? 'Connecting...' : calendarConnected ? 'Disconnect Calendar' : 'Connect Calendar'}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className={`${F.space} px-5 py-2.5 bg-[#F7941D] border-2 border-[#1C1C1C] text-white font-bold text-[12px] tracking-[0.12em] uppercase hover:bg-[#1C1C1C] transition-colors`}
          >
            Schedule Meeting
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-5">
        <div className={`${F.space} text-[#888888] text-sm`}>Weekly calendar view with synced confirmed meetings.</div>
        <div className="flex border-2 border-[#1C1C1C]">
          <button onClick={() => setWeekOffset((v) => v - 1)} className={`${F.space} px-4 py-2 text-sm font-bold text-[#1C1C1C] border-r-2 border-[#1C1C1C] hover:bg-[#F5F4F0] transition`}>&lt; Prev</button>
          <button onClick={() => setWeekOffset(0)} className={`${F.space} px-4 py-2 text-sm font-bold text-[#1C1C1C] border-r-2 border-[#1C1C1C] hover:bg-[#F5F4F0] transition`}>Today</button>
          <button onClick={() => setWeekOffset((v) => v + 1)} className={`${F.space} px-4 py-2 text-sm font-bold text-[#1C1C1C] hover:bg-[#F5F4F0] transition`}>Next &gt;</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-x-auto gap-4 pb-8">
        {days.map((d) => (
          <div key={d.isoDate} className="flex-1 min-w-[240px] bg-white border-2 border-[#1C1C1C] flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b-2 border-[#1C1C1C] bg-[#1C1C1C] text-center">
              <div className={`${F.space} text-[10px] font-bold tracking-[0.25em] uppercase text-[#F7941D]`}>{d.dayStr}</div>
              <div className={`${F.bebas} text-3xl text-white tracking-wider leading-tight`}>{d.dateStr}</div>
            </div>
            <div className="flex flex-col flex-1 p-3 gap-2 overflow-y-auto bg-[#F5F4F0]">
              {eventsForDay(d.isoDate).length === 0 && (
                <div className={`${F.space} text-[11px] text-[#9A9A9A] border-2 border-dashed border-[#D2D2D2] py-3 text-center`}>No meetings</div>
              )}
              {eventsForDay(d.isoDate).map((ev: any) => (
                <div key={ev.id} className="bg-white border-2 border-[#1C1C1C] p-3">
                  <div className={`${F.space} text-[10px] tracking-[0.15em] uppercase text-[#F7941D] mb-1`}>{ev.type === 'office_hour' ? 'Office Hour' : 'Meeting'}</div>
                  <div className={`${F.space} font-bold text-sm text-[#1C1C1C] leading-snug`}>{ev.title}</div>
                  <div className={`${F.space} text-xs text-[#777777] mt-1`}>with {ev.with}</div>
                  <div className={`${F.bebas} text-[1.5rem] leading-none text-[#003580] mt-2`}>
                    {new Date(ev.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {ev.meeting_link && (
                    <a href={ev.meeting_link} target="_blank" rel="noopener noreferrer" className={`${F.space} inline-block mt-2 text-[10px] tracking-[0.15em] uppercase text-[#1C1C1C] border-b border-[#1C1C1C] hover:text-[#F7941D] hover:border-[#F7941D] transition-colors`}>
                      Open Link →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-[#1C1C1C] w-full max-w-2xl">
            <div className="bg-[#1C1C1C] px-6 py-4 flex items-center justify-between">
              <div>
                <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-0.5`}>Calendar View</div>
                <h2 className={`${F.display} text-white font-bold text-lg`}>Schedule Meeting</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-white hover:text-[#F7941D] transition text-2xl leading-none font-bold">&times;</button>
            </div>

            <form onSubmit={submitSchedule} className="p-6 space-y-4">
              {!calendarConnected && (
                <div className={`${F.space} text-[12px] text-[#CC0000] border-l-4 border-[#CC0000] pl-3 py-1.5 bg-red-50`}>
                  Connect Google Calendar first to schedule synced meetings.
                </div>
              )}

              <div>
                <label className={`${F.space} text-[10px] font-bold tracking-[0.15em] uppercase text-[#1C1C1C] block mb-1.5`}>Find {targetLabel}</label>
                <input
                  type="text"
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                  placeholder={`Search ${targetLabel.toLowerCase()}...`}
                  className={`${F.space} w-full border-2 border-[#1C1C1C] bg-[#F5F4F0] px-4 py-2.5 text-sm text-[#1C1C1C] focus:outline-none focus:border-[#F7941D]`}
                />
              </div>

              <div>
                <label className={`${F.space} text-[10px] font-bold tracking-[0.15em] uppercase text-[#1C1C1C] block mb-1.5`}>Participant</label>
                <select
                  value={form.attendee_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, attendee_id: e.target.value }))}
                  className={`${F.space} w-full border-2 border-[#1C1C1C] bg-[#F5F4F0] px-4 py-2.5 text-sm text-[#1C1C1C] focus:outline-none focus:border-[#F7941D]`}
                >
                  <option value="">Select participant</option>
                  {participants.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.company ? `- ${p.company}` : ''} ({p.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`${F.space} text-[10px] font-bold tracking-[0.15em] uppercase text-[#1C1C1C] block mb-1.5`}>Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  className={`${F.space} w-full border-2 border-[#1C1C1C] bg-[#F5F4F0] px-4 py-2.5 text-sm text-[#1C1C1C] focus:outline-none focus:border-[#F7941D]`}
                  placeholder="Product review sync"
                />
              </div>

              <div>
                <label className={`${F.space} text-[10px] font-bold tracking-[0.15em] uppercase text-[#1C1C1C] block mb-1.5`}>Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className={`${F.space} w-full border-2 border-[#1C1C1C] bg-[#F5F4F0] px-4 py-2.5 text-sm text-[#1C1C1C] focus:outline-none focus:border-[#F7941D] resize-none`}
                  placeholder="Agenda and meeting context"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={`${F.space} text-[10px] font-bold tracking-[0.15em] uppercase text-[#1C1C1C] block mb-1.5`}>Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))} className={`${F.space} w-full border-2 border-[#1C1C1C] bg-[#F5F4F0] px-4 py-2.5 text-sm text-[#1C1C1C] focus:outline-none focus:border-[#F7941D]`} />
                </div>
                <div>
                  <label className={`${F.space} text-[10px] font-bold tracking-[0.15em] uppercase text-[#1C1C1C] block mb-1.5`}>Start Time</label>
                  <input type="time" value={form.start_time} onChange={(e) => setForm((prev) => ({ ...prev, start_time: e.target.value }))} className={`${F.space} w-full border-2 border-[#1C1C1C] bg-[#F5F4F0] px-4 py-2.5 text-sm text-[#1C1C1C] focus:outline-none focus:border-[#F7941D]`} />
                </div>
                <div>
                  <label className={`${F.space} text-[10px] font-bold tracking-[0.15em] uppercase text-[#1C1C1C] block mb-1.5`}>End Time</label>
                  <input type="time" value={form.end_time} onChange={(e) => setForm((prev) => ({ ...prev, end_time: e.target.value }))} className={`${F.space} w-full border-2 border-[#1C1C1C] bg-[#F5F4F0] px-4 py-2.5 text-sm text-[#1C1C1C] focus:outline-none focus:border-[#F7941D]`} />
                </div>
              </div>

              <div>
                <label className={`${F.space} text-[10px] font-bold tracking-[0.15em] uppercase text-[#1C1C1C] block mb-1.5`}>Meeting Link (optional)</label>
                <input
                  type="url"
                  value={form.meeting_link}
                  onChange={(e) => setForm((prev) => ({ ...prev, meeting_link: e.target.value }))}
                  className={`${F.space} w-full border-2 border-[#1C1C1C] bg-[#F5F4F0] px-4 py-2.5 text-sm text-[#1C1C1C] focus:outline-none focus:border-[#F7941D]`}
                  placeholder="https://meet.google.com/... (leave empty to auto-create Meet)"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className={`${F.space} flex-1 py-2.5 border-2 border-[#1C1C1C] text-[#1C1C1C] text-sm font-bold hover:bg-[#F5F4F0] transition`}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!calendarConnected || scheduleLoading}
                  className={`${F.space} flex-1 py-2.5 bg-[#F7941D] border-2 border-[#1C1C1C] text-white text-sm font-bold hover:bg-[#e8850e] transition disabled:opacity-40`}
                >
                  {scheduleLoading ? 'Scheduling...' : 'Create & Sync'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Task Kanban ───────────────────────────────────────────────────────────────

const COLUMNS: { id: string; label: string; accent: string }[] = [
  { id: 'todo',        label: 'To Do',       accent: 'border-t-[#888888]'  },
  { id: 'in_progress', label: 'In Progress', accent: 'border-t-[#003580]'  },
  { id: 'review',      label: 'In Review',   accent: 'border-t-[#F7941D]'  },
  { id: 'done',        label: 'Done',        accent: 'border-t-[#1C1C1C]'  },
  { id: 'blocked',     label: 'Blocked',     accent: 'border-t-red-600'    },
];

const PRIORITY_BADGE: Record<string, string> = {
  urgent: 'bg-red-600 text-white',
  high:   'bg-[#F7941D] text-white',
  medium: 'bg-[#003580] text-white',
  low:    'bg-[#888888] text-white',
};

function TaskCard({ task, onDelete, onEdit }: { task: any; onDelete: (id: number) => void; onEdit: (task: any) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `task-${task.id}`, data: task });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-white border-2 border-[#1C1C1C] p-3 mb-2 cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''} transition`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className={`${F.space} text-sm font-bold text-[#1C1C1C] leading-snug flex-1`}>{task.title}</p>
        <div className="flex gap-1 shrink-0" onPointerDown={e => e.stopPropagation()}>
          <button onClick={() => onEdit(task)} className="p-1 text-[#888888] hover:text-[#F7941D] transition">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </button>
          <button onClick={() => onDelete(task.id)} className="p-1 text-[#888888] hover:text-red-600 transition">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </div>
      {task.description && (
        <p className={`${F.serif} text-xs text-[#888888] mt-1 line-clamp-2 mb-2`}>{task.description}</p>
      )}
      <div className="flex items-center justify-between mt-1 flex-wrap gap-1">
        <span className={`${F.space} text-[10px] font-bold px-2 py-0.5 capitalize ${PRIORITY_BADGE[task.priority] || 'bg-[#888888] text-white'}`}>{task.priority}</span>
        {task.due_date && (
          <span className={`${F.space} text-[10px] text-[#888888] font-bold`}>{new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        )}
      </div>
    </div>
  );
}

function TaskColumn({ col, tasks, onDelete, onEdit, onAdd }: any) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  return (
    <div className={`flex flex-col flex-1 min-w-[230px] bg-white border-2 border-[#1C1C1C] border-t-4 ${col.accent} overflow-hidden`}>
      <div className="px-4 pt-3 pb-3 border-b-2 border-[#1C1C1C] flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <h3 className={`${F.space} font-bold text-[#1C1C1C] text-sm`}>{col.label}</h3>
          <span className={`${F.space} text-[10px] font-bold bg-[#F5F4F0] border border-[#1C1C1C] px-2 py-0.5`}>{tasks.length}</span>
        </div>
        <button
          onClick={() => onAdd(col.id)}
          className={`${F.space} w-6 h-6 flex items-center justify-center border-2 border-[#1C1C1C] text-[#1C1C1C] hover:bg-[#F7941D] hover:text-white hover:border-[#F7941D] transition font-bold text-lg leading-none`}
          title={`Add task to ${col.label}`}
        >+</button>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 p-3 overflow-y-auto min-h-[200px] transition-colors ${isOver ? 'bg-[#FFF8F0]' : 'bg-[#F5F4F0]'}`}
      >
        {tasks.map((t: any) => (
          <TaskCard key={t.id} task={t} onDelete={onDelete} onEdit={onEdit} />
        ))}
        {tasks.length === 0 && (
          <div className={`${F.space} text-[11px] text-[#888888] text-center mt-6 border-2 border-dashed border-[#CCCCCC] py-4`}>Drop tasks here</div>
        )}
      </div>
    </div>
  );
}

function TaskModal({ initial, onSave, onClose }: { initial?: any; onSave: (data: any) => void; onClose: () => void }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [priority, setPriority] = useState(initial?.priority || 'medium');
  const [dueDate, setDueDate] = useState(initial?.due_date ? initial.due_date.split('T')[0] : '');
  const [status, setStatus] = useState(initial?.status || 'todo');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), description: description.trim() || null, priority, status, due_date: dueDate || null });
  };

  const inputCls = `${F.space} w-full border-2 border-[#1C1C1C] bg-[#F5F4F0] px-4 py-2.5 text-sm text-[#1C1C1C] focus:outline-none focus:border-[#F7941D]`;
  const labelCls = `${F.space} text-[10px] font-bold tracking-[0.15em] uppercase text-[#1C1C1C] block mb-1.5`;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-2 border-[#1C1C1C] w-full max-w-md">
        <div className="bg-[#1C1C1C] px-6 py-4 flex items-center justify-between">
          <div>
            <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-0.5`}>Board</div>
            <h2 className={`${F.display} text-white font-bold text-lg`}>{initial ? 'Edit Task' : 'New Task'}</h2>
          </div>
          <button onClick={onClose} className="text-white hover:text-[#F7941D] transition text-2xl leading-none font-bold">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs to be done?" autoFocus className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Add more details..." className={`${inputCls} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className={inputCls}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className={inputCls}>
                {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Due Date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className={`${F.space} flex-1 py-2.5 border-2 border-[#1C1C1C] text-[#1C1C1C] text-sm font-bold hover:bg-[#F5F4F0] transition`}>Cancel</button>
            <button type="submit" className={`${F.space} flex-1 py-2.5 bg-[#F7941D] border-2 border-[#1C1C1C] text-white text-sm font-bold hover:bg-[#e8850e] transition`}>{initial ? 'Update' : 'Create Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TaskKanban() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; initial?: any; defaultStatus?: string }>({ open: false });
  const [activeTask, setActiveTask] = useState<any>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/calendar/tasks');
      setTasks(res.data.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSave = async (data: any) => {
    try {
      if (modal.initial) {
        await api.put(`/calendar/tasks/${modal.initial.id}`, data);
      } else {
        await api.post('/calendar/tasks', { ...data, status: data.status || modal.defaultStatus || 'todo' });
      }
      await fetchTasks();
      setModal({ open: false });
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/calendar/tasks/${id}`);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (e) { console.error(e); }
  };

  const handleDragEnd = async (e: any) => {
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;
    const task = active.data.current;
    const newStatus = over.id as string;
    if (!COLUMNS.find(c => c.id === newStatus) || task.status === newStatus) return;
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    try {
      await api.patch(`/calendar/tasks/${task.id}/move`, { status: newStatus });
    } catch (e) { console.error(e); fetchTasks(); }
  };

  if (loading) return (
    <div className={`${F.space} text-center py-20 text-[#F7941D] font-bold tracking-[0.2em] uppercase`}>Loading tasks...</div>
  );

  return (
    <div className="flex flex-col flex-1">
      <div className="flex items-center justify-between mb-5">
        <p className={`${F.space} text-sm text-[#888888]`}>Drag cards between columns to update their status.</p>
        <button
          onClick={() => setModal({ open: true, defaultStatus: 'todo' })}
          className={`${F.space} px-5 py-2.5 bg-[#F7941D] border-2 border-[#1C1C1C] text-white font-bold text-sm hover:bg-[#e8850e] transition flex items-center gap-2`}
        >
          <span className="text-lg leading-none">+</span> New Task
        </button>
      </div>

      <DndContext sensors={sensors} onDragStart={e => setActiveTask(e.active.data.current)} onDragEnd={handleDragEnd}>
        <div className="flex flex-1 gap-4 overflow-x-auto pb-10">
          {COLUMNS.map(col => (
            <TaskColumn
              key={col.id}
              col={col}
              tasks={tasks.filter(t => t.status === col.id)}
              onDelete={handleDelete}
              onEdit={(t: any) => setModal({ open: true, initial: t })}
              onAdd={(status: string) => setModal({ open: true, defaultStatus: status })}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? (
            <div className={`${F.space} bg-white border-2 border-[#1C1C1C] p-3 text-sm font-bold text-[#1C1C1C] w-56 opacity-90`}>
              {activeTask.title}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {modal.open && (
        <TaskModal
          initial={modal.initial}
          onSave={handleSave}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'calendar'>('calendar');

  return (
    <div className="min-h-screen bg-[#F5F4F0] flex flex-col">
      {/* Header */}
      <div className="bg-[#1C1C1C] border-b-2 border-[#1C1C1C]">
        <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className={`${F.space} text-[10px] tracking-[0.3em] uppercase text-[#F7941D] mb-0.5`}>Workspace</div>
            <h1 className={`${F.display} text-white font-bold text-2xl`}>Calendar & Tasks</h1>
            <p className={`${F.space} text-[#888888] text-xs mt-0.5`}>Schedule meetings in calendar view and sync with Google Calendar</p>
          </div>
          <div className="flex border-2 border-white self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`${F.space} px-5 py-2.5 text-sm font-bold border-r-2 border-white transition ${activeTab === 'tasks' ? 'bg-white text-[#1C1C1C]' : 'bg-transparent text-white hover:bg-white/10'}`}
            >
              Task Board
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`${F.space} px-5 py-2.5 text-sm font-bold transition ${activeTab === 'calendar' ? 'bg-[#F7941D] text-white' : 'bg-transparent text-white hover:bg-white/10'}`}
            >
              Calendar View
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        {activeTab === 'tasks' ? <TaskKanban /> : <MeetingKanban />}
      </div>
    </div>
  );
}
