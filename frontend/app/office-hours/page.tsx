'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/axios';

export default function OfficeHours() {
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // MENTOR STATE
  const [slots, setSlots] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDay, setNewDay] = useState('Mon');
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('10:00');

  // STUDENT STATE
  const [mentors, setMentors] = useState<any[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<number|null>(null);
  const [mentorSlots, setMentorSlots] = useState<any[]>([]);
  const [studentDate, setStudentDate] = useState<string>('');
  const [studentBookings, setStudentBookings] = useState<any[]>([]);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      const meRes = await api.get('/profile/me');
      setRole(meRes.data.data.role);
      setCurrentUser(meRes.data.data);

      if (meRes.data.data.role === 'mentor') {
        fetchMentorData(meRes.data.data.id);
      } else {
        fetchStudentData();
      }
    } catch(err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchMentorData = async (mentorId: number) => {
    try {
      const res = await api.get(`/office-hours/mentor/\${mentorId}`);
      setSlots(res.data.data.slots);
      setBookings(res.data.data.bookings);
    } catch(err) { console.error(err); }
  };

  const fetchStudentData = async () => {
    try {
      // Just fetch all mentors for simplicity
      const res = await api.get('/discover/users?role=mentor');
      setMentors(res.data.data);
      const bRes = await api.get('/office-hours/my-bookings');
      setStudentBookings(bRes.data.data);
    } catch(err) { console.error(err); }
  };

  // Mentor Actions
  const handleCreateSlot = async () => {
    try {
      await api.post('/office-hours', { title: newTitle, day_of_week: newDay, start_time: newStart, end_time: newEnd });
      setShowAddForm(false);
      fetchMentorData(currentUser.id);
    } catch(err) { console.error(err); }
  };

  const deactivateSlot = async (id: number) => {
    try {
      await api.delete(`/office-hours/\${id}`);
      fetchMentorData(currentUser.id);
    } catch(err) { console.error(err); }
  };

  // Student Actions
  const handleSelectMentorAndDate = async (mentorId: number, date: string) => {
    setSelectedMentor(mentorId);
    setStudentDate(date);
    if (!date) return;
    try {
      const res = await api.get(`/office-hours/available/\${mentorId}?date=\${date}`);
      setMentorSlots(res.data.data);
    } catch(err) { console.error(err); }
  };

  const handleBook = async (slotId: number) => {
    if (!studentDate) return alert('Select date first');
    try {
      await api.post(`/office-hours/\${slotId}/book`, { date: studentDate });
      alert('Booked successfully');
      fetchStudentData();
      handleSelectMentorAndDate(selectedMentor!, studentDate);
    } catch(err: any) { alert(err.response?.data?.error || 'Booking failed'); }
  };
  
  const cancelBooking = async (id: number) => {
    try {
       await api.patch(`/office-hours/bookings/\${id}/cancel`);
       fetchStudentData();
    } catch(err) { console.error(err); }
  };

  if (loading) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-20">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Office Hours</h1>
          <p className="text-gray-500 mt-2">{role === 'mentor' ? 'Manage your availability and upcoming advising sessions.' : 'Book 1:1 sessions with industry experts.'}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* MENTOR VIEW */}
        {role === 'mentor' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
               <h2 className="text-xl font-bold dark:text-white">My Weekly Rules</h2>
               <button onClick={()=>setShowAddForm(true)} className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">+ Add Slot</button>
            </div>

            {showAddForm && (
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 shadow-sm flex gap-4 items-end">
                 <div><label className="block text-sm text-gray-500">Title</label><input type="text" value={newTitle} onChange={e=>setNewTitle(e.target.value)} className="border p-2 rounded-lg mt-1 w-full bg-gray-50" placeholder="E.g. Strategy Review"/></div>
                 <div>
                   <label className="block text-sm text-gray-500">Day</label>
                   <select value={newDay} onChange={e=>setNewDay(e.target.value)} className="border p-2 rounded-lg mt-1 bg-gray-50">
                     {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=><option key={d}>{d}</option>)}
                   </select>
                 </div>
                 <div><label className="block text-sm text-gray-500">Start</label><input type="time" value={newStart} onChange={e=>setNewStart(e.target.value)} className="border p-2 rounded-lg mt-1 bg-gray-50"/></div>
                 <div><label className="block text-sm text-gray-500">End</label><input type="time" value={newEnd} onChange={e=>setNewEnd(e.target.value)} className="border p-2 rounded-lg mt-1 bg-gray-50"/></div>
                 <button onClick={handleCreateSlot} className="px-5 py-2.5 bg-green-600 text-white font-bold rounded-xl">Save</button>
                 <button onClick={()=>setShowAddForm(false)} className="px-5 py-2.5 text-gray-500 font-bold rounded-xl">Cancel</button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Slots List */}
               <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                 <h3 className="font-bold mb-4 dark:text-white">Active Time Slots</h3>
                 <div className="space-y-3">
                   {slots.length===0 && <p className="text-gray-500">No active slots.</p>}
                   {slots.map(s => (
                     <div key={s.id} className="flex justify-between items-center p-3 border rounded-xl dark:border-gray-600">
                       <div>
                         <div className="font-bold dark:text-white">{s.title}</div>
                         <div className="text-sm text-blue-600 font-mono tracking-wide">{s.day_of_week} • {s.start_time.substring(0,5)} - {s.end_time.substring(0,5)}</div>
                       </div>
                       <button onClick={()=>deactivateSlot(s.id)} className="text-red-500 text-sm font-bold">Remove</button>
                     </div>
                   ))}
                 </div>
               </div>

               {/* Bookings List */}
               <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                 <h3 className="font-bold mb-4 dark:text-white">Upcoming Bookings</h3>
                 <div className="space-y-3">
                   {bookings.length===0 && <p className="text-gray-500">No bookings yet.</p>}
                   {bookings.map(b => (
                     <div key={b.id} className="p-4 border rounded-xl bg-gray-50 dark:bg-gray-700">
                       <div className="font-bold dark:text-white">{b.student_name}</div>
                       <div className="text-sm text-gray-600 dark:text-gray-300">Booked for {new Date(b.booked_date).toLocaleDateString()}</div>
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          </div>
        )}

        {/* STUDENT VIEW */}
        {role !== 'mentor' && (
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
               <h2 className="text-xl font-bold dark:text-white mb-4">Find a Mentor</h2>
               <div className="flex gap-4 overflow-x-auto pb-4">
                 {mentors.map(m => (
                   <div key={m.id} onClick={()=>handleSelectMentorAndDate(m.id, studentDate)} className={`flex-shrink-0 w-64 p-4 border rounded-2xl cursor-pointer transition \${selectedMentor===m.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md' : 'hover:border-gray-300'}`}>
                     <div className="font-bold truncate dark:text-white">{m.name}</div>
                     <div className="text-xs text-gray-500 truncate">{m.role}</div>
                   </div>
                 ))}
               </div>
               
               {selectedMentor && (
                 <div className="mt-6 border-t pt-6">
                   <h3 className="font-bold mb-2">Select Date</h3>
                   <input type="date" value={studentDate} onChange={e=>handleSelectMentorAndDate(selectedMentor, e.target.value)} className="border p-3 rounded-xl bg-gray-50 w-64" />
                   
                   {studentDate && (
                     <div className="mt-4 space-y-3">
                       {mentorSlots.length===0 && <p className="text-gray-500 text-sm">No availability on this day of the week.</p>}
                       {mentorSlots.map(s => (
                         <div key={s.id} className="flex justify-between items-center p-4 border rounded-xl bg-gray-50 dark:bg-gray-700">
                           <div>
                             <div className="font-bold dark:text-white">{s.title}</div>
                             <div className="text-sm font-mono text-blue-600">{s.start_time.substring(0,5)} - {s.end_time.substring(0,5)}</div>
                             <div className="text-xs text-gray-500 mt-1">{s.booked_count} of {s.max_bookings} booked</div>
                           </div>
                           <button onClick={()=>handleBook(s.id)} disabled={s.booked_count >= s.max_bookings} className="px-5 py-2 bg-blue-600 disabled:opacity-50 text-white font-bold rounded-xl">{s.booked_count >= s.max_bookings ? 'Full' : 'Book'}</button>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
               )}
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
               <h2 className="text-xl font-bold dark:text-white mb-4">My Bookings</h2>
               <div className="space-y-3">
                 {studentBookings.length===0 && <p className="text-gray-500 text-sm">You haven't booked any slots.</p>}
                 {studentBookings.map(b => (
                   <div key={b.booking_id} className="flex justify-between items-center p-4 border rounded-xl bg-gray-50 dark:bg-gray-700">
                     <div>
                       <div className="font-bold dark:text-white">{b.title} w/ {b.mentor_name}</div>
                       <div className="text-sm text-gray-600 dark:text-gray-300">{new Date(b.booked_date).toLocaleDateString()} at {b.start_time.substring(0,5)}</div>
                     </div>
                     <div className="flex items-center gap-4">
                       <span className="text-xs font-bold uppercase tracking-wider text-green-600 bg-green-100 px-2 py-1 rounded">{b.status}</span>
                       {b.status === 'confirmed' && <button onClick={()=>cancelBooking(b.booking_id)} className="text-red-500 text-sm font-bold">Cancel</button>}
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
