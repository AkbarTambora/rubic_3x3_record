import { Solve } from '../types/solve';
import { StatsSummary } from '../types/stats';

export const StatsEngine = {
  getEffectiveTime(solve: Solve): number {
    if (solve.penalty === 'dnf') return Infinity;
    if (solve.penalty === '+2') return solve.seconds + 2.0;
    return solve.seconds;
  },

  calculateWcaAverage(timesList: number[]): number | null {
    if (!timesList || timesList.length < 3) return null;
    const dnfCount = timesList.filter(t => t === Infinity).length;
    if (dnfCount >= 2) return Infinity;

    const sorted = [...timesList].sort((a, b) => a - b);
    const trimmed = sorted.slice(1, -1);
    const sum = trimmed.reduce((a, b) => a + b, 0);
    return sum / trimmed.length;
  },

  calculateStandardDeviation(times: number[]): number {
    const valid = times.filter(t => t !== Infinity && !isNaN(t));
    if (valid.length < 2) return 0;
    const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
    const variance = valid.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / valid.length;
    return Math.sqrt(variance);
  },

  calculateTrendline(data: (number | null)[]): (number | null)[] {
    const validIndices: number[] = [];
    const validValues: number[] = [];
    data.forEach((v, i) => {
      if (v !== null && v !== Infinity && !isNaN(v)) {
        validIndices.push(i);
        validValues.push(v);
      }
    });

    if (validValues.length < 2) return [];
    const n = validValues.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += validIndices[i];
      sumY += validValues[i];
      sumXY += validIndices[i] * validValues[i];
      sumXX += validIndices[i] * validIndices[i];
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return data.map((_, i) => slope * i + intercept);
  },

  calculateMilestone(meanSeconds: number | null) {
    if (!meanSeconds || meanSeconds === Infinity || isNaN(meanSeconds)) return null;

    const tiers = [
      { target: 120, name: "Sub-2:00 (120s)", short: "Sub-2:00" },
      { target: 105, name: "Sub-1:45 (105s)", short: "Sub-1:45" },
      { target: 90,  name: "Sub-1:30 (90s)",  short: "Sub-1:30" },
      { target: 75,  name: "Sub-1:15 (75s)",  short: "Sub-1:15" },
      { target: 60,  name: "Sub-1:00 (60s)",  short: "Sub-1:00" },
      { target: 45,  name: "Sub-45s (45s)",   short: "Sub-45" },
      { target: 30,  name: "Sub-30s (30s)",   short: "Sub-30" },
      { target: 20,  name: "Sub-20s (20s)",   short: "Sub-20" }
    ];

    let currentTier = tiers[0];
    for (const tier of tiers) {
      if (meanSeconds > tier.target) {
        currentTier = tier;
        break;
      }
    }

    if (meanSeconds <= tiers[tiers.length - 1].target) {
      currentTier = tiers[tiers.length - 1];
    }

    const diff = meanSeconds - currentTier.target;
    const progress = Math.max(0, Math.min(100, Math.round((1 - (diff / (currentTier.target * 0.5))) * 100)));

    return {
      target: currentTier.target,
      name: currentTier.name,
      progressPercent: progress,
      differenceSeconds: diff,
      projectedDate: "Targeting Next Level",
      isAchieved: diff <= 0
    };
  },

  computeSummary(solvesList: Solve[]): StatsSummary {
    if (!solvesList || solvesList.length === 0) {
      return {
        totalSolves: 0,
        pbSingle: null,
        pbSolveNumber: null,
        currentSingle: null,
        bestAo5: null,
        currentAo5: null,
        bestAo12: null,
        currentAo12: null,
        sessionMean: null,
        stdDev: 0,
        dnfCount: 0,
        plusTwoCount: 0,
        milestone: null
      };
    }

    const effectiveTimes = solvesList.map(s => this.getEffectiveTime(s));
    const validTimes = effectiveTimes.filter(t => t !== Infinity);

    // Personal Best Single
    let pbSingle: number | null = null;
    let pbSolveNumber: number | null = null;
    solvesList.forEach((s) => {
      const eff = this.getEffectiveTime(s);
      if (eff !== Infinity) {
        if (pbSingle === null || eff < pbSingle) {
          pbSingle = eff;
          pbSolveNumber = s.solveNumber;
        }
      }
    });

    const currentSingle = effectiveTimes.length > 0 ? effectiveTimes[effectiveTimes.length - 1] : null;

    // Averages Ao5 & Ao12
    let bestAo5: number | null = null;
    let currentAo5: number | null = null;
    let bestAo12: number | null = null;
    let currentAo12: number | null = null;

    for (let i = 4; i < effectiveTimes.length; i++) {
      const window5 = effectiveTimes.slice(i - 4, i + 1);
      const avg5 = this.calculateWcaAverage(window5);
      if (avg5 !== null && avg5 !== Infinity) {
        if (bestAo5 === null || avg5 < bestAo5) bestAo5 = avg5;
      }
      if (i === effectiveTimes.length - 1) currentAo5 = avg5;
    }

    for (let i = 11; i < effectiveTimes.length; i++) {
      const window12 = effectiveTimes.slice(i - 11, i + 1);
      const avg12 = this.calculateWcaAverage(window12);
      if (avg12 !== null && avg12 !== Infinity) {
        if (bestAo12 === null || avg12 < bestAo12) bestAo12 = avg12;
      }
      if (i === effectiveTimes.length - 1) currentAo12 = avg12;
    }

    // Session Mean
    const sessionMean = validTimes.length > 0
      ? validTimes.reduce((a, b) => a + b, 0) / validTimes.length
      : null;

    const stdDev = this.calculateStandardDeviation(effectiveTimes);
    const dnfCount = solvesList.filter(s => s.penalty === 'dnf').length;
    const plusTwoCount = solvesList.filter(s => s.penalty === '+2').length;
    const milestone = this.calculateMilestone(sessionMean);

    return {
      totalSolves: solvesList.length,
      pbSingle,
      pbSolveNumber,
      currentSingle,
      bestAo5,
      currentAo5,
      bestAo12,
      currentAo12,
      sessionMean,
      stdDev,
      dnfCount,
      plusTwoCount,
      milestone
    };
  }
};
