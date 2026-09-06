import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Activity,
  Sparkles,
  TrendingUp,
  Cpu,
  Palette
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const THEMES = {
  aurora: {
    name: 'Aurora Flow',
    badge: '🌈',
    meshStyle: {
      background: `
        radial-gradient(at 5% 15%, rgba(99, 102, 241, 0.28) 0px, transparent 50%),
        radial-gradient(at 95% 10%, rgba(236, 72, 153, 0.24) 0px, transparent 50%),
        radial-gradient(at 50% 50%, rgba(139, 92, 246, 0.18) 0px, transparent 50%),
        radial-gradient(at 10% 90%, rgba(56, 189, 248, 0.26) 0px, transparent 50%),
        radial-gradient(at 90% 90%, rgba(168, 85, 247, 0.22) 0px, transparent 50%),
        #f8fafc
      `
    },
    orb1: 'bg-indigo-400/30',
    orb2: 'bg-pink-400/25',
    orb3: 'bg-sky-400/30',
    accentText: 'from-indigo-600 via-violet-600 to-pink-600',
    btnGradient: 'from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-700 hover:to-violet-800 shadow-indigo-500/30'
  },
  sunrise: {
    name: 'Sunrise Coral',
    badge: '🌅',
    meshStyle: {
      background: `
        radial-gradient(at 5% 10%, rgba(249, 115, 22, 0.26) 0px, transparent 50%),
        radial-gradient(at 95% 10%, rgba(244, 63, 94, 0.25) 0px, transparent 50%),
        radial-gradient(at 50% 50%, rgba(251, 191, 36, 0.20) 0px, transparent 50%),
        radial-gradient(at 10% 90%, rgba(236, 72, 153, 0.22) 0px, transparent 50%),
        radial-gradient(at 90% 90%, rgba(245, 158, 11, 0.22) 0px, transparent 50%),
        #fffaf5
      `
    },
    orb1: 'bg-orange-300/35',
    orb2: 'bg-rose-300/30',
    orb3: 'bg-amber-300/35',
    accentText: 'from-orange-600 via-rose-600 to-amber-600',
    btnGradient: 'from-orange-600 via-rose-600 to-amber-600 hover:from-orange-700 hover:to-rose-700 shadow-rose-500/30'
  },
  executive: {
    name: 'Clean Executive',
    badge: '💎',
    meshStyle: {
      background: `
        radial-gradient(at 50% 0%, rgba(59, 130, 246, 0.24) 0px, transparent 50%),
        radial-gradient(at 0% 50%, rgba(99, 102, 241, 0.22) 0px, transparent 50%),
        radial-gradient(at 100% 50%, rgba(14, 165, 233, 0.24) 0px, transparent 50%),
        radial-gradient(at 50% 100%, rgba(99, 102, 241, 0.20) 0px, transparent 50%),
        #f1f5f9
      `
    },
    orb1: 'bg-blue-300/30',
    orb2: 'bg-indigo-300/30',
    orb3: 'bg-sky-300/30',
    accentText: 'from-blue-600 via-indigo-600 to-sky-600',
    btnGradient: 'from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 shadow-blue-500/30'
  }
};

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('admin');
  const [activeTheme, setActiveTheme] = useState('aurora');

  const currentTheme = THEMES[activeTheme];
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
    <div
      className="min-h-screen relative overflow-hidden flex flex-col justify-center py-10 sm:px-6 lg:px-8 selection:bg-indigo-500 selection:text-white transition-all duration-700"
      style={currentTheme.meshStyle}
    >
      {/* Interactive Theme Switcher Pill in Top Right */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 flex items-center gap-1.5 p-1 bg-white/85 backdrop-blur-md rounded-2xl border border-white/90 shadow-lg shadow-slate-200/50">
        <div className="px-2.5 py-1 text-[11px] font-bold text-slate-400 flex items-center gap-1 border-r border-slate-200/80">
          <Palette className="w-3.5 h-3.5 text-indigo-500" />
          <span className="hidden sm:inline">Theme</span>
        </div>
        {Object.entries(THEMES).map(([key, t]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTheme(key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTheme === key
                ? 'bg-slate-900 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
            title={`Switch to ${t.name}`}
          >
            <span>{t.badge}</span>
            <span className="hidden md:inline">{t.name}</span>
          </button>
        ))}
      </div>

      {/* Ambient Lighting Orbs */}
      <div className={`absolute -top-36 -left-36 w-[34rem] h-[34rem] ${currentTheme.orb1} rounded-full blur-3xl pointer-events-none transition-all duration-700`} />
      <div className={`absolute -bottom-36 -right-36 w-[34rem] h-[34rem] ${currentTheme.orb2} rounded-full blur-3xl pointer-events-none transition-all duration-700`} />
      <div className={`absolute top-1/3 left-1/4 w-80 h-80 ${currentTheme.orb3} rounded-full blur-2xl pointer-events-none transition-all duration-700`} />

      {/* Decorative Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Floating 3D Metric Badges around the Card (Visible on Desktop) */}
      <div className="hidden xl:flex absolute left-8 lg:left-16 top-1/4 -translate-y-1/2 items-center gap-3 px-4 py-3 rounded-2xl bg-white/90 backdrop-blur-xl border border-white/90 shadow-xl shadow-indigo-950/5 pointer-events-none transform -rotate-2 hover:rotate-0 transition-transform">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-800">AI Workforce Insights</div>
          <div className="text-[11px] text-slate-500">Autonomous Trend & Risk Signals</div>
        </div>
      </div>

      <div className="hidden xl:flex absolute right-8 lg:right-16 top-1/4 -translate-y-1/2 items-center gap-3 px-4 py-3 rounded-2xl bg-white/90 backdrop-blur-xl border border-white/90 shadow-xl shadow-indigo-950/5 pointer-events-none transform rotate-2 hover:rotate-0 transition-transform">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-800">99.4% Attendance</div>
          <div className="text-[11px] text-emerald-600 font-semibold">Real-Time Verification Active</div>
        </div>
      </div>

      <div className="hidden xl:flex absolute left-8 lg:left-20 bottom-16 items-center gap-3 px-4 py-3 rounded-2xl bg-white/90 backdrop-blur-xl border border-white/90 shadow-xl shadow-indigo-950/5 pointer-events-none transform rotate-1 hover:rotate-0 transition-transform">
        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-800">Zero-Trust Security</div>
          <div className="text-[11px] text-slate-500">Role-Based Access & IDOR Shield</div>
        </div>
      </div>

      <div className="hidden xl:flex absolute right-8 lg:right-20 bottom-16 items-center gap-3 px-4 py-3 rounded-2xl bg-white/90 backdrop-blur-xl border border-white/90 shadow-xl shadow-indigo-950/5 pointer-events-none transform -rotate-1 hover:rotate-0 transition-transform">
        <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shrink-0">
          <Cpu className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-800">Automated Payroll</div>
          <div className="text-[11px] text-slate-500">Instant Itemized Payslip Engine</div>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Icon */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-500/25 ring-8 ring-white/90 mb-3.5 transition-transform hover:scale-105">
          <Activity className="w-7 h-7 text-white" />
        </div>

        {/* Brand Heading */}
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            Work<span className={`text-transparent bg-clip-text bg-gradient-to-r ${currentTheme.accentText}`}>Pulse</span>
          </h1>
          <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest rounded-full bg-white/90 text-slate-800 border border-slate-200/80 shadow-2xs">
            OS 2.0
          </span>
        </div>
        <p className="mt-1.5 text-sm text-slate-500 font-medium max-w-sm mx-auto">
          Intelligent Workforce, Payroll & Analytics Platform
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/90 backdrop-blur-2xl py-8 px-6 sm:px-10 rounded-3xl shadow-[0_20px_60px_-15px_rgba(79,70,229,0.12)] border border-white/90 ring-1 ring-slate-900/5">
          {/* Quick Demo Preset Switcher */}
          <div className="mb-6 bg-slate-100/90 p-1.5 rounded-xl grid grid-cols-2 gap-1.5 text-xs font-semibold border border-slate-200/60">
            <button
              type="button"
              onClick={() => handleSelectPreset('admin')}
              className={`py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
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
              className={`py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
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
              className={`w-full mt-2 py-3 rounded-xl bg-gradient-to-r ${currentTheme.btnGradient} text-white font-bold shadow-lg transition-all active:scale-[0.99]`}
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
