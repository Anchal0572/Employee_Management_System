import React, { forwardRef } from 'react';

export const Textarea = forwardRef(({
  label,
  error,
  helperText,
  className = '',
  required = false,
  id,
  rows = 3,
  ...props
}, ref) => {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={textareaId} className="block text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={`block w-full text-xs rounded-lg bg-white border px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-slate-50 disabled:text-slate-400 ${
          error
            ? 'border-rose-400 text-rose-900 placeholder-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
            : 'border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20'
        } ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-[11px] text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
});

Textarea.displayName = 'Textarea';
