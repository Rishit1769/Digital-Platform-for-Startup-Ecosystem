'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../../lib/axios';
import Avatar from '../../../../components/Avatar';

export default function ProfileEdit() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [userRole, setUserRole] = useState<'student' | 'mentor'>('student');
  const [name, setName] = useState('');
  
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
    // Fetch profile
    api.get('/profile/me').then(res => {
      const data = res.data.data;
      setUserRole(data.role);
      setName(data.name);
      
      const p = data.profile || {};
      setBio(p.bio || '');
      setGithubUrl(p.github_url || '');
      setLinkedinUrl(p.linkedin_url || '');
      setAvatarUrl(p.avatar_url || '');
      
      setSkills(Array.isArray(p.skills) ? p.skills : (typeof p.skills === 'string' ? JSON.parse(p.skills) : []));
      setInterests(Array.isArray(p.interests) ? p.interests : (typeof p.interests === 'string' ? JSON.parse(p.interests) : []));
      setDomains(Array.isArray(p.preferred_domains) ? p.preferred_domains : (typeof p.preferred_domains === 'string' ? JSON.parse(p.preferred_domains) : []));
      
      if (data.role === 'student') {
        setCollege(p.college || '');
        setYearOfStudy(p.year_of_study || '1');
        setCgpa(p.cgpa ? String(p.cgpa) : '');
      } else {
        setCompany(p.company || '');
        setDesignation(p.designation || '');
        setExpertise(p.expertise || '');
        setYearsOfExperience(p.years_of_experience ? String(p.years_of_experience) : '');
      }
      setInitialLoad(false);
    }).catch(err => {
      console.error(err);
    });
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await api.post('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
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

  const removeTag = (idx: number, setter: any, items: string[]) => setter(items.filter((_, i) => i !== idx));

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
      router.push(`/profile/me`); // Redirecting to profile view
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoad) return <div className="min-h-screen flex items-center justify-center dark:bg-gray-900 bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900 flex justify-center py-12">
      <div className="max-w-3xl w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 space-y-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white border-b pb-4 dark:border-gray-700">Edit Profile</h1>
        
        {/* Basic Info */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Basic Information</h2>
          <div className="flex items-center gap-6">
            <div 
              className="relative cursor-pointer group rounded-full overflow-hidden w-32 h-32"
              onClick={() => fileInputRef.current?.click()}
            >
              <Avatar name={name} avatarUrl={avatarUrl} size="xl" />
              <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-sm font-medium">Change Photo</span>
              </div>
            </div>
            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Allowed formats: JPG, PNG. Max size: 2MB.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
            <textarea rows={3} className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl" value={bio} onChange={e => setBio(e.target.value)} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">GitHub URL</label>
              <input type="url" className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">LinkedIn URL</label>
              <input type="url" className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Professional Details</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Skills</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {skills.map((s, i) => (
                <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {s} <button onClick={() => removeTag(i, setSkills, skills)} className="ml-2 hover:text-blue-500">&times;</button>
                </span>
              ))}
            </div>
            <input 
              type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)} 
              onKeyDown={e => handleAddTag(e, setSkills, skills, setSkillInput)}
              className="block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl" placeholder="Type and press Enter"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Interests</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {interests.map((s, i) => (
                <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  {s} <button onClick={() => removeTag(i, setInterests, interests)} className="ml-2 hover:text-purple-500">&times;</button>
                </span>
              ))}
            </div>
            <input 
              type="text" value={interestInput} onChange={e => setInterestInput(e.target.value)} 
              onKeyDown={e => handleAddTag(e, setInterests, interests, setInterestInput)}
              className="block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl" placeholder="Type and press Enter"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Preferred Domains</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {domains.map((s, i) => (
                <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  {s} <button onClick={() => removeTag(i, setDomains, domains)} className="ml-2 hover:text-green-500">&times;</button>
                </span>
              ))}
            </div>
            <input 
              type="text" value={domainInput} onChange={e => setDomainInput(e.target.value)} 
              onKeyDown={e => handleAddTag(e, setDomains, domains, setDomainInput)}
              className="block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl" placeholder="Type and press Enter"
            />
          </div>
        </div>

        {/* Role Specific */}
        {userRole === 'student' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Academic Information</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">College / University</label>
              <input type="text" className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl" value={college} onChange={e => setCollege(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Year of Study</label>
                <select className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl" value={yearOfStudy} onChange={e => setYearOfStudy(e.target.value)}>
                  <option value="1">1st Year</option><option value="2">2nd Year</option>
                  <option value="3">3rd Year</option><option value="4">4th Year</option>
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

        {userRole === 'mentor' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Expertise Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company</label>
                <input type="text" className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl" value={company} onChange={e => setCompany(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Designation</label>
                <input type="text" className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl" value={designation} onChange={e => setDesignation(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Expertise</label>
                <input type="text" className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl" value={expertise} onChange={e => setExpertise(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Years of Experience</label>
                <input type="number" className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl" value={yearsOfExperience} onChange={e => setYearsOfExperience(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        <div className="pt-6 flex justify-end gap-4">
          <button type="button" onClick={() => router.back()} className="px-6 py-3 font-semibold text-gray-700">Cancel</button>
          <button 
            type="button" onClick={handleSubmit} disabled={loading}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow hover:bg-blue-700 transition"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
