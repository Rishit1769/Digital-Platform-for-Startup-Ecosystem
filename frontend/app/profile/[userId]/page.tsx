'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { api } from '../../../lib/axios';
import Avatar from '../../../components/Avatar';
import { BadgesGrid } from '../../../components/GamificationWidgets';

const F = {
  display: "font-[family-name:var(--font-playfair)]",
  space:   "font-[family-name:var(--font-space)]",
  serif:   "font-[family-name:var(--font-serif)]",
  bebas:   "font-[family-name:var(--font-bebas)]",
};

export default function UserProfile({ params }: { params: Promise<{ userId: string }> }) {
  const router = useRouter();
  const { userId } = use(params);
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Meeting Request State
  const [showMeetModal, setShowMeetModal] = useState(false);
  const [meetTitle, setMeetTitle] = useState('');
  const [meetDesc, setMeetDesc] = useState('');
  const [slots, setSlots] = useState<string[]>(['', '', '']);

  useEffect(() => {
    fetchProfile();
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

  if(loading) return <div className="p-8 text-center text-[#F7941D] font-bold">Loading Profile...</div>;
  if(!profile) return <div className="p-8 text-center">User not found.</div>;

  return (
    <div className="min-h-screen bg-[#F5F4F0]">
      {/* Hero header */}
      <div className="bg-white border-b-2 border-[#1C1C1C]">
        <div className="max-w-4xl mx-auto px-6 py-12 flex flex-col items-center text-center">
          <div className="w-24 h-24 border-2 border-[#1C1C1C] overflow-hidden bg-[#F5F4F0] flex items-center justify-center">
            <Avatar name={profile.name} avatarUrl={profile.profile?.avatar_url} size="xl" verified={profile.is_verified} />
          </div>
          <h1 className={`${F.display} mt-5 text-3xl font-bold text-[#1C1C1C]`}>{profile.name}</h1>
          <p className={`${F.space} text-[#F7941D] font-bold mt-1 uppercase tracking-[0.2em] text-xs`}>{profile.role}</p>
          <p className={`${F.serif} mt-4 max-w-2xl text-[#444444] text-base`}>{profile.profile?.bio || 'No bio provided'}</p>

          <div className="mt-8 flex gap-3 flex-wrap justify-center">
            <button
              onClick={() => setShowMeetModal(true)}
              className={`${F.space} px-8 py-3 bg-[#F7941D] text-white font-bold text-sm tracking-[0.05em] border-2 border-[#1C1C1C] hover:bg-[#e8850e] transition`}
            >
              Request Meeting
            </button>
            {profile.role === 'mentor' && (
              <button
                onClick={() => router.push('/office-hours')}
                className={`${F.space} px-8 py-3 bg-white text-[#1C1C1C] font-bold text-sm tracking-[0.05em] border-2 border-[#1C1C1C] hover:bg-[#F5F4F0] transition`}
              >
                View Office Hours
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        {/* Badges */}
        <div className="bg-white border-2 border-[#1C1C1C] p-8">
          <div className="border-b-2 border-[#1C1C1C] pb-3 mb-6">
            <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-1`}>Recognition</div>
            <h2 className={`${F.display} font-bold text-[#1C1C1C] text-xl`}>Achievements &amp; Badges</h2>
          </div>
          <BadgesGrid badges={Array.isArray(profile.badges) ? profile.badges : []} />
        </div>

        {/* Skills */}
        <div className="bg-white border-2 border-[#1C1C1C] p-8">
          <div className="border-b-2 border-[#1C1C1C] pb-3 mb-6">
            <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-1`}>Expertise</div>
            <h2 className={`${F.display} font-bold text-[#1C1C1C] text-xl`}>Skills</h2>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(() => {
              const raw = profile.profile?.skills;
              if (!raw) return <span className={`${F.space} text-sm text-[#888888]`}>No skills listed yet.</span>;
              const arr = Array.isArray(raw) ? raw : (typeof raw === 'string' && raw ? (() => { try { return JSON.parse(raw); } catch { return []; } })() : []);
              return arr.map((s: string, i: number) => (
                <span key={i} className={`${F.space} bg-[#F5F4F0] text-[#1C1C1C] border-2 border-[#1C1C1C] px-3 py-1 text-sm font-bold`}>{s}</span>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* Request Meeting Modal */}
      {showMeetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white border-2 border-[#1C1C1C] w-full max-w-lg relative">
            <div className="bg-[#1C1C1C] px-8 py-5 flex items-center justify-between">
              <div>
                <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-0.5`}>Schedule</div>
                <h2 className={`${F.display} text-white font-bold text-xl`}>Request Meeting</h2>
              </div>
              <button
                onClick={() => setShowMeetModal(false)}
                className="text-white hover:text-[#F7941D] transition text-2xl leading-none font-bold"
              >
                &times;
              </button>
            </div>

            <div className="px-8 py-6 space-y-4">
              <p className={`${F.space} text-[#888888] text-sm`}>Propose 3 time slots. The attendee will pick one.</p>

              <div>
                <label className={`${F.space} block text-xs font-bold tracking-[0.15em] uppercase text-[#1C1C1C] mb-1`}>Meeting Title</label>
                <input
                  type="text"
                  placeholder="e.g. Career Guidance Session"
                  value={meetTitle}
                  onChange={e => setMeetTitle(e.target.value)}
                  className={`${F.space} w-full border-2 border-[#1C1C1C] bg-[#F5F4F0] px-4 py-3 text-sm text-[#1C1C1C] focus:outline-none focus:border-[#F7941D]`}
                />
              </div>

              <div>
                <label className={`${F.space} block text-xs font-bold tracking-[0.15em] uppercase text-[#1C1C1C] mb-1`}>Agenda / Description</label>
                <textarea
                  placeholder="What would you like to discuss?"
                  value={meetDesc}
                  onChange={e => setMeetDesc(e.target.value)}
                  rows={3}
                  className={`${F.space} w-full border-2 border-[#1C1C1C] bg-[#F5F4F0] px-4 py-3 text-sm text-[#1C1C1C] focus:outline-none focus:border-[#F7941D] resize-none`}
                />
              </div>

              {[0, 1, 2].map(idx => (
                <div key={idx}>
                  <label className={`${F.space} block text-xs font-bold tracking-[0.15em] uppercase text-[#1C1C1C] mb-1`}>Proposed Slot {idx + 1}</label>
                  <input
                    type="datetime-local"
                    value={slots[idx]}
                    onChange={e => {
                      const updated = [...slots];
                      updated[idx] = e.target.value;
                      setSlots(updated);
                    }}
                    className={`${F.space} w-full border-2 border-[#1C1C1C] bg-[#F5F4F0] px-4 py-3 text-sm text-[#1C1C1C] focus:outline-none focus:border-[#F7941D]`}
                  />
                </div>
              ))}

              <button
                onClick={handleRequestMeeting}
                className={`${F.space} w-full py-3 bg-[#F7941D] text-white font-bold text-sm tracking-[0.05em] border-2 border-[#1C1C1C] hover:bg-[#e8850e] transition mt-2`}
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
