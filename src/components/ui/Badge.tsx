import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'pb' | 'dnf' | 'plus2' | 'cube';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none select-none",
        {
          'bg-sky-500/15 text-sky-300 border border-sky-500/30': variant === 'default',
          'bg-slate-800 text-slate-300 border border-slate-700': variant === 'secondary',
          'border border-slate-700 text-slate-400': variant === 'outline',
          'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm shadow-amber-500/20': variant === 'pb',
          'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono': variant === 'dnf',
          'bg-orange-500/20 text-orange-300 border border-orange-500/40 font-mono': variant === 'plus2',
          'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40': variant === 'cube',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
