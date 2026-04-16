'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setToken } from '../lib/axios';

type Role = 'student' | 'mentor';
type StartupIntent = '' | 'has_startup' | 'finding_startup';

type GoogleOAuthButtonProps = {
  mode: 'signin' | 'register';
  role?: Role;
  startupIntent?: StartupIntent;
  onError?: (message: string) => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, string | number>
          ) => void;
        };
      };
    };
  }
}

function routeByRole(role: string) {
  if (role === 'student') return '/dashboard';
  if (role === 'mentor') return '/mentor';
  return '/admin';
}

export default function GoogleOAuthButton({ mode, role, startupIntent, onError }: GoogleOAuthButtonProps) {
  const router = useRouter();
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  useEffect(() => {
    if (window.google?.accounts?.id) {
      setScriptReady(true);
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-google-identity="true"]');
    if (existing) {
      existing.addEventListener('load', () => setScriptReady(true));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = 'true';
    script.onload = () => setScriptReady(true);
    script.onerror = () => onError?.('Failed to load Google OAuth script.');
    document.head.appendChild(script);
  }, [onError]);

  useEffect(() => {
    if (!scriptReady || !clientId || !window.google?.accounts?.id || !mountRef.current) return;

    mountRef.current.innerHTML = '';

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response: { credential?: string }) => {
        if (!response.credential) {
          onError?.('Google sign-in failed. Please try again.');
          return;
        }

        setIsLoading(true);
        try {
          const payload: {
            idToken: string;
            role?: Role;
            startup_intent?: Exclude<StartupIntent, ''>;
          } = { idToken: response.credential };

          if (mode === 'register') {
            payload.role = role || 'student';
            if ((role || 'student') === 'student' && startupIntent) {
              payload.startup_intent = startupIntent;
            }
          }

          const res = await api.post('/auth/oauth/google', payload);
          const { user, accessToken } = res.data.data;
          setToken(accessToken);
          if (typeof window !== 'undefined') {
            localStorage.setItem('token', accessToken);
          }
          router.push(routeByRole(user.role));
        } catch (err: any) {
          onError?.(err.response?.data?.error || 'Google sign-in failed. Please try again.');
        } finally {
          setIsLoading(false);
        }
      },
    });

    window.google.accounts.id.renderButton(mountRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: mode === 'register' ? 'signup_with' : 'signin_with',
      shape: 'square',
      width: 360,
      logo_alignment: 'left',
    });
  }, [scriptReady, clientId, mode, role, startupIntent, onError, router]);

  if (!clientId) {
    return (
      <div className="text-[12px] text-[#CC0000] border-l-4 border-[#CC0000] pl-3 py-1.5 bg-red-50">
        Google OAuth is unavailable. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in frontend env.
      </div>
    );
  }

  return (
    <div>
      <div ref={mountRef} className={isLoading ? 'opacity-60 pointer-events-none' : ''} />
      {isLoading && <p className="text-[11px] text-[#777777] mt-2">Completing Google sign-in...</p>}
    </div>
  );
}
