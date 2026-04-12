'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { api } from '../../../lib/axios';
import Avatar from '../../../components/Avatar';
import SkeletonLoader from '../../../components/SkeletonLoader';
import GitHubWidget from '../../../components/GitHubWidget';

export default function StartupProfile({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [startup, setStartup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview'|'team'|'roles'|'reviews'|'analytics'>('overview');
  const [analytics, setAnalytics] = useState<any>(null);
  
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(0);

  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    fetchStartup();
    checkUpvote();
    fetchReviews();
    fetchAnalytics();
  }, [id]);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get(`/analytics/startup/${id}`);
      setAnalytics(res.data.data);
    } catch(err) {}
  };

  const fetchStartup = async () => {
    try {
      const res = await api.get(`/startups/${id}`);
      setStartup(res.data.data);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkUpvote = async () => {
    try {
      // using discovery / showcase APIs or the direct startup one
      const res = await api.get(`/startups/${id}/upvote`);
      setIsUpvoted(res.data.is_upvoted);
    } catch(err) {}
  };

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/startups/${id}/reviews`);
      setReviews(res.data.data);
    } catch(err) {}
  };

  const handleUpvote = async () => {
    try {
      const res = await api.post(`/startups/${id}/upvote`);
      setIsUpvoted(res.data.action === 'added');
      setUpvoteCount(prev => res.data.action === 'added' ? prev + 1 : prev - 1);
    } catch(err) {
      console.error(err);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (!startup) return <div className="min-h-screen flex items-center justify-center">Startup not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Hero */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row gap-8 items-start">
          <div className="w-32 h-32 rounded-3xl bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex-shrink-0 flex justify-center items-center overflow-hidden shadow-sm">
            {startup.logo_url ? <img src={startup.logo_url} className="w-full h-full object-cover"/> : <span className="text-3xl font-bold text-gray-400">{startup.name.charAt(0)}</span>}
          </div>
          
          <div className="flex-1">
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white flex items-center gap-4 flex-wrap">
              {startup.name}
              <button 
                onClick={handleUpvote}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-bold border rounded-full transition ${isUpvoted ? 'bg-orange-100 text-orange-600 border-orange-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
              >
                <svg className="w-5 h-5 pointer-events-none" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                Upvote
              </button>
              {(startup.my_role === 'founder' || startup.my_role === 'member') && (
                <button onClick={() => router.push(`/startups/${id}/pitch`)} className="flex items-center gap-2 px-4 py-1.5 text-sm font-bold bg-purple-600 text-white rounded-full transition hover:bg-purple-700 shadow">
                   ✨ Pitch Deck
                </button>
              )}
            </h1>
            <p className="text-xl text-gray-500 dark:text-gray-400 mt-2 font-medium">{startup.tagline}</p>
            
            <div className="flex flex-wrap gap-3 mt-5 text-sm font-semibold tracking-wide uppercase">
              {startup.domain && <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md">{startup.domain}</span>}
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-md">{startup.stage} Stage</span>
              {startup.github_url && <a href={startup.github_url} target="_blank" rel="noopener noreferrer" className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1 rounded-md flex items-center gap-1"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482z" clipRule="evenodd" /></svg> GitHub</a>}
            </div>
          </div>
        </div>

        {/* Tab Header */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 border-b-2 border-transparent">
            {['overview', 'team', 'roles', 'reviews', 'analytics'].map(tab => (
              <button 
                key={tab} onClick={() => setActiveTab(tab as any)}
                className={`py-4 text-sm font-bold uppercase tracking-wider border-b-2 transition ${activeTab === tab ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <GitHubWidget startupId={id} githubRepo={startup.github_repo_url} isMember={startup.my_role === 'founder' || startup.my_role === 'member'} />
            
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold mb-4 dark:text-white">About the Startup</h2>
              <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                {startup.description || 'No description provided.'}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {startup.members.map((m: any) => (
              <div key={m.member_id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col items-center text-center">
                <Avatar name={m.name} avatarUrl={m.avatar_url} size="lg" />
                <h3 className="mt-4 font-bold text-gray-900 dark:text-white">{m.name}</h3>
                <p className="text-blue-600 font-medium text-sm mt-1">{m.role}</p>
                <button onClick={() => router.push(`/profile/${m.user_id}`)} className="mt-6 w-full py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm font-semibold text-gray-600 transition hover:bg-gray-100">View Profile</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'roles' && (
          <div className="space-y-4">
            {startup.open_roles.length === 0 ? <p className="text-gray-500 bg-white p-8 rounded-2xl text-center shadow-sm border">No open roles currently.</p> : null}
            {startup.open_roles.map((r: any) => (
              <div key={r.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{r.title}</h3>
                  <p className="text-gray-500 mt-1 line-clamp-2">{r.description}</p>
                  <div className="flex gap-2 mt-3">
                    {r.skills_required && JSON.parse(r.skills_required).map((s: string, i: number) => (
                      <span key={i} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">{s}</span>
                    ))}
                  </div>
                </div>
                <button onClick={() => router.push(`/roles?startup=${id}`)} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold shadow hover:bg-blue-700 transition">Apply</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4">
             {reviews.length === 0 ? <p className="text-gray-500 bg-white p-8 rounded-2xl text-center shadow-sm border">No reviews yet.</p> : null}
             {reviews.map((rev: any) => (
               <div key={rev.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100">
                 <div className="flex justify-between items-start mb-2">
                   <div>
                     <span className="font-bold text-gray-900 dark:text-white">{rev.reviewer_name}</span>
                     <span className="text-gray-400 text-sm ml-2">reviewed {rev.reviewee_name}</span>
                   </div>
                   <div className="flex text-yellow-400">{'★'.repeat(rev.rating)}{'☆'.repeat(5-rev.rating)}</div>
                 </div>
                 <p className="text-gray-600 dark:text-gray-300">{rev.comment}</p>
               </div>
             ))}
          </div>
        )}

        {activeTab === 'analytics' && analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center">
              <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Milestone Progress</div>
              <div className="relative w-32 h-32 flex items-center justify-center">
                 <svg className="absolute w-full h-full transform -rotate-90">
                   <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100 dark:text-gray-700 w-full h-full" />
                   <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="351" strokeDashoffset={351 - (351 * analytics.completion_rate) / 100} className="text-blue-500 w-full h-full transition-all duration-1000" />
                 </svg>
                 <span className="text-2xl font-extrabold text-blue-600">{analytics.completion_rate}%</span>
              </div>
              <button onClick={() => router.push(`/startups/${id}/progress`)} className="mt-6 text-sm text-blue-600 font-bold hover:underline">View Timeline</button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 shadow-sm text-center flex flex-col justify-center">
               <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Days Active</div>
               <div className="text-4xl font-extrabold text-gray-900 dark:text-white">{analytics.days_active}</div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 shadow-sm text-center flex flex-col justify-center">
               <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Mentor Meetings</div>
               <div className="text-4xl font-extrabold text-green-600">{analytics.mentor_meetings}</div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 shadow-sm text-center flex flex-col justify-center">
               <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Team Size</div>
               <div className="text-4xl font-extrabold text-purple-600">{analytics.team_size}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
