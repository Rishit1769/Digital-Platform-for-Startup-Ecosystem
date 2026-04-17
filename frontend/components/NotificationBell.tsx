'use client';

import { useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const F = {
  space: 'font-[family-name:var(--font-space)]',
};

type BellNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: number;
};

const resolveSocketUrl = () => {
  const explicit = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (explicit) return explicit;
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  return api.replace(/\/api\/?$/, '');
};

export default function NotificationBell({ userId }: { userId?: number | null }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<BellNotification[]>([]);

  const unreadCount = useMemo(() => items.length, [items]);

  useEffect(() => {
    if (!userId) return;

    const socket: Socket = io(resolveSocketUrl(), {
      transports: ['websocket'],
      withCredentials: true,
    });

    socket.on('connect', () => {
      socket.emit('register', { userId });
    });

    socket.on('mentor_access_request', (payload: any) => {
      setItems((prev) => [
        {
          id: `mentor-${payload?.request_id || Date.now()}`,
          title: 'Mentor Access Request',
          message: payload?.message || `A founder requested access for ${payload?.startup_name || 'a startup'}.`,
          createdAt: Date.now(),
        },
        ...prev,
      ]);
    });

    socket.on('member_invite', (payload: any) => {
      setItems((prev) => [
        {
          id: `invite-${payload?.startup_id || Date.now()}`,
          title: 'Startup Invite',
          message: payload?.message || `You were invited to ${payload?.startup_name || 'a startup'}.`,
          createdAt: Date.now(),
        },
        ...prev,
      ]);
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`${F.space} relative text-[12px] text-white/70 hover:text-white transition-colors border border-white/20 hover:border-white/40 px-3 py-2`}
      >
        Bell
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 bg-[#F7941D] text-white text-[10px] font-bold border border-[#1C1C1C] flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[320px] bg-white border-2 border-[#1C1C1C] shadow-[6px_6px_0_#1C1C1C] z-50">
          <div className="px-4 py-3 border-b-2 border-[#1C1C1C] flex items-center justify-between">
            <div className={`${F.space} text-[11px] tracking-[0.12em] uppercase text-[#1C1C1C] font-bold`}>Notifications</div>
            {items.length > 0 && (
              <button
                onClick={() => setItems([])}
                className={`${F.space} text-[10px] uppercase tracking-wide text-[#888888] hover:text-[#1C1C1C]`}
              >
                Clear
              </button>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <div className={`${F.space} text-[11px] uppercase tracking-[0.15em] text-[#AAAAAA]`}>No live alerts</div>
              </div>
            ) : (
              <div className="divide-y divide-[#EEEEEE]">
                {items.map((item) => (
                  <div key={item.id} className="px-4 py-3">
                    <div className={`${F.space} text-[10px] tracking-[0.14em] uppercase text-[#F7941D] mb-1`}>{item.title}</div>
                    <div className={`${F.space} text-[12px] text-[#1C1C1C] leading-relaxed`}>{item.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
