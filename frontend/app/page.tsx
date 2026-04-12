'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    const checkApi = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`);
        const data = await res.json();
        if (data.success) {
          setApiStatus('connected');
        } else {
          setApiStatus('error');
        }
      } catch (error) {
        setApiStatus('error');
      }
    };

    checkApi();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col items-center gap-8 text-center max-w-2xl w-full p-12 bg-white dark:bg-gray-800 rounded-3xl shadow-xl transition-all hover:shadow-2xl">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-7xl mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
          CloudCampus
        </h1>
        
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Welcome to the next-generation digital ecosystem for startups, students, and mentors.
        </p>

        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="text-lg font-medium text-gray-700 dark:text-gray-200">
            API Connection Status
          </div>
          
          {apiStatus === 'checking' && (
            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 animate-pulse">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
              </span>
              Checking connection...
            </div>
          )}
          
          {apiStatus === 'connected' && (
            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              Successfully connected to backend
            </div>
          )}
          
          {apiStatus === 'error' && (
            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              Failed to connect to backend
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
