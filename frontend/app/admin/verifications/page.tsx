'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/axios';
import { DataPanel } from '../../../components/DataPanel';
import EcoTable, { EcoRow, StatusBadge } from '../../../components/EcoTable';

const F = {
  display: "font-[family-name:var(--font-playfair)]",
  space:   "font-[family-name:var(--font-space)]",
  serif:   "font-[family-name:var(--font-serif)]",
  bebas:   "font-[family-name:var(--font-bebas)]",
};

export default function Verifications() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/admin/verification-requests');
      setRequests(res.data.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleVerify = async (userId: number, role: string) => {
    try {
      const badge_type = role === 'mentor' ? 'verified_mentor' : 'verified_student';
      await api.post(`/admin/verify/${userId}`, { badge_type });
      fetchRequests();
    } catch (err) { console.error(err); }
  };

  const handleReject = async (userId: number) => {
    try {
      await api.delete(`/admin/verify/${userId}`);
      fetchRequests();
    } catch (err) { console.error(err); }
  };

  const COLS = [
    { label: 'User',                span: 'col-span-4' },
    { label: 'Role / Institution',  span: 'col-span-3' },
    { label: 'Profile Strength',    span: 'col-span-3' },
    { label: 'Action',              span: 'col-span-2', align: 'right' as const },
  ];

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
            <span className={`${F.space} text-white/30 text-[11px] tracking-[0.2em] uppercase hidden md:block`}>/ Verifications</span>
          </div>
          <button onClick={() => router.push('/admin')}
            className={`${F.space} text-[12px] tracking-wide text-white/60 hover:text-white transition-colors border border-white/15 hover:border-white/40 px-4 py-2`}>
            ← Admin Console
          </button>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-[#003580] border-b-2 border-[#1C1C1C]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-14">
          <div className={`${F.space} text-[11px] tracking-[0.25em] uppercase text-[#F7941D] mb-4`}>Trust & Compliance</div>
          <div className="flex items-end justify-between flex-wrap gap-6">
            <h1 className={`${F.display} font-black italic text-white leading-[0.92]`}
              style={{ fontSize: 'clamp(36px, 4vw, 56px)' }}>
              Verification Centre.
            </h1>
            <div className="border-2 border-white/20 px-6 py-4">
              <div className={`${F.bebas} text-[#F7941D] leading-none`} style={{ fontSize: '2.5rem' }}>{requests.length}</div>
              <div className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-white/50 mt-0.5`}>Pending Requests</div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-12">
        <DataPanel noPadding
          eyebrow="Awaiting Review"
          title={`Pending Requests (${requests.length})`}
        >
          <div className="px-6 lg:px-8 pb-6">
            <EcoTable cols={COLS} loading={loading} empty="No pending verification requests.">
              {requests.map(req => {
                const strength = req.bio && req.skills ? 100 : req.skills ? 60 : 25;
                const strengthLabel = strength === 100 ? 'Strong' : strength === 60 ? 'Medium' : 'Weak';
                const strengthColor = strength === 100 ? '#1C1C1C' : strength === 60 ? '#F7941D' : '#CC0000';
                return (
                  <EcoRow key={req.id}>
                    {/* User */}
                    <div className="col-span-12 md:col-span-4 flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#1C1C1C] flex items-center justify-center flex-shrink-0">
                        <span className={`${F.bebas} text-[#F7941D] text-xl leading-none`}>{req.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <div className={`${F.space} font-bold text-[#1C1C1C] text-[14px] cursor-pointer hover:text-[#F7941D] transition-colors truncate`}
                          onClick={() => router.push(`/profile/${req.id}`)}>
                          {req.name}
                        </div>
                        <div className={`${F.space} text-[#888888] text-[11px] truncate`}>{req.email}</div>
                      </div>
                    </div>

                    {/* Role / Institution */}
                    <div className="hidden md:block col-span-3">
                      <StatusBadge
                        label={req.role.toUpperCase()}
                        color={req.role === 'mentor' ? 'blue' : 'dark'}
                      />
                      <div className={`${F.serif} text-[#555555] text-[13px] mt-1.5`}>
                        {req.role === 'mentor' ? req.company || '—' : req.college || '—'}
                      </div>
                    </div>

                    {/* Strength */}
                    <div className="hidden md:block col-span-3">
                      <div className="flex items-center gap-3">
                        <div className="eco-progress-bar flex-1">
                          <div className="eco-progress-bar-fill" style={{ width: strength + '%', backgroundColor: strengthColor }} />
                        </div>
                        <span className={`${F.space} text-[11px] font-bold w-14 flex-shrink-0`} style={{ color: strengthColor }}>
                          {strengthLabel}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="col-span-12 md:col-span-2 flex items-center justify-end gap-2">
                      <button onClick={() => handleReject(req.id)}
                        className={`${F.space} font-bold text-[11px] tracking-wide border border-[#CC0000] text-[#CC0000] hover:bg-[#CC0000] hover:text-white px-3 py-2 transition-colors`}>
                        Reject
                      </button>
                      <button onClick={() => handleVerify(req.id, req.role)}
                        className={`${F.space} font-bold text-[11px] tracking-wide bg-[#1C1C1C] text-white hover:bg-[#F7941D] px-3 py-2 transition-colors`}>
                        Approve
                      </button>
                    </div>
                  </EcoRow>
                );
              })}
            </EcoTable>
          </div>
        </DataPanel>
      </div>
    </div>
  );
}
