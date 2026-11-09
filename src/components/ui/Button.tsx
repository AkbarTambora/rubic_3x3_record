import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'cube';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]",
          {
            'bg-sky-500 text-slate-950 hover:bg-sky-400 font-semibold shadow-md shadow-sky-500/20': variant === 'default',
            'border border-slate-700/80 bg-slate-900/60 text-slate-200 hover:bg-slate-800 hover:text-white hover:border-slate-600': variant === 'outline',
            'bg-slate-800 text-slate-100 hover:bg-slate-700': variant === 'secondary',
            'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50': variant === 'ghost',
            'bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30': variant === 'destructive',
            'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold hover:brightness-110 shadow-lg shadow-emerald-500/10': variant === 'cube',
          },
          {
            'h-10 px-4 py-2': size === 'default',
            'h-8 rounded-md px-3 text-xs': size === 'sm',
            'h-12 rounded-xl px-6 text-base': size === 'lg',
            'h-9 w-9 p-0': size === 'icon',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
