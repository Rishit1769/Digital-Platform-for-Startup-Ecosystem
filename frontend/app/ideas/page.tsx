'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/axios';
import Avatar from '../../components/Avatar';

export default function IdeasIncubation() {
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDomain, setNewDomain] = useState('');

  const [expandedIdea, setExpandedIdea] = useState<number | null>(null);
  const [ideaDetails, setIdeaDetails] = useState<any>(null);
  const [feedbackInput, setFeedbackInput] = useState('');

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    try {
      const res = await api.get('/ideas?sort=upvotes');
      setIdeas(res.data.data);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostIdea = async () => {
    if(!newTitle || !newDesc) return;
    try {
      await api.post('/ideas', { title: newTitle, description: newDesc, domain: newDomain });
      setShowModal(false);
      setNewTitle(''); setNewDesc(''); setNewDomain('');
      fetchIdeas();
    } catch(err) {
      console.error(err);
    }
  };

  const handleUpvote = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.post(`/ideas/${id}/upvote`);
      fetchIdeas();
    } catch(err) { console.error(err); }
  };

  const expandIdea = async (id: number) => {
    if (expandedIdea === id) {
      setExpandedIdea(null);
      setIdeaDetails(null);
      return;
    }
    setExpandedIdea(id);
    try {
      const res = await api.get(`/ideas/${id}`);
      setIdeaDetails(res.data.data);
    } catch(err) { console.error(err); }
  };

  const submitFeedback = async (id: number) => {
    if (!feedbackInput) return;
    try {
      await api.post(`/ideas/${id}/feedback`, { comment: feedbackInput });
      setFeedbackInput('');
      const res = await api.get(`/ideas/${id}`); // refresh specifics
      setIdeaDetails(res.data.data);
      fetchIdeas(); // refresh numbers
    } catch(err) { console.error(err); }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-8">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Incubation Room</h1>
            <p className="text-gray-500 mt-1">Validate your ideas and provide feedback to peers.</p>
          </div>
          <button onClick={() => setShowModal(true)} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow hover:bg-blue-700 transition">Post an Idea</button>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-3xl p-8 shadow-2xl relative">
              <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">✕</button>
              <h2 className="text-2xl font-bold mb-6 dark:text-white">Share a new idea</h2>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label><input type="text" className="w-full mt-1 border p-3 rounded-xl bg-gray-50 dark:bg-gray-700" value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="E.g. AI-driven logistics..."/></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Domain</label><input type="text" className="w-full mt-1 border p-3 rounded-xl bg-gray-50 dark:bg-gray-700" value={newDomain} onChange={e=>setNewDomain(e.target.value)} placeholder="E.g. Logistics"/></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label><textarea className="w-full mt-1 border p-3 rounded-xl bg-gray-50 dark:bg-gray-700" rows={4} value={newDesc} onChange={e=>setNewDesc(e.target.value)} placeholder="Problem you're solving..."/></div>
                <button onClick={handlePostIdea} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl mt-4">Post to Room</button>
              </div>
            </div>
          </div>
        )}

        {/* Ideas List */}
        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
        ) : (
          <div className="space-y-4">
            {ideas.map(idea => (
              <div key={idea.id} className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition hover:shadow-md">
                <div className="p-6 flex gap-6 cursor-pointer" onClick={() => expandIdea(idea.id)}>
                  
                  {/* Upvote block */}
                  <div className="flex flex-col items-center bg-gray-50 dark:bg-gray-700/50 p-3 rounded-2xl h-min">
                    <button onClick={(e) => handleUpvote(idea.id, e)} className="text-gray-400 hover:text-blue-600 transition -mt-1"><svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"/></svg></button>
                    <span className="font-bold text-lg text-gray-900 dark:text-white -mt-1">{idea.upvotes}</span>
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{idea.title}</h3>
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg text-xs font-bold uppercase">{idea.domain}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{idea.description}</p>
                    
                    <div className="mt-4 flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <Avatar name={idea.poster_name} avatarUrl={idea.avatar_url} size="sm" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">{idea.poster_name}</span>
                      </div>
                      <div className="text-gray-500 flex items-center gap-1.5 font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        {idea.feedback_count} feedback
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedIdea === idea.id && ideaDetails && (
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-6 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{ideaDetails.description}</p>
                    
                    <div className="mt-8">
                       <h4 className="font-bold text-gray-900 dark:text-white mb-4">Feedback ({ideaDetails.feedback.length})</h4>
                       <div className="flex gap-4 mb-6">
                         <input type="text" className="flex-1 border p-3 rounded-xl bg-white dark:bg-gray-800 dark:border-gray-600" placeholder="What do you think about this idea?" value={feedbackInput} onChange={e=>setFeedbackInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitFeedback(idea.id)} />
                         <button onClick={()=>submitFeedback(idea.id)} className="px-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl">Post</button>
                       </div>
                       
                       <div className="space-y-4">
                         {ideaDetails.feedback.map((f: any) => (
                           <div key={f.id} className="flex gap-4">
                             <Avatar name={f.name} avatarUrl={f.avatar_url} size="sm" />
                             <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                               <div className="flex justify-between items-center mb-1">
                                 <span className="font-bold text-gray-900 dark:text-white text-sm">{f.name}</span>
                                 <span className="text-xs text-gray-400">{new Date(f.created_at).toLocaleDateString()}</span>
                               </div>
                               <p className="text-gray-600 dark:text-gray-300 text-sm">{f.comment}</p>
                             </div>
                           </div>
                         ))}
                       </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
