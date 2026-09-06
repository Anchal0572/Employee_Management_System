import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  User,
  Settings,
  LogOut,
  ChevronDown,
  ArrowLeftRight,
  Shield,
  UserCheck
} from 'lucide-react';
import { healthService } from '../../services/healthService';
import { useAuth } from '../../context/AuthContext';
import { useEMSData } from '../../context/EMSDataContext';
import { Breadcrumbs } from './Breadcrumbs';
import { NotificationDropdown } from './NotificationDropdown';

export const Navbar = ({ onOpenMobile }) => {
  const { user, role, switchRole, logout, isAdmin } = useAuth();
  const { notifications } = useEMSData();
  const navigate = useNavigate();

  const [apiOnline, setApiOnline] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const res = await healthService.checkHealth();
      setApiOnline(Boolean(res && res.success));
    } catch {
      setApiOnline(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [profileOpen]);

  const handleToggleRole = () => {
    const nextRole = isAdmin ? 'employee' : 'admin';
    switchRole(nextRole);
    navigate('/');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between shadow-2xs">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          type="button"
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Dynamic Breadcrumbs */}
        <div className="hidden sm:block">
          <Breadcrumbs />
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Role Switcher Pill for rapid testing/evaluation */}
        <button
          type="button"
          onClick={handleToggleRole}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors shadow-2xs"
          title={`Currently in ${role} mode. Click to switch to ${isAdmin ? 'employee' : 'admin'}.`}
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden md:inline text-slate-500">View as:</span>
          <span className="capitalize text-slate-900 font-bold">{role}</span>
        </button>

        {/* Backend API Health Status Indicator */}
        <button
          onClick={checkStatus}
          title="Click to probe backend API status"
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-colors ${
            apiOnline === null
              ? 'bg-slate-50 text-slate-500 border-slate-200'
              : apiOnline
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70'
              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/70'
          }`}
        >
          {isChecking ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-500" />
          ) : apiOnline ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          )}
          <span className="hidden xl:inline">
            {apiOnline === null ? 'Probing API...' : apiOnline ? 'API 200 OK' : 'API Offline'}
          </span>
        </button>

        {/* Notifications Button & Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          <NotificationDropdown isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none"
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-300"
            />
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 leading-tight">{user.name}</span>
              <span className="text-[11px] text-slate-500 leading-tight capitalize">{user.role}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
          </button>

          {/* Profile Dropdown */}
          {profileOpen && (
            <div className="absolute right-0 top-12 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900 truncate">{user.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                <span className="mt-1 inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 capitalize">
                  {user.role} workspace
                </span>
              </div>

              <Link
                to="/profile"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>My Profile</span>
              </Link>

              <Link
                to="/settings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Settings</span>
              </Link>

              <div className="border-t border-slate-100 my-1" />

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors text-left"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
