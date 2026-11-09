import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Activity, LineChart as ChartIcon } from 'lucide-react';
import { useCubeStore } from '../../hooks/useCubeStore';
import { StatsEngine } from '../../lib/statsEngine';
import { TimeUtils } from '../../lib/timeUtils';

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const PerformanceChart: React.FC = () => {
  const { filteredSolves, filteredStats } = useCubeStore();

  // For chart x-axis, always sort chronologically by solveNumber ascending
  const chronologicalSolves = useMemo(() => {
    return [...filteredSolves].sort((a, b) => a.solveNumber - b.solveNumber);
  }, [filteredSolves]);

  const chartData = useMemo(() => {
    const labels = chronologicalSolves.map(s => `#${s.solveNumber}`);
    const singleTimes = chronologicalSolves.map(s => {
      const eff = StatsEngine.getEffectiveTime(s);
      return eff === Infinity ? null : eff;
    });

    // Compute rolling Ao5
    const ao5Times = chronologicalSolves.map((_, i) => {
      if (i < 4) return null;
      const window = chronologicalSolves.slice(i - 4, i + 1).map(s => StatsEngine.getEffectiveTime(s));
      const avg = StatsEngine.calculateWcaAverage(window);
      return avg === Infinity ? null : avg;
    });

    // Compute linear regression trendline
    const trendline = StatsEngine.calculateTrendline(singleTimes);

    return {
      labels,
      datasets: [
        {
          label: 'Single Solve Time (s)',
          data: singleTimes,
          borderColor: '#38bdf8', // Sky 400
          backgroundColor: 'rgba(56, 189, 248, 0.08)',
          fill: true,
          tension: 0.25,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#38bdf8',
          borderWidth: 2,
        },
        {
          label: 'Rolling Ao5 Average (s)',
          data: ao5Times,
          borderColor: '#34d399', // Emerald 400
          borderWidth: 2.2,
          borderDash: [5, 5],
          pointRadius: 3,
          tension: 0.3,
          pointBackgroundColor: '#34d399',
        },
        {
          label: 'Linear Progress Trendline',
          data: trendline,
          borderColor: 'rgba(168, 85, 247, 0.7)', // Purple 500
          borderWidth: 1.5,
          borderDash: [3, 3],
          pointRadius: 0,
          fill: false,
        }
      ]
    };
  }, [chronologicalSolves]);

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 11 },
          usePointStyle: true,
          boxWidth: 8,
          padding: 16
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1,
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        padding: 10,
        callbacks: {
          label: function (context) {
            const rawVal = context.parsed.y;
            if (rawVal === null || isNaN(rawVal)) return `${context.dataset.label}: N/A`;
            return `${context.dataset.label}: ${TimeUtils.formatTimerDigits(rawVal)} (${rawVal.toFixed(2)}s)`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        ticks: { color: '#64748b', font: { family: 'Fira Code', size: 10 } }
      },
      y: {
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        ticks: {
          color: '#64748b',
          font: { family: 'Fira Code', size: 10 },
          callback: function (val) {
            return TimeUtils.formatTimerDigits(Number(val));
          }
        }
      }
    }
  };

  return (
    <Card className="border-slate-800/80 bg-slate-900/50 backdrop-blur-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-semibold text-slate-200">
          <ChartIcon className="w-4 h-4 text-sky-400" />
          <span>Performance Telemetry Diagram</span>
        </CardTitle>
        <span className="text-xs text-slate-400 font-mono">
          {chronologicalSolves.length} points plotted
        </span>
      </CardHeader>
      <CardContent>
        <div className="h-64 sm:h-72 w-full pt-2">
          {chronologicalSolves.length > 0 ? (
            <Line data={chartData} options={options} />
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              No solves match current filter criteria.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
