import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import { api } from '../lib/api';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = () => {
    api.getNotifications()
      .then(setNotifications)
      .catch(console.error);
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 30 seconds for live updates
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    api.markNotificationAsRead(id)
      .then(() => {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
        );
      })
      .catch(console.error);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2.5 text-gray-400 hover:text-emerald-600 rounded-xl hover:bg-gray-50 transition-all cursor-pointer focus:outline-none"
        title="Notifikasi"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4.5 h-4.5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-bounce ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 z-50 overflow-hidden transform origin-top-right transition-all">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-extrabold text-gray-800 text-sm">Notifikasi Baru</h3>
            <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {unreadCount} Belum Dibaca
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs italic">
                Tidak ada notifikasi
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 transition-all hover:bg-gray-50/50 flex gap-3 ${
                    !n.isRead ? 'bg-emerald-50/15' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${!n.isRead ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                      {n.title}
                    </p>
                    <p className="text-[11px] text-gray-400 font-medium mt-0.5 leading-relaxed">
                      {n.body}
                    </p>
                    <p className="text-[9px] text-gray-405 font-bold mt-1.5">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                      {new Date(n.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  {!n.isRead && (
                    <button
                      onClick={(e) => handleMarkAsRead(n.id, e)}
                      className="self-start p-1 text-emerald-600 hover:bg-emerald-100/50 rounded-lg transition-all"
                      title="Tandai telah dibaca"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
