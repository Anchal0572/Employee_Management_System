import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Trash2,
  Calendar,
  DollarSign,
  UserCheck,
  ShieldAlert,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { useEMSData } from '../context/EMSDataContext';

export const Notifications = () => {
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification
  } = useEMSData();

  const [activeTab, setActiveTab] = useState('all');

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'leave') return n.type === 'leave';
    if (activeTab === 'payroll') return n.type === 'payroll';
    if (activeTab === 'system') return n.type === 'system';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type) => {
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notification Center</h1>
          <p className="text-xs text-slate-500 mt-1">
            System alerts, leave workflow updates, and corporate payroll announcements.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" icon={CheckCheck} onClick={markAllNotificationsAsRead}>
            Mark All as Read
          </Button>
        )}
      </div>

      <Card>
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-xs font-semibold overflow-x-auto">
          {[
            { key: 'all', label: `All (${notifications.length})` },
            { key: 'unread', label: `Unread (${unreadCount})` },
            { key: 'leave', label: 'Leaves' },
            { key: 'payroll', label: 'Payroll' },
            { key: 'system', label: 'System Telemetry' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-slate-100 mt-2">
          {filteredNotifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No notifications in this view"
              description="You're all caught up! There are no unread notifications or alerts for this filter."
            />
          ) : (
            filteredNotifications.map((item) => {
              const notifId = item._id || item.id;
              const displayTime = item.time || (item.createdAt ? new Date(item.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently');
              return (
                <div
                  key={notifId}
                  className={`py-4 px-3 flex items-start justify-between gap-4 transition-colors rounded-lg ${
                    !item.read ? 'bg-indigo-50/40' : 'hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 mt-0.5">
                      {getIcon(item.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                        {!item.read && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{item.message}</p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {displayTime}
                        </span>
                        {item.link && (
                          <Link
                            to={item.link}
                            onClick={() => markNotificationAsRead(notifId)}
                            className="text-indigo-600 hover:underline flex items-center gap-0.5 font-medium"
                          >
                            View details <ExternalLink className="w-3 h-3 ml-0.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!item.read && (
                      <button
                        onClick={() => markNotificationAsRead(notifId)}
                        title="Mark as read"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                      >
                        <CheckCheck className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notifId)}
                      title="Dismiss"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
};
