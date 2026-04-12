'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/axios';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line
} from 'recharts';

const F = {
  display: "font-[family-name:var(--font-playfair)]",
  space:   "font-[family-name:var(--font-space)]",
  serif:   "font-[family-name:var(--font-serif)]",
  bebas:   "font-[family-name:var(--font-bebas)]",
};

const CHART_COLORS = ['#F7941D', '#1C1C1C', '#003580', '#888888', '#444444', '#AAAAAA', '#CCCCCC'];

export default function AnalyticsDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/profile/me').then(res => {
      const role = res.data.data?.role;
      if (role === 'mentor') { router.push('/mentor'); return; }
      if (role !== 'admin') { router.push('/dashboard'); return; }
    }).catch(() => {});
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/analytics/ecosystem');
      setData(res.data.data);
      const snapRes = await api.get('/analytics/ecosystem/snapshots');
      setSnapshots(snapRes.data.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  if (loading || !data) return (
    <div className="min-h-screen bg-[#F5F4F0] flex items-center justify-center">
      <div className={`${F.space} text-[#F7941D] font-bold tracking-[0.2em] uppercase`}>Loading Analytics...</div>
    </div>
  );

  const roleData = [
    { name: 'Students', value: data.users_by_role.student },
    { name: 'Mentors', value: data.users_by_role.mentor },
  ];

  const stageData = [
    { name: 'Idea', count: data.startups_by_stage.idea },
    { name: 'Prototype', count: data.startups_by_stage.prototype || 0 },
    { name: 'MVP', count: data.startups_by_stage.mvp },
    { name: 'Beta', count: data.startups_by_stage.beta || 0 },
    { name: 'Launch', count: data.startups_by_stage.launch || 0 },
    { name: 'Growth', count: data.startups_by_stage.growth },
    { name: 'Funded', count: data.startups_by_stage.funded },
  ];

  const lineData = snapshots.map(s => ({
    date: new Date(s.snapshot_date).toLocaleDateString(),
    users: s.total_users,
    startups: s.total_startups,
  }));

  const kpis = [
    { label: 'Total Users', value: data.total_users },
    { label: 'Active Startups', value: data.active_startups },
    { label: 'Total Meetings', value: data.total_meetings },
    { label: 'Ideas Posted', value: data.ideas_posted },
    { label: 'Mentor Engage', value: `${Math.round(data.mentor_engagement_rate * 100)}%` },
    { label: 'Roles Filled', value: `${Math.round(data.open_roles_filled_rate * 100)}%` },
  ];

  return (
    <div className="min-h-screen bg-[#F5F4F0]">
      {/* Top bar */}
      <div className="bg-[#1C1C1C] border-b-2 border-[#1C1C1C]">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <div className={`${F.space} text-[10px] tracking-[0.3em] uppercase text-[#F7941D] mb-0.5`}>Admin Panel</div>
            <h1 className={`${F.display} text-white font-bold text-2xl`}>Ecosystem Health Dashboard</h1>
          </div>
          <button
            onClick={() => router.push('/admin')}
            className={`${F.space} flex items-center gap-2 px-4 py-2 bg-transparent border-2 border-white text-white text-sm font-bold hover:bg-white hover:text-[#1C1C1C] transition`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
            Back to Admin
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-0 border-2 border-[#1C1C1C] mb-8">
          {kpis.map((kpi, i) => (
            <div key={i} className={`bg-white p-5 text-center ${i < kpis.length - 1 ? 'border-r-2 border-[#1C1C1C]' : ''}`}>
              <div className={`${F.space} text-[#888888] text-[10px] font-bold uppercase tracking-[0.2em] mb-2`}>{kpi.label}</div>
              <div className={`${F.bebas} text-3xl text-[#1C1C1C] tracking-wider`}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Users by Role */}
          <div className="bg-white border-2 border-[#1C1C1C] p-6">
            <div className="border-b-2 border-[#1C1C1C] pb-3 mb-5">
              <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-0.5`}>Distribution</div>
              <h3 className={`${F.display} font-bold text-[#1C1C1C] text-lg`}>Users by Role</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={roleData} innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                    {roleData.map((e, index) => <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Startups by Stage */}
          <div className="bg-white border-2 border-[#1C1C1C] p-6">
            <div className="border-b-2 border-[#1C1C1C] pb-3 mb-5">
              <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-0.5`}>Pipeline</div>
              <h3 className={`${F.display} font-bold text-[#1C1C1C] text-lg`}>Startups by Stage</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" />
                  <XAxis dataKey="name" tick={{ fill: '#888888', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#888888', fontSize: 11 }} />
                  <Tooltip cursor={{ fill: '#F5F4F0' }} />
                  <Bar dataKey="count" radius={[0, 0, 0, 0]}>
                    {stageData.map((s, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Growth Over Time */}
          <div className="lg:col-span-2 bg-white border-2 border-[#1C1C1C] p-6">
            <div className="border-b-2 border-[#1C1C1C] pb-3 mb-5">
              <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-0.5`}>Trend</div>
              <h3 className={`${F.display} font-bold text-[#1C1C1C] text-lg`}>Growth Over Time</h3>
            </div>
            <div className="h-72">
              {lineData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" />
                    <XAxis dataKey="date" tick={{ fill: '#888888', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#888888', fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="users" stroke="#F7941D" strokeWidth={3} dot={{ r: 4, fill: '#F7941D' }} />
                    <Line type="monotone" dataKey="startups" stroke="#1C1C1C" strokeWidth={3} dot={{ r: 4, fill: '#1C1C1C' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className={`${F.space} flex h-full items-center justify-center text-[#888888] text-sm`}>
                  Waiting for weekly snapshot data...
                </div>
              )}
            </div>
          </div>

          {/* Top Domains */}
          <div className="bg-white border-2 border-[#1C1C1C] p-6 flex flex-col">
            <div className="border-b-2 border-[#1C1C1C] pb-3 mb-5">
              <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-0.5`}>Focus Areas</div>
              <h3 className={`${F.display} font-bold text-[#1C1C1C] text-lg`}>Top Domains</h3>
            </div>
            <div className="flex-1 space-y-4">
              {data.top_domains.map((d: any, i: number) => {
                const percent = data.active_startups > 0 ? (d.count / data.active_startups) * 100 : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1 text-[#1C1C1C]">
                      <span className={`${F.space} font-bold`}>{d.domain}</span>
                      <span className={`${F.space} text-[#888888]`}>{d.count} ({Math.round(percent)}%)</span>
                    </div>
                    <div className="w-full bg-[#F5F4F0] border border-[#1C1C1C] h-2.5">
                      <div className="bg-[#F7941D] h-2.5" style={{ width: `${percent}%` }}></div>
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
