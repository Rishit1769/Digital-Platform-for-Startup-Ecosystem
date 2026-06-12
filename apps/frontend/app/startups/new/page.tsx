'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/axios';

const F = {
  display: 'font-[family-name:var(--font-playfair)]',
  space: 'font-[family-name:var(--font-space)]',
  serif: 'font-[family-name:var(--font-serif)]',
  bebas: 'font-[family-name:var(--font-bebas)]',
};

const STAGES = ['idea', 'mvp', 'growth', 'funded'];

export default function CreateStartup() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [domain, setDomain] = useState('');
  const [stage, setStage] = useState('idea');
  const [description, setDescription] = useState('');

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');

  const [firstRoleTitle, setFirstRoleTitle] = useState('');
  const [firstRoleDescription, setFirstRoleDescription] = useState('');
  const [firstRoleSkills, setFirstRoleSkills] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const parseSkills = (raw: string): string[] => {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !description.trim()) {
      setError('Startup name and description are required.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const createRes = await api.post('/startups', {
        name: name.trim(),
        tagline: tagline.trim() || null,
        description: description.trim(),
        domain: domain.trim() || null,
        stage,
      });

      const startupId = createRes.data.startup_id;

      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);
        await api.post(`/startups/${startupId}/logo`, formData, { isFormData: true });
      }

      if (firstRoleTitle.trim()) {
        await api.post(`/startups/${startupId}/roles`, {
          title: firstRoleTitle.trim(),
          description: firstRoleDescription.trim() || null,
          skills_required: parseSkills(firstRoleSkills),
        });
      }

      router.push(`/startups/${startupId}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create startup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-[#1C1C1C]">
      <header className="bg-[#1C1C1C] border-b-2 border-[#F7941D]">
        <div className="max-w-[980px] mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 bg-[#F7941D]" />
            <span className={`${F.space} font-bold text-white text-lg tracking-[0.05em]`}>ECOSYSTEM</span>
          </a>
          <button
            onClick={() => router.push('/dashboard')}
            className={`${F.space} text-[12px] text-white/70 hover:text-white border border-white/20 px-4 py-2 transition-colors`}
          >
            Cancel
          </button>
        </div>
      </header>

      <div className="max-w-[980px] mx-auto px-6 py-10">
        <div className="mb-8">
          <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#F7941D] mb-3`}>Founder Setup</div>
          <h1 className={`${F.display} font-black italic text-[#1C1C1C]`} style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}>
            Add Your Startup Details.
          </h1>
          <p className={`${F.serif} text-[#666666] mt-3 max-w-2xl`}>
            Publish your startup profile for mentors and student builders. You can also post your first open role right now.
          </p>
        </div>

        {error && <div className="eco-error mb-6">{error}</div>}

        <div className="bg-white border-2 border-[#1C1C1C] p-6 md:p-8 flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="eco-label">Startup Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="NovaGrid Labs"
                className="eco-input off-white"
              />
            </div>

            <div>
              <label className="eco-label">Domain</label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="FinTech"
                className="eco-input off-white"
              />
            </div>

            <div>
              <label className="eco-label">Stage</label>
              <select value={stage} onChange={(e) => setStage(e.target.value)} className="eco-input off-white">
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="eco-label">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Turning repayment behavior into growth credit rails"
                className="eco-input off-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="eco-label">Description *</label>
              <textarea
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the problem, your solution, target users, and current progress."
                className="eco-input off-white"
              />
            </div>
          </div>

          <div className="border-t-2 border-[#1C1C1C] pt-7">
            <label className="eco-label">Startup Logo (optional)</label>
            <div className="flex items-center gap-5">
              <div
                className="w-28 h-28 border-2 border-[#1C1C1C] bg-[#F5F4F0] flex items-center justify-center overflow-hidden cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className={`${F.bebas} text-[#CCCCCC] text-3xl`}>+</span>
                )}
              </div>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleLogoUpload} />
              <p className={`${F.serif} text-[#888888] text-sm`}>Upload logo to improve discovery visibility. JPG/PNG up to 2 MB.</p>
            </div>
          </div>

          <div className="border-t-2 border-[#1C1C1C] pt-7">
            <div className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#F7941D] mb-2`}>Hiring Setup</div>
            <h2 className={`${F.space} font-bold text-[#1C1C1C] text-lg mb-1`}>Post Your First Open Role (optional)</h2>
            <p className={`${F.serif} text-[#666666] text-sm mb-5`}>
              Add at least a role title to make this startup appear immediately in Hiring Startups.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="eco-label">Role Title</label>
                <input
                  type="text"
                  value={firstRoleTitle}
                  onChange={(e) => setFirstRoleTitle(e.target.value)}
                  placeholder="Founding Frontend Engineer"
                  className="eco-input off-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="eco-label">Role Description</label>
                <textarea
                  rows={4}
                  value={firstRoleDescription}
                  onChange={(e) => setFirstRoleDescription(e.target.value)}
                  placeholder="What will this person own in the next 3 months?"
                  className="eco-input off-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="eco-label">Skills Required (comma separated)</label>
                <input
                  type="text"
                  value={firstRoleSkills}
                  onChange={(e) => setFirstRoleSkills(e.target.value)}
                  placeholder="React, TypeScript, API Integration"
                  className="eco-input off-white"
                />
              </div>
            </div>
          </div>

          <div className="border-t-2 border-[#1C1C1C] pt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className={`${F.space} text-[12px] font-bold tracking-[0.1em] uppercase border-2 border-[#1C1C1C] text-[#1C1C1C] px-5 py-3 hover:bg-[#1C1C1C] hover:text-white transition-colors`}
            >
              Back
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className={`${F.space} text-[12px] font-bold tracking-[0.1em] uppercase bg-[#F7941D] text-white px-7 py-3 border-2 border-[#F7941D] hover:bg-[#1C1C1C] hover:border-[#1C1C1C] transition-colors disabled:opacity-40`}
            >
              {loading ? 'Saving…' : 'Create Startup'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
