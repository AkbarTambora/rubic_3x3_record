import React, { useEffect, useRef } from 'react';
import { RubikEngine } from '../../lib/rubikEngine';

interface ScrambleNet2DProps {
  scramble: string;
}

export const ScrambleNet2D: React.FC<ScrambleNet2DProps> = ({ scramble }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      RubikEngine.render2DNet(canvasRef.current, scramble);
    }
  }, [scramble]);

  return (
    <div className="relative flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 shadow-inner">
      <div className="flex items-center justify-between w-full px-2 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
        <span>2D Cube Net</span>
        <span className="text-slate-500 font-mono">WCA Scramble</span>
      </div>
      <canvas
        ref={canvasRef}
        width={195}
        height={145}
        className="rounded shadow-sm cursor-default"
        title="Unfolded 3x3 Cube Net Simulation"
      />
    </div>
  );
};
