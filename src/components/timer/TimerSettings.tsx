import React from 'react';
import { Clock, Volume2, Shield } from 'lucide-react';
import { useCubeStore } from '../../hooks/useCubeStore';

export const TimerSettings: React.FC = () => {
  const { settings, updateSettings } = useCubeStore();

  return (
    <div className="flex items-center justify-center gap-6 py-2 px-4 rounded-xl bg-slate-900/40 border border-slate-800/60 text-xs text-slate-300">
      {/* 15s WCA Inspection */}
      <label className="flex items-center gap-2 cursor-pointer select-none group">
        <input
          type="checkbox"
          checked={settings.wcaInspection}
          onChange={(e) => {
            updateSettings({ wcaInspection: e.target.checked });
            e.target.blur();
          }}
          className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-sky-400 focus:ring-offset-0 focus:ring-1 cursor-pointer"
        />
        <div className="flex items-center gap-1.5 group-hover:text-white transition-colors">
          <Shield className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-medium">15s WCA Inspection</span>
        </div>
      </label>

      {/* Audio Alerts */}
      <label className="flex items-center gap-2 cursor-pointer select-none group">
        <input
          type="checkbox"
          checked={settings.soundAlerts}
          onChange={(e) => {
            updateSettings({ soundAlerts: e.target.checked });
            e.target.blur();
          }}
          className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-sky-400 focus:ring-offset-0 focus:ring-1 cursor-pointer"
        />
        <div className="flex items-center gap-1.5 group-hover:text-white transition-colors">
          <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-medium">Audio Beeps</span>
        </div>
      </label>
    </div>
  );
};
