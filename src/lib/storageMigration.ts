import { Solve } from '../types/solve';
import { TimeUtils } from './timeUtils';

export const INITIAL_DEFAULT_SOLVES: Solve[] = [
  { id: 1, solveNumber: 1, seconds: 134.00, formattedTime: "02:14.00", effectiveSeconds: 134.00, date: "2026-10-01", timestamp: "14:10:22", notes: "Session 1", scramble: "D2 R2 F2 U L2 U' B2 D' R2 F2 U' L2 U2 B' R D F2 R2 B' L'", penalty: "none", tags: ["Session 1"] },
  { id: 2, solveNumber: 2, seconds: 111.24, formattedTime: "01:51.24", effectiveSeconds: 111.24, date: "2026-10-01", timestamp: "14:15:45", notes: "Session 1", scramble: "U2 F2 D' B2 L2 B2 D F2 U' R2 U' L' D2 B' R' F D' L B' U", penalty: "none", tags: ["Session 1"] },
  { id: 3, solveNumber: 3, seconds: 122.91, formattedTime: "02:02.91", effectiveSeconds: 122.91, date: "2026-10-01", timestamp: "14:21:03", notes: "Session 1", scramble: "B2 L2 D2 R2 U2 B2 F2 D' F2 U' R' B' D F2 L D' R2 U' F", penalty: "none", tags: ["Session 1"] },
  { id: 4, solveNumber: 4, seconds: 120.02, formattedTime: "02:00.02", effectiveSeconds: 120.02, date: "2026-10-01", timestamp: "14:26:18", notes: "Session 1", scramble: "L2 B2 D2 R2 U' L2 D B2 D' F2 L' B R' U' L2 F' D2 L' U' B", penalty: "none", tags: ["Session 1"] },
  { id: 5, solveNumber: 5, seconds: 112.31, formattedTime: "01:52.31", effectiveSeconds: 112.31, date: "2026-10-01", timestamp: "14:30:50", notes: "Session 1", scramble: "R2 F2 U' B2 D' L2 D' B2 U' F2 R' B' L' D F' R2 U2 B' L' F", penalty: "none", tags: ["Session 1"] },
  { id: 6, solveNumber: 6, seconds: 112.12, formattedTime: "01:52.12", effectiveSeconds: 112.12, date: "2026-10-01", timestamp: "14:35:12", notes: "Session 1", scramble: "F2 D2 L2 U2 B2 R2 D' F2 U' B2 R D' L2 F' D2 R' F2 L' U' R", penalty: "none", tags: ["Session 1"] },
  { id: 7, solveNumber: 7, seconds: 107.94, formattedTime: "01:47.94", effectiveSeconds: 107.94, date: "2026-10-02", timestamp: "19:05:30", notes: "Session 2", scramble: "U2 L2 B2 D2 R2 U B2 D' F2 L2 U' R' D2 F' R2 B' L D2 F'", penalty: "none", tags: ["Session 2"] },
  { id: 8, solveNumber: 8, seconds: 120.75, formattedTime: "02:00.75", effectiveSeconds: 120.75, date: "2026-10-02", timestamp: "19:11:14", notes: "Session 2", scramble: "D2 B2 L2 U' R2 U' B2 U2 F2 D' L' U2 F' R' D' F2 L2 B2 U", penalty: "none", tags: ["Session 2"] },
  { id: 9, solveNumber: 9, seconds: 103.62, formattedTime: "01:43.62", effectiveSeconds: 103.62, date: "2026-10-02", timestamp: "19:16:40", notes: "Session 2", scramble: "R2 U2 F2 D' L2 U' B2 D' F2 L2 R' B D2 R2 F' U' L' B' D2", penalty: "none", tags: ["Session 2"] },
  { id: 10, solveNumber: 10, seconds: 88.62, formattedTime: "01:28.62", effectiveSeconds: 88.62, date: "2026-10-02", timestamp: "19:22:05", notes: "Smooth F2L", scramble: "B2 D2 R2 F2 U' L2 U' B2 D' F2 U L' D2 B' R F D' L B' U", penalty: "none", tags: ["Smooth F2L", "Session 2"], isPB: true },
  { id: 11, solveNumber: 11, seconds: 93.34, formattedTime: "01:33.34", effectiveSeconds: 93.34, date: "2026-10-02", timestamp: "19:28:50", notes: "Session 2", scramble: "L2 U2 F2 D2 R2 U' B2 D' L2 U' R' B' D F2 L D' R2 U' F", penalty: "none", tags: ["Session 2"] },
  { id: 12, solveNumber: 12, seconds: 110.42, formattedTime: "01:50.42", effectiveSeconds: 110.42, date: "2026-10-02", timestamp: "19:35:10", notes: "Session 2", scramble: "F2 R2 U' B2 D' L2 D' B2 U' F2 R' B' L' D F' R2 U2 B' L'", penalty: "none", tags: ["Session 2"] },
  { id: 13, solveNumber: 13, seconds: 110.66, formattedTime: "01:50.66", effectiveSeconds: 110.66, date: "2026-10-03", timestamp: "20:10:05", notes: "Session 3", scramble: "U2 F2 D' B2 L2 B2 D F2 U' R2 U' L' D2 B' R' F D' L B' U", penalty: "none", tags: ["Session 3"] },
  { id: 14, solveNumber: 14, seconds: 104.40, formattedTime: "01:44.40", effectiveSeconds: 104.40, date: "2026-10-03", timestamp: "20:16:22", notes: "Session 3", scramble: "D2 B2 L2 U' R2 U' B2 U2 F2 D' L' U2 F' R' D' F2 L2 B2 U", penalty: "none", tags: ["Session 3"] },
  { id: 15, solveNumber: 15, seconds: 112.57, formattedTime: "01:52.57", effectiveSeconds: 112.57, date: "2026-10-03", timestamp: "20:22:40", notes: "Session 3", scramble: "R2 F2 U' B2 D' L2 D' B2 U' F2 R' B' L' D F' R2 U2 B' L'", penalty: "none", tags: ["Session 3"] },
  { id: 16, solveNumber: 16, seconds: 149.44, formattedTime: "02:29.44", effectiveSeconds: 149.44, date: "2026-10-03", timestamp: "20:28:15", notes: "Lockup", scramble: "B2 L2 D2 R2 U2 B2 F2 D' F2 U' R' B' D F2 L D' R2 U' F", penalty: "none", tags: ["Lockup", "Session 3"] }
];

export const StorageMigration = {
  CURRENT_STORAGE_KEY: 'cubestudio_react_v1',

  loadInitialSolves(): Solve[] {
    if (typeof window === 'undefined') return INITIAL_DEFAULT_SOLVES;

    try {
      // 1. Try React state storage first
      const savedReact = localStorage.getItem(this.CURRENT_STORAGE_KEY);
      if (savedReact) {
        const parsed = JSON.parse(savedReact);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }

      // 2. Try migrating legacy v5 state
      const legacyKeys = ['cubestudio_app_state_v5', 'cubestudio_app_state_v4', 'cubestudio_app_state_v3', 'cubestudio_solves'];
      for (const key of legacyKeys) {
        const legacyData = localStorage.getItem(key);
        if (legacyData) {
          const parsed = JSON.parse(legacyData);
          let rawSolves: any[] = [];
          if (parsed.sessions && parsed.activeSessionId && parsed.sessions[parsed.activeSessionId]) {
            rawSolves = parsed.sessions[parsed.activeSessionId].solves || [];
          } else if (Array.isArray(parsed)) {
            rawSolves = parsed;
          }

          if (rawSolves.length > 0) {
            const migratedSolves: Solve[] = rawSolves.map((s, idx) => {
              const seconds = typeof s.seconds === 'number' ? s.seconds : TimeUtils.parseSmartTime(s.raw || '') || 0;
              const penalty = s.penalty === '+2' || s.penalty === 'dnf' ? s.penalty : 'none';
              const effSec = penalty === 'dnf' ? Infinity : penalty === '+2' ? seconds + 2 : seconds;
              const tags = Array.isArray(s.tags) ? s.tags : s.notes ? [s.notes] : [];

              return {
                id: s.id || idx + 1,
                solveNumber: s.solveNumber || idx + 1,
                seconds,
                formattedTime: TimeUtils.formatTimerDigits(seconds),
                effectiveSeconds: effSec,
                date: s.date || TimeUtils.getCurrentDateStr(),
                timestamp: s.time || s.timestamp || '00:00:00',
                scramble: s.scramble || '',
                penalty,
                tags,
                notes: s.notes || '',
                isPB: s.id === 10 || s.isPB || false
              };
            });

            // Save migrated state to new storage key
            localStorage.setItem(this.CURRENT_STORAGE_KEY, JSON.stringify(migratedSolves));
            return migratedSolves;
          }
        }
      }
    } catch (e) {
      console.warn("Storage migration error, falling back to defaults", e);
    }

    // 3. Fallback to default solves
    return INITIAL_DEFAULT_SOLVES;
  },

  persistSolves(solves: Solve[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.CURRENT_STORAGE_KEY, JSON.stringify(solves));
    } catch (e) {
      console.error("Failed to persist solves", e);
    }
  }
};
