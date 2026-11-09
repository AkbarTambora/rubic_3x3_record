import React, { useState } from 'react';
import { RefreshCw, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/Button';
import { useCubeStore } from '../../hooks/useCubeStore';

export const ScrambleBanner: React.FC = () => {
  const { currentScramble, generateNewScramble, settings, updateSettings } = useCubeStore();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!currentScramble) return;
    navigator.clipboard.writeText(currentScramble);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="w-full rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/50 border border-slate-800/80 p-4 shadow-xl backdrop-blur-md">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Scramble Label & Controls */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-400 bg-sky-950/60 border border-sky-800/50 px-2.5 py-1 rounded-md">
            Scramble
          </span>
          <span className="text-xs text-slate-400">
            3×3 WCA
          </span>
        </div>

        {/* Big Monospace Scramble String */}
        <div className="flex-1 text-center px-2 py-1">
          <p className="font-mono text-base md:text-xl font-bold tracking-wider text-slate-100 select-all leading-relaxed">
            {currentScramble}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 self-end md:self-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateSettings({ show2DNet: !settings.show2DNet })}
            title={settings.show2DNet ? "Hide 2D Net" : "Show 2D Net"}
            className="text-slate-400 hover:text-white h-8 px-2"
          >
            {settings.show2DNet ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            title="Copy Scramble"
            className="text-slate-400 hover:text-white h-8 px-2"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={generateNewScramble}
            title="Generate Next Scramble"
            className="gap-1.5 text-xs text-slate-200 border-slate-700 hover:bg-slate-800 h-8 px-2.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Next</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
