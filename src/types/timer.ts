export type TimerPhase = 
  | 'IDLE' 
  | 'HOLDING' 
  | 'READY' 
  | 'INSPECTION' 
  | 'INSPECTION_HOLD'
  | 'RUNNING' 
  | 'STOPPED';

export interface TimerState {
  phase: TimerPhase;
  inspectionSecondsLeft: number;
  inspectionPenalty: 'none' | '+2' | 'dnf';
}
