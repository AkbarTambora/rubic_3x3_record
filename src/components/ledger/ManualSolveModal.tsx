import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Check, Clock, AlertCircle } from 'lucide-react';
import { TimeUtils } from '../../lib/timeUtils';
import { PenaltyType } from '../../types/solve';

interface ManualSolveModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (seconds: number, penalty: PenaltyType, tags: string[], notes: string) => void;
}

export const ManualSolveModal: React.FC<ManualSolveModalProps> = ({
  open,
  onClose,
  onSubmit
}) => {
  const [timeInput, setTimeInput] = useState('');
  const [penalty, setPenalty] = useState<PenaltyType>('none');
  const [tagsInput, setTagsInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  // Live parsed time
  const parsedSeconds = TimeUtils.parseSmartTime(timeInput);
  const isValid = parsedSeconds !== null && parsedSeconds > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || parsedSeconds === null) return;

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    onSubmit(parsedSeconds, penalty, tags, notesInput);
    setTimeInput('');
    setPenalty('none');
    setTagsInput('');
    setNotesInput('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add Manual Solve Time"
      description="Supports smart speedcuber typing formats: '12862' -> 01:28.62, '88.62', or '01:28.62'."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Time Input */}
        <div>
          <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
            Time Record:
          </label>
          <Input
            autoFocus
            placeholder="e.g. 12862 (for 01:28.62) or 88.62"
            value={timeInput}
            onChange={(e) => setTimeInput(e.target.value)}
            className="font-mono text-base"
          />

          {/* Live Preview */}
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-400">Parsed Preview:</span>
            {isValid ? (
              <Badge variant="cube" className="font-mono text-sm py-0.5 px-2">
                {TimeUtils.formatTimerDigits(parsedSeconds)} ({parsedSeconds.toFixed(2)}s)
              </Badge>
            ) : timeInput ? (
              <span className="text-rose-400 flex items-center gap-1 text-[11px]">
                <AlertCircle className="w-3.5 h-3.5" /> Invalid time format
              </span>
            ) : (
              <span className="text-slate-500 italic">Enter time above</span>
            )}
          </div>
        </div>

        {/* Penalty Options */}
        <div>
          <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
            Penalty Status:
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPenalty('none')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                penalty === 'none'
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Clean (None)
            </button>
            <button
              type="button"
              onClick={() => setPenalty('+2')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                penalty === '+2'
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              +2 Seconds
            </button>
            <button
              type="button"
              onClick={() => setPenalty('dnf')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                penalty === 'dnf'
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              DNF
            </button>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
            Tags (comma separated):
          </label>
          <Input
            placeholder="e.g. Session 3, Smooth F2L, Competition"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
            Notes (optional):
          </label>
          <Input
            placeholder="e.g. First sub-1:30 milestone achieved!"
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!isValid} className="gap-1.5">
            <Check className="w-4 h-4" />
            <span>Record Solve</span>
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
