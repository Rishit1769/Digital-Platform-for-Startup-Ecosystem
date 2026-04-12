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
  
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  const [githubLoading, setGithubLoading] = useState(false);

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
      setGithubRepoUrl(s.github_repo_url || '');

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

  const handleLinkRepo = async () => {
    if (!githubRepoUrl) return;
    setGithubLoading(true);
    try {
      await api.post(`/startups/${id}/github`, { github_repo_url: githubRepoUrl });
      alert('GitHub repository linked successfully.');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to link repository.');
    } finally { setGithubLoading(false); }
  };

  const handleUnlinkRepo = async () => {
    if (confirm('Unlink this repository? Timeline and signal data will be cleared.')) {
       try {
         await api.delete(`/startups/${id}/github`);
         fetchData();
       } catch (err) {}
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

        {/* GitHub Integration */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold dark:text-white mb-4">GitHub Integration</h2>
          {startup.github_repo_owner ? (
             <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-100 dark:border-blue-800 rounded-xl">
                <div>
                   <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                     <svg className="w-5 h-5 text-gray-900 dark:text-white" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482z"/></svg>
                     Linked to: <a href={startup.github_repo_url} target="_blank" className="hover:underline">{startup.github_repo_owner}/{startup.github_repo_name}</a>
                   </div>
                   <p className="text-sm text-gray-500 mt-1">Analytics and Progress tracking are active.</p>
                </div>
                <button onClick={handleUnlinkRepo} className="px-4 py-2 border-2 border-red-200 text-red-600 bg-red-50 hover:bg-red-100 font-bold rounded-lg text-sm">Unlink Repo</button>
             </div>
          ) : (
             <div className="flex flex-col sm:flex-row gap-3">
               <input 
                 type="text" 
                 placeholder="e.g. https://github.com/facebook/react" 
                 value={githubRepoUrl} 
                 onChange={e=>setGithubRepoUrl(e.target.value)} 
                 className="flex-1 border p-3 rounded-xl bg-gray-50 dark:bg-gray-700" 
               />
               <button 
                 onClick={handleLinkRepo} disabled={githubLoading} 
                 className="px-6 py-3 bg-gray-900 dark:bg-black text-white font-bold rounded-xl whitespace-nowrap disabled:opacity-50"
               >
                 {githubLoading ? 'Validating...' : 'Link Repository'}
               </button>
             </div>
          )}
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
