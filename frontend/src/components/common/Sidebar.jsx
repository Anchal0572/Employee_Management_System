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
    <div className="flex flex-col h-full bg-white/95 backdrop-blur-xl text-slate-700 border-r border-slate-200/80 shadow-[1px_0_15px_rgba(0,0,0,0.02)] select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-100 gap-3 bg-gradient-to-r from-slate-50/60 via-white to-indigo-50/20">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/25 ring-2 ring-indigo-50 shrink-0">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-black text-sm tracking-tight text-slate-900 flex items-center gap-1.5 truncate">
            Work<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Pulse</span>
            <span className={`text-[9px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded-md border shadow-2xs ${
              isAdmin
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200/80'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
            }`}>
              {role}
            </span>
          </span>
          <span className="text-[11px] text-slate-400 font-medium truncate">Workforce & HR OS</span>
        </div>
      </div>

      {/* Role Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
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
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 text-white font-bold shadow-md shadow-indigo-500/25'
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50/90'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'
                    }`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold leading-none ${
                      isActive
                        ? 'bg-white/20 text-white border border-white/30'
                        : 'bg-indigo-600 text-white shadow-xs'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Current User Pill Footer */}
      <div className="p-3.5 border-t border-slate-100 bg-gradient-to-b from-transparent to-slate-50/70">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors text-xs">
          <div className="relative shrink-0">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-slate-900 truncate leading-tight">{user.name}</span>
            <span className="text-[11px] text-slate-400 truncate capitalize font-medium">{user.role} • {user.department}</span>
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
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity"
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
