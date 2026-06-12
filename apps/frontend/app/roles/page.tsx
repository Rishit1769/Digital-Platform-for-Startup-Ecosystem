'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/axios';

export default function RolesBoard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'board'|'my_apps'>('board');
  
  const [roles, setRoles] = useState<any[]>([]);
  const [myApps, setMyApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [skillFilter, setSkillFilter] = useState('');
  const [domainFilter, setDomainFilter] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [applyMsg, setApplyMsg] = useState('');

  useEffect(() => {
    if (activeTab === 'board') fetchRoles();
    if (activeTab === 'my_apps') fetchMyApps();
  }, [activeTab, skillFilter, domainFilter]);

  const fetchRoles = async () => {
    setLoading(true);
    let url = '/roles?';
    if(skillFilter) url+=`skill=${skillFilter}&`;
    if(domainFilter) url+=`domain=${domainFilter}`;
    try {
      const res = await api.get(url);
      setRoles(res.data.data);
    } catch(err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchMyApps = async () => {
    setLoading(true);
    try {
      const res = await api.get('/roles/applications/me');
      setMyApps(res.data.data);
    } catch(err) { console.error(err); } finally { setLoading(false); }
  };

  const submitApplication = async () => {
    if(!selectedRole) return;
    try {
      await api.post(`/roles/${selectedRole}/apply`, { message: applyMsg });
      setShowModal(false);
      setApplyMsg('');
      setActiveTab('my_apps');
    } catch(err: any) {
      alert(err.response?.data?.error || 'Failed to apply');
    }
  };

  const parseSkills = (s: any) => {
    try { return JSON.parse(s); } catch { return []; }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 border-t border-gray-200 dark:border-gray-800">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-10 px-4">
        <div className="max-w-5xl mx-auto flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">Open Roles Board</h1>
            <p className="text-gray-500 mt-2">Find your next big opportunity at an early-stage startup.</p>
          </div>
          <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
            <button onClick={() => setActiveTab('board')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'board' ? 'bg-white dark:bg-gray-800 shadow text-blue-600' : 'text-gray-500 dark:text-gray-300'}`}>All Roles</button>
            <button onClick={() => setActiveTab('my_apps')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'my_apps' ? 'bg-white dark:bg-gray-800 shadow text-blue-600' : 'text-gray-500 dark:text-gray-300'}`}>My Applications</button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {activeTab === 'board' && (
          <>
            <div className="flex gap-4 mb-8">
              <input type="text" placeholder="Filter by skill (e.g. React)" value={skillFilter} onChange={e=>setSkillFilter(e.target.value)} className="border p-3 rounded-xl w-64 bg-white dark:bg-gray-800 dark:border-gray-700" />
              <input type="text" placeholder="Filter by domain (e.g. HealthTech)" value={domainFilter} onChange={e=>setDomainFilter(e.target.value)} className="border p-3 rounded-xl w-64 bg-white dark:bg-gray-800 dark:border-gray-700" />
            </div>

            {loading ? <div className="text-center py-20 text-blue-600 font-bold">Loading...</div> : (
               <div className="space-y-4">
                 {roles.length === 0 && <div className="p-8 bg-white dark:bg-gray-800 rounded-3xl text-center text-gray-500">No roles matched.</div>}
                 {roles.map((r: any) => (
                   <div key={r.id} className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 flex flex-col md:flex-row gap-6 items-center hover:shadow-md transition">
                     <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                       {r.logo_url ? <img src={r.logo_url} className="w-full h-full object-cover"/> : <span className="font-bold text-gray-400 text-xl">{r.startup_name.charAt(0)}</span>}
                     </div>
                     <div className="flex-1 text-center md:text-left">
                       <h2 className="text-xl font-bold dark:text-white cursor-pointer hover:text-blue-600" onClick={()=>router.push(`/startups/${r.startup_id}`)}>{r.title}</h2>
                       <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{r.startup_name} <span className="mx-2">•</span> {r.domain}</p>
                       <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                         {parseSkills(r.skills_required).map((s:string, i:number) => (
                           <span key={i} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs font-semibold">{s}</span>
                         ))}
                       </div>
                     </div>
                     <button 
                       onClick={() => { setSelectedRole(r.id); setShowModal(true); }}
                       className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow w-full md:w-auto hover:bg-blue-700 transition"
                     >
                       Apply Now
                     </button>
                   </div>
                 ))}
               </div>
            )}
          </>
        )}

        {activeTab === 'my_apps' && (
          <div className="space-y-4">
            {loading ? <div className="text-center py-20 text-blue-600 font-bold">Loading...</div> : (
              <>
                 {myApps.length === 0 && <div className="p-8 bg-white dark:bg-gray-800 rounded-3xl text-center text-gray-500">You haven't applied to any roles yet.</div>}
                 {myApps.map((a: any) => (
                   <div key={a.id} className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 flex justify-between items-center">
                     <div>
                       <h3 className="text-lg font-bold dark:text-white">{a.title} @ {a.startup_name}</h3>
                       <p className="text-sm text-gray-500 mt-1">Applied on {new Date(a.applied_at).toLocaleDateString()}</p>
                     </div>
                     <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        a.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        a.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                     }`}>
                       {a.status}
                     </span>
                   </div>
                 ))}
              </>
            )}
          </div>
        )}

      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-3xl p-8 shadow-2xl relative">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">✕</button>
            <h2 className="text-2xl font-bold mb-2 dark:text-white">Apply for Role</h2>
            <p className="text-gray-500 text-sm mb-6">Write a short message to the founders outlining why you're a good fit.</p>
            <textarea 
              rows={5} 
              className="w-full border p-4 rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
              placeholder="Hi, I'm..."
              value={applyMsg} onChange={e=>setApplyMsg(e.target.value)}
            />
            <button onClick={submitApplication} className="w-full mt-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Submit Application</button>
          </div>
        </div>
      )}
    </div>
  );
}
