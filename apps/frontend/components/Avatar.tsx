import React from 'react';

interface AvatarProps {
  userId?: number;
  name: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  verified?: boolean;
}

export default function Avatar({ name, avatarUrl, size = 'md', verified = false }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-32 h-32 text-3xl',
  };

  const badgeSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-8 h-8',
  };

  return (
    <div className="relative inline-block">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full border-2 border-white dark:border-gray-800 shadow-sm bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold select-none`}
        >
          {initials}
        </div>
      )}
      
      {verified && (
        <div
          className={`absolute bottom-0 right-0 rounded-full bg-white dark:bg-gray-800 p-0.5 shadow-sm transform translate-x-1/4 translate-y-1/4`}
          title="Verified"
        >
          <svg className={`${badgeSizeClasses[size]} text-blue-500`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
}
