export interface Milestone {
  target: number;
  name: string;
  short: string;
}

export interface StatsSummary {
  totalSolves: number;
  pbSingle: number | null;
  pbSolveNumber: number | null;
  currentSingle: number | null;
  bestAo5: number | null;
  currentAo5: number | null;
  bestAo12: number | null;
  currentAo12: number | null;
  sessionMean: number | null;
  stdDev: number;
  dnfCount: number;
  plusTwoCount: number;
  milestone: {
    target: number;
    name: string;
    progressPercent: number;
    differenceSeconds: number;
    projectedDate: string;
    isAchieved: boolean;
  } | null;
}
