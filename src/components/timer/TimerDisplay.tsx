import React from 'react';
import { TimerPhase } from '../../types/timer';
import { PenaltyType } from '../../types/solve';
import { Badge } from '../ui/Badge';
import { AlertCircle, CheckCircle2, Flame, Hand } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TimerDisplayProps {
  phase: TimerPhase;
  displayTime: string;
  inspectionSecondsLeft: number;
  inspectionPenalty: PenaltyType;
  timerDigitsDomRef: React.RefObject<HTMLHeadingElement>;
  onTouchStart: () => void;
  onTouchEnd: () => void;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  phase,
  displayTime,
  inspectionSecondsLeft,
  inspectionPenalty,
  timerDigitsDomRef,
  onTouchStart,
  onTouchEnd
}) => {
  // Compute color states according to Speedcubing phase
  const getPhaseTextColor = () => {
    switch (phase) {
      case 'HOLDING':
      case 'INSPECTION_HOLD':
        return 'text-rose-500';
      case 'READY':
        return 'text-emerald-400 drop-shadow-[0_0_25px_rgba(52,211,153,0.7)]';
      case 'INSPECTION':
        return inspectionSecondsLeft <= 7 ? 'text-amber-500' : 'text-amber-400';
      case 'RUNNING':
        return 'text-sky-400';
      case 'STOPPED':
        return 'text-slate-100';
      case 'IDLE':
      default:
        return 'text-slate-200';
    }
  };

  const getPhaseBorderColor = () => {
    switch (phase) {
      case 'READY':
        return 'border-emerald-500/80 shadow-[0_0_35px_rgba(16,185,129,0.25)] bg-emerald-950/20';
      case 'HOLDING':
      case 'INSPECTION_HOLD':
        return 'border-rose-500/80 shadow-[0_0_35px_rgba(244,63,94,0.25)] bg-rose-950/20';
      case 'INSPECTION':
        return 'border-amber-500/60 shadow-[0_0_35px_rgba(245,158,11,0.2)] bg-amber-950/20';
      case 'RUNNING':
        return 'border-sky-500/50 shadow-[0_0_35px_rgba(56,189,248,0.15)] bg-sky-950/10';
      default:
        return 'border-slate-800/80 hover:border-slate-700/80 bg-slate-900/40';
    }
  };

  return (
    <div
      onMouseDown={(e) => {
        // Only primary mouse button (left click)
        if (e.button === 0) {
          onTouchStart();
        }
      }}
      onMouseUp={(e) => {
        if (e.button === 0) {
          onTouchEnd();
        }
      }}
      onTouchStart={(e) => {
        e.preventDefault();
        onTouchStart();
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        onTouchEnd();
      }}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        "relative flex flex-col items-center justify-center p-8 md:p-14 rounded-3xl border transition-all duration-150 select-none cursor-pointer min-h-[220px] md:min-h-[280px] backdrop-blur-md",
        getPhaseBorderColor()
      )}
    >
      {/* Inspection Countdown HUD */}
      {(phase === 'INSPECTION' || phase === 'INSPECTION_HOLD') && (
        <div className="absolute top-5 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
          <Badge
            variant={inspectionPenalty === 'dnf' ? 'dnf' : inspectionPenalty === '+2' ? 'plus2' : 'default'}
            className="text-base px-3 py-1 font-bold tracking-wider animate-pulse"
          >
            {inspectionPenalty === 'dnf' ? (
              <span className="flex items-center gap-1.5 text-rose-400">
                <AlertCircle className="w-4 h-4" /> DNF (+17s EXCEEDED)
              </span>
            ) : inspectionPenalty === '+2' ? (
              <span className="flex items-center gap-1.5 text-orange-400">
                <AlertCircle className="w-4 h-4" /> +2 PENALTY (15s OVER)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-300">
                INSPECTION: {inspectionSecondsLeft}s
              </span>
            )}
          </Badge>
        </div>
      )}

      {/* Main Digits (Ref-Decoupled for 60fps running with zero React tree re-render) */}
      <h2
        ref={timerDigitsDomRef}
        className={cn(
          "font-mono font-black tracking-tight text-6xl sm:text-7xl md:text-8xl lg:text-9xl transition-colors duration-75 tabular-nums",
          getPhaseTextColor()
        )}
      >
        {displayTime}
      </h2>

      {/* Phase status indicator subtitle */}
      <div className="mt-4 flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-slate-400">
        {phase === 'IDLE' && (
          <span className="flex items-center gap-1.5 text-slate-400">
            <Hand className="w-3.5 h-3.5" /> Hold Spacebar to Arm
          </span>
        )}
        {phase === 'HOLDING' && (
          <span className="flex items-center gap-1.5 text-rose-400 font-bold">
            Wait for green... (Hold still)
          </span>
        )}
        {phase === 'READY' && (
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <CheckCircle2 className="w-4 h-4" /> Ready! Release to Start
          </span>
        )}
        {phase === 'INSPECTION' && (
          <span className="flex items-center gap-1.5 text-amber-400">
            Inspecting Cube • Hold Space when ready to solve
          </span>
        )}
        {phase === 'INSPECTION_HOLD' && (
          <span className="flex items-center gap-1.5 text-rose-400 font-bold">
            Hold for green ready...
          </span>
        )}
        {phase === 'RUNNING' && (
          <span className="flex items-center gap-1.5 text-sky-400 animate-pulse">
            <Flame className="w-3.5 h-3.5 text-sky-400" /> Solving in progress • Press any key to stop
          </span>
        )}
        {phase === 'STOPPED' && (
          <span className="flex items-center gap-1.5 text-slate-300">
            Solve complete • Press space to prepare next
          </span>
        )}
      </div>
    </div>
  );
};
