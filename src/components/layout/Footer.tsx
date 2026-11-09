import React from 'react';
import { Keyboard, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-12 border-t border-slate-800/80 bg-slate-950/60 py-6 px-4 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Hotkey guides */}
        <div className="flex items-center gap-4 flex-wrap justify-center text-slate-400">
          <div className="flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5 text-slate-500" />
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px] font-mono text-slate-300">Space</kbd>
            <span>Hold 0.3s to Arm • Release to Start • Press any key to Stop</span>
          </div>
          <div className="hidden lg:flex items-center gap-1.5 text-slate-500">
            <span>•</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px] font-mono text-slate-300">Esc</kbd>
            <span>Close Modal</span>
          </div>
        </div>

        {/* WCA Compliance status */}
        <div className="flex items-center gap-2 text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500/80" />
          <span>WCA 15s Inspection • Ao5 & Ao12 Olympic Trimming • Docker Production</span>
        </div>
      </div>
    </footer>
  );
};
