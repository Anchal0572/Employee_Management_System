import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

/**
 * Ensures user is authenticated before granting access to inner routes
 */
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-slate-600 tracking-wide uppercase">
          Verifying security credentials...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

/**
 * Enforces role-based authorization (e.g. Admin only)
 */
export const RoleRoute = ({ children, allowedRoles = [] }) => {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user || (allowedRoles.length > 0 && !allowedRoles.includes(role))) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 uppercase tracking-wider mb-2">
          HTTP 403 Forbidden
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Access Restricted
        </h1>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Your current account role (<strong className="capitalize text-slate-700">{role || 'unassigned'}</strong>) does not have authorization to access this administration interface.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Link to="/">
            <Button variant="primary" icon={ArrowLeft}>
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return children;
};
