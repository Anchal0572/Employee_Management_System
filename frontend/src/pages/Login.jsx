import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Briefcase, Lock, Mail, Eye, EyeOff, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 mb-4">
          <Briefcase className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">EMS Enterprise</h2>
        <p className="mt-1 text-xs text-slate-400">
          Workforce, Payroll & Intelligence Management Suite
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl shadow-xl border border-slate-200">
          {/* Quick Demo Preset Switcher */}
          <div className="mb-6 bg-slate-100 p-1 rounded-lg grid grid-cols-2 gap-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleSelectPreset('admin')}
              className={`py-2 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                selectedPreset === 'admin'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              Admin Login
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset('employee')}
              className={`py-2 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                selectedPreset === 'employee'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              Employee Login
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {authError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
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
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span>Remember this terminal</span>
              </label>
              <span className="text-slate-400 text-[11px]">
                JWT Authentication
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              loading={isSubmitting}
            >
              Sign In to EMS
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              EMS Enterprise Platform • Production Edition • v1.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
