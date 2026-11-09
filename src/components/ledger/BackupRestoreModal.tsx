import React, { useRef } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Download, Upload, Trash2, FileSpreadsheet, FileCode, AlertTriangle } from 'lucide-react';
import { useCubeStore } from '../../hooks/useCubeStore';

interface BackupRestoreModalProps {
  open: boolean;
  onClose: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({ open, onClose }) => {
  const {
    solves,
    exportSolvesJSON,
    exportSolvesCSV,
    importSolvesData,
    clearAllSolves
  } = useCubeStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        let solvesToImport: any[] = [];
        if (Array.isArray(parsed)) {
          solvesToImport = parsed;
        } else if (parsed.sessions && parsed.activeSessionId && parsed.sessions[parsed.activeSessionId]) {
          solvesToImport = parsed.sessions[parsed.activeSessionId].solves || [];
        }

        if (solvesToImport.length > 0) {
          const success = importSolvesData(solvesToImport);
          if (success) {
            alert(`Successfully restored ${solvesToImport.length} solves!`);
            onClose();
          } else {
            alert("Invalid solves data structure.");
          }
        } else {
          alert("No solves found in JSON file.");
        }
      } catch (err) {
        alert("Failed to read JSON backup file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Data Backup & Restore Center"
      description={`Currently managing ${solves.length} recorded solves in local state.`}
    >
      <div className="space-y-4">
        {/* Export Options */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Export & Backup</span>
          </h4>
          <p className="text-xs text-slate-400">
            Download your speedcubing records for external analysis or backup.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportSolvesJSON}
              className="flex-1 gap-1.5 text-xs border-slate-700 hover:border-slate-600"
            >
              <FileCode className="w-4 h-4 text-sky-400" />
              <span>Export JSON</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportSolvesCSV}
              className="flex-1 gap-1.5 text-xs border-slate-700 hover:border-slate-600"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>

        {/* Import Option */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Restore / Import</span>
          </h4>
          <p className="text-xs text-slate-400">
            Import records from previously exported CubeStudio JSON files.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="w-full gap-1.5 text-xs border-slate-700 hover:border-slate-600 text-emerald-300"
          >
            <Upload className="w-4 h-4" />
            <span>Select JSON Backup File</span>
          </Button>
        </div>

        {/* Danger Zone */}
        <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-2">
          <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Danger Zone</span>
          </h4>
          <p className="text-xs text-rose-300/80">
            Permanently clear all {solves.length} solves from this browser session.
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              clearAllSolves();
              onClose();
            }}
            className="w-full gap-1.5 text-xs"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All Solves</span>
          </Button>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
