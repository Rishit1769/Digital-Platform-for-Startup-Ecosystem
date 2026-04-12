'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/axios';
import AIMatches from '../../components/AIMatches';
import { useAuth } from '../../lib/auth';

const F = {
  display: "font-[family-name:var(--font-playfair)]",
  space:   "font-[family-name:var(--font-space)]",
  serif:   "font-[family-name:var(--font-serif)]",
  bebas:   "font-[family-name:var(--font-bebas)]",
};

const availableSkills  = ['React', 'Node.js', 'Python', 'Marketing', 'Sales', 'Design', 'Finance', 'ML/AI'];
const availableDomains = ['FinTech', 'EdTech', 'HealthTech', 'E-commerce', 'AI/ML', 'Web3', 'ClimTech'];

export default function Discover() {
  const { user }  = useAuth();
  const [users,   setUsers]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'browse' | 'ai'>('browse');

  const [search,           setSearch]           = useState('');
  const [debouncedSearch,  setDebouncedSearch]  = useState('');
  const [selectedRole,     setSelectedRole]     = useState('');
  const [selectedSkills,   setSelectedSkills]   = useState<string[]>([]);
  const [selectedDomains,  setSelectedDomains]  = useState<string[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { fetchUsers(); }, [debouncedSearch, selectedRole, selectedSkills, selectedDomains]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query = `/discover/users?page=1&limit=24`;
      if (debouncedSearch)    query += `&search=${encodeURIComponent(debouncedSearch)}`;
      if (selectedRole)       query += `&role=${selectedRole}`;
      if (selectedSkills.length)  query += `&skills=${selectedSkills.join(',')}`;
      if (selectedDomains.length) query += `&domains=${selectedDomains.join(',')}`;
      const res = await api.get(query);
      setUsers(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const toggleSkill  = (s: string) => setSelectedSkills(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  const toggleDomain = (d: string) => setSelectedDomains(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]);
  const clearAll = () => { setSelectedRole(''); setSelectedSkills([]); setSelectedDomains([]); setSearch(''); };

  const hasFilters = selectedRole || selectedSkills.length || selectedDomains.length || search;

  return (
    <div className="bg-[#FFFFFF] min-h-screen">

      {/* ── Back nav ── */}
      <div className="border-b-2 border-[#1C1C1C]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-4 flex items-center gap-4">
          <a href="/" className={`${F.space} text-[11px] tracking-[0.2em] uppercase text-[#888888] hover:text-[#F7941D] transition-colors`}>
            ← Ecosystem
          </a>
          <span className="text-[#DDDDDD]">/</span>
          <span className={`${F.space} text-[11px] tracking-[0.2em] uppercase text-[#1C1C1C]`}>Discover</span>
        </div>
      </div>

      {/* ── Asymmetric header ── */}
      <div className="bg-[#F5F4F0] border-b-2 border-[#1C1C1C]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 grid grid-cols-12">

          {/* Left heading — bleeds to col 1–6 */}
          <div className="col-span-12 lg:col-span-6 py-16 lg:border-r-2 border-[#1C1C1C] lg:pr-14">
            <div className={`${F.space} text-[11px] tracking-[0.25em] uppercase text-[#F7941D] mb-4`}>— Matchmaking</div>
            <h1 className={`${F.display} font-black italic text-[#1C1C1C] leading-[0.92]`}
              style={{ fontSize: 'clamp(40px, 5.5vw, 72px)' }}>
              Find Your<br />Missing Node.
            </h1>
            <p className={`${F.serif} text-[#666666] text-base leading-[1.8] mt-6 max-w-md`}>
              Every great founding team has a complement. Search by skill, domain, and role — or let the AI find who you need before you know you need them.
            </p>
          </div>

          {/* Right: search + mode tabs */}
          <div className="col-span-12 lg:col-span-6 py-16 lg:pl-14 flex flex-col justify-center gap-6">
            <div className="relative">
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, bio, or skill…"
                className={`${F.space} w-full text-[14px] text-[#1C1C1C] placeholder-[#BBBBBB] bg-[#FFFFFF] border-b-2 border-[#1C1C1C] py-3 pr-10 focus:outline-none focus:border-[#F7941D] transition-colors`} />
              <svg className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAAAAA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeWidth={2} d="M21 21l-5-5m0 0A7 7 0 1 0 5 5a7 7 0 0 0 11 11z"/>
              </svg>
            </div>

            {user?.role === 'student' && (
              <div className="flex border-2 border-[#1C1C1C] w-fit">
                <button onClick={() => setActiveTab('browse')}
                  className={`${F.space} font-bold text-[11px] tracking-[0.15em] uppercase px-6 py-2.5 transition-colors
                    ${activeTab === 'browse' ? 'bg-[#1C1C1C] text-white' : 'bg-transparent text-[#888888] hover:text-[#1C1C1C]'}`}>
                  Browse All
                </button>
                <button onClick={() => setActiveTab('ai')}
                  className={`${F.space} font-bold text-[11px] tracking-[0.15em] uppercase px-6 py-2.5 transition-colors border-l-2 border-[#1C1C1C]
                    ${activeTab === 'ai' ? 'bg-[#F7941D] text-white' : 'bg-transparent text-[#888888] hover:text-[#1C1C1C]'}`}>
                  AI Matched
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main area ── */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-14">

        {activeTab === 'ai' ? (
          <div className="py-12">
            <AIMatches isStudent={user?.role === 'student'} />
          </div>
        ) : (
          <div className="grid grid-cols-12 border-b-2 border-[#1C1C1C]">

            {/* ── Sidebar filters ── */}
            <div className="col-span-12 lg:col-span-3 border-b-2 lg:border-b-0 lg:border-r-2 border-[#1C1C1C] py-10 lg:pr-10">

              <div className="flex items-center justify-between mb-8">
                <div className={`${F.space} text-[10px] tracking-[0.25em] uppercase text-[#888888]`}>Filters</div>
                {hasFilters && (
                  <button onClick={clearAll}
                    className={`${F.space} text-[10px] tracking-[0.15em] uppercase text-[#F7941D] hover:text-[#1C1C1C] transition-colors`}>
                    Clear All
                  </button>
                )}
              </div>

              {/* Role */}
              <div className="mb-8">
                <div className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#AAAAAA] mb-4 pb-2 border-b border-[#E0E0E0]`}>Role</div>
                <div className="flex flex-col gap-0 border border-[#E0E0E0]">
                  {['', 'student', 'mentor'].map((r, i) => (
                    <button key={r || 'all'} onClick={() => setSelectedRole(r)}
                      className={`${F.space} text-[12px] font-medium px-4 py-2.5 text-left transition-colors ${i > 0 ? 'border-t border-[#E0E0E0]' : ''}
                        ${selectedRole === r ? 'bg-[#1C1C1C] text-white' : 'bg-transparent text-[#666666] hover:bg-[#F5F4F0] hover:text-[#1C1C1C]'}`}>
                      {r === '' ? 'All Roles' : r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div className="mb-8">
                <div className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#AAAAAA] mb-4 pb-2 border-b border-[#E0E0E0]`}>Skills</div>
                <div className="flex flex-col gap-0 border border-[#E0E0E0]">
                  {availableSkills.map((s, i) => (
                    <button key={s} onClick={() => toggleSkill(s)}
                      className={`${F.space} text-[12px] font-medium px-4 py-2.5 text-left flex items-center justify-between transition-colors ${i > 0 ? 'border-t border-[#E0E0E0]' : ''}
                        ${selectedSkills.includes(s) ? 'bg-[#1C1C1C] text-white' : 'bg-transparent text-[#666666] hover:bg-[#F5F4F0] hover:text-[#1C1C1C]'}`}>
                      {s}
                      {selectedSkills.includes(s) && <span className="text-[#F7941D] text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Domains */}
              <div>
                <div className={`${F.space} text-[10px] tracking-[0.2em] uppercase text-[#AAAAAA] mb-4 pb-2 border-b border-[#E0E0E0]`}>Domain</div>
                <div className="flex flex-col gap-0 border border-[#E0E0E0]">
                  {availableDomains.map((d, i) => (
                    <button key={d} onClick={() => toggleDomain(d)}
                      className={`${F.space} text-[12px] font-medium px-4 py-2.5 text-left flex items-center justify-between transition-colors ${i > 0 ? 'border-t border-[#E0E0E0]' : ''}
                        ${selectedDomains.includes(d) ? 'bg-[#1C1C1C] text-white' : 'bg-transparent text-[#666666] hover:bg-[#F5F4F0] hover:text-[#1C1C1C]'}`}>
                      {d}
                      {selectedDomains.includes(d) && <span className="text-[#F7941D] text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* ── Main results ── */}
            <div className="col-span-12 lg:col-span-9 py-10 lg:pl-10">

              {/* Count bar */}
              <div className="flex items-center justify-between mb-8 pb-5 border-b border-[#E0E0E0]">
                <div>
                  <span className={`${F.bebas} text-[2.5rem] text-[#1C1C1C] leading-none mr-2`}>
                    {loading ? '—' : String(users.length).padStart(2, '0')}
                  </span>
                  <span className={`${F.space} text-[11px] tracking-[0.2em] uppercase text-[#888888]`}>
                    {loading ? 'Searching…' : `Profile${users.length !== 1 ? 's' : ''} found`}
                  </span>
                </div>
                {hasFilters && (
                  <div className="flex gap-2 flex-wrap">
                    {selectedRole && (
                      <span className={`${F.space} text-[10px] tracking-wide uppercase bg-[#1C1C1C] text-white px-2.5 py-1`}>{selectedRole}</span>
                    )}
                    {selectedSkills.map(s => (
                      <span key={s} className={`${F.space} text-[10px] tracking-wide uppercase bg-[#F7941D] text-white px-2.5 py-1`}>{s}</span>
                    ))}
                    {selectedDomains.map(d => (
                      <span key={d} className={`${F.space} text-[10px] tracking-wide uppercase border border-[#1C1C1C] text-[#1C1C1C] px-2.5 py-1`}>{d}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Loading skeleton */}
              {loading && (
                <div className="border-t-2 border-[#1C1C1C]">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="border-b border-[#E0E0E0] py-5 grid grid-cols-12 items-center gap-4">
                      <div className="col-span-1 w-8 h-8 bg-[#F0F0F0] animate-pulse" />
                      <div className="col-span-4 space-y-2">
                        <div className="h-3 bg-[#F0F0F0] animate-pulse w-3/4" />
                        <div className="h-2 bg-[#F5F5F5] animate-pulse w-1/2" />
                      </div>
                      <div className="col-span-5 h-2 bg-[#F5F5F5] animate-pulse" />
                      <div className="col-span-2 h-3 bg-[#F0F0F0] animate-pulse" />
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!loading && users.length === 0 && (
                <div className="border-2 border-[#1C1C1C] py-16 text-center">
                  <div className={`${F.bebas} text-[#EEEEEE]`} style={{ fontSize: '6rem', lineHeight: 1 }}>00</div>
                  <div className={`${F.space} font-bold text-[#1C1C1C] mt-3 mb-1`}>No profiles matched</div>
                  <div className={`${F.serif} italic text-[#888888] text-sm`}>Try broadening your filters.</div>
                </div>
              )}

              {/* Results — flat editorial list */}
              {!loading && users.length > 0 && (
                <div className="border-t-2 border-[#1C1C1C]">
                  {users.map((u, i) => {
                    const skills: string[] = (() => {
                      if (Array.isArray(u.skills)) return u.skills;
                      if (typeof u.skills === 'string' && u.skills) {
                        try { return JSON.parse(u.skills); } catch { return []; }
                      }
                      return [];
                    })();

                    return (
                      <a key={u.id} href={`/profile/${u.id}`}
                        className="group block border-b border-[#E8E8E8] py-5 grid grid-cols-12 items-center gap-4 hover:bg-[#F5F4F0] -mx-6 lg:-mx-10 px-6 lg:px-10 transition-colors">

                        {/* Index */}
                        <div className={`col-span-1 ${F.bebas} text-[1.5rem] text-[#DDDDDD] leading-none`}>
                          {String(i + 1).padStart(2, '0')}
                        </div>

                        {/* Avatar + name */}
                        <div className="col-span-3 flex items-center gap-3">
                          <div className="w-9 h-9 bg-[#1C1C1C] flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {u.avatar_url
                              ? <img src={u.avatar_url} alt={u.name} className="w-full h-full object-cover grayscale" />
                              : <span className={`${F.bebas} text-white text-lg leading-none`}>{u.name?.charAt(0)}</span>}
                          </div>
                          <div>
                            <div className={`${F.space} font-bold text-[#1C1C1C] text-[13px] group-hover:text-[#F7941D] transition-colors`}>{u.name}</div>
                            <div className={`${F.space} text-[10px] tracking-[0.15em] uppercase text-[#AAAAAA]`}>{u.role}</div>
                          </div>
                        </div>

                        {/* Bio */}
                        <div className="col-span-4 hidden md:block">
                          <p className={`${F.serif} text-[#777777] text-[13px] italic line-clamp-1`}>{u.bio || '—'}</p>
                        </div>

                        {/* Skills */}
                        <div className="col-span-3 hidden lg:flex gap-1.5 flex-wrap">
                          {skills.slice(0, 3).map((s: string) => (
                            <span key={s} className={`${F.space} text-[9px] tracking-[0.1em] uppercase border border-[#DDDDDD] text-[#888888] px-2 py-0.5`}>{s}</span>
                          ))}
                          {skills.length > 3 && (
                            <span className={`${F.space} text-[9px] text-[#F7941D]`}>+{skills.length - 3}</span>
                          )}
                        </div>

                        {/* Arrow */}
                        <div className="col-span-1 text-right">
                          <span className={`${F.space} text-[#CCCCCC] group-hover:text-[#F7941D] transition-colors`}>→</span>
                        </div>

                      </a>
                    );
                  })}
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}


export default function Discover() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'browse' | 'ai'>('browse');

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
          
          {user?.role === 'student' && (
            <div className="flex justify-center mt-6">
              <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-full inline-flex">
                <button onClick={() => setActiveTab('browse')} className={`px-6 py-2 rounded-full text-sm font-bold transition ${activeTab === 'browse' ? 'bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-white' : 'text-gray-500'}`}>Browse All</button>
                <button onClick={() => setActiveTab('ai')} className={`px-6 py-2 rounded-full text-sm font-bold transition flex items-center gap-2 ${activeTab === 'ai' ? 'bg-white dark:bg-gray-800 shadow text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}>✨ AI Recommended</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        
        {activeTab === 'ai' ? (
          <div className="flex-1">
            <AIMatches isStudent={user?.role === 'student'} />
          </div>
        ) : (
          <>
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
          </>
        )}

      </div>
    </div>
  );
}
