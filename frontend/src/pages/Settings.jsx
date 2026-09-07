import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Clock,
  Calendar,
  Shield,
  Activity,
  Save,
  CheckCircle2,
  Bell,
  Lock,
  User,
  Laptop,
  Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';

export const Settings = () => {
  const { user, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState(isAdmin ? 'org' : 'personal'); // 'org' | 'personal'
  const [saved, setSaved] = useState(false);

  // Employee personal preferences state
  const [leaveAlerts, setLeaveAlerts] = useState(true);
  const [payslipAlerts, setPayslipAlerts] = useState(true);
  const [announcementAlerts, setAnnouncementAlerts] = useState(true);
  const [workLocation, setWorkLocation] = useState('Remote (Home Office)');
  const [timezone, setTimezone] = useState('America/Los_Angeles (PST/PDT)');

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSave = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Settings & Preferences</h1>
            <Badge variant={isAdmin ? 'primary' : 'success'}>
              {isAdmin ? 'System Admin' : 'Employee Workspace'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isAdmin
              ? 'Configure company policies, shift timings, leave quotas, and personal preferences.'
              : 'Customize notification alerts, workspace preferences, and account security.'}
          </p>
        </div>

        {isAdmin && (
          <Link to="/system-health">
            <Button variant="secondary" size="sm" icon={Activity}>
              System Health & Diagnostics
            </Button>
          </Link>
        )}
      </div>

      {/* Tabs (If Admin, show Org vs Personal tabs) */}
      {isAdmin && (
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl border border-slate-200/80 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('org')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'org'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Organization Policies
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'personal'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            My Account & Preferences
          </button>
        </div>
      )}

      {/* Top Banner When Saved */}
      {saved && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-semibold shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Preferences updated and saved successfully!</span>
        </div>
      )}

      {/* TAB 1: Organization Settings (Admins only) */}
      {isAdmin && activeTab === 'org' && (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Company Identity */}
          <Card
            className="border-slate-200/80 bg-white"
            title="Company Information"
            subtitle="Official registered organizational identity"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Legal Entity Name"
                defaultValue="WorkPulse Technologies Inc."
                required
              />
              <Input
                label="Corporate Tax ID / EIN"
                defaultValue="EIN-94-3829104"
                required
              />
              <Input
                label="Corporate Headquarters"
                defaultValue="100 Silicon Way, San Francisco, CA"
              />
              <Select
                label="Default Operational Timezone"
                options={[
                  'America/Los_Angeles (PST/PDT)',
                  'America/New_York (EST/EDT)',
                  'Europe/London (GMT/BST)',
                  'Asia/Kolkata (IST)'
                ]}
                defaultValue="America/Los_Angeles (PST/PDT)"
              />
            </div>
          </Card>

          {/* Work Shifts & Attendance Rules */}
          <Card
            className="border-slate-200/80 bg-white"
            title="Shift & Working Hours"
            subtitle="Standard daily attendance parameters"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Standard Shift Start"
                type="time"
                defaultValue="09:00"
                required
              />
              <Input
                label="Standard Shift End"
                type="time"
                defaultValue="17:30"
                required
              />
              <Input
                label="Late Arrival Grace (Minutes)"
                type="number"
                defaultValue="15"
                required
              />
            </div>
          </Card>

          {/* Default Leave Quotas */}
          <Card
            className="border-slate-200/80 bg-white"
            title="Annual Leave Policy Quotas"
            subtitle="Default calendar year leave allocations"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Annual Vacation (Days)"
                type="number"
                defaultValue="20"
                required
              />
              <Input
                label="Paid Sick Leave (Days)"
                type="number"
                defaultValue="10"
                required
              />
              <Input
                label="Casual Leave (Days)"
                type="number"
                defaultValue="7"
                required
              />
            </div>
          </Card>

          <div className="flex items-center justify-end gap-3 pt-2">
            {saved && (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Saved
              </span>
            )}
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center justify-center font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 px-5 py-2.5 rounded-xl shadow-md shadow-indigo-500/25 transition-all cursor-pointer text-xs"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Organization Settings
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Personal Preferences (Employees & Admins) */}
      {(activeTab === 'personal' || !isAdmin) && (
        <div className="space-y-6">
          {/* Notification Preferences */}
          <Card
            className="border-slate-200/80 bg-white"
            title="Notification Alerts"
            subtitle="Configure what events trigger in-app & email notifications"
          >
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 hover:bg-slate-50 cursor-pointer transition-colors">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Leave Request Approvals</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">Receive alert when manager reviews your leave request.</span>
                </div>
                <input
                  type="checkbox"
                  checked={leaveAlerts}
                  onChange={(e) => setLeaveAlerts(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 hover:bg-slate-50 cursor-pointer transition-colors">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Monthly Payslip Releases</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">Get notified immediately once your monthly salary statement is generated.</span>
                </div>
                <input
                  type="checkbox"
                  checked={payslipAlerts}
                  onChange={(e) => setPayslipAlerts(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 hover:bg-slate-50 cursor-pointer transition-colors">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Company Circulars & Notice Broadcasts</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">Stay updated with townhalls, public holidays, and policy updates.</span>
                </div>
                <input
                  type="checkbox"
                  checked={announcementAlerts}
                  onChange={(e) => setAnnouncementAlerts(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>
          </Card>

          {/* Workplace & Timezone */}
          <Card
            className="border-slate-200/80 bg-white"
            title="Workplace Location & Timezone"
            subtitle="Default check-in preferences and regional parameters"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Default Attendance Check-In Location
                </label>
                <select
                  value={workLocation}
                  onChange={(e) => setWorkLocation(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="Remote (Home Office)">Remote (Home Office)</option>
                  <option value="Headquarters (Office)">Headquarters (Office)</option>
                  <option value="Hybrid Travel">Hybrid Travel</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Personal Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="America/Los_Angeles (PST/PDT)">America/Los_Angeles (PST/PDT)</option>
                  <option value="America/New_York (EST/EDT)">America/New_York (EST/EDT)</option>
                  <option value="Europe/London (GMT/BST)">Europe/London (GMT/BST)</option>
                  <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST)</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Security & Password */}
          <Card
            className="border-slate-200/80 bg-white"
            title="Account Security"
            subtitle="Password protection and terminal session rules"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="New Password"
                type="password"
                placeholder="Leave blank to keep unchanged"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <div className="mt-3 text-[11px] text-slate-400 font-medium">
              Protected by JWT stateless session authentication and bcrypt salted password hash (Work factor 10).
            </div>
          </Card>

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {saved && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl shadow-xs animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Preferences Saved Successfully!
              </div>
            )}
            <button
              type="button"
              id="save-preferences-btn"
              onClick={handleSave}
              className="inline-flex items-center justify-center font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 px-6 py-2.5 rounded-xl shadow-md shadow-indigo-500/25 transition-all cursor-pointer text-xs"
            >
              <Save className="w-4 h-4 mr-2" />
              {saved ? 'Saved ✓' : 'Save Preferences'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
