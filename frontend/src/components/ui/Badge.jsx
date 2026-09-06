import React from 'react';

const badgeVariants = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
  neutral: 'bg-slate-50 text-slate-700 border-slate-200'
};

export const Badge = ({ children, variant = 'neutral', className = '', dot = false }) => {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badgeVariants[variant]} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
            variant === 'success' ? 'bg-emerald-500' :
            variant === 'warning' ? 'bg-amber-500' :
            variant === 'danger' ? 'bg-rose-500' :
            variant === 'info' ? 'bg-sky-500' : 'bg-slate-500'
          }`}
        />
      )}
      {children}
    </span>
  );
};
