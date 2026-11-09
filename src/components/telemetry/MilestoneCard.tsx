import React from 'react';
import { Target, Award, CheckCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useCubeStore } from '../../hooks/useCubeStore';

export const MilestoneCard: React.FC = () => {
  const { filteredStats } = useCubeStore();
  const milestone = filteredStats.milestone;

  if (!milestone) return null;

  return (
    <Card className="p-4 border-slate-800/80 bg-gradient-to-r from-slate-900/90 to-slate-950/80 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">Target Milestone: {milestone.name}</h4>
              {milestone.isAchieved ? (
                <Badge variant="cube" className="text-[10px] gap-1">
                  <CheckCircle className="w-3 h-3" /> Achieved!
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-sky-400 border-sky-800">
                  {milestone.differenceSeconds > 0 ? `+${milestone.differenceSeconds.toFixed(2)}s to goal` : 'Target Met'}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Berdasarkan rerata sesi saat ini. Konsistensi sub-{milestone.target}s membuka tier kecepatan berikutnya.
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full sm:w-60 flex flex-col gap-1.5 self-center">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-400">Progres Menuju Target</span>
            <span className="text-sky-300 font-mono font-bold">{milestone.progressPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700/60">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${milestone.progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
