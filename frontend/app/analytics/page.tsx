'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/axios';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line
} from 'recharts';

export default function AnalyticsDashboard() {
  const [data, setData] = useState<any>(null);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/analytics/ecosystem');
      setData(res.data.data);
      const snapRes = await api.get('/analytics/ecosystem/snapshots');
      setSnapshots(snapRes.data.data);
    } catch(err) { console.error(err); } finally { setLoading(false); }
  };

  if(!data) return <div className="p-8 text-center text-blue-600 font-bold">Loading...</div>;

  const roleData = [
    { name: 'Students', value: data.users_by_role.student },
    { name: 'Mentors', value: data.users_by_role.mentor },
    { name: 'Admins', value: data.users_by_role.admin },
  ];

  const stageData = [
    { name: 'Idea', count: data.startups_by_stage.idea },
    { name: 'Prototype', count: data.startups_by_stage.prototype || 0 }, // fallback
    { name: 'MVP', count: data.startups_by_stage.mvp },
    { name: 'Beta', count: data.startups_by_stage.beta || 0 }, // fallback
    { name: 'Launch', count: data.startups_by_stage.launch || 0 }, // fallback
    { name: 'Growth', count: data.startups_by_stage.growth },
    { name: 'Funded', count: data.startups_by_stage.funded },
  ];

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'];

  const lineData = snapshots.map(s => ({
    date: new Date(s.snapshot_date).toLocaleDateString(),
    users: s.total_users,
    startups: s.total_startups
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8">Ecosystem Health Dashboard</h1>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <KPICard title="Total Users" val={data.total_users} />
          <KPICard title="Active Startups" val={data.active_startups} />
          <KPICard title="Total Meetings" val={data.total_meetings} />
          <KPICard title="Ideas Posted" val={data.ideas_posted} />
          <KPICard title="Mentor Engage %" val={`${Math.round(data.mentor_engagement_rate*100)}%`} />
          <KPICard title="Roles Filled" val={`${Math.round(data.open_roles_filled_rate*100)}%`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Users by Role */ }
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-6">Users by Role</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={roleData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {roleData.map((e, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Startups by Stage */ }
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-6">Startups by Stage</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.3} />
                  <XAxis dataKey="name" tick={{fill: '#6b7280', fontSize: 12}} />
                  <YAxis tick={{fill: '#6b7280', fontSize: 12}} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="count" radius={[4,4,0,0]}>
                    {stageData.map((s, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Growth Over Time */}
           <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
             <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-6">Growth Over Time</h3>
             <div className="h-72">
               {lineData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={lineData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.3} />
                   <XAxis dataKey="date" tick={{fill: '#6b7280', fontSize: 12}} />
                   <YAxis tick={{fill: '#6b7280', fontSize: 12}} />
                   <Tooltip />
                   <Legend />
                   <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} dot={{r:4}} />
                   <Line type="monotone" dataKey="startups" stroke="#10b981" strokeWidth={3} dot={{r:4}} />
                 </LineChart>
               </ResponsiveContainer>
               ) : <div className="flex h-full items-center justify-center text-gray-400">Waiting for weekly cron job...</div>}
             </div>
           </div>

           {/* Top Domains */}
           <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col">
             <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-6">Top Domains</h3>
             <div className="flex-1 space-y-4">
               {data.top_domains.map((d: any, i: number) => {
                 const percent = (d.count / data.active_startups) * 100;
                 return (
                   <div key={i}>
                     <div className="flex justify-between text-sm mb-1 text-gray-600 dark:text-gray-300 font-medium">
                       <span>{d.domain}</span>
                       <span>{d.count} ({Math.round(percent)}%)</span>
                     </div>
                     <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                       <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${percent}%` }}></div>
                     </div>
                   </div>
                 );
               })}
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}

function KPICard({ title, val }: { title: string, val: string | number }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm text-center">
      <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">{title}</div>
      <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{val}</div>
    </div>
  );
}
