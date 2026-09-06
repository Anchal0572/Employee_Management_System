import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  CreditCard,
  BarChart3,
  Bell,
  Settings,
  User,
  Activity,
  Briefcase,
  ShieldCheck,
  UserCheck,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEMSData } from '../../context/EMSDataContext';

export const Sidebar = ({ isMobileOpen, onCloseMobile }) => {
  const { role, user, isAdmin } = useAuth();
  const { notifications, leaves } = useEMSData();

  const unreadNotifCount = notifications.filter(n => !n.read).length;
  const pendingLeavesCount = leaves.filter(l => l.status?.toLowerCase() === 'pending').length;

  const adminNavItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'AI HR Assistant', path: '/ai-assistant', icon: Sparkles },
    { name: 'Employees', path: '/employees', icon: Users },
    { name: 'Attendance', path: '/attendance', icon: Clock },
    { name: 'Leaves', path: '/leaves', icon: CalendarDays, badge: pendingLeavesCount > 0 ? pendingLeavesCount : null },
    { name: 'Payroll', path: '/payroll', icon: CreditCard },
    { name: 'Reports', path: '/analytics', icon: BarChart3 },
    { name: 'Notifications', path: '/notifications', icon: Bell, badge: unreadNotifCount > 0 ? unreadNotifCount : null },
    { name: 'System Diagnostics', path: '/system-health', icon: Activity },
    { name: 'Settings', path: '/settings', icon: Settings }
  ];

  const employeeNavItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'AI HR Assistant', path: '/ai-assistant', icon: Sparkles },
    { name: 'My Attendance', path: '/attendance', icon: Clock },
    { name: 'My Leaves', path: '/leaves', icon: CalendarDays },
    { name: 'My Payslips', path: '/payroll', icon: CreditCard },
    { name: 'Notifications', path: '/notifications', icon: Bell, badge: unreadNotifCount > 0 ? unreadNotifCount : null },
    { name: 'My Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: Settings }
  ];

  const navItems = isAdmin ? adminNavItems : employeeNavItems;

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800 gap-3">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20 shrink-0">
          <Briefcase className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-sm tracking-wide text-white flex items-center gap-1.5 truncate">
            EMS Enterprise
            <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded border ${
              isAdmin
                ? 'bg-indigo-950 text-indigo-400 border-indigo-800/50'
                : 'bg-emerald-950 text-emerald-400 border-emerald-800/50'
            }`}>
              {role}
            </span>
          </span>
          <span className="text-xs text-slate-400 truncate">HR & Workforce Suite</span>
        </div>
      </div>

      {/* Role Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span>{isAdmin ? 'Administration' : 'Employee Workspace'}</span>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/'}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500 text-white leading-none">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Current User Pill Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-600 shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-slate-200 truncate">{user.name}</span>
            <span className="text-[11px] text-slate-400 truncate capitalize">{user.role} • {user.department}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 z-30">
        {content}
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-64 shadow-2xl z-50">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
