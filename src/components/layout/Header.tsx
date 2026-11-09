import React from 'react';
import { Box, Download, PlusCircle, Volume2, VolumeX, Sparkles, Database } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useCubeStore } from '../../hooks/useCubeStore';
import { TimeUtils } from '../../lib/timeUtils';

interface HeaderProps {
  onOpenManualModal: () => void;
  onOpenBackupModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenManualModal, onOpenBackupModal }) => {
  const { stats, settings, updateSettings } = useCubeStore();

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-emerald-500 shadow-md shadow-sky-500/20 text-white">
            <Box className="w-5 h-5 stroke-[2.2]" />
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-sky-300 bg-clip-text text-transparent">
                CubeStudio <span className="text-sky-400 font-mono text-sm px-1.5 py-0.5 rounded bg-sky-950/80 border border-sky-800/50">3×3</span>
              </h1>
              <Badge variant="outline" className="hidden md:inline-flex text-[10px] py-0 px-1.5 border-slate-800 text-slate-400">
                PRO TELEMETRY
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              WCA Tournament Standards • Single Source of Truth
            </p>
          </div>
        </div>

        {/* Global Quick Info & Actions */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {stats.pbSingle && (
            <div className="hidden sm:flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg text-amber-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>PB:</span>
              <span className="font-mono font-bold text-amber-200">
                {TimeUtils.formatTimerDigits(stats.pbSingle)}
              </span>
              <span className="text-[10px] text-amber-400/80">(#{stats.pbSolveNumber})</span>
            </div>
          )}

          {/* Sound Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateSettings({ soundAlerts: !settings.soundAlerts })}
            title={settings.soundAlerts ? "Sound Enabled" : "Sound Muted"}
            className="text-slate-400 hover:text-white"
          >
            {settings.soundAlerts ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </Button>

          {/* Manual Entry */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenManualModal}
            className="gap-1.5 text-xs text-sky-300 border-sky-900/60 hover:border-sky-700 bg-sky-950/30"
          >
            <PlusCircle className="w-3.5 h-3.5 text-sky-400" />
            <span>Manual Time</span>
          </Button>

          {/* Data Backup / Restore */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenBackupModal}
            className="gap-1.5 text-xs text-slate-300 border-slate-800 hover:bg-slate-800"
          >
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span>Data</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
