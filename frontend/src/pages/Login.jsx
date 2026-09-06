import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, UserCheck, AlertCircle, Sparkles, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('admin');

  const from = location.state?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      email: 'anchal.keshri@ems.corp',
      password: 'AdminPassword@2025'
    }
  });

  const onSubmit = async (data) => {
    setAuthError('');
    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (err) {
      setAuthError(err.message || 'Authentication failed. Please check your credentials.');
    }
  };

  const handleSelectPreset = (presetType) => {
    setSelectedPreset(presetType);
    setAuthError('');
    if (presetType === 'admin') {
      setValue('email', 'anchal.keshri@ems.corp');
      setValue('password', 'AdminPassword@2025');
    } else {
      setValue('email', 'sophia.chen@ems.corp');
      setValue('password', 'EmployeePassword@2025');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-indigo-500 selection:text-white">
      {/* Ambient Lighting Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-violet-200/35 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-72 h-72 bg-sky-100/50 rounded-full blur-2xl pointer-events-none" />

      {/* Decorative Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Icon */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-500/25 ring-8 ring-indigo-50/80 mb-4 transition-transform hover:scale-105">
          <Activity className="w-7 h-7 text-white" />
        </div>

        {/* Brand Heading */}
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            Work<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Pulse</span>
          </h1>
          <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest rounded-full bg-indigo-100/80 text-indigo-700 border border-indigo-200/60 shadow-2xs">
            OS
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-500 font-medium max-w-sm mx-auto">
          Intelligent Workforce, Payroll & Analytics Platform
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/95 backdrop-blur-xl py-8 px-6 sm:px-10 rounded-3xl shadow-2xl shadow-slate-300/40 border border-slate-200/80">
          {/* Quick Demo Preset Switcher */}
          <div className="mb-6 bg-slate-100/90 p-1.5 rounded-xl grid grid-cols-2 gap-1.5 text-xs font-semibold border border-slate-200/60">
            <button
              type="button"
              onClick={() => handleSelectPreset('admin')}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                selectedPreset === 'admin'
                  ? 'bg-white text-slate-900 shadow-xs font-bold ring-1 ring-slate-900/5'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Admin Portal
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset('employee')}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                selectedPreset === 'employee'
                  ? 'bg-white text-slate-900 shadow-xs font-bold ring-1 ring-slate-900/5'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4 text-emerald-600" />
              Employee Portal
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {authError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{authError}</span>
              </div>
            )}

            <Input
              label="Corporate Email"
              type="email"
              icon={Mail}
              required
              placeholder="name@company.com"
              error={errors.email?.message}
              {...register('email', {
                required: 'Corporate email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Enter a valid corporate email address'
                }
              })}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                icon={Lock}
                required
                placeholder="••••••••••••"
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Minimum 6 characters required' }
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                <input type="checkbox" defaultChecked className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span>Remember this terminal</span>
              </label>
              <span className="text-slate-400 text-[11px] font-medium">
                JWT Authentication
              </span>
            </div>

            <Button
              type="submit"
              className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/35 transition-all active:scale-[0.99]"
              loading={isSubmitting}
            >
              Sign In to WorkPulse
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 font-medium">
              WorkPulse OS • Enterprise Workforce Suite • v2.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
