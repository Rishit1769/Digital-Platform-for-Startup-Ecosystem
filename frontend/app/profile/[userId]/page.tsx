'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { api } from '../../../lib/axios';
import Avatar from '../../../components/Avatar';
import { BadgesGrid } from '../../../components/GamificationWidgets';

export default function UserProfile({ params }: { params: Promise<{ userId: string }> }) {
  const router = useRouter();
  const { userId } = use(params);
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [gamification, setGamification] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  // Meeting Request State
  const [showMeetModal, setShowMeetModal] = useState(false);
  const [meetTitle, setMeetTitle] = useState('');
  const [meetDesc, setMeetDesc] = useState('');
  const [slots, setSlots] = useState<string[]>(['', '', '']);

  useEffect(() => {
    fetchProfile();
    
    // Fetch user gamification profile
    api.get(userId === 'me' ? '/gamification/me' : `/gamification/user/${userId}`)
       .then(res => setGamification(res.data.data)).catch(console.error);

    // Fetch history only if it's "me"
    if (userId === 'me') {
       api.get('/gamification/me/history').then(res => setHistory(res.data.data)).catch(console.error);
    }
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/profile/${userId}`);
      setProfile(res.data.data);
    } catch(err) { console.error(err); } finally { setLoading(false); }
  };

  const handleRequestMeeting = async () => {
    if (!meetTitle || !slots.every(s => s)) return alert('Fill all fields and 3 slots.');
    try {
      const proposed_slots = slots.map(s => new Date(s).toISOString());
      await api.post('/meetings', { attendee_id: userId, title: meetTitle, description: meetDesc, proposed_slots });
      setShowMeetModal(false);
      alert('Meeting request sent!');
    } catch (err: any) {
      alert('Failed: ' + (err.response?.data?.error || err.message));
    }
  };

  if(loading) return <div className="p-8 text-center text-blue-600 font-bold">Loading Profile...</div>;
  if(!profile) return <div className="p-8 text-center">User not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center text-center">
          <Avatar name={profile.name} avatarUrl={profile.profile?.avatar_url} size="xl" verified={profile.is_verified} />
          <h1 className="mt-6 text-3xl font-bold dark:text-white">{profile.name}</h1>
          <p className="text-gray-500 font-medium mt-1 uppercase tracking-wider text-sm">{profile.role}</p>
          <p className="mt-4 max-w-2xl text-gray-700 dark:text-gray-300">{profile.profile?.bio || 'No bio provided'}</p>

          <div className="mt-8 flex gap-4">
             <button onClick={()=>setShowMeetModal(true)} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow hover:bg-blue-700 transition">Request Meeting</button>
             {profile.role === 'mentor' && (
               <button onClick={()=>router.push('/office-hours')} className="px-8 py-3 bg-purple-600 text-white font-bold rounded-xl shadow hover:bg-purple-700 transition">View Office Hours</button>
             )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
         {/* Render gamification badges if available */}
         {gamification && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border shadow-sm">
               <h2 className="font-bold text-xl dark:text-white mb-6">Achievements & Badges</h2>
               <BadgesGrid badges={Array.isArray(gamification.badges) ? gamification.badges : (typeof gamification.badges === 'string' && gamification.badges ? (() => { try { return JSON.parse(gamification.badges); } catch { return []; } })() : [])} />
            </div>
         )}
         
         {/* History Feed - Only if it's "me" */}
         {userId === 'me' && history.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border shadow-sm">
               <h2 className="font-bold text-xl dark:text-white mb-6">Recent XP Activity</h2>
               <div className="space-y-4">
                  {history.map((h: any, i: number) => (
                     <div key={i} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700">
                        <div className="flex gap-4 items-center">
                           <div className="text-2xl">{h.event_type.includes('login') ? '👋' : h.event_type.includes('idea') ? '💡' : h.event_type.includes('startup') ? '🚀' : h.event_type.includes('meeting') ? '📅' : '⭐'}</div>
                           <div>
                              <div className="font-bold text-gray-900 dark:text-white capitalize">{h.event_type.replace(/_/g, ' ')}</div>
                              <div className="text-xs text-gray-500">{new Date(h.created_at).toLocaleString()}</div>
                           </div>
                        </div>
                        <div className="font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded-full text-sm">+{h.xp_awarded} XP</div>
                     </div>
                  ))}
               </div>
            </div>
         )}
         {/* Render profile fields (skills, domains, etc) lightly here... */}
         <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border shadow-sm">
           <h2 className="font-bold text-lg dark:text-white mb-4">Skills</h2>
           <div className="flex gap-2 flex-wrap">
             {(() => {
               const raw = profile.profile?.skills;
               if (!raw) return null;
               const arr = Array.isArray(raw) ? raw : (typeof raw === 'string' && raw ? (() => { try { return JSON.parse(raw); } catch { return []; } })() : []);
               return arr.map((s: string, i: number) => (
                 <span key={i} className="bg-gray-100 text-gray-700 px-3 py-1 rounded font-medium">{s}</span>
               ));
             })()}
           </div>
         </div>
      </div>

      {showMeetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-3xl p-8 shadow-2xl relative">
            <button onClick={() => setShowMeetModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">✕</button>
            <h2 className="text-2xl font-bold mb-2 dark:text-white">Request Meeting</h2>
            <p className="text-gray-500 text-sm mb-6">Propose 3 slots. The attendee will pick one.</p>
            
            <div className="space-y-4">
              <input type="text" placeholder="Meeting Title" value={meetTitle} onChange={e=>setMeetTitle(e.target.value)} className="w-full border p-3 rounded-xl bg-gray-50" />
              <textarea placeholder="Agenda / Description" value={meetDesc} onChange={e=>setMeetDesc(e.target.value)} className="w-full border p-3 rounded-xl bg-gray-50" rows={3} />
              
              <div className="pt-2">
                <label className="font-medium text-sm text-gray-700 dark:text-gray-300">Proposed Slot 1</label>
                <input type="datetime-local" value={slots[0]} onChange={e => setSlots([e.target.value, slots[1], slots[2]])} className="w-full border p-3 rounded-xl bg-gray-50 mt-1" />
              </div>
              <div>
                <label className="font-medium text-sm text-gray-700 dark:text-gray-300">Proposed Slot 2</label>
                <input type="datetime-local" value={slots[1]} onChange={e => setSlots([slots[0], e.target.value, slots[2]])} className="w-full border p-3 rounded-xl bg-gray-50 mt-1" />
              </div>
              <div>
                <label className="font-medium text-sm text-gray-700 dark:text-gray-300">Proposed Slot 3</label>
                <input type="datetime-local" value={slots[2]} onChange={e => setSlots([slots[0], slots[1], e.target.value])} className="w-full border p-3 rounded-xl bg-gray-50 mt-1" />
              </div>

              <button onClick={handleRequestMeeting} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 mt-4">Send Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
