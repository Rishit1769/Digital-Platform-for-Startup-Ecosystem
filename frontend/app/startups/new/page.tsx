'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/axios';

export default function CreateStartup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [domain, setDomain] = useState('');
  const [stage, setStage] = useState('idea');
  
  const [description, setDescription] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  
  const [invites, setInvites] = useState([{ email: '', role: 'Co-founder' }]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const addInvite = () => setInvites([...invites, { email: '', role: 'Member' }]);
  const updateInvite = (idx: number, field: string, val: string) => {
    const updated = [...invites];
    updated[idx] = { ...updated[idx], [field]: val };
    setInvites(updated);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Create Startup
      const res = await api.post('/startups', { name, tagline, description, domain, stage });
      const startupId = res.data.startup_id;

      // 2. Upload Logo
      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);
        await api.post(`/startups/${startupId}/logo`, formData, { headers: { 'Content-Type': 'multipart/form-data' }});
      }

      // 3. Send Invites
      for (const inv of invites) {
        if (inv.email.trim()) {
          try {
            await api.post(`/startups/${startupId}/invite`, { email: inv.email, role: inv.role });
          } catch (e) {
             console.error('Failed to invite', inv.email);
          }
        }
      }

      router.push(`/startups/${startupId}`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center py-12 px-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Create Your Startup</h1>

        {/* Progress Bar */}
        <div className="flex gap-2 h-2 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className={`flex-1 rounded-full ${step >= i ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Startup Name</label>
              <input type="text" className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tagline</label>
              <input type="text" className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl" value={tagline} onChange={e => setTagline(e.target.value)} placeholder="One short sentence" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Domain</label>
                <input type="text" className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl" value={domain} onChange={e => setDomain(e.target.value)} placeholder="e.g. FinTech" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stage</label>
                <select className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl" value={stage} onChange={e => setStage(e.target.value)}>
                  <option value="idea">Idea</option>
                  <option value="mvp">MVP</option>
                  <option value="growth">Growth</option>
                  <option value="funded">Funded</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="flex flex-col items-center">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 w-full mb-2">Startup Logo</label>
              <div 
                className="w-32 h-32 rounded-2xl bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden cursor-pointer relative group"
                onClick={() => fileInputRef.current?.click()}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400">Upload</span>
                )}
              </div>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleLogoUpload} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Description</label>
              <textarea rows={5} className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the problem, solution, and market..." />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Invite Co-founders & Team</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">You can do this later from the manage page.</p>

            {invites.map((inv, idx) => (
              <div key={idx} className="flex gap-4">
                <input 
                  type="email" placeholder="Email address" 
                  className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl"
                  value={inv.email} onChange={e => updateInvite(idx, 'email', e.target.value)}
                />
                <input 
                  type="text" placeholder="Role (e.g. CTO)" 
                  className="w-32 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl"
                  value={inv.role} onChange={e => updateInvite(idx, 'role', e.target.value)}
                />
              </div>
            ))}
            <button type="button" onClick={addInvite} className="text-blue-600 text-sm font-medium hover:underline">+ Add another</button>
          </div>
        )}

        <div className="mt-10 flex justify-between">
          <button 
            type="button" onClick={() => setStep(step - 1)} disabled={step === 1}
            className="px-6 py-3 font-semibold text-gray-700 disabled:opacity-50"
          >
            Back
          </button>
          {step < 3 ? (
            <button 
              type="button" onClick={() => setStep(step + 1)}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
            >
              Next
            </button>
          ) : (
            <button 
              type="button" onClick={handleSubmit} disabled={loading}
              className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold shadow hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              {loading && <span className="w-4 h-4 rounded-full border-2 border-white animate-spin border-t-transparent" />}
              Launch Startup
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
