'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../../lib/axios';
import Avatar from '../../../../components/Avatar';
import { DataPanel, Tag } from '../../../../components/DataPanel';

const F = {
  display: "font-[family-name:var(--font-playfair)]",
  space:   "font-[family-name:var(--font-space)]",
  serif:   "font-[family-name:var(--font-serif)]",
  bebas:   "font-[family-name:var(--font-bebas)]",
};

export default function ProfileEdit() {
  const router = useRouter();
  const [saving,      setSaving]      = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [userRole,    setUserRole]    = useState<'student' | 'mentor'>('student');
  const [name,        setName]        = useState('');
  const [bio,         setBio]         = useState('');
  const [githubUrl,   setGithubUrl]   = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [avatarUrl,   setAvatarUrl]   = useState('');
  const [skills,      setSkills]      = useState<string[]>([]);
  const [skillInput,  setSkillInput]  = useState('');
  const [interests,   setInterests]   = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState('');
  const [domains,     setDomains]     = useState<string[]>([]);
  const [domainInput, setDomainInput] = useState('');
  const [college,     setCollege]     = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('1');
  const [cgpa,        setCgpa]        = useState('');
  const [company,     setCompany]     = useState('');
  const [designation, setDesignation] = useState('');
  const [expertise,   setExpertise]   = useState('');
  const [yearsOfExp,  setYearsOfExp]  = useState('');
  const [saveMsg,     setSaveMsg]     = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get('/profile/me').then(res => {
      const data = res.data.data;
      setUserRole(data.role); setName(data.name);
      const p = data.profile || {};
      setBio(p.bio || ''); setGithubUrl(p.github_url || ''); setLinkedinUrl(p.linkedin_url || ''); setAvatarUrl(p.avatar_url || '');
      const parse = (v: any) => Array.isArray(v) ? v : typeof v === 'string' ? JSON.parse(v) : [];
      setSkills(parse(p.skills)); setInterests(parse(p.interests)); setDomains(parse(p.preferred_domains));
      if (data.role === 'student') {
        setCollege(p.college || ''); setYearOfStudy(p.year_of_study || '1'); setCgpa(p.cgpa ? String(p.cgpa) : '');
      } else {
        setCompany(p.company || ''); setDesignation(p.designation || ''); setExpertise(p.expertise || '');
        setYearsOfExp(p.years_of_experience ? String(p.years_of_experience) : '');
      }
      setInitialLoad(false);
    }).catch(console.error);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const fd = new FormData(); fd.append('avatar', file);
    try { const res = await api.post('/profile/avatar', fd, { isFormData: true }); setAvatarUrl(res.data.data.avatar_url); }
    catch (err) { console.error(err); }
  };

  const addTag = (input: string, setter: any, items: string[], clearInput: () => void) => {
    const v = input.trim();
    if (v && !items.includes(v)) setter([...items, v]);
    clearInput();
  };

  const removeTag = (idx: number, setter: any, items: string[]) => setter(items.filter((_: any, i: number) => i !== idx));

  const onTagKey = (e: React.KeyboardEvent<HTMLInputElement>, input: string, setter: any, items: string[], clearInput: () => void) => {
    if (e.key === 'Enter') { e.preventDefault(); addTag(input, setter, items, clearInput); }
  };

  const handleSubmit = async () => {
    setSaving(true); setSaveMsg('');
    try {
      const payload: any = { bio, avatar_url: avatarUrl, github_url: githubUrl, linkedin_url: linkedinUrl, skills, interests, preferred_domains: domains };
      if (userRole === 'student') { payload.college = college; payload.year_of_study = yearOfStudy; if (cgpa) payload.cgpa = cgpa; }
      else { payload.company = company; payload.designation = designation; payload.expertise = expertise; if (yearsOfExp) payload.years_of_experience = Number(yearsOfExp); }
      await api.put('/profile/me', payload);
      setSaveMsg('Profile saved successfully.');
      setTimeout(() => router.push('/profile/me'), 1200);
    } catch { setSaveMsg('Save failed. Please try again.'); }
    finally { setSaving(false); }
  };

  if (initialLoad) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F4F0]">
      <div className={`${F.bebas} text-[#F7941D] tracking-widest`} style={{ fontSize: '2rem' }}>Loading</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-[#1C1C1C]">

      {/* Top bar */}
      <header className="bg-[#1C1C1C] border-b-2 border-[#F7941D] sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 bg-[#F7941D]" />
              <span className={`${F.space} font-bold text-white text-lg tracking-[0.05em]`}>ECOSYSTEM</span>
            </a>
            <span className={`${F.space} text-white/30 text-[11px] tracking-wide uppercase hidden md:block`}>/ Edit Profile</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()}
              className={`${F.space} text-[12px] text-white/60 hover:text-white transition-colors border border-white/15 px-4 py-2`}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={saving}
              className={`${F.space} font-bold text-[12px] tracking-wide uppercase bg-[#F7941D] text-white px-5 py-2 hover:bg-white hover:text-[#1C1C1C] disabled:opacity-40 transition-colors`}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[900px] mx-auto px-6 lg:px-0 py-12 flex flex-col gap-8">

        {saveMsg && (
          <div className={`${F.space} text-[12px] ${saveMsg.includes('failed') ? 'eco-error' : 'border-l-4 border-[#F7941D] pl-3 text-[#1C1C1C]'} py-2`}>{saveMsg}</div>
        )}

        {/* Avatar */}
        <DataPanel eyebrow="Identity" title="Profile Photo">
          <div className="flex items-center gap-8">
            <div className="relative cursor-pointer group w-24 h-24 border-2 border-[#1C1C1C] overflow-hidden flex-shrink-0"
              onClick={() => fileInputRef.current?.click()}>
              <Avatar name={name} avatarUrl={avatarUrl} size="xl" />
              <div className="absolute inset-0 bg-[#1C1C1C]/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <span className={`${F.space} text-white text-[10px] font-bold tracking-widest uppercase`}>Change</span>
              </div>
            </div>
            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
            <p className={`${F.serif} text-[#888888] text-[13px] leading-[1.7]`}>
              Click to upload a new photo. Allowed formats: JPG, PNG. Max size: 2 MB.
            </p>
          </div>
        </DataPanel>

        {/* Bio + Links */}
        <DataPanel eyebrow="Profile" title="Basic Information">
          <div className="flex flex-col gap-5">
            <div>
              <label className="eco-label">Bio</label>
              <textarea rows={4} value={bio} onChange={e => setBio(e.target.value)}
                placeholder="Tell the ecosystem about yourself…"
                className="eco-input off-white" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="eco-label">GitHub URL</label>
                <input type="url" value={githubUrl} onChange={e => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/you"
                  className="eco-input off-white" />
              </div>
              <div>
                <label className="eco-label">LinkedIn URL</label>
                <input type="url" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/you"
                  className="eco-input off-white" />
              </div>
            </div>
          </div>
        </DataPanel>

        {/* Skills / Interests / Domains */}
        <DataPanel eyebrow="Expertise" title="Skills, Interests & Domains">
          <div className="flex flex-col gap-7">
            {([ 
              { label: 'Skills', items: skills, setter: setSkills, input: skillInput, setInput: setSkillInput },
              { label: 'Interests', items: interests, setter: setInterests, input: interestInput, setInput: setInterestInput },
              { label: 'Preferred Domains', items: domains, setter: setDomains, input: domainInput, setInput: setDomainInput },
            ] as const).map(({ label, items, setter, input, setInput }) => (
              <div key={label}>
                <label className="eco-label">{label}</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(items as string[]).map((s: string, i: number) => (
                    <Tag key={i} label={s} onRemove={() => removeTag(i, setter, items as string[])} />
                  ))}
                </div>
                <input type="text" value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => onTagKey(e, input, setter, items as string[], () => setInput(''))}
                  placeholder="Type and press Enter to add"
                  className="eco-input off-white" />
              </div>
            ))}
          </div>
        </DataPanel>

        {/* Role-specific */}
        {userRole === 'student' && (
          <DataPanel eyebrow="Academic" title="Student Information">
            <div className="flex flex-col gap-5">
              <div>
                <label className="eco-label">College / University</label>
                <input type="text" value={college} onChange={e => setCollege(e.target.value)} className="eco-input off-white" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="eco-label">Year of Study</label>
                  <select value={yearOfStudy} onChange={e => setYearOfStudy(e.target.value)} className="eco-input off-white">
                    {[['1','1st Year'],['2','2nd Year'],['3','3rd Year'],['4','4th Year'],['alumni','Alumni']].map(([v,l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="eco-label">CGPA (optional)</label>
                  <input type="number" step="0.01" max="10" value={cgpa} onChange={e => setCgpa(e.target.value)} className="eco-input off-white" />
                </div>
              </div>
            </div>
          </DataPanel>
        )}

        {userRole === 'mentor' && (
          <DataPanel eyebrow="Professional" title="Mentor Information">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="eco-label">Company</label>
                <input type="text" value={company} onChange={e => setCompany(e.target.value)} className="eco-input off-white" />
              </div>
              <div>
                <label className="eco-label">Designation</label>
                <input type="text" value={designation} onChange={e => setDesignation(e.target.value)} className="eco-input off-white" />
              </div>
              <div>
                <label className="eco-label">Area of Expertise</label>
                <input type="text" value={expertise} onChange={e => setExpertise(e.target.value)} className="eco-input off-white" />
              </div>
              <div>
                <label className="eco-label">Years of Experience</label>
                <input type="number" value={yearsOfExp} onChange={e => setYearsOfExp(e.target.value)} className="eco-input off-white" />
              </div>
            </div>
          </DataPanel>
        )}

      </div>
    </div>
  );
}
