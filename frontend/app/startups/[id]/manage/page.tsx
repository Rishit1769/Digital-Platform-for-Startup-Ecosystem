'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { api } from '../../../../lib/axios';
import { DataPanel, Tag } from '../../../../components/DataPanel';
import SubNav from '../../../../components/SubNav';

const F = {
  display: "font-[family-name:var(--font-playfair)]",
  space:   "font-[family-name:var(--font-space)]",
  serif:   "font-[family-name:var(--font-serif)]",
  bebas:   "font-[family-name:var(--font-bebas)]",
};

const STAGES = ['idea', 'prototype', 'mvp', 'scaling', 'funded'];

export default function ManageStartup({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [startup,       setStartup]       = useState<any>(null);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [name,          setName]          = useState('');
  const [tagline,       setTagline]       = useState('');
  const [description,   setDescription]   = useState('');
  const [stage,         setStage]         = useState('');
  const [domain,        setDomain]        = useState('');
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  const [githubLoading, setGithubLoading] = useState(false);
  const [apps,          setApps]          = useState<{ [roleId: string]: any[] }>({});
  const [saveMsg,       setSaveMsg]       = useState('');

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    try {
      const res = await api.get(`/startups/${id}`);
      const s = res.data.data;
      setStartup(s); setName(s.name); setTagline(s.tagline || '');
      setDescription(s.description || ''); setStage(s.stage || '');
      setDomain(s.domain || ''); setGithubRepoUrl(s.github_repo_url || '');
      const appsMap: any = {};
      for (const role of s.open_roles) {
        const appsRes = await api.get(`/roles/${role.id}/applications`);
        appsMap[role.id] = appsRes.data.data;
      }
      setApps(appsMap);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleUpdate = async () => {
    setSaving(true); setSaveMsg('');
    try {
      await api.put(`/startups/${id}`, { name, tagline, description, stage, domain });
      setSaveMsg('Saved successfully.');
      fetchData();
    } catch { setSaveMsg('Save failed. Please try again.'); }
    finally { setSaving(false); }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!confirm('Remove this member?')) return;
    try { await api.delete(`/startups/${id}/members/${userId}`); fetchData(); }
    catch { /* silent */ }
  };

  const handleAppStatus = async (roleId: number, appId: number, status: string) => {
    try { await api.patch(`/roles/${roleId}/applications/${appId}`, { status }); fetchData(); }
    catch { /* silent */ }
  };

  const handleLinkRepo = async () => {
    if (!githubRepoUrl) return;
    setGithubLoading(true);
    try { await api.post(`/startups/${id}/github`, { github_repo_url: githubRepoUrl }); fetchData(); }
    catch (err: any) { alert(err.response?.data?.error || 'Failed to link repository.'); }
    finally { setGithubLoading(false); }
  };

  const handleUnlinkRepo = async () => {
    if (!confirm('Unlink this repository?')) return;
    setGithubLoading(true);
    try { await api.delete(`/startups/${id}/github`); setGithubRepoUrl(''); fetchData(); }
    catch { /* silent */ } finally { setGithubLoading(false); }
  };

  const TABS = [
    { key: 'overview', label: 'Overview',  href: `/startups/${id}` },
    { key: 'manage',   label: 'Manage',    href: `/startups/${id}/manage` },
    { key: 'progress', label: 'Progress',  href: `/startups/${id}/progress` },
    { key: 'pitch',    label: 'Pitch Deck',href: `/startups/${id}/pitch` },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F4F0]">
      <div className={`${F.bebas} text-[#F7941D] tracking-widest`} style={{ fontSize: '2rem' }}>Loading</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-[#1C1C1C]">

      {/* Top bar */}
      <header className="bg-[#1C1C1C] border-b-2 border-[#F7941D] sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 bg-[#F7941D]" />
            <span className={`${F.space} font-bold text-white text-lg tracking-[0.05em]`}>ECOSYSTEM</span>
          </a>
          <div className={`${F.space} text-white/30 text-[11px] tracking-[0.2em] uppercase hidden md:block`}>{startup?.name ?? 'Manage'}</div>
        </div>
      </header>

      <SubNav
        backLabel="Startups"
        backHref="/startups"
        entityName={startup?.name}
        tabs={TABS}
        activeTab="manage"
      />

      <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-12 flex flex-col gap-10">

        {/* ─ Edit Details ─ */}
        <DataPanel eyebrow="Settings" title="Edit Startup Details"
          action={
            <button onClick={handleUpdate} disabled={saving}
              className={`${F.space} font-bold text-[12px] tracking-[0.1em] uppercase bg-[#F7941D] text-white px-5 py-2.5 hover:bg-[#1C1C1C] disabled:opacity-40 transition-colors`}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          }>
          {saveMsg && (
            <p className={`${F.space} text-[12px] mb-4 ${saveMsg.includes('failed') ? 'eco-error' : 'text-[#1C1C1C] border-l-4 border-[#F7941D] pl-3'}`}>{saveMsg}</p>
          )}
          <div className="grid grid-cols-12 gap-5">
            <div className="col-span-12 md:col-span-6">
              <label className="eco-label">Startup Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="eco-input off-white" />
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className="eco-label">Tagline</label>
              <input type="text" value={tagline} onChange={e => setTagline(e.target.value)} className="eco-input off-white" />
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className="eco-label">Domain / Industry</label>
              <input type="text" value={domain} onChange={e => setDomain(e.target.value)} className="eco-input off-white" />
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className="eco-label">Stage</label>
              <select value={stage} onChange={e => setStage(e.target.value)} className="eco-input off-white">
                <option value="">Select stage…</option>
                {STAGES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div className="col-span-12">
              <label className="eco-label">Description</label>
              <textarea rows={5} value={description} onChange={e => setDescription(e.target.value)} className="eco-input off-white" />
            </div>
          </div>
        </DataPanel>

        {/* ─ GitHub ─ */}
        <DataPanel eyebrow="Integrations" title="GitHub Repository">
          <div className="flex items-center gap-3">
            <input type="url" value={githubRepoUrl} onChange={e => setGithubRepoUrl(e.target.value)}
              placeholder="https://github.com/org/repo"
              className="eco-input off-white flex-1" />
            <button onClick={handleLinkRepo} disabled={githubLoading}
              className={`${F.space} font-bold text-[12px] tracking-wide uppercase bg-[#1C1C1C] text-white px-5 py-3.5 hover:bg-[#F7941D] disabled:opacity-40 transition-colors flex-shrink-0`}>
              {githubLoading ? '…' : 'Link'}
            </button>
            {startup?.github_repo_url && (
              <button onClick={handleUnlinkRepo} disabled={githubLoading}
                className={`${F.space} font-bold text-[12px] tracking-wide uppercase border border-[#CC0000] text-[#CC0000] hover:bg-[#CC0000] hover:text-white px-5 py-3.5 disabled:opacity-40 transition-colors flex-shrink-0`}>
                Unlink
              </button>
            )}
          </div>
        </DataPanel>

        {/* ─ Members ─ */}
        <DataPanel eyebrow="Team" title={`Members (${startup?.members?.length ?? 0})`} noPadding>
          {(startup?.members ?? []).length === 0 ? (
            <div className="p-8 text-center">
              <p className={`${F.space} text-[#AAAAAA] text-[12px] tracking-widest uppercase`}>No members yet.</p>
            </div>
          ) : (
            <div className="divide-y-2 divide-[#F5F4F0]">
              {startup.members.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#F5F4F0] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#F5F4F0] border-2 border-[#1C1C1C] flex items-center justify-center flex-shrink-0">
                      <span className={`${F.bebas} text-[#1C1C1C] text-xl leading-none`}>{m.name?.charAt(0)}</span>
                    </div>
                    <div>
                      <div className={`${F.space} font-bold text-[#1C1C1C] text-[14px]`}>{m.name}</div>
                      <div className={`${F.space} text-[11px] tracking-[0.1em] uppercase text-[#888888]`}>{m.role}</div>
                    </div>
                  </div>
                  {m.role !== 'founder' && (
                    <button onClick={() => handleRemoveMember(m.id)}
                      className={`${F.space} text-[11px] tracking-wide font-bold border border-[#CC0000] text-[#CC0000] hover:bg-[#CC0000] hover:text-white px-3 py-1.5 transition-colors`}>
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </DataPanel>

        {/* ─ Applications ─ */}
        {startup?.open_roles?.length > 0 && (
          <DataPanel eyebrow="Recruitment" title="Role Applications" noPadding>
            <div className="divide-y-2 divide-[#F5F4F0]">
              {startup.open_roles.map((role: any) => {
                const roleApps: any[] = apps[role.id] ?? [];
                return (
                  <div key={role.id}>
                    <div className="px-6 py-3 bg-[#F5F4F0] border-b border-[#E0E0E0]">
                      <div className={`${F.space} font-bold text-[#1C1C1C] text-[13px] tracking-wide`}>{role.title}</div>
                      <div className={`${F.space} text-[#888888] text-[11px]`}>{roleApps.length} application(s)</div>
                    </div>
                    {roleApps.length === 0 ? (
                      <div className="px-6 py-5">
                        <p className={`${F.serif} italic text-[#AAAAAA] text-[13px]`}>No applications yet.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-[#F0F0F0]">
                        {roleApps.map((app: any) => (
                          <div key={app.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-[#F5F4F0] transition-colors">
                            <div>
                              <div className={`${F.space} font-bold text-[#1C1C1C] text-[14px]`}>{app.applicant_name}</div>
                              {app.cover_note && (
                                <p className={`${F.serif} text-[#888888] text-[12px] mt-0.5 line-clamp-1`}>{app.cover_note}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`${F.space} text-[10px] font-bold tracking-[0.1em] uppercase px-2 py-0.5 border ${app.status === 'accepted' ? 'border-[#1C1C1C] text-[#1C1C1C]' : app.status === 'rejected' ? 'border-[#CC0000] text-[#CC0000]' : 'border-[#888888] text-[#888888]'}`}>
                                {app.status}
                              </span>
                              {app.status === 'pending' && (
                                <>
                                  <button onClick={() => handleAppStatus(role.id, app.id, 'accepted')}
                                    className={`${F.space} text-[11px] font-bold bg-[#1C1C1C] text-white px-3 py-1.5 hover:bg-[#F7941D] transition-colors`}>
                                    Accept
                                  </button>
                                  <button onClick={() => handleAppStatus(role.id, app.id, 'rejected')}
                                    className={`${F.space} text-[11px] font-bold border border-[#CC0000] text-[#CC0000] hover:bg-[#CC0000] hover:text-white px-3 py-1.5 transition-colors`}>
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </DataPanel>
        )}

      </div>
    </div>
  );
}
