'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/axios';
import UserCard from '../../components/UserCard';
import SkeletonLoader from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';
import FilterChip from '../../components/FilterChip';

export default function Discover() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  
  // Dummy options for quick filtering
  const availableSkills = ['React', 'Node.js', 'Python', 'Marketing', 'Sales', 'Design'];
  const availableDomains = ['FinTech', 'EdTech', 'HealthTech', 'E-commerce', 'AI/ML'];

  // Debouncing search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    fetchUsers();
  }, [debouncedSearch, selectedRole, selectedSkills, selectedDomains]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query = `/discover/users?page=1&limit=20`;
      if (debouncedSearch) query += `&search=${encodeURIComponent(debouncedSearch)}`;
      if (selectedRole) query += `&role=${selectedRole}`;
      if (selectedSkills.length) query += `&skills=${selectedSkills.join(',')}`;
      if (selectedDomains.length) query += `&domains=${selectedDomains.join(',')}`;

      const res = await api.get(query);
      setUsers(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSkill = (s: string) => {
    setSelectedSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const toggleDomain = (d: string) => {
    setSelectedDomains(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      
      {/* Top Search Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by name, bio, or keyword..."
              className="block w-full pl-11 pr-4 py-3 bg-gray-100 dark:bg-gray-700 border-transparent rounded-full text-gray-900 dark:text-white placeholder-gray-500 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors shadow-inner"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Left Sidebar Filters */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-8">
          <div>
            <h3 className="text-xs font-bold tracking-wider text-gray-500 uppercase mb-4">Role</h3>
            <select 
              value={selectedRole} 
              onChange={e => setSelectedRole(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              <option value="student">Student</option>
              <option value="mentor">Mentor</option>
            </select>
          </div>

          <div>
            <h3 className="text-xs font-bold tracking-wider text-gray-500 uppercase mb-4">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {availableSkills.map(skill => (
                <FilterChip 
                  key={skill} label={skill} 
                  active={selectedSkills.includes(skill)} 
                  onClick={() => toggleSkill(skill)} 
                />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold tracking-wider text-gray-500 uppercase mb-4">Domains</h3>
            <div className="flex flex-wrap gap-2">
              {availableDomains.map(domain => (
                <FilterChip 
                  key={domain} label={domain} 
                  active={selectedDomains.includes(domain)} 
                  onClick={() => toggleDomain(domain)} 
                />
              ))}
            </div>
          </div>
          
          {(selectedRole || selectedSkills.length > 0 || selectedDomains.length > 0) && (
            <button 
              onClick={() => { setSelectedRole(''); setSelectedSkills([]); setSelectedDomains([]); }}
              className="mt-4 w-full py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <SkeletonLoader type="card" count={6} />
            </div>
          ) : users.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map(u => (
                <UserCard key={u.id} user={u} />
              ))}
            </div>
          ) : (
            <EmptyState message={`No users matched your criteria.`} />
          )}
        </div>

      </div>
    </div>
  );
}
