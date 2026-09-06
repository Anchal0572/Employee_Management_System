import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  User,
  Mail,
  Phone,
  Shield,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';

export const Profile = () => {
  const { user, changePassword } = useAuth();
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register: registerPass,
    handleSubmit: handlePassSubmit,
    reset: resetPass,
    formState: { errors: passErrors, isSubmitting: isPassSubmitting }
  } = useForm();

  const onPasswordSubmit = async (data) => {
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await changePassword(data.currentPassword, data.newPassword);
      setSuccessMsg('Security credentials updated and re-hashed successfully.');
      resetPass();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update credentials. Check your current password.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Profile & Security</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal identity credentials, contact information, and security preferences.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          {errorMsg}
        </div>
      )}

      {/* Hero Overview Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'}
            alt={user?.name || 'User'}
            className="w-20 h-20 rounded-full object-cover ring-4 ring-slate-100 shadow-sm"
          />
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-slate-900">{user?.name || 'User Profile'}</h2>
              <Badge variant="info" dot>{user?.role}</Badge>
            </div>
            <p className="text-xs text-slate-600">{user?.designation}</p>
            <p className="text-xs text-slate-400">
              Department: <strong className="text-slate-700">{user?.department}</strong> • ID: <span className="font-mono">{user?.employeeId || user?.id}</span>
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details */}
        <Card title="Account Particulars" subtitle="Official record registered in EMS">
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 font-semibold uppercase text-[10px]">Full Name</label>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 font-semibold text-slate-800 mt-1">
                {user?.name}
              </div>
            </div>
            <div>
              <label className="text-slate-400 font-semibold uppercase text-[10px]">Work Email Address</label>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 font-semibold text-slate-800 mt-1">
                {user?.email}
              </div>
            </div>
            <div>
              <label className="text-slate-400 font-semibold uppercase text-[10px]">Assigned Role</label>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 font-semibold capitalize text-slate-800 mt-1">
                {user?.role} Privilege Tier
              </div>
            </div>
          </div>
        </Card>

        {/* Change Password Form */}
        <Card title="Security & Authentication" subtitle="Update terminal login credentials via bcrypt">
          <form onSubmit={handlePassSubmit(onPasswordSubmit)} className="space-y-3">
            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••••••"
              required
              error={passErrors.currentPassword?.message}
              {...registerPass('currentPassword', { required: 'Current password is required' })}
            />

            <Input
              label="New Password"
              type="password"
              placeholder="Minimum 6 characters"
              required
              error={passErrors.newPassword?.message}
              {...registerPass('newPassword', {
                required: 'New password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' }
              })}
            />

            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="w-full mt-2"
              icon={Save}
              loading={isPassSubmitting}
            >
              Update Password
            </Button>
          </form>
        </Card>
      </div>

      {/* Preferences & 2FA */}
      <Card title="Account Preferences" subtitle="System notifications and multi-factor authentication">
        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-800">Two-Factor Authentication (2FA)</span>
              <p className="text-[11px] text-slate-500">Require an authenticator code when signing into untrusted devices.</p>
            </div>
            <Badge variant="success">Enforced</Badge>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-800">Email Notification Digest</span>
              <p className="text-[11px] text-slate-500">Receive weekly summaries of department leave applications and payslip releases.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>
      </Card>
    </div>
  );
};
