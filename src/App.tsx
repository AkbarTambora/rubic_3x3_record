import React, { useState } from 'react';
import { CubeStoreProvider, useCubeStore } from './hooks/useCubeStore';
import { useCubeTimer } from './hooks/useCubeTimer';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { ScrambleBanner } from './components/scramble/ScrambleBanner';
import { ScrambleNet2D } from './components/scramble/ScrambleNet2D';
import { TimerDisplay } from './components/timer/TimerDisplay';
import { TimerSettings } from './components/timer/TimerSettings';
import { TelemetryHUD } from './components/telemetry/TelemetryHUD';
import { MilestoneCard } from './components/telemetry/MilestoneCard';
import { PerformanceChart } from './components/telemetry/PerformanceChart';
import { LedgerFilterBar } from './components/ledger/LedgerFilterBar';
import { LedgerTable } from './components/ledger/LedgerTable';
import { ManualSolveModal } from './components/ledger/ManualSolveModal';
import { BackupRestoreModal } from './components/ledger/BackupRestoreModal';
import { PenaltyType } from './types/solve';

const AppContent: React.FC = () => {
  const {
    currentScramble,
    settings,
    addSolve
  } = useCubeStore();

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  const handleSolveComplete = React.useCallback((seconds: number, penalty: PenaltyType) => {
    const recorded = addSolve(seconds, penalty);
    return Boolean(recorded.isPB);
  }, [addSolve]);

  // Hook decoupled timer
  const timer = useCubeTimer({
    wcaInspection: settings.wcaInspection,
    soundAlerts: settings.soundAlerts,
    onSolveComplete: handleSolveComplete
  });

  return (
    <div className="min-h-screen flex flex-col bg-background text-slate-100">
      {/* Sticky Header */}
      <Header
        onOpenManualModal={() => setIsManualModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Scramble Row with optional 2D Canvas Net */}
        <section className="space-y-3">
          <ScrambleBanner />
          {settings.show2DNet && (
            <div className="flex justify-center animate-in fade-in zoom-in-95 duration-200">
              <ScrambleNet2D scramble={currentScramble} />
            </div>
          )}
        </section>

        {/* Speedcubing Timer Area */}
        <section className="space-y-3">
          <TimerDisplay
            phase={timer.phase}
            displayTime={timer.displayTime}
            inspectionSecondsLeft={timer.inspectionSecondsLeft}
            inspectionPenalty={timer.inspectionPenalty}
            timerDigitsDomRef={timer.timerDigitsDomRef as React.RefObject<HTMLHeadingElement>}
            onTouchStart={timer.handleTriggerDown}
            onTouchEnd={timer.handleTriggerUp}
          />
          <TimerSettings />
        </section>

        {/* Telemetry Analytics HUD */}
        <section className="space-y-4">
          <TelemetryHUD />
          <MilestoneCard />
        </section>

        {/* Performance Diagram */}
        <section>
          <PerformanceChart />
        </section>

        {/* Solve History Ledger & Filters */}
        <section className="space-y-3">
          <LedgerFilterBar />
          <LedgerTable />
        </section>
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals */}
      <ManualSolveModal
        open={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSubmit={(sec, pen, tags, notes) => {
          addSolve(sec, pen, tags, notes);
        }}
      />

      <BackupRestoreModal
        open={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <CubeStoreProvider>
      <AppContent />
    </CubeStoreProvider>
  );
}
