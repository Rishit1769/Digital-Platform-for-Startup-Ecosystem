'use client';
import { useState, useEffect } from 'react';
import { api, setToken } from './axios';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hydrateAuth = async () => {
      try {
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (storedToken) {
          setToken(storedToken);
        } else {
          try {
            const refreshRes = await api.post('/auth/refresh');
            const refreshedToken = refreshRes.data?.data?.accessToken;
            if (refreshedToken) {
              setToken(refreshedToken);
              localStorage.setItem('token', refreshedToken);
            }
          } catch {
            setLoading(false);
            return;
          }
        }

        const meRes = await api.get('/profile/me');
        setUser(meRes.data.data);
      } catch (err) {
        console.error('Auth check fail:', err);
      } finally {
        setLoading(false);
      }
    };

    hydrateAuth();
  }, []);

  return { user, loading };
}
