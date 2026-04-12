'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/axios';
import { use } from 'react';

export default function StartupProgress({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [milestones, setMilestones] = useState<any[]>([]);
  const [startup, setStartup] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form bounds
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newStage, setNewStage] = useState('idea');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const msRes = await api.get(`/startups/${id}/milestones`);
      setMilestones(msRes.data.data);
      const stRes = await api.get(`/startups/${id}`);
      setStartup(stRes.data.data);
    } catch(err) { console.error(err); } finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if(!newTitle || !newStage) return;
    try {
      await api.post(`/startups/${id}/milestones`, { title: newTitle, description: newDesc, stage: newStage });
      setShowForm(false); setNewTitle(''); setNewDesc('');
      fetchData();
    } catch(err) { console.error(err); }
  };

  const setComplete = async (milId: number) => {
    try {
      await api.patch(`/startups/${id}/milestones/${milId}`, { completed: true });
      fetchData();
    } catch(err) { console.error(err); }
  };
  
  const killMilestone = async (milId: number) => {
    try {
      await api.delete(`/startups/${id}/milestones/${milId}`);
      fetchData();
    } catch(err) { console.error(err); }
  };

  const isOwnerOrMember = startup?.my_role === 'founder' || startup?.my_role === 'member';

  if (loading) return <div className="p-8 text-center bg-white dark:bg-gray-800">Loading tracking...</div>;
  if (!startup) return null;

  const completedCount = milestones.filter(m => m.completed_at).length;
  const progressPercent = milestones.length > 0 ? (completedCount / milestones.length) * 100 : 0;

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm mt-8">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-bold dark:text-white">Startup Progress & Timeline</h2>
           <p className="text-gray-500">Track milestones, releases, and key moments.</p>
        </div>
        <div className="text-right">
           <div className="text-2xl font-extrabold text-blue-600">{completedCount} / {milestones.length}</div>
           <div className="text-sm font-bold text-gray-400 uppercase tracking-wide">Milestones Completed</div>
        </div>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-10 overflow-hidden">
        <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
      </div>

      <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-4 pb-8 space-y-10">
        
        {milestones.length === 0 && <div className="ml-8 text-gray-500">No milestones yet. Plan your first target!</div>}

        {milestones.map(m => {
          const isDone = !!m.completed_at;
          return (
            <div key={m.id} className="relative ml-8 group">
              <div className={`absolute -left-[41px] top-1 h-5 w-5 rounded-full border-4 bg-white dark:bg-gray-800 ${isDone ? 'border-green-500 bg-green-500' : 'border-gray-300 dark:border-gray-600 shadow'}`}></div>
              
              <div className={`p-5 rounded-2xl border transition ${isDone ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/50' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'}`}>
                 <div className="flex justify-between items-start">
                   <div>
                     <span className={`inline-block px-2 text-xs font-bold uppercase rounded mb-2 ${isDone ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300'}`}>{m.stage}</span>
                     <h3 className="text-lg font-bold text-gray-900 dark:text-white">{m.title}</h3>
                     <p className="text-gray-600 dark:text-gray-400 mt-1">{m.description}</p>
                   </div>
                   <div className="text-right">
                     {isDone ? (
                       <div className="text-sm font-bold text-green-600">Done on {new Date(m.completed_at).toLocaleDateString()}</div>
                     ) : (
                       <div className="text-sm font-bold text-gray-400">Pending</div>
                     )}
                   </div>
                 </div>

                 {isOwnerOrMember && !isDone && (
                   <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600/50 flex gap-4">
                     <button onClick={() => setComplete(m.id)} className="px-4 py-1.5 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700">Mark Complete</button>
                     <button onClick={() => killMilestone(m.id)} className="px-4 py-1.5 bg-red-100 text-red-700 font-bold text-sm rounded-lg hover:bg-red-200">Delete</button>
                   </div>
                 )}
              </div>
            </div>
          );
        })}

        {/* Add Node */}
        {isOwnerOrMember && (
          <div className="relative ml-8">
            <div className="absolute -left-[41px] top-1 h-5 w-5 rounded-full border-4 border-blue-500 bg-white dark:bg-gray-800 shadow"></div>
            {showForm ? (
               <div className="p-5 rounded-2xl border-2 border-blue-500 border-dashed bg-white dark:bg-gray-800">
                  <div className="grid gap-4">
                    <input type="text" placeholder="Milestone Title" value={newTitle} onChange={e=>setNewTitle(e.target.value)} className="border p-2 rounded-xl bg-gray-50 dark:bg-gray-700 w-full" />
                    <textarea placeholder="Description" value={newDesc} onChange={e=>setNewDesc(e.target.value)} className="border p-2 rounded-xl bg-gray-50 dark:bg-gray-700 w-full" rows={2}/>
                    <select value={newStage} onChange={e=>setNewStage(e.target.value)} className="border p-2 rounded-xl bg-gray-50 dark:bg-gray-700 w-full">
                       <option value="idea">Idea</option><option value="prototype">Prototype</option><option value="mvp">MVP</option><option value="beta">Beta</option><option value="launch">Launch</option><option value="funded">Funded</option>
                    </select>
                    <div className="flex gap-2">
                       <button onClick={handleCreate} className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl flex-1">Save Milestone</button>
                       <button onClick={()=>setShowForm(false)} className="px-5 py-2 bg-gray-200 text-gray-700 font-bold rounded-xl">Cancel</button>
                    </div>
                  </div>
               </div>
            ) : (
               <button onClick={()=>setShowForm(true)} className="px-6 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl text-gray-500 font-bold hover:border-blue-500 hover:text-blue-500 transition w-full text-left">+ Add Next Milestone</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
