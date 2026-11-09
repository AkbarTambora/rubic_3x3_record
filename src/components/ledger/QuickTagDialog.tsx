import React, { useState, useEffect } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Tag, Plus, X } from 'lucide-react';
import { Solve } from '../../types/solve';

interface QuickTagDialogProps {
  solve: Solve | null;
  open: boolean;
  onClose: () => void;
  onSaveTags: (id: string | number, tags: string[], notes: string) => void;
  availableTags: string[];
}

export const QuickTagDialog: React.FC<QuickTagDialogProps> = ({
  solve,
  open,
  onClose,
  onSaveTags,
  availableTags
}) => {
  const [currentTags, setCurrentTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (solve) {
      setCurrentTags(solve.tags || []);
      setNotes(solve.notes || '');
    }
  }, [solve]);

  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (!trimmed) return;
    if (!currentTags.includes(trimmed)) {
      setCurrentTags(prev => [...prev, trimmed]);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setCurrentTags(prev => prev.filter(t => t !== tagToRemove));
  };

  const handleSave = () => {
    if (solve) {
      onSaveTags(solve.id, currentTags, notes);
    }
    onClose();
  };

  if (!solve) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Edit Tags & Notes (Solve #${solve.solveNumber})`}
      description={`Time: ${solve.formattedTime} • Scramble: ${solve.scramble.slice(0, 24)}...`}
    >
      <div className="space-y-4">
        {/* Active Tags */}
        <div>
          <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
            Active Tags:
          </label>
          <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 rounded-lg bg-slate-950/60 border border-slate-800">
            {currentTags.length > 0 ? (
              currentTags.map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1 pr-1 bg-slate-800 hover:bg-slate-700">
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-400 p-0.5 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))
            ) : (
              <span className="text-xs text-slate-500 italic">No tags assigned yet</span>
            )}
          </div>
        </div>

        {/* Add Tag Input */}
        <div>
          <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
            Add New Tag:
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Session 3, Smooth F2L, PLL Skip"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag(newTagInput);
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => handleAddTag(newTagInput)}
              className="gap-1 px-3 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </Button>
          </div>
        </div>

        {/* Quick Suggestions from existing tags */}
        {availableTags.length > 0 && (
          <div>
            <label className="text-[11px] font-medium text-slate-400 mb-1 block">
              Suggestions from library:
            </label>
            <div className="flex flex-wrap gap-1">
              {availableTags.filter(t => !currentTags.includes(t)).map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  className="text-xs px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notes Textarea */}
        <div>
          <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
            Notes / Review:
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Catatan eksekusi, cross, F2L lookahead..."
            className="w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder:text-slate-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="default" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
