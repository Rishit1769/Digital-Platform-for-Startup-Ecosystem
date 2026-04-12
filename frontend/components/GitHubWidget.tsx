'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/axios';

function LanguageBar({ languages }: { languages: any }) {
  if (!languages || Object.keys(languages).length === 0) return null;
  const total = Object.values(languages).reduce((a: any, b: any) => a + b, 0) as number;
  
  const colors = ['bg-yellow-400', 'bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-purple-500', 'bg-pink-500'];
  let colorIdx = 0;

  const segments = Object.entries(languages).sort((a:any, b:any) => b[1] - a[1]).slice(0, 6).map(([lang, val]: any) => {
    const percent = total > 0 ? (val / total) * 100 : 0;
    const color = colors[colorIdx++ % colors.length];
    return { lang, percent, color };
  });

  return (
    <div className="mt-4">
      <div className="flex w-full h-2 rounded-full overflow-hidden mb-2">
         {segments.map((s, i) => (
           <div key={i} title={`${s.lang}: ${Math.round(s.percent)}%`} className={`h-full ${s.color}`} style={{ width: `${s.percent}%` }}></div>
         ))}
      </div>
      <div className="flex flex-wrap gap-3 text-xs font-bold text-gray-500">
         {segments.map((s, i) => (
           <div key={i} className="flex items-center gap-1">
             <span className={`w-2 h-2 rounded-full ${s.color}`}></span>
             <span>{s.lang}</span>
             <span className="opacity-70 font-normal">{Math.round(s.percent)}%</span>
           </div>
         ))}
      </div>
    </div>
  );
}

function ContributorStack({ contributors }: { contributors: any[] }) {
  if (!contributors || contributors.length === 0) return null;

  const visible = contributors.slice(0, 5);
  const extra = contributors.length - 5;

  return (
    <div className="flex items-center mt-4">
      <div className="flex -space-x-2">
        {visible.map((c, i) => (
           <img key={i} src={c.avatar_url} title={`${c.login} (${c.contributions} commits)`} alt={c.login} className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800" />
        ))}
        {extra > 0 && (
           <div className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300">
             +{extra}
           </div>
        )}
      </div>
      <div className="ml-3 text-sm font-bold text-gray-600 dark:text-gray-300 border-l border-gray-200 dark:border-gray-700 pl-3">
        {contributors.length} Contributors
      </div>
    </div>
  );
}

export default function GitHubWidget({ startupId, githubRepo, isMember }: { startupId: string, githubRepo?: string, isMember?: boolean }) {
  const [data, setData] = useState<any>(null);
  const [scoreData, setScoreData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (githubRepo) {
      fetchCache();
    } else {
      setLoading(false);
    }
  }, [githubRepo]);

  const fetchCache = async () => {
    try {
      const res = await api.get(`/startups/${startupId}/github`);
      setData(res.data.data);
      const sRes = await api.get(`/startups/${startupId}/activity-score`);
      setScoreData(sRes.data.data);
    } catch(err) {} finally { setLoading(false); setRefreshing(false); }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await api.get(`/startups/${startupId}/github/refresh`);
      fetchCache();
    } catch(err) { setRefreshing(false); }
  };

  if (!startupId) return null;

  if (!githubRepo) {
     if (!isMember) return null;
     return (
       <div className="bg-gray-50 border border-gray-200 border-dashed rounded-3xl p-6 text-center dark:bg-gray-800/50 dark:border-gray-700">
         <h4 className="font-bold text-gray-700 dark:text-gray-300">No Open Source Repo</h4>
         <p className="text-gray-500 text-sm mt-1 mb-4">Link your GitHub repository to track activity signals.</p>
         <button onClick={() => window.location.href=`/startups/${startupId}/manage`} className="bg-gray-900 text-white font-bold py-2 px-6 rounded-xl text-sm">Link GitHub Repo</button>
       </div>
     );
  }

  if (loading) return <div className="animate-pulse bg-gray-100 rounded-3xl h-48 w-full p-6"></div>;

  if (!data) return null;

  const signalColors: any = {
    'Very Active': 'bg-green-100 text-green-700 border-green-200',
    'Active': 'bg-teal-100 text-teal-700 border-teal-200',
    'Moderate': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Low': 'bg-red-100 text-red-700 border-red-200'
  };

  const signalTheme = scoreData?.signal ? signalColors[scoreData.signal] : signalColors['Low'];

  // Relative time
  const ms = new Date().getTime() - new Date(data.last_push_at).getTime();
  const days = Math.floor(ms / (1000 * 3600 * 24));
  const relTime = days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`;

  const contribArray = typeof data.contributors === 'string' ? JSON.parse(data.contributors) : data.contributors;
  const langObject = typeof data.languages === 'string' ? JSON.parse(data.languages) : data.languages;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm rounded-3xl p-6 relative">
      
      <div className="absolute top-6 right-6 flex items-center gap-2">
         {scoreData && <span className={`text-xs font-bold px-3 py-1 rounded-full border ${signalTheme}`}>{scoreData.signal} Signal</span>}
         <button onClick={handleRefresh} disabled={refreshing} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition disabled:opacity-50" title="Sync">
           <svg className={`w-4 h-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
         </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <svg className="w-6 h-6 text-gray-900 dark:text-white" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482z"/></svg>
        <a href={githubRepo} target="_blank" className="text-lg font-bold text-gray-900 dark:text-white hover:underline">{githubRepo.replace('https://github.com/', '')}</a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
         <div className="border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
           <div className="text-xs text-gray-500 font-bold uppercase mb-1">Commits this week</div>
           <div className="text-xl font-bold">{data.commit_count_week}</div>
         </div>
         <div className="border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
           <div className="text-xs text-gray-500 font-bold uppercase mb-1">Issues</div>
           <div className="text-xl font-bold">{data.open_issues}</div>
         </div>
         <div className="border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
           <div className="text-xs text-gray-500 font-bold uppercase mb-1">Stars</div>
           <div className="text-xl font-bold">{data.stars}</div>
         </div>
         <div className="border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
           <div className="text-xs text-gray-500 font-bold uppercase mb-1">Last Push</div>
           <div className="text-xl font-bold">{relTime}</div>
         </div>
      </div>

      <ContributorStack contributors={contribArray} />
      <LanguageBar languages={langObject} />
    </div>
  );
}
