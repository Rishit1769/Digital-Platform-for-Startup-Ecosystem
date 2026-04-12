'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { api } from '../../../lib/axios';
import Avatar from '../../../components/Avatar';

export default function ProfileView({ params }: { params: Promise<{ userId: string }> }) {
  const router = useRouter();
  const { userId } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If 'me', we can fetch /profile/me or handle differently.
    // Assuming backend handles /api/profile/:userId accurately.
    const url = userId === 'me' ? '/profile/me' : `/profile/${userId}`;
    api.get(url).then(res => {
      setData(res.data.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [userId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-gray-900 bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center dark:bg-gray-900 bg-gray-50 dark:text-white">Profile not found.</div>;

  const { name, role, profile, badges } = data;
  const isVerified = badges && badges.length > 0;
  
  const parseJson = (val: any) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch (e) { return []; }
    }
    return [];
  };

  const skills = parseJson(profile?.skills);
  const interests = parseJson(profile?.interests);
  const domains = parseJson(profile?.preferred_domains);

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900 flex justify-center py-12">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Sidebar */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-20"></div>
            
            <div className="relative mt-4">
              <Avatar name={name} avatarUrl={profile?.avatar_url} size="xl" verified={isVerified} />
            </div>
            
            <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
              {name}
            </h1>
            <p className="text-blue-600 dark:text-blue-400 capitalize font-medium">{role}</p>
            
            {role === 'student' && profile?.college && (
              <p className="text-gray-500 mt-2 text-sm">{profile.college}</p>
            )}
            {role === 'mentor' && profile?.designation && (
              <p className="text-gray-500 mt-2 text-sm">{profile.designation} at {profile.company}</p>
            )}

            <div className="mt-6 flex flex-col w-full gap-3">
              <button className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition">
                Connect
              </button>
              <button 
                onClick={() => router.push(`/meetings/request/${data.id}`)}
                className="w-full py-2.5 border border-blue-600 text-blue-600 dark:text-blue-400 rounded-xl font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
              >
                Request Meeting
              </button>
              {userId === 'me' && (
                 <button 
                 onClick={() => router.push(`/profile/me/edit`)}
                 className="w-full py-2.5 mt-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition"
               >
                 Edit Profile
               </button>
              )}
            </div>

            {/* Social Links */}
            <div className="mt-6 flex justify-center gap-4 border-t border-gray-100 dark:border-gray-700 pt-6 w-full">
              {profile?.github_url && (
                <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
                </a>
              )}
              {profile?.linkedin_url && (
                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-700 filter transition">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" /></svg>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">About</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {profile?.bio ? profile.bio : 'No bio provided yet.'}
            </p>

            {role === 'mentor' && profile?.expertise && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <h3 className="font-semibold text-blue-900 dark:text-blue-200">Expertise</h3>
                <p className="text-blue-800 dark:text-blue-300 mt-1">{profile.expertise}</p>
              </div>
            )}
            
            {role === 'student' && profile?.year_of_study && (
              <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                <h3 className="font-semibold text-indigo-900 dark:text-indigo-200">Academic Status</h3>
                <p className="text-indigo-800 dark:text-indigo-300 mt-1">Year {profile.year_of_study} • CGPA: {profile.cgpa || 'N/A'}</p>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Skills & Interests</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.length ? skills.map((s: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 rounded-full text-sm font-medium">
                      {s}
                    </span>
                  )) : <span className="text-gray-400 italic text-sm">None added</span>}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase mb-3">Preferred Domains</h3>
                <div className="flex flex-wrap gap-2">
                  {domains.length ? domains.map((s: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 rounded-full text-sm font-medium">
                      {s}
                    </span>
                  )) : <span className="text-gray-400 italic text-sm">None added</span>}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase mb-3">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {interests.length ? interests.map((s: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 rounded-full text-sm font-medium">
                      {s}
                    </span>
                  )) : <span className="text-gray-400 italic text-sm">None added</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
