'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/axios';

export default function Verifications() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/admin/verification-requests');
      setRequests(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (userId: number, role: string) => {
    try {
      const badge_type = role === 'mentor' ? 'verified_mentor' : 'verified_student';
      await api.post(`/admin/verify/${userId}`, { badge_type });
      fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (userId: number) => {
    // Optionally: an API to permanently reject or just visually clear.
    // Assuming backend deletes or ignores if we send a different request.
    // For now, we manually remove it from view locally since revocation removes the badge.
    try {
      await api.delete(`/admin/verify/${userId}`);
      fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Verification Center</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Review and manage platform trust badges.</p>
          </div>
          <button onClick={() => router.push('/admin')} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300 text-sm tracking-wider uppercase">User Info</th>
                  <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300 text-sm tracking-wider uppercase">Role Details</th>
                  <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300 text-sm tracking-wider uppercase">Profile Completion</th>
                  <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300 text-sm tracking-wider uppercase w-48 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No pending verification requests.
                    </td>
                  </tr>
                )}
                {requests.map((req, i) => (
                  <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 font-bold">
                          {req.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900 dark:text-white cursor-pointer hover:text-blue-600" onClick={() => router.push(`/profile/${req.id}`)}>
                            {req.name}
                          </div>
                          <div className="text-gray-500 text-sm font-mono mt-0.5">{req.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${req.role === 'mentor' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300' : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'}`}>
                        {req.role.toUpperCase()}
                      </span>
                      <div className="text-sm text-gray-500 mt-1">
                        {req.role === 'mentor' ? req.company || 'No company listed' : req.college || 'No college listed'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 w-24 mr-2">
                          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: req.bio && req.skills ? '100%' : req.skills ? '70%' : '30%' }}></div>
                        </div>
                        <span className="text-xs text-gray-500">{req.bio && req.skills ? 'High' : req.skills ? 'Medium' : 'Low'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleReject(req.id)}
                          className="px-3 py-1.5 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-lg text-sm font-medium transition"
                        >
                          Reject
                        </button>
                        <button 
                          onClick={() => handleVerify(req.id, req.role)}
                          className="px-3 py-1.5 text-white bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium shadow-sm transition"
                        >
                          Approve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
