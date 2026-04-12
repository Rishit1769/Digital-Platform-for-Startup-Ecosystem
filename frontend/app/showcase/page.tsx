'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/axios';

export default function Showcase() {
  const router = useRouter();
  const [startups, setStartups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [sort, setSort] = useState('upvotes');
  const [domain, setDomain] = useState('');

  const domains = ['FinTech', 'EdTech', 'HealthTech', 'E-commerce', 'AI/ML', 'SaaS', 'Web3'];

  useEffect(() => {
    fetchStartups();
  }, [sort, domain]);

  const fetchStartups = async () => {
    setLoading(true);
    try {
      const query = `/showcase?sort=${sort}${domain ? `&domain=${domain}` : ''}`;
      const res = await api.get(query);
      setStartups(res.data.data);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.post(`/startups/${id}/upvote`);
      fetchStartups(); // simple refresh
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">Product Showcase Wall</h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">Discover the latest products and startups built by the ecosystem. Upvote your favorites.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-between gap-6 mb-10">
          <div className="flex flex-wrap gap-2">
            <button onClick={()=>setDomain('')} className={`px-4 py-2 rounded-full text-sm font-semibold transition ${domain === '' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100'}`}>All Domains</button>
            {domains.map(d=>(
              <button key={d} onClick={()=>setDomain(d)} className={`px-4 py-2 rounded-full text-sm font-semibold transition ${domain === d ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 border border-gray-200 dark:border-gray-700'}`}>{d}</button>
            ))}
          </div>
          <select value={sort} onChange={e=>setSort(e.target.value)} className="bg-white dark:bg-gray-800 border rounded-xl px-4 py-2 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500">
            <option value="upvotes">Most Upvoted</option>
            <option value="newest">Newest</option>
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
        ) : startups.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold dark:text-white mb-2">No startups found</h3>
            <p className="text-gray-500">Be the first to launch in this category!</p>
            <button onClick={() => router.push('/startups/new')} className="mt-6 px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Launch Startup</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {startups.map(s => (
              <div 
                key={s.id} 
                onClick={() => router.push(`/startups/${s.id}`)}
                className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition cursor-pointer flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {s.logo_url ? <img src={s.logo_url} className="w-full h-full object-cover"/> : <span className="text-xl font-bold text-gray-400">{s.name.charAt(0)}</span>}
                  </div>
                  <button 
                    onClick={(e) => handleUpvote(s.id, e)}
                    className="flex flex-col items-center border border-gray-200 dark:border-gray-600 px-3 py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition group"
                  >
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-orange-500" fill="currentColor" viewBox="0 0 20 20"><path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"/></svg>
                    <span className="font-bold text-gray-700 dark:text-gray-300 text-sm mt-0.5">{s.upvote_count}</span>
                  </button>
                </div>
                
                <h3 className="text-xl font-bold dark:text-white mb-1">{s.name}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 h-10 mb-4">{s.tagline}</p>

                <div className="mt-auto flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-4">
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded text-xs font-bold uppercase">{s.domain}</span>
                    <span className="px-2 py-1 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded text-xs font-bold uppercase">{s.stage}</span>
                    <ActivityBadge startupId={s.id} />
                  </div>
                  <div className="text-xs text-gray-400 font-medium">{s.member_count} member{s.member_count !== 1 && 's'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityBadge({ startupId }: { startupId: number }) {
  const [signal, setSignal] = useState<string | null>(null);

  useEffect(() => {
    api.get(`/startups/${startupId}/activity-score`).then(res => {
      if (res.data.data.signal && res.data.data.signal !== 'Unlinked') {
        setSignal(res.data.data.signal);
      }
    }).catch(()=>{});
  }, [startupId]);

  if (!signal) return null;

  const signalColors: any = {
    'Very Active': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    'Active': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
    'Moderate': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    'Low': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
  };

  const theme = signalColors[signal] || signalColors['Low'];
  
  return (
    <span className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap flex items-center gap-1 ${theme}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {signal}
    </span>
  );
}
