import React from 'react';

export const Skeleton = ({ className = '', variant = 'rectangular' }) => {
  const variantStyles = {
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    text: 'rounded h-3 my-1'
  };

  return (
    <div
      className={`animate-pulse bg-slate-200/80 ${variantStyles[variant]} ${className}`}
    />
  );
};
