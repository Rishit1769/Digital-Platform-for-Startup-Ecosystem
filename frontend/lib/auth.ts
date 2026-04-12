'use client';
import { useState, useEffect } from 'react';
import { api } from './axios';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setLoading(false);
      return;
    }

    api.get('/profile/me')
      .then(res => {
         setUser(res.data.data);
      })
      .catch((err) => {
         console.error('Auth check fail:', err);
      })
      .finally(() => {
         setLoading(false);
      });
  }, []);

  return { user, loading };
}
