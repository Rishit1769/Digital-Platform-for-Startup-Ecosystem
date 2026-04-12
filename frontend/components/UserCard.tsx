import React from 'react';
import Avatar from './Avatar';
import { useRouter } from 'next/navigation';

export default function UserCard({ user }: { user: any }) {
  const router = useRouter();
  
  const parseJson = (val: any) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch(e) {}
    }
    return [];
  };

  const skills = parseJson(user.skills).slice(0, 3);
  const domains = parseJson(user.preferred_domains).slice(0, 2);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition border border-gray-100 dark:border-gray-700 p-6 flex flex-col items-center text-center">
      <Avatar name={user.name} avatarUrl={user.avatar_url} size="lg" verified={!!user.is_verified} />
      
      <h3 className="mt-4 font-bold text-gray-900 dark:text-white truncate w-full">{user.name}</h3>
      <p className="text-sm text-blue-600 dark:text-blue-400 capitalize font-medium">{user.role}</p>

      {user.role === 'mentor' && user.company && (
        <p className="text-xs text-gray-500 mt-1 truncate w-full">{user.designation} at {user.company}</p>
      )}
      {user.role === 'student' && user.college && (
        <p className="text-xs text-gray-500 mt-1 truncate w-full">{user.college}</p>
      )}

      <div className="mt-4 flex flex-wrap justify-center gap-1.5 w-full">
        {skills.map((s: string, idx: number) => (
          <span key={idx} className="px-2 py-1 text-xs rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            {s}
          </span>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap justify-center gap-1.5 w-full">
        {domains.map((d: string, idx: number) => (
          <span key={idx} className="px-2 py-1 text-xs rounded-md bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">
            {d}
          </span>
        ))}
      </div>

      <button 
        onClick={() => router.push(`/profile/${user.id}`)}
        className="mt-6 w-full py-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition text-sm"
      >
        View Profile
      </button>
    </div>
  );
}
