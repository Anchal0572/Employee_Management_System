import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Clock, ArrowRight, Calendar, DollarSign, UserCheck, ShieldAlert } from 'lucide-react';
import { useEMSData } from '../../context/EMSDataContext';

const getNotificationIcon = (type) => {
  switch (type) {
    case 'leave':
      return <Calendar className="w-4 h-4 text-amber-500" />;
    case 'payroll':
      return <DollarSign className="w-4 h-4 text-emerald-500" />;
    case 'employee':
      return <UserCheck className="w-4 h-4 text-indigo-500" />;
    default:
      return <ShieldAlert className="w-4 h-4 text-sky-500" />;
  }
};

export const NotificationDropdown = ({ isOpen, onClose }) => {
  const dropdownRef = useRef(null);
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useEMSData();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-12 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsAsRead}
            className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No notifications available.
          </div>
        ) : (
          notifications.slice(0, 6).map((item) => {
            const notifId = item._id || item.id;
            const displayTime = item.time || (item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently');
            return (
              <div
                key={notifId}
                onClick={() => markNotificationAsRead(notifId)}
                className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 cursor-pointer transition-colors ${
                  !item.read ? 'bg-indigo-50/30' : ''
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  {getNotificationIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-semibold text-slate-900 truncate">{item.title}</p>
                    {!item.read && <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{item.message}</p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                    <Clock className="w-3 h-3" />
                    <span>{displayTime}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-center">
        <Link
          to="/notifications"
          onClick={onClose}
          className="text-xs font-medium text-slate-700 hover:text-indigo-600 inline-flex items-center gap-1 transition-colors"
        >
          View all notifications <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
