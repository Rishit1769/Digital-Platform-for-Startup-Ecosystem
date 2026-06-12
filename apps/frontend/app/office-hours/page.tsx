'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/axios';
import { DataPanel } from '../../components/DataPanel';

const F = {
  display: "font-[family-name:var(--font-playfair)]",
  space:   "font-[family-name:var(--font-space)]",
  serif:   "font-[family-name:var(--font-serif)]",
  bebas:   "font-[family-name:var(--font-bebas)]",
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function OfficeHours() {
  const router = useRouter();
  const [role,         setRole]         = useState<string>('');
  const [loading,      setLoading]      = useState(true);
  const [currentUser,  setCurrentUser]  = useState<any>(null);

  // ─── MENTOR STATE ───────────────────────────────────────────────────────────
  const [slots,        setSlots]        = useState<any[]>([]);
  const [bookings,     setBookings]     = useState<any[]>([]);
  const [showForm,     setShowForm]     = useState(false);
  const [newTitle,     setNewTitle]     = useState('');
  const [newDay,       setNewDay]       = useState('Mon');
  const [newStart,     setNewStart]     = useState('09:00');
  const [newEnd,       setNewEnd]       = useState('10:00');
  const [creating,     setCreating]     = useState(false);

  // ─── STUDENT STATE ──────────────────────────────────────────────────────────
  const [mentors,          setMentors]          = useState<any[]>([]);
  const [selectedMentor,   setSelectedMentor]   = useState<number | null>(null);
  const [mentorSlots,      setMentorSlots]      = useState<any[]>([]);
  const [studentDate,      setStudentDate]      = useState<string>('');
  const [studentBookings,  setStudentBookings]  = useState<any[]>([]);
  const [booking,          setBooking]          = useState<number | null>(null);

  useEffect(() => { init(); }, []);

  const init = async () => {
    try {
      const meRes = await api.get('/profile/me');
      const user  = meRes.data.data;
      setRole(user.role);
      setCurrentUser(user);
      if (user.role === 'mentor') {
        fetchMentorData(user.id);
      } else {
        fetchStudentData();
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchMentorData = async (mentorId: number) => {
    try {
      const res = await api.get(`/office-hours/mentor/${mentorId}`);
      setSlots(res.data.data.slots ?? []);
      setBookings(res.data.data.bookings ?? []);
    } catch (err) { console.error(err); }
  };

  const fetchStudentData = async () => {
    try {
      const [mRes, bRes] = await Promise.all([
        api.get('/discover/users?role=mentor'),
        api.get('/office-hours/my-bookings'),
      ]);
      setMentors(mRes.data.data ?? []);
      setStudentBookings(bRes.data.data ?? []);
    } catch (err) { console.error(err); }
  };

  const handleCreateSlot = async () => {
    if (!newTitle) return;
    setCreating(true);
    try {
      await api.post('/office-hours', { title: newTitle, day_of_week: newDay, start_time: newStart, end_time: newEnd });
      setShowForm(false); setNewTitle('');
      fetchMentorData(currentUser.id);
    } catch (err) { console.error(err); } finally { setCreating(false); }
  };

  const deactivateSlot = async (id: number) => {
    try { await api.delete(`/office-hours/${id}`); fetchMentorData(currentUser.id); }
    catch (err) { console.error(err); }
  };

  const handleSelectMentorAndDate = async (mentorId: number, date: string) => {
    setSelectedMentor(mentorId);
    setStudentDate(date);
    if (!date) { setMentorSlots([]); return; }
    try {
      const res = await api.get(`/office-hours/available/${mentorId}?date=${date}`);
      setMentorSlots(res.data.data ?? []);
    } catch (err) { console.error(err); }
  };

  const handleBook = async (slotId: number) => {
    if (!studentDate) return;
    setBooking(slotId);
    try {
      await api.post(`/office-hours/${slotId}/book`, { date: studentDate });
      fetchStudentData();
      handleSelectMentorAndDate(selectedMentor!, studentDate);
    } catch (err: any) { alert(err.response?.data?.error || 'Booking failed'); }
    finally { setBooking(null); }
  };

  const cancelBooking = async (id: number) => {
    try { await api.patch(`/office-hours/bookings/${id}/cancel`); fetchStudentData(); }
    catch (err) { console.error(err); }
  };

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
          <div className="flex items-center gap-6">
            <a href="/" className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 bg-[#F7941D]" />
              <span className={`${F.space} font-bold text-white text-lg tracking-[0.05em]`}>ECOSYSTEM</span>
            </a>
            <span className={`${F.space} text-white/30 text-[11px] tracking-[0.2em] uppercase hidden md:block`}>/ Office Hours</span>
          </div>
          <button onClick={() => router.push(role === 'mentor' ? '/mentor' : '/dashboard')}
            className={`${F.space} text-[12px] text-white/60 hover:text-white transition-colors border border-white/15 hover:border-white/40 px-4 py-2`}>
            ← {role === 'mentor' ? 'Mentor Dashboard' : 'Dashboard'}
          </button>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-[#003580] border-b-2 border-[#1C1C1C]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-14">
          <div className={`${F.space} text-[11px] tracking-[0.25em] uppercase text-[#F7941D] mb-4`}>
            {role === 'mentor' ? 'Availability Management' : '1:1 Sessions'}
          </div>
          <h1 className={`${F.display} font-black italic text-white leading-[0.92]`}
            style={{ fontSize: 'clamp(36px, 4vw, 56px)' }}>
            {role === 'mentor' ? 'Office Hours.' : 'Book a Session.'}
          </h1>
          <p className={`${F.serif} text-white/50 text-[15px] mt-4 max-w-xl leading-[1.7]`}>
            {role === 'mentor'
              ? 'Define your weekly availability. Students can book slots directly within your schedule.'
              : 'Find a mentor, pick a date, and book a 1:1 advising session.'}
          </p>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-12 flex flex-col gap-10">

        {/* ─── MENTOR VIEW ──────────────────────────────────────────────── */}
        {role === 'mentor' && (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 border-2 border-[#1C1C1C] divide-x-2 divide-[#1C1C1C]">
              {[
                { v: slots.length,                      l: 'Active Slots'    },
                { v: bookings.length,                   l: 'Upcoming Bookings' },
                { v: bookings.filter((b:any) => b.status === 'confirmed').length, l: 'Confirmed' },
              ].map(({ v, l }) => (
                <div key={l} className="bg-white px-8 py-6">
                  <div className={`${F.bebas} text-[#F7941D] leading-none`} style={{ fontSize: '3rem' }}>{v}</div>
                  <div className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#888888] mt-1`}>{l}</div>
                </div>
              ))}
            </div>

            {/* Weekly schedule */}
            <DataPanel eyebrow="Availability" title="Weekly Time Slots"
              action={
                <button onClick={() => setShowForm(s => !s)}
                  className={`${F.space} font-bold text-[12px] tracking-wide uppercase bg-[#F7941D] text-white px-5 py-2.5 hover:bg-[#1C1C1C] transition-colors`}>
                  {showForm ? 'Cancel' : '+ Add Slot'}
                </button>
              }>
              {showForm && (
                <div className="mb-8 p-6 border-2 border-[#1C1C1C] bg-[#F5F4F0] flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[180px]">
                    <label className="eco-label">Session Title</label>
                    <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                      placeholder="e.g. Strategy Review"
                      className="eco-input off-white" />
                  </div>
                  <div>
                    <label className="eco-label">Day</label>
                    <select value={newDay} onChange={e => setNewDay(e.target.value)} className="eco-input off-white">
                      {DAYS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="eco-label">Start</label>
                    <input type="time" value={newStart} onChange={e => setNewStart(e.target.value)} className="eco-input off-white" />
                  </div>
                  <div>
                    <label className="eco-label">End</label>
                    <input type="time" value={newEnd} onChange={e => setNewEnd(e.target.value)} className="eco-input off-white" />
                  </div>
                  <button onClick={handleCreateSlot} disabled={creating || !newTitle}
                    className={`${F.space} font-bold text-[12px] tracking-wide uppercase bg-[#1C1C1C] text-white px-6 py-3.5 hover:bg-[#F7941D] disabled:opacity-40 transition-colors mt-auto`}>
                    {creating ? 'Saving…' : 'Save Slot'}
                  </button>
                </div>
              )}

              {slots.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-[#DDDDDD]">
                  <div className={`${F.bebas} text-[#EEEEEE] leading-none`} style={{ fontSize: '6rem' }}>00</div>
                  <p className={`${F.space} text-[#AAAAAA] text-sm mt-3`}>No active time slots. Add your first slot above.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {slots.map(s => (
                    <div key={s.id} className="border-2 border-[#1C1C1C] bg-white p-5 flex items-center justify-between group hover:bg-[#F5F4F0] transition-colors">
                      <div>
                        <div className={`${F.space} font-bold text-[#1C1C1C] text-[15px]`}>{s.title}</div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className={`${F.space} font-bold text-[10px] tracking-[0.15em] uppercase border border-[#F7941D] text-[#F7941D] px-2 py-0.5`}>{s.day_of_week}</span>
                          <span className={`${F.space} text-[#888888] text-[12px]`}>{s.start_time?.substring(0,5)} – {s.end_time?.substring(0,5)}</span>
                        </div>
                      </div>
                      <button onClick={() => deactivateSlot(s.id)}
                        className={`${F.space} text-[11px] font-bold border border-[#CC0000] text-[#CC0000] hover:bg-[#CC0000] hover:text-white px-3 py-1.5 transition-colors opacity-0 group-hover:opacity-100`}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </DataPanel>

            {/* Upcoming bookings */}
            <DataPanel eyebrow="Schedule" title={`Upcoming Bookings (${bookings.length})`} noPadding>
              {bookings.length === 0 ? (
                <div className="py-12 text-center">
                  <p className={`${F.space} text-[#AAAAAA] text-[12px] tracking-widest uppercase`}>No bookings yet.</p>
                </div>
              ) : (
                <div className="divide-y-2 divide-[#F5F4F0]">
                  {bookings.map(b => (
                    <div key={b.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#F5F4F0] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#F5F4F0] border-2 border-[#1C1C1C] flex items-center justify-center flex-shrink-0">
                          <span className={`${F.bebas} text-[#1C1C1C] text-xl leading-none`}>{b.student_name?.charAt(0)}</span>
                        </div>
                        <div>
                          <div className={`${F.space} font-bold text-[#1C1C1C] text-[14px]`}>{b.student_name}</div>
                          <div className={`${F.space} text-[#888888] text-[12px]`}>
                            {new Date(b.booked_date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      </div>
                      <span className={`${F.space} font-bold text-[10px] tracking-[0.15em] uppercase px-2 py-0.5 border ${b.status === 'confirmed' ? 'border-[#1C1C1C] text-[#1C1C1C]' : 'border-[#888888] text-[#888888]'}`}>
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </DataPanel>
          </>
        )}

        {/* ─── STUDENT VIEW ──────────────────────────────────────────────── */}
        {role !== 'mentor' && (
          <>
            {/* Find a mentor */}
            <DataPanel eyebrow="Step 01" title="Choose a Mentor">
              {mentors.length === 0 ? (
                <p className={`${F.space} text-[#AAAAAA] text-[12px]`}>No mentors available right now.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {mentors.map(m => (
                    <button key={m.id}
                      onClick={() => handleSelectMentorAndDate(m.id, studentDate)}
                      className={`text-left border-2 p-5 transition-colors ${selectedMentor === m.id ? 'border-[#F7941D] bg-[#FFF8F0]' : 'border-[#1C1C1C] bg-white hover:bg-[#F5F4F0]'}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 bg-[#1C1C1C] flex items-center justify-center flex-shrink-0">
                          <span className={`${F.bebas} text-[#F7941D] text-xl leading-none`}>{m.name?.charAt(0)}</span>
                        </div>
                        <div className="min-w-0">
                          <div className={`${F.space} font-bold text-[#1C1C1C] text-[14px] truncate`}>{m.name}</div>
                          {m.profile?.designation && (
                            <div className={`${F.space} text-[#888888] text-[11px] truncate`}>{m.profile.designation}</div>
                          )}
                        </div>
                      </div>
                      {selectedMentor === m.id && (
                        <div className={`${F.space} text-[10px] font-bold tracking-[0.15em] uppercase text-[#F7941D]`}>Selected</div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {selectedMentor && (
                <div className="border-t-2 border-[#1C1C1C] pt-6">
                  <label className="eco-label">Pick a Date</label>
                  <input type="date"
                    value={studentDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => handleSelectMentorAndDate(selectedMentor, e.target.value)}
                    className="eco-input off-white max-w-xs" />
                </div>
              )}
            </DataPanel>

            {/* Available slots */}
            {selectedMentor && studentDate && (
              <DataPanel eyebrow="Step 02" title="Available Slots">
                {mentorSlots.length === 0 ? (
                  <div className="py-8 text-center border-2 border-dashed border-[#DDDDDD]">
                    <p className={`${F.space} text-[#AAAAAA]`}>No availability on this day. Try another date.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {mentorSlots.map(s => {
                      const full = s.booked_count >= s.max_bookings;
                      return (
                        <div key={s.id} className={`border-2 p-5 flex items-center justify-between transition-colors ${full ? 'border-[#DDDDDD] bg-[#F5F4F0] opacity-60' : 'border-[#1C1C1C] bg-white'}`}>
                          <div>
                            <div className={`${F.space} font-bold text-[#1C1C1C] text-[15px] mb-1`}>{s.title}</div>
                            <div className={`${F.space} text-[#888888] text-[12px]`}>
                              {s.start_time?.substring(0, 5)} – {s.end_time?.substring(0, 5)}
                            </div>
                            <div className={`${F.space} text-[10px] uppercase tracking-wide mt-1 ${full ? 'text-[#CC0000]' : 'text-[#888888]'}`}>
                              {s.booked_count}/{s.max_bookings} slots taken
                            </div>
                          </div>
                          <button
                            onClick={() => !full && handleBook(s.id)}
                            disabled={full || booking === s.id}
                            className={`${F.space} font-bold text-[11px] tracking-wide uppercase px-4 py-3 transition-colors ${full ? 'border border-[#DDDDDD] text-[#AAAAAA] cursor-not-allowed' : 'bg-[#F7941D] text-white hover:bg-[#1C1C1C] disabled:opacity-40'}`}>
                            {booking === s.id ? '…' : full ? 'Full' : 'Book'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </DataPanel>
            )}

            {/* My bookings */}
            <DataPanel eyebrow="My Bookings" title={`Booked Sessions (${studentBookings.length})`} noPadding>
              {studentBookings.length === 0 ? (
                <div className="py-12 text-center">
                  <p className={`${F.space} text-[#AAAAAA] text-[12px] tracking-widest uppercase`}>No bookings yet.</p>
                </div>
              ) : (
                <div className="divide-y-2 divide-[#F5F4F0]">
                  {studentBookings.map(b => (
                    <div key={b.booking_id} className="flex items-center justify-between px-6 py-4 hover:bg-[#F5F4F0] transition-colors">
                      <div>
                        <div className={`${F.space} font-bold text-[#1C1C1C] text-[14px]`}>{b.title}</div>
                        <div className={`${F.serif} text-[#888888] text-[13px] mt-0.5`}>
                          with {b.mentor_name} · {new Date(b.booked_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at {b.start_time?.substring(0, 5)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`${F.space} font-bold text-[10px] tracking-[0.15em] uppercase px-2 py-0.5 border ${b.status === 'confirmed' ? 'border-[#1C1C1C] text-[#1C1C1C]' : 'border-[#888888] text-[#888888]'}`}>
                          {b.status}
                        </span>
                        {b.status === 'confirmed' && (
                          <button onClick={() => cancelBooking(b.booking_id)}
                            className={`${F.space} text-[11px] font-bold border border-[#CC0000] text-[#CC0000] hover:bg-[#CC0000] hover:text-white px-3 py-1.5 transition-colors`}>
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DataPanel>
          </>
        )}

      </div>
    </div>
  );
}
