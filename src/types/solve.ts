export type PenaltyType = 'none' | '+2' | 'dnf';

export interface Solve {
  id: string | number;
  solveNumber: number;
  seconds: number;
  formattedTime: string;
  effectiveSeconds: number;
  date: string;       // YYYY-MM-DD
  timestamp: string;  // HH:MM:SS or full ISO
  scramble: string;
  penalty: PenaltyType;
  tags: string[];
  notes?: string;
  isPB?: boolean;
}

export interface AppSettings {
  wcaInspection: boolean;
  soundAlerts: boolean;
  show2DNet: boolean;
  theme: 'dark';
}
