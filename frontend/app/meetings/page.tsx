'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/axios';

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
