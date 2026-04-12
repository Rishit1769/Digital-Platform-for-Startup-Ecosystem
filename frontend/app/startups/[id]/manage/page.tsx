'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { api } from '../../../../lib/axios';

export default function ManageStartup({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [startup, setStartup] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Local state for editing details
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [stage, setStage] = useState('');
  const [domain, setDomain] = useState('');

  // Apps
  const [apps, setApps] = useState<{ [roleId: string]: any[] }>({});

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const res = await api.get(`/startups/${id}`);
      const s = res.data.data;
      setStartup(s);
      setName(s.name);
      setTagline(s.tagline || '');
      setDescription(s.description || '');
      setStage(s.stage || '');
      setDomain(s.domain || '');

      // For each open role, fetch applications
      const appsMap: any = {};
      for (const role of s.open_roles) {
        const appsRes = await api.get(`/roles/${role.id}/applications`);
        appsMap[role.id] = appsRes.data.data;
      }
      setApps(appsMap);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/startups/${id}`, { name, tagline, description, stage, domain });
      alert('Startup details updated!');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (confirm('Are you sure you want to remove this member?')) {
      try {
        await api.delete(`/startups/${id}/members/${userId}`);
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAppStatus = async (roleId: number, appId: number, status: string) => {
    try {
      await api.patch(`/roles/${roleId}/applications/${appId}`, { status });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8">Loading settings...</div>;
  if (!startup) return <div className="p-8">Startup not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 dark:bg-gray-800">
          <div>
            <h1 className="text-2xl font-bold dark:text-white">Manage Startup</h1>
            <p className="text-gray-500">Configure your team, applications, and core details.</p>
          </div>
          <button onClick={() => router.push(`/startups/${id}`)} className="px-4 py-2 border rounded-xl hover:bg-gray-50 dark:text-white transition">View Public Profile</button>
        </div>

        {/* Details Form */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col space-y-4">
          <h2 className="text-xl font-bold dark:text-white">Core Details</h2>
          <div className="grid grid-cols-2 gap-4">
             <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</label><input type="text" className="w-full mt-1 border p-2 rounded-lg" value={name} onChange={e=>setName(e.target.value)}/></div>
             <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300">Domain</label><input type="text" className="w-full mt-1 border p-2 rounded-lg" value={domain} onChange={e=>setDomain(e.target.value)}/></div>
          </div>
          <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tagline</label><input type="text" className="w-full mt-1 border p-2 rounded-lg" value={tagline} onChange={e=>setTagline(e.target.value)}/></div>
          <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label><textarea className="w-full mt-1 border p-2 rounded-lg" rows={3} value={description} onChange={e=>setDescription(e.target.value)}/></div>
          <button onClick={handleUpdate} className="self-end px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Changes</button>
        </div>

        {/* Members */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold dark:text-white mb-4">Team Members</h2>
          <div className="space-y-3">
            {startup.members.map((m: any) => (
              <div key={m.member_id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 border rounded-xl">
                <div>
                  <div className="font-bold dark:text-white">{m.name}</div>
                  <div className="text-sm text-gray-500">{m.role}</div>
                </div>
                <button onClick={() => handleRemoveMember(m.user_id)} className="text-red-500 text-sm font-semibold hover:underline">Remove</button>
              </div>
            ))}
          </div>
        </div>

        {/* Applications */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold dark:text-white mb-4">Role Applications</h2>
          {startup.open_roles.length === 0 && <p className="text-gray-500">No open roles currently posted.</p>}
          {startup.open_roles.map((r: any) => (
            <div key={r.id} className="mb-6 border rounded-xl p-4">
              <h3 className="font-bold text-lg dark:text-white">{r.title}</h3>
              <div className="mt-3 space-y-3">
                {apps[r.id]?.length === 0 && <div className="text-sm text-gray-500">No applications yet.</div>}
                
                {apps[r.id]?.map((app: any) => (
                  <div key={app.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{app.name} <span className="text-gray-400 font-normal text-sm ml-2">({app.email})</span></div>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 italic">"{app.message}"</p>
                      <div className="mt-2 text-xs font-bold text-blue-600 uppercase tracking-wider">Status: {app.status}</div>
                    </div>
                    {app.status === 'pending' && (
                      <div className="flex gap-2">
                         <button onClick={() => handleAppStatus(r.id, app.id, 'accepted')} className="px-3 py-1 bg-green-500 text-white rounded text-sm font-medium">Accept</button>
                         <button onClick={() => handleAppStatus(r.id, app.id, 'rejected')} className="px-3 py-1 bg-red-500 text-white rounded text-sm font-medium">Reject</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
