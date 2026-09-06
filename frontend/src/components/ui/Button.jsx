import React from 'react';

const variants = {
  primary: 'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 border border-transparent shadow-sm',
  secondary: 'bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 border border-slate-300 shadow-sm',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 border border-transparent shadow-sm',
  ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent',
  outline: 'bg-transparent text-slate-700 hover:bg-slate-100 border border-slate-300'
};

const sizes = {
  sm: 'px-2.5 py-1.5 text-xs rounded-md',
  md: 'px-3.5 py-2 text-sm rounded-lg',
  lg: 'px-4 py-2.5 text-base rounded-lg'
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon: Icon,
  ...props
}) => {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : Icon ? (
        <Icon className="w-4 h-4 mr-2 -ml-0.5" />
      ) : null}
      {children}
    </button>
  );
};
