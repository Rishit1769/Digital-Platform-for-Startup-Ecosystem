import React from 'react';

export default function EmptyState({ message = 'No results found' }: { message?: string }) {
  return (
    <div className="w-full py-16 flex flex-col items-center justify-center text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
      <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{message}</h3>
      <p className="text-gray-500 dark:text-gray-400 mt-1">Try adjusting your filters or search query.</p>
    </div>
  );
}
