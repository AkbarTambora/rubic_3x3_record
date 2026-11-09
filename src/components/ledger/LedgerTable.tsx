import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { QuickTagDialog } from './QuickTagDialog';
import {
  ListOrdered,
  Tag as TagIcon,
  Trash2,
  Trophy,
  AlertCircle,
  Clock,
  Calendar,
  MessageSquare,
  Plus
} from 'lucide-react';
import { useCubeStore } from '../../hooks/useCubeStore';
import { Solve, PenaltyType } from '../../types/solve';
import { TimeUtils } from '../../lib/timeUtils';

export const LedgerTable: React.FC = () => {
  const {
    filteredSolves,
    solves,
    deleteSolve,
    updatePenalty,
    updateTags,
    updateNotes,
    allTags,
    stats
  } = useCubeStore();

  const [activeTagSolve, setActiveTagSolve] = useState<Solve | null>(null);

  const handlePenaltyToggle = (solve: Solve, targetPenalty: PenaltyType) => {
    if (solve.penalty === targetPenalty) {
      updatePenalty(solve.id, 'none');
    } else {
      updatePenalty(solve.id, targetPenalty);
    }
  };

  const handleDelete = (solve: Solve) => {
    if (window.confirm(`Delete Solve #${solve.solveNumber} (${solve.formattedTime})?`)) {
      deleteSolve(solve.id);
    }
  };

  return (
    <>
      <Card className="border-slate-800/80 bg-slate-900/60 backdrop-blur-md shadow-xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-800/80">
          <CardTitle className="text-sm font-semibold text-slate-200">
            <ListOrdered className="w-4 h-4 text-sky-400" />
            <span>Solve Ledger & History</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono border-slate-700 text-slate-300">
              Showing {filteredSolves.length} of {solves.length} Solves
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredSolves.length > 0 ? (
            <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 w-14 text-center">#</th>
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3 text-center">Penalty</th>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Tags & Notes</th>
                    <th className="py-2.5 px-3 hidden md:table-cell">Scramble</th>
                    <th className="py-2.5 px-3 w-14 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredSolves.map((solve) => {
                    const isPB = stats.pbSingle !== null && solve.effectiveSeconds === stats.pbSingle && solve.penalty !== 'dnf';

                    return (
                      <tr
                        key={solve.id}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          isPB ? 'bg-amber-500/5' : ''
                        }`}
                      >
                        {/* Solve Number */}
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400">
                          {solve.solveNumber}
                        </td>

                        {/* Time & PB Indicator */}
                        <td className="py-2.5 px-3 font-mono font-black text-sm whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={
                                solve.penalty === 'dnf'
                                  ? 'text-rose-400 line-through'
                                  : solve.penalty === '+2'
                                  ? 'text-orange-400'
                                  : isPB
                                  ? 'text-amber-300'
                                  : 'text-white'
                              }
                            >
                              {solve.penalty === 'dnf' ? 'DNF' : TimeUtils.formatTimerDigits(solve.effectiveSeconds)}
                            </span>

                            {solve.penalty === '+2' && (
                              <span className="text-[10px] text-orange-400 font-mono">
                                ({solve.formattedTime}+2)
                              </span>
                            )}

                            {isPB && (
                              <Badge variant="pb" className="text-[10px] gap-0.5 px-1 py-0">
                                <Trophy className="w-2.5 h-2.5" /> PB
                              </Badge>
                            )}
                          </div>
                        </td>

                        {/* Penalty Buttons */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950/60 p-0.5">
                            <button
                              type="button"
                              onClick={() => handlePenaltyToggle(solve, '+2')}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                                solve.penalty === '+2'
                                  ? 'bg-orange-500 text-slate-950'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                              title="Toggle +2 second penalty"
                            >
                              +2
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePenaltyToggle(solve, 'dnf')}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                                solve.penalty === 'dnf'
                                  ? 'bg-rose-500 text-slate-950'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                              title="Toggle DNF penalty"
                            >
                              DNF
                            </button>
                          </div>
                        </td>

                        {/* Date & Time */}
                        <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap text-[11px] font-mono">
                          <div>{solve.date}</div>
                          <div className="text-[10px] text-slate-500">{solve.timestamp}</div>
                        </td>

                        {/* Tags & Notes */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {solve.tags && solve.tags.length > 0 ? (
                              solve.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-[10px] px-1.5 py-0 bg-slate-800 text-slate-300"
                                >
                                  {tag}
                                </Badge>
                              ))
                            ) : null}

                            {solve.notes && (
                              <span className="text-[11px] text-slate-400 italic flex items-center gap-1">
                                <MessageSquare className="w-3 h-3 text-slate-500 shrink-0" />
                                {solve.notes}
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => setActiveTagSolve(solve)}
                              className="text-slate-500 hover:text-sky-400 p-0.5 rounded hover:bg-slate-800 transition-colors"
                              title="Edit Tags / Notes"
                            >
                              <TagIcon className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* Scramble Preview */}
                        <td className="py-2.5 px-3 hidden md:table-cell text-slate-500 font-mono text-[11px] truncate max-w-xs" title={solve.scramble}>
                          {solve.scramble || "—"}
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDelete(solve)}
                            className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-rose-500/10 transition-colors"
                            title="Delete solve record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              No solves found matching the selected filter criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Tag Dialog */}
      <QuickTagDialog
        open={Boolean(activeTagSolve)}
        solve={activeTagSolve}
        onClose={() => setActiveTagSolve(null)}
        availableTags={allTags}
        onSaveTags={(id, tags, notes) => {
          updateTags(id, tags);
          updateNotes(id, notes);
        }}
      />
    </>
  );
};
