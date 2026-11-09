import React from 'react';
import { Trophy, Zap, TrendingUp, Activity, BarChart2, ShieldAlert } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useCubeStore } from '../../hooks/useCubeStore';
import { TimeUtils } from '../../lib/timeUtils';

export const TelemetryHUD: React.FC = () => {
  const { filteredStats, solves } = useCubeStore();

  const metrics = [
    {
      title: "Personal Best (PB)",
      value: filteredStats.pbSingle !== null ? TimeUtils.formatTimerDigits(filteredStats.pbSingle) : "--:--.--",
      sub: filteredStats.pbSolveNumber ? `Solve #${filteredStats.pbSolveNumber}` : "All-time Best",
      icon: Trophy,
      color: "text-amber-400",
      borderColor: "border-amber-500/30",
      bgGlow: "bg-amber-500/5",
      isHighlight: true
    },
    {
      title: "Current Single",
      value: filteredStats.currentSingle !== null ? (filteredStats.currentSingle === Infinity ? 'DNF' : TimeUtils.formatTimerDigits(filteredStats.currentSingle)) : "--:--.--",
      sub: "Latest Recorded",
      icon: Zap,
      color: "text-sky-400",
      borderColor: "border-sky-500/30",
      bgGlow: "bg-sky-500/5"
    },
    {
      title: "Best / Current Ao5",
      value: filteredStats.currentAo5 !== null ? (filteredStats.currentAo5 === Infinity ? 'DNF' : TimeUtils.formatTimerDigits(filteredStats.currentAo5)) : "--:--.--",
      sub: `Best: ${filteredStats.bestAo5 !== null ? TimeUtils.formatTimerDigits(filteredStats.bestAo5) : '--:--.--'}`,
      icon: TrendingUp,
      color: "text-emerald-400",
      borderColor: "border-emerald-500/30",
      bgGlow: "bg-emerald-500/5"
    },
    {
      title: "Best / Current Ao12",
      value: filteredStats.currentAo12 !== null ? (filteredStats.currentAo12 === Infinity ? 'DNF' : TimeUtils.formatTimerDigits(filteredStats.currentAo12)) : "--:--.--",
      sub: `Best: ${filteredStats.bestAo12 !== null ? TimeUtils.formatTimerDigits(filteredStats.bestAo12) : '--:--.--'}`,
      icon: BarChart2,
      color: "text-purple-400",
      borderColor: "border-purple-500/30",
      bgGlow: "bg-purple-500/5"
    },
    {
      title: "Session Mean",
      value: filteredStats.sessionMean !== null ? TimeUtils.formatTimerDigits(filteredStats.sessionMean) : "--:--.--",
      sub: `Total: ${filteredStats.totalSolves} / ${solves.length} Solves`,
      icon: Activity,
      color: "text-indigo-400",
      borderColor: "border-indigo-500/30",
      bgGlow: "bg-indigo-500/5"
    },
    {
      title: "Std Deviation (σ)",
      value: filteredStats.stdDev ? `±${filteredStats.stdDev.toFixed(2)}s` : "±0.00s",
      sub: `${filteredStats.plusTwoCount} (+2) • ${filteredStats.dnfCount} (DNF)`,
      icon: ShieldAlert,
      color: "text-rose-400",
      borderColor: "border-rose-500/30",
      bgGlow: "bg-rose-500/5"
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {metrics.map((m, idx) => {
        const Icon = m.icon;
        return (
          <Card
            key={idx}
            className={`p-4 border ${m.borderColor} ${m.bgGlow} transition-all duration-200 hover:scale-[1.02] flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                {m.title}
              </span>
              <Icon className={`w-4 h-4 ${m.color} shrink-0`} />
            </div>

            <div>
              <div className="font-mono text-xl sm:text-2xl font-black tracking-tight text-white tabular-nums">
                {m.value}
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-1 truncate">
                {m.sub}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
