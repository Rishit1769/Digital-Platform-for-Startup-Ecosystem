import React from 'react';

export default function SkeletonLoader({ type = 'card', count = 1 }: { type?: 'card' | 'text' | 'radar', count?: number }) {
  const renderItem = (i: number) => {
    if (type === 'card') {
      return (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 flex flex-col items-center animate-pulse">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="flex gap-2 mb-6">
            <div className="w-12 h-6 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
            <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
          </div>
          <div className="w-full h-10 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        </div>
      );
    }
    if (type === 'radar') {
      return (
        <div key={i} className="min-w-[300px] h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse flex-shrink-0 mr-4"></div>
      );
    }
    return (
      <div key={i} className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
    );
  };

  return <>{Array.from({ length: count }).map((_, i) => renderItem(i))}</>;
}
