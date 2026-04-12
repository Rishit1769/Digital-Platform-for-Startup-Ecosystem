'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/axios';

export default function ProfileSetup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<'student' | 'mentor'>('student');
  
  // Form state
  const [bio, setBio] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  
  const [interests, setInterests] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState('');
  
  const [domains, setDomains] = useState<string[]>([]);
  const [domainInput, setDomainInput] = useState('');
  
  // Student fields
  const [college, setCollege] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('1');
  const [cgpa, setCgpa] = useState('');
  
  // Mentor fields
  const [company, setCompany] = useState('');
  const [designation, setDesignation] = useState('');
  const [expertise, setExpertise] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch current user details to know role
    api.get('/auth/me').then(res => {
      setUserRole(res.data.data.role);
    }).catch(err => {
      console.error(err);
      // Could redirect to login if fails, but axios interceptor handles 401
    });
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await api.post('/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setAvatarUrl(res.data.data.avatar_url);
    } catch (err) {
      console.error('Failed to upload image', err);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>, setter: any, items: string[], setInput: any) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim() !== '') {
      e.preventDefault();
      if (!items.includes(e.currentTarget.value.trim())) {
        setter([...items, e.currentTarget.value.trim()]);
      }
      setInput('');
    }
  };

  const removeTag = (idx: number, setter: any, items: string[]) => {
    setter(items.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload: any = {
        bio, avatar_url: avatarUrl, github_url: githubUrl, linkedin_url: linkedinUrl,
        skills, interests, preferred_domains: domains
      };
      
      if (userRole === 'student') {
        payload.college = college;
        payload.year_of_study = yearOfStudy;
        if (cgpa) payload.cgpa = cgpa;
      } else {
        payload.company = company;
        payload.designation = designation;
        payload.expertise = expertise;
        if (yearsOfExperience) payload.years_of_experience = Number(yearsOfExperience);
      }

      await api.put('/profile/me', payload);
      router.push(userRole === 'student' ? '/dashboard' : '/mentor');
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Complete Your Profile</h1>
        
        {/* Progress Bar */}
        <div className="flex gap-2 h-2 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className={`flex-1 rounded-full ${step >= i ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="flex flex-col items-center">
              <div 
                className="w-32 h-32 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden cursor-pointer relative group"
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400">Add Photo</span>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-sm">Upload</span>
                </div>
              </div>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
              <textarea 
                rows={3} 
                className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white" 
                value={bio} onChange={e => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">GitHub URL</label>
                <input type="url" className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">LinkedIn URL</label>
                <input type="url" className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Skills</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {skills.map((s, i) => (
                  <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {s} <button onClick={() => removeTag(i, setSkills, skills)} className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400">&times;</button>
                  </span>
                ))}
              </div>
              <input 
                type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)} 
                onKeyDown={e => handleAddTag(e, setSkills, skills, setSkillInput)}
                placeholder="Type skill and press Enter"
                className="block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Interests</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {interests.map((s, i) => (
                  <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    {s} <button onClick={() => removeTag(i, setInterests, interests)} className="ml-2 text-purple-600 hover:text-purple-800 dark:text-purple-400">&times;</button>
                  </span>
                ))}
              </div>
              <input 
                type="text" value={interestInput} onChange={e => setInterestInput(e.target.value)} 
                onKeyDown={e => handleAddTag(e, setInterests, interests, setInterestInput)}
                placeholder="Type interest and press Enter"
                className="block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Preferred Domains</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {domains.map((s, i) => (
                  <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {s} <button onClick={() => removeTag(i, setDomains, domains)} className="ml-2 text-green-600 hover:text-green-800 dark:text-green-400">&times;</button>
                  </span>
                ))}
              </div>
              <input 
                type="text" value={domainInput} onChange={e => setDomainInput(e.target.value)} 
                onKeyDown={e => handleAddTag(e, setDomains, domains, setDomainInput)}
                placeholder="Type domain and press Enter"
                className="block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {step === 3 && userRole === 'student' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">College/University</label>
              <input type="text" className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl" value={college} onChange={e => setCollege(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Year of Study</label>
                <select className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl" value={yearOfStudy} onChange={e => setYearOfStudy(e.target.value)}>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                  <option value="alumni">Alumni</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">CGPA (Optional)</label>
                <input type="number" step="0.01" max="10" className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl" value={cgpa} onChange={e => setCgpa(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {step === 3 && userRole === 'mentor' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company</label>
                <input type="text" className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl" value={company} onChange={e => setCompany(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Designation</label>
                <input type="text" className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl" value={designation} onChange={e => setDesignation(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Expertise</label>
              <input type="text" className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl" value={expertise} onChange={e => setExpertise(e.target.value)} placeholder="E.g., Scalability, Go-to-market" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Years of Experience</label>
              <input type="number" className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl" value={yearsOfExperience} onChange={e => setYearsOfExperience(e.target.value)} />
            </div>
          </div>
        )}

        <div className="mt-10 flex justify-between">
          <button 
            type="button" 
            onClick={() => setStep(step - 1)} 
            disabled={step === 1}
            className="px-6 py-3 font-semibold text-gray-700 disabled:opacity-50"
          >
            Back
          </button>
          
          {step < 3 ? (
            <button 
              type="button" 
              onClick={() => setStep(step + 1)}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow hover:bg-blue-700 transition"
            >
              Next
            </button>
          ) : (
            <button 
              type="button" 
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold shadow hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              {loading && <span className="w-4 h-4 rounded-full border-2 border-white animate-spin border-t-transparent" />}
              Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
