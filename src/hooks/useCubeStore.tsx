import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Solve, PenaltyType, AppSettings } from '../types/solve';
import { FilterCriteria, SortOption } from '../types/filter';
import { StatsSummary } from '../types/stats';
import { StorageMigration } from '../lib/storageMigration';
import { StatsEngine } from '../lib/statsEngine';
import { RubikEngine } from '../lib/rubikEngine';
import { TimeUtils } from '../lib/timeUtils';

interface CubeStoreContextType {
  solves: Solve[];
  filteredSolves: Solve[];
  stats: StatsSummary;
  filteredStats: StatsSummary;
  currentScramble: string;
  filters: FilterCriteria;
  settings: AppSettings;
  allTags: string[];
  
  // Actions
  generateNewScramble: () => void;
  addSolve: (timeSeconds: number, penalty?: PenaltyType, customTags?: string[], customNotes?: string) => Solve;
  deleteSolve: (id: string | number) => void;
  updatePenalty: (id: string | number, penalty: PenaltyType) => void;
  updateTags: (id: string | number, tags: string[]) => void;
  updateNotes: (id: string | number, notes: string) => void;
  setFilters: React.Dispatch<React.SetStateAction<FilterCriteria>>;
  resetFilters: () => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  exportSolvesJSON: () => void;
  exportSolvesCSV: () => void;
  importSolvesData: (imported: Solve[]) => boolean;
  clearAllSolves: () => void;
}

const DEFAULT_FILTERS: FilterCriteria = {
  dateFrom: '',
  dateTo: '',
  solveFrom: '',
  solveTo: '',
  tag: 'all',
  penalty: 'all',
  sort: 'newest',
  searchQuery: ''
};

const DEFAULT_SETTINGS: AppSettings = {
  wcaInspection: false,
  soundAlerts: true,
  show2DNet: true,
  theme: 'dark'
};

const CubeStoreContext = createContext<CubeStoreContextType | null>(null);

export const CubeStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [solves, setSolves] = useState<Solve[]>(() => StorageMigration.loadInitialSolves());
  const [currentScramble, setCurrentScramble] = useState<string>(() => RubikEngine.generateScramble());
  const [filters, setFilters] = useState<FilterCriteria>(DEFAULT_FILTERS);
  const [settings, setSettings] = useState<AppSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('cubestudio_settings');
        if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch {}
    }
    return DEFAULT_SETTINGS;
  });

  // Persist solves on change
  useEffect(() => {
    StorageMigration.persistSolves(solves);
  }, [solves]);

  // Persist settings on change
  useEffect(() => {
    try {
      localStorage.setItem('cubestudio_settings', JSON.stringify(settings));
    } catch {}
  }, [settings]);

  const generateNewScramble = useCallback(() => {
    setCurrentScramble(RubikEngine.generateScramble());
  }, []);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    solves.forEach(s => {
      s.tags?.forEach(t => {
        if (t.trim()) set.add(t.trim());
      });
    });
    return Array.from(set).sort();
  }, [solves]);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const addSolve = useCallback((timeSeconds: number, penalty: PenaltyType = 'none', customTags: string[] = [], customNotes = ''): Solve => {
    const solveNumber = solves.length + 1;
    const effectiveSec = penalty === 'dnf' ? Infinity : penalty === '+2' ? timeSeconds + 2 : timeSeconds;

    // Check PB
    let isPB = false;
    const currentPB = StatsEngine.computeSummary(solves).pbSingle;
    if (effectiveSec !== Infinity && (currentPB === null || effectiveSec < currentPB)) {
      isPB = true;
    }

    const newSolve: Solve = {
      id: Date.now(),
      solveNumber,
      seconds: timeSeconds,
      formattedTime: TimeUtils.formatTimerDigits(timeSeconds),
      effectiveSeconds: effectiveSec,
      date: TimeUtils.getCurrentDateStr(),
      timestamp: TimeUtils.getCurrentClockStr(),
      scramble: currentScramble,
      penalty,
      tags: customTags,
      notes: customNotes,
      isPB
    };

    setSolves(prev => [...prev, newSolve]);
    setCurrentScramble(RubikEngine.generateScramble());
    return newSolve;
  }, [solves, currentScramble]);

  const deleteSolve = useCallback((id: string | number) => {
    setSolves(prev => {
      const remaining = prev.filter(s => s.id !== id);
      // Re-index solveNumber cleanly
      return remaining.map((s, idx) => ({ ...s, solveNumber: idx + 1 }));
    });
  }, []);

  const updatePenalty = useCallback((id: string | number, penalty: PenaltyType) => {
    setSolves(prev => prev.map(s => {
      if (s.id !== id) return s;
      const effectiveSec = penalty === 'dnf' ? Infinity : penalty === '+2' ? s.seconds + 2 : s.seconds;
      return { ...s, penalty, effectiveSeconds: effectiveSec };
    }));
  }, []);

  const updateTags = useCallback((id: string | number, tags: string[]) => {
    setSolves(prev => prev.map(s => s.id === id ? { ...s, tags } : s));
  }, []);

  const updateNotes = useCallback((id: string | number, notes: string) => {
    setSolves(prev => prev.map(s => s.id === id ? { ...s, notes } : s));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const clearAllSolves = useCallback(() => {
    if (window.confirm("Are you sure you want to clear all solve records? This cannot be undone.")) {
      setSolves([]);
    }
  }, []);

  // Filtered Solves calculation (SSOT for table and chart!)
  const filteredSolves = useMemo(() => {
    let result = [...solves];

    // Filter by Date Range
    if (filters.dateFrom) {
      result = result.filter(s => s.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      result = result.filter(s => s.date <= filters.dateTo);
    }

    // Filter by Solve Number Range
    const sFrom = parseInt(filters.solveFrom, 10);
    const sTo = parseInt(filters.solveTo, 10);
    if (!isNaN(sFrom)) {
      result = result.filter(s => s.solveNumber >= sFrom);
    }
    if (!isNaN(sTo)) {
      result = result.filter(s => s.solveNumber <= sTo);
    }

    // Filter by Tag
    if (filters.tag && filters.tag !== 'all') {
      result = result.filter(s => s.tags?.includes(filters.tag));
    }

    // Filter by Penalty Status
    if (filters.penalty === 'clean') {
      result = result.filter(s => s.penalty === 'none');
    } else if (filters.penalty === '+2') {
      result = result.filter(s => s.penalty === '+2');
    } else if (filters.penalty === 'dnf') {
      result = result.filter(s => s.penalty === 'dnf');
    }

    // Search query (scramble, notes, or tags)
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(s => 
        (s.notes && s.notes.toLowerCase().includes(q)) ||
        (s.scramble && s.scramble.toLowerCase().includes(q)) ||
        (s.tags && s.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    // Sort order
    result.sort((a, b) => {
      if (filters.sort === 'newest') return b.solveNumber - a.solveNumber;
      if (filters.sort === 'oldest') return a.solveNumber - b.solveNumber;
      if (filters.sort === 'fastest') {
        const timeA = a.penalty === 'dnf' ? Infinity : a.effectiveSeconds;
        const timeB = b.penalty === 'dnf' ? Infinity : b.effectiveSeconds;
        return timeA - timeB;
      }
      if (filters.sort === 'slowest') {
        const timeA = a.penalty === 'dnf' ? -Infinity : a.effectiveSeconds;
        const timeB = b.penalty === 'dnf' ? -Infinity : b.effectiveSeconds;
        return timeB - timeA;
      }
      return b.solveNumber - a.solveNumber;
    });

    return result;
  }, [solves, filters]);

  // Overall and Filtered Stats computation
  const stats = useMemo(() => StatsEngine.computeSummary(solves), [solves]);
  const filteredStats = useMemo(() => StatsEngine.computeSummary(filteredSolves), [filteredSolves]);

  // Export JSON
  const exportSolvesJSON = useCallback(() => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(solves, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `CubeStudio_Export_${TimeUtils.getCurrentDateStr()}.json`);
    dlAnchor.click();
  }, [solves]);

  // Export CSV
  const exportSolvesCSV = useCallback(() => {
    const headers = ["Solve Number", "Raw Time", "Effective Seconds", "Date", "Time", "Penalty", "Tags", "Notes", "Scramble"];
    const rows = solves.map(s => [
      s.solveNumber,
      s.formattedTime,
      s.effectiveSeconds === Infinity ? 'DNF' : s.effectiveSeconds.toFixed(2),
      s.date,
      s.timestamp,
      s.penalty,
      `"${(s.tags || []).join(';')}"`,
      `"${s.notes || ''}"`,
      `"${s.scramble}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", encodedUri);
    dlAnchor.setAttribute("download", `CubeStudio_Solves_${TimeUtils.getCurrentDateStr()}.csv`);
    dlAnchor.click();
  }, [solves]);

  // Import Solves
  const importSolvesData = useCallback((imported: Solve[]): boolean => {
    if (!Array.isArray(imported) || imported.length === 0) return false;
    setSolves(imported);
    return true;
  }, []);

  const contextValue = useMemo(() => ({
    solves,
    filteredSolves,
    stats,
    filteredStats,
    currentScramble,
    filters,
    settings,
    allTags,
    generateNewScramble,
    addSolve,
    deleteSolve,
    updatePenalty,
    updateTags,
    updateNotes,
    setFilters,
    resetFilters,
    updateSettings,
    exportSolvesJSON,
    exportSolvesCSV,
    importSolvesData,
    clearAllSolves
  }), [
    solves,
    filteredSolves,
    stats,
    filteredStats,
    currentScramble,
    filters,
    settings,
    allTags,
    generateNewScramble,
    addSolve,
    deleteSolve,
    updatePenalty,
    updateTags,
    updateNotes,
    resetFilters,
    updateSettings,
    exportSolvesJSON,
    exportSolvesCSV,
    importSolvesData,
    clearAllSolves
  ]);

  return (
    <CubeStoreContext.Provider value={contextValue}>
      {children}
    </CubeStoreContext.Provider>
  );
};

export const useCubeStore = () => {
  const context = useContext(CubeStoreContext);
  if (!context) {
    throw new Error('useCubeStore must be used within a CubeStoreProvider');
  }
  return context;
};
