import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeNames = {
  '': 'Dashboard',
  'admin': 'Admin',
  'employee': 'Employee',
  'dashboard': 'Dashboard',
  'employees': 'Employees',
  'new': 'Add Employee',
  'edit': 'Edit',
  'attendance': 'Attendance',
  'leaves': 'Leave Management',
  'payroll': 'Payroll & Payslips',
  'notifications': 'Notifications',
  'profile': 'My Profile',
  'settings': 'Settings',
  'system-health': 'Diagnostics'
};

export const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) {
    return (
      <div className="flex items-center text-xs font-medium text-slate-500">
        <Home className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
        <span>Dashboard</span>
      </div>
    );
  }

  return (
    <nav className="flex items-center space-x-1.5 text-xs text-slate-500" aria-label="Breadcrumb">
      <Link
        to="/"
        className="inline-flex items-center text-slate-500 hover:text-slate-800 transition-colors"
      >
        <Home className="w-3.5 h-3.5 mr-1 text-slate-400" />
        <span className="hidden sm:inline">Home</span>
      </Link>

      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const displayName = routeNames[value] || (value.startsWith('EMP-') || value.startsWith('PAY-') ? value : value.charAt(0).toUpperCase() + value.slice(1));

        return (
          <React.Fragment key={to}>
            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-slate-800 truncate max-w-[150px] sm:max-w-none">
                {displayName}
              </span>
            ) : (
              <Link
                to={to}
                className="text-slate-500 hover:text-slate-800 transition-colors truncate max-w-[120px] sm:max-w-none"
              >
                {displayName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
