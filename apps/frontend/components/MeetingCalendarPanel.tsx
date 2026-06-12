'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../lib/axios';

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

function GoogleBadgeIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.3-1.9 3l3.1 2.4c1.8-1.7 2.9-4.1 2.9-7 0-.7-.1-1.4-.2-2.1H12z" />
      <path fill="#34A853" d="M12 22c2.6 0 4.8-.9 6.4-2.5l-3.1-2.4c-.9.6-2 .9-3.3.9-2.5 0-4.6-1.7-5.4-4H3.3v2.5C4.9 19.8 8.2 22 12 22z" />
      <path fill="#4A90E2" d="M6.6 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.5H3.3C2.5 9 2 10.5 2 12s.5 3 1.3 4.5L6.6 14z" />
      <path fill="#FBBC05" d="M12 6.8c1.4 0 2.7.5 3.7 1.4l2.8-2.8C16.8 3.8 14.6 3 12 3 8.2 3 4.9 5.2 3.3 8.5L6.6 11c.8-2.3 2.9-4.2 5.4-4.2z" />
    </svg>
  );
}

export default function MeetingCalendarPanel() {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthOffset, setMonthOffset] = useState(0);
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
  }, []);

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

  const toDateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const eventsForDay = (isoDate: string) => {
    return events
      .filter((e) => e.date && toDateKey(new Date(e.date)) === isoDate && (e.status === 'confirmed' || e.type === 'office_hour'))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const currentMonthDate = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1);
  const currentMonthLabel = currentMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const buildMonthGrid = () => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const gridStart = new Date(year, month, 1 - firstDayOfMonth);

    return Array.from({ length: 42 }).map((_, i) => {
      const cellDate = new Date(gridStart);
      cellDate.setDate(gridStart.getDate() + i);
      return {
        date: cellDate,
        isoDate: toDateKey(cellDate),
        inCurrentMonth: cellDate.getMonth() === month,
        isToday: toDateKey(cellDate) === toDateKey(new Date()),
      };
    });
  };

  const submitSchedule = async (e: FormEvent) => {
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

  const monthCells = buildMonthGrid();
  const targetLabel = userRole === 'mentor' ? 'Students' : 'Mentors';

  return (
    <div className="flex flex-col flex-1">
      <div className="bg-white border-2 border-[#1C1C1C] p-5 mb-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-1`}>Google Calendar</div>
          <div className="inline-flex items-center gap-2 border border-[#1C1C1C] px-2 py-1 bg-[#F5F4F0] mb-2">
            <GoogleBadgeIcon className="w-4 h-4" />
            <span className={`${F.space} text-[10px] tracking-[0.12em] uppercase text-[#1C1C1C]`}>
              {calendarConnected ? 'Google Linked' : 'Link Google Calendar'}
            </span>
          </div>
          {calendarConnected ? (
            <p className={`${F.space} text-sm text-[#1C1C1C]`}>Connected as {calendarEmail || 'your account'}.</p>
          ) : (
            <p className={`${F.space} text-sm text-[#888888]`}>Link your Google Calendar to sync confirmed meetings directly into both calendars.</p>
          )}
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={calendarConnected ? disconnectGoogleCalendar : connectGoogleCalendar}
            disabled={calendarConnecting}
            className={`${F.space} px-5 py-2.5 border-2 border-[#1C1C1C] font-bold text-[12px] tracking-[0.12em] uppercase ${calendarConnected ? 'bg-white text-[#1C1C1C] hover:bg-[#F5F4F0]' : 'bg-[#1C1C1C] text-white hover:bg-[#F7941D]'} transition-colors disabled:opacity-40`}
          >
            <span className="inline-flex items-center gap-2">
              <GoogleBadgeIcon className="w-4 h-4" />
              {calendarConnecting ? 'Linking...' : calendarConnected ? 'Unlink Google Calendar' : 'Link Google Calendar'}
            </span>
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
        <div>
          <div className={`${F.display} text-[#1C1C1C] font-bold text-2xl`}>{currentMonthLabel}</div>
          <div className={`${F.space} text-[#888888] text-sm`}>Month calendar view with synced confirmed meetings.</div>
        </div>
        <div className="flex border-2 border-[#1C1C1C]">
          <button onClick={() => setMonthOffset((v) => v - 1)} className={`${F.space} px-4 py-2 text-sm font-bold text-[#1C1C1C] border-r-2 border-[#1C1C1C] hover:bg-[#F5F4F0] transition`}>&lt; Prev</button>
          <button onClick={() => setMonthOffset(0)} className={`${F.space} px-4 py-2 text-sm font-bold text-[#1C1C1C] border-r-2 border-[#1C1C1C] hover:bg-[#F5F4F0] transition`}>Today</button>
          <button onClick={() => setMonthOffset((v) => v + 1)} className={`${F.space} px-4 py-2 text-sm font-bold text-[#1C1C1C] hover:bg-[#F5F4F0] transition`}>Next &gt;</button>
        </div>
      </div>

      <div className="border-2 border-[#1C1C1C] bg-white overflow-hidden pb-8">
        <div className="grid grid-cols-7 border-b-2 border-[#1C1C1C] bg-[#1C1C1C]">
          {weekdayLabels.map((day) => (
            <div key={day} className={`${F.space} text-center text-[11px] font-bold tracking-[0.16em] uppercase text-[#F7941D] py-3 border-r border-white/15 last:border-r-0`}>
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {monthCells.map((cell) => {
            const dayEvents = eventsForDay(cell.isoDate);
            const visibleEvents = dayEvents.slice(0, 3);
            const remaining = dayEvents.length - visibleEvents.length;

            return (
              <div
                key={cell.isoDate}
                className={`min-h-[150px] border-r border-b border-[#E5E5E5] p-2.5 ${cell.inCurrentMonth ? 'bg-white' : 'bg-[#F5F4F0]'} ${cell.isToday ? 'outline outline-2 outline-[#F7941D] outline-offset-[-2px]' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`${F.space} text-[11px] font-bold ${cell.inCurrentMonth ? 'text-[#1C1C1C]' : 'text-[#A8A8A8]'}`}>
                    {cell.date.getDate()}
                  </span>
                  {cell.isToday && (
                    <span className={`${F.space} text-[9px] tracking-[0.1em] uppercase px-1.5 py-0.5 bg-[#F7941D] text-white`}>Today</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  {visibleEvents.map((ev: any) => (
                    <div key={ev.id} className="border border-[#1C1C1C] bg-[#F5F4F0] px-2 py-1">
                      <div className={`${F.space} text-[10px] font-bold text-[#003580]`}>
                        {new Date(ev.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className={`${F.space} text-[10px] text-[#1C1C1C] truncate`} title={ev.title}>{ev.title}</div>
                    </div>
                  ))}

                  {remaining > 0 && (
                    <div className={`${F.space} text-[10px] text-[#888888] font-bold`}>+{remaining} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
