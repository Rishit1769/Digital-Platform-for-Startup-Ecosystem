'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/axios';
import { DataPanel, Tag } from '../../../components/DataPanel';

const F = {
  display: "font-[family-name:var(--font-playfair)]",
  space:   "font-[family-name:var(--font-space)]",
  serif:   "font-[family-name:var(--font-serif)]",
  bebas:   "font-[family-name:var(--font-bebas)]",
};

const STEPS = [
  { key: 1, label: 'Your Story'      },
  { key: 2, label: 'Skills & Domains' },
  { key: 3, label: 'Background'       },
];

export default function ProfileSetup() {
  const router = useRouter();
  const [step,          setStep]          = useState(1);
  const [saving,        setSaving]        = useState(false);
  const [userRole,      setUserRole]      = useState<'student' | 'mentor'>('student');
  const [bio,           setBio]           = useState('');
  const [githubUrl,     setGithubUrl]     = useState('');
  const [linkedinUrl,   setLinkedinUrl]   = useState('');
  const [avatarUrl,     setAvatarUrl]     = useState('');
  const [skills,        setSkills]        = useState<string[]>([]);
  const [skillInput,    setSkillInput]    = useState('');
  const [interests,     setInterests]     = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState('');
  const [domains,       setDomains]       = useState<string[]>([]);
  const [domainInput,   setDomainInput]   = useState('');
  const [college,       setCollege]       = useState('');
  const [yearOfStudy,   setYearOfStudy]   = useState('1');
  const [cgpa,          setCgpa]          = useState('');
  const [company,       setCompany]       = useState('');
  const [designation,   setDesignation]   = useState('');
  const [expertise,     setExpertise]     = useState('');
  const [yearsOfExp,    setYearsOfExp]    = useState('');
  const [error,         setError]         = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get('/auth/me').then(res => setUserRole(res.data.data.role)).catch(console.error);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const fd = new FormData(); fd.append('avatar', file);
    try { const res = await api.post('/profile/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); setAvatarUrl(res.data.data.avatar_url); }
    catch { /* silent */ }
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
    setSaving(true); setError('');
    try {
      const payload: any = { bio, avatar_url: avatarUrl, github_url: githubUrl, linkedin_url: linkedinUrl, skills, interests, preferred_domains: domains };
      if (userRole === 'student') { payload.college = college; payload.year_of_study = yearOfStudy; if (cgpa) payload.cgpa = cgpa; }
      else { payload.company = company; payload.designation = designation; payload.expertise = expertise; if (yearsOfExp) payload.years_of_experience = Number(yearsOfExp); }
      await api.put('/profile/me', payload);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-[#1C1C1C]">

      {/* Top bar */}
      <header className="bg-[#1C1C1C] border-b-2 border-[#F7941D]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 bg-[#F7941D]" />
            <span className={`${F.space} font-bold text-white text-lg tracking-[0.05em]`}>ECOSYSTEM</span>
          </a>
          <div className={`${F.space} text-[11px] tracking-[0.15em] uppercase text-white/40`}>Profile Setup</div>
        </div>
      </header>

      {/* Step indicator */}
      <div className="border-b-2 border-[#1C1C1C] bg-white">
        <div className="max-w-[900px] mx-auto px-6 lg:px-0">
          <div className="flex divide-x-2 divide-[#1C1C1C]">
            {STEPS.map(s => (
              <button key={s.key} onClick={() => s.key < step && setStep(s.key)}
                className={`${F.space} flex-1 py-4 font-bold text-[11px] tracking-[0.15em] uppercase flex items-center justify-center gap-2 transition-colors
                  ${step === s.key ? 'bg-[#1C1C1C] text-white' : s.key < step ? 'bg-[#F5F4F0] text-[#888888] hover:text-[#1C1C1C] cursor-pointer' : 'bg-white text-[#CCCCCC] cursor-not-allowed'}`}>
                <span className={step === s.key ? 'text-[#F7941D]' : s.key < step ? 'text-[#F7941D]' : 'text-inherit'}>
                  {String(s.key).padStart(2, '0')}
                </span>
                <span className="hidden sm:block">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-6 lg:px-0 py-12 flex flex-col gap-8">

        {error && <div className="eco-error">{error}</div>}

        {/* Step 1: Story */}
        {step === 1 && (
          <>
            <div>
              <div className={`${F.space} text-[11px] tracking-[0.25em] uppercase text-[#F7941D] mb-3`}>Step 01</div>
              <h1 className={`${F.display} font-black italic text-[#1C1C1C] mb-2`} style={{ fontSize: 'clamp(28px, 3vw, 40px)' }}>
                Tell us your story.
              </h1>
              <p className={`${F.serif} text-[#888888] text-[15px] leading-[1.8]`}>
                Your profile is your identity in the ecosystem. Make it count.
              </p>
            </div>

            {/* Avatar upload */}
            <DataPanel eyebrow="Photo" title="Profile Picture">
              <div className="flex items-center gap-6">
                <div className="relative cursor-pointer group w-24 h-24 border-2 border-[#1C1C1C] overflow-hidden bg-[#F5F4F0] flex items-center justify-center flex-shrink-0"
                  onClick={() => fileInputRef.current?.click()}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    : <div className={`${F.bebas} text-[#CCCCCC] text-4xl`}>+</div>
                  }
                  <div className="absolute inset-0 bg-[#1C1C1C]/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <span className={`${F.space} text-white text-[10px] font-bold tracking-widest uppercase`}>Upload</span>
                  </div>
                </div>
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
                <p className={`${F.serif} text-[#888888] text-[13px] leading-[1.7]`}>
                  Upload a professional headshot. JPG or PNG, max 2 MB. You can skip this for now.
                </p>
              </div>
            </DataPanel>

            <DataPanel eyebrow="About" title="Your Bio & Links">
              <div className="flex flex-col gap-5">
                <div>
                  <label className="eco-label">Bio *</label>
                  <textarea rows={5} value={bio} onChange={e => setBio(e.target.value)}
                    placeholder="Describe yourself, your goals, and what you bring to the ecosystem…"
                    className="eco-input off-white" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="eco-label">GitHub (optional)</label>
                    <input type="url" value={githubUrl} onChange={e => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/you" className="eco-input off-white" />
                  </div>
                  <div>
                    <label className="eco-label">LinkedIn (optional)</label>
                    <input type="url" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/you" className="eco-input off-white" />
                  </div>
                </div>
              </div>
            </DataPanel>
          </>
        )}

        {/* Step 2: Skills */}
        {step === 2 && (
          <>
            <div>
              <div className={`${F.space} text-[11px] tracking-[0.25em] uppercase text-[#F7941D] mb-3`}>Step 02</div>
              <h1 className={`${F.display} font-black italic text-[#1C1C1C] mb-2`} style={{ fontSize: 'clamp(28px, 3vw, 40px)' }}>
                What can you build?
              </h1>
              <p className={`${F.serif} text-[#888888] text-[15px] leading-[1.8]`}>
                Skills help us match you with the right startups, mentors, and teammates.
              </p>
            </div>

            <DataPanel eyebrow="Expertise" title="Skills, Interests & Domains">
              <div className="flex flex-col gap-7">
                {([
                  { label: 'Skills *', items: skills, setter: setSkills, input: skillInput, setInput: setSkillInput },
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
                      placeholder="Type and press Enter to add…"
                      className="eco-input off-white" />
                  </div>
                ))}
              </div>
            </DataPanel>
          </>
        )}

        {/* Step 3: Background */}
        {step === 3 && (
          <>
            <div>
              <div className={`${F.space} text-[11px] tracking-[0.25em] uppercase text-[#F7941D] mb-3`}>Step 03</div>
              <h1 className={`${F.display} font-black italic text-[#1C1C1C] mb-2`} style={{ fontSize: 'clamp(28px, 3vw, 40px)' }}>
                {userRole === 'mentor' ? 'Your professional background.' : 'Your academic background.'}
              </h1>
            </div>

            {userRole === 'student' && (
              <DataPanel eyebrow="Academic" title="Student Details">
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
              <DataPanel eyebrow="Professional" title="Mentor Details">
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
          </>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-4 border-t-2 border-[#1C1C1C]">
          <button
            onClick={() => { setStep(s => Math.max(1, s - 1)); setError(''); }}
            disabled={step === 1}
            className={`${F.space} font-bold text-[12px] tracking-[0.1em] uppercase border-2 border-[#1C1C1C] text-[#1C1C1C] px-6 py-3.5 hover:bg-[#1C1C1C] hover:text-white disabled:opacity-30 transition-colors`}>
            ← Back
          </button>

          {step < 3 ? (
            <button onClick={() => {
              if (step === 2 && skills.length === 0) { setError('Add at least one skill before continuing.'); return; }
              setError('');
              setStep(s => s + 1);
            }}
              className={`${F.space} font-bold text-[13px] tracking-[0.1em] uppercase bg-[#F7941D] text-white px-8 py-3.5 hover:bg-[#1C1C1C] transition-colors`}>
              Continue →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving}
              className={`${F.space} font-bold text-[13px] tracking-[0.1em] uppercase bg-[#1C1C1C] text-white px-8 py-3.5 hover:bg-[#F7941D] disabled:opacity-40 transition-colors`}>
              {saving ? 'Saving…' : 'Complete Setup →'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
