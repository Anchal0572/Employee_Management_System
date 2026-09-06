import React, { forwardRef } from 'react';

export const Select = forwardRef(({
  label,
  options = [],
  error,
  helperText,
  className = '',
  required = false,
  id,
  placeholder = 'Select an option',
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`block w-full text-xs rounded-lg bg-white border px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-slate-50 disabled:text-slate-400 ${
          error
            ? 'border-rose-400 text-rose-900 focus:border-rose-500 focus:ring-rose-500/20'
            : 'border-slate-300 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500/20'
        } ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt, i) => {
          const value = typeof opt === 'object' ? opt.value : opt;
          const labelText = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={i} value={value}>
              {labelText}
            </option>
          );
        })}
      </select>
      {error ? (
        <p className="text-[11px] text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
});

Select.displayName = 'Select';
