import { useState, useRef, useEffect, useCallback } from 'react';
import { TimerPhase } from '../types/timer';
import { PenaltyType } from '../types/solve';
import { AudioSynth } from '../lib/audioSynth';
import { TimeUtils } from '../lib/timeUtils';
import confetti from 'canvas-confetti';

interface UseCubeTimerOptions {
  wcaInspection: boolean;
  soundAlerts: boolean;
  onSolveComplete: (seconds: number, penalty: PenaltyType) => boolean; // returns true if new PB
}

export function useCubeTimer({
  wcaInspection,
  soundAlerts,
  onSolveComplete
}: UseCubeTimerOptions) {
  const [phase, setPhase] = useState<TimerPhase>('IDLE');
  const [inspectionSecondsLeft, setInspectionSecondsLeft] = useState<number>(15);
  const [inspectionPenalty, setInspectionPenalty] = useState<PenaltyType>('none');
  const [displayTime, setDisplayTime] = useState<string>('00:00.00');

  // Keep latest options in a stable ref so event listeners don't rebind
  const optionsRef = useRef({ wcaInspection, soundAlerts, onSolveComplete });
  useEffect(() => {
    optionsRef.current = { wcaInspection, soundAlerts, onSolveComplete };
  }, [wcaInspection, soundAlerts, onSolveComplete]);

  const phaseRef = useRef<TimerPhase>('IDLE');
  const startTimeRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inspectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inspectionTimeRef = useRef<number>(15);
  const inspectionPenaltyRef = useRef<PenaltyType>('none');
  const timerDigitsDomRef = useRef<HTMLElement | null>(null);

  // Keep phaseRef synchronized
  const updatePhase = useCallback((newPhase: TimerPhase) => {
    phaseRef.current = newPhase;
    setPhase(newPhase);
  }, []);

  // Reset inspection if toggle is disabled while inspection is running
  useEffect(() => {
    if (!wcaInspection && (phaseRef.current === 'INSPECTION' || phaseRef.current === 'INSPECTION_HOLD')) {
      if (inspectionIntervalRef.current) {
        clearInterval(inspectionIntervalRef.current);
        inspectionIntervalRef.current = null;
      }
      updatePhase('IDLE');
      setInspectionSecondsLeft(15);
      inspectionTimeRef.current = 15;
      setInspectionPenalty('none');
      inspectionPenaltyRef.current = 'none';
      setDisplayTime('00:00.00');
      if (timerDigitsDomRef.current) timerDigitsDomRef.current.innerText = '00:00.00';
    }
  }, [wcaInspection, updatePhase]);

  // High precision timer loop via requestAnimationFrame
  const startTimerLoop = useCallback(() => {
    startTimeRef.current = performance.now();

    const loop = () => {
      const elapsedSec = (performance.now() - startTimeRef.current) / 1000;
      const formatted = TimeUtils.formatTimerDigits(elapsedSec);

      // Direct DOM update for 60 FPS without React re-render thrashing
      if (timerDigitsDomRef.current) {
        timerDigitsDomRef.current.innerText = formatted;
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);
  }, []);

  const stopTimer = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    const elapsedSec = (performance.now() - startTimeRef.current) / 1000;
    const finalTimeStr = TimeUtils.formatTimerDigits(elapsedSec);
    setDisplayTime(finalTimeStr);
    if (timerDigitsDomRef.current) {
      timerDigitsDomRef.current.innerText = finalTimeStr;
    }

    const appliedPenalty = inspectionPenaltyRef.current;
    updatePhase('STOPPED');

    if (optionsRef.current.soundAlerts) {
      AudioSynth.playFinishChime();
    }

    const isPB = optionsRef.current.onSolveComplete(elapsedSec, appliedPenalty);
    if (isPB) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}
    }

    // Reset inspection state
    setInspectionPenalty('none');
    inspectionPenaltyRef.current = 'none';
    setInspectionSecondsLeft(15);
    inspectionTimeRef.current = 15;
  }, [updatePhase]);

  // Inspection countdown handler
  const startInspection = useCallback(() => {
    updatePhase('INSPECTION');
    inspectionTimeRef.current = 15;
    setInspectionSecondsLeft(15);
    setInspectionPenalty('none');
    inspectionPenaltyRef.current = 'none';

    setDisplayTime('15');
    if (timerDigitsDomRef.current) {
      timerDigitsDomRef.current.innerText = '15';
    }

    if (inspectionIntervalRef.current) {
      clearInterval(inspectionIntervalRef.current);
    }

    inspectionIntervalRef.current = setInterval(() => {
      inspectionTimeRef.current -= 1;
      const t = inspectionTimeRef.current;

      if (t > 0) {
        setInspectionSecondsLeft(t);
        if (phaseRef.current === 'INSPECTION') {
          setDisplayTime(String(t));
          if (timerDigitsDomRef.current) timerDigitsDomRef.current.innerText = String(t);
        }

        // Warning alerts at 8s elapsed (t=7) and 12s elapsed (t=3)
        if (optionsRef.current.soundAlerts) {
          if (t === 7) AudioSynth.playInspection8s();
          if (t === 3) AudioSynth.playInspection12s();
        }
      } else if (t === 0) {
        // Detik 15: Penalti +2
        setInspectionPenalty('+2');
        inspectionPenaltyRef.current = '+2';
        setInspectionSecondsLeft(0);
        if (phaseRef.current === 'INSPECTION') {
          setDisplayTime('+2');
          if (timerDigitsDomRef.current) timerDigitsDomRef.current.innerText = '+2';
        }
        if (optionsRef.current.soundAlerts) AudioSynth.playPenaltyTone();
      } else if (t <= -2) {
        // Melewati detik 17: DNF
        if (inspectionIntervalRef.current) {
          clearInterval(inspectionIntervalRef.current);
          inspectionIntervalRef.current = null;
        }
        setInspectionPenalty('dnf');
        inspectionPenaltyRef.current = 'dnf';
        setDisplayTime('DNF');
        if (timerDigitsDomRef.current) timerDigitsDomRef.current.innerText = 'DNF';
        updatePhase('IDLE');
        if (optionsRef.current.soundAlerts) AudioSynth.playPenaltyTone();
      }
    }, 1000);
  }, [updatePhase]);

  const clearInspection = useCallback(() => {
    if (inspectionIntervalRef.current) {
      clearInterval(inspectionIntervalRef.current);
      inspectionIntervalRef.current = null;
    }
  }, []);

  // Hold arming: 300ms hold turns timer green (READY)
  const beginHold = useCallback(() => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
    }
    holdTimeoutRef.current = setTimeout(() => {
      updatePhase('READY');
      setDisplayTime('00:00.00');
      if (timerDigitsDomRef.current) timerDigitsDomRef.current.innerText = '00:00.00';
      if (optionsRef.current.soundAlerts) {
        AudioSynth.playReady();
      }
    }, 300);
  }, [updatePhase]);

  const cancelHold = useCallback(() => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
  }, []);

  // Trigger Down (Spacebar down or Mouse/Touch start)
  const handleTriggerDown = useCallback(() => {
    AudioSynth.unlock();
    const current = phaseRef.current;

    // 1. If currently RUNNING: Stop timer immediately
    if (current === 'RUNNING') {
      stopTimer();
      return;
    }

    // 2. If STOPPED: Reset to IDLE first
    if (current === 'STOPPED') {
      updatePhase('IDLE');
      setDisplayTime('00:00.00');
      if (timerDigitsDomRef.current) timerDigitsDomRef.current.innerText = '00:00.00';
      return;
    }

    // 3. If IDLE:
    if (current === 'IDLE') {
      if (optionsRef.current.wcaInspection) {
        // Start 15s inspection countdown
        startInspection();
      } else {
        // Start normal holding (Red -> Green in 300ms)
        updatePhase('HOLDING');
        setDisplayTime('00:00.00');
        if (timerDigitsDomRef.current) timerDigitsDomRef.current.innerText = '00:00.00';
        beginHold();
      }
      return;
    }

    // 4. If in INSPECTION:
    if (current === 'INSPECTION') {
      // Put hands on timer to get ready
      updatePhase('INSPECTION_HOLD');
      beginHold();
      return;
    }
  }, [updatePhase, stopTimer, startInspection, beginHold]);

  // Trigger Up (Spacebar up or Mouse/Touch release)
  const handleTriggerUp = useCallback(() => {
    const current = phaseRef.current;

    // 1. If released while still in HOLDING (before reaching 300ms READY):
    if (current === 'HOLDING') {
      cancelHold();
      updatePhase('IDLE');
      setDisplayTime('00:00.00');
      if (timerDigitsDomRef.current) timerDigitsDomRef.current.innerText = '00:00.00';
      return;
    }

    // 2. If released while in INSPECTION_HOLD (before reaching 300ms READY):
    if (current === 'INSPECTION_HOLD') {
      cancelHold();
      updatePhase('INSPECTION');
      const curLeft = inspectionTimeRef.current;
      const text = curLeft > 0 ? String(curLeft) : curLeft === 0 ? '+2' : 'DNF';
      setDisplayTime(text);
      if (timerDigitsDomRef.current) timerDigitsDomRef.current.innerText = text;
      return;
    }

    // 3. If released when READY (held for >= 300ms):
    if (current === 'READY') {
      cancelHold();
      clearInspection();
      updatePhase('RUNNING');
      startTimerLoop();
      return;
    }
  }, [cancelHold, updatePhase, clearInspection, startTimerLoop]);

  // Stable references for global event listeners
  const handleTriggerDownRef = useRef(handleTriggerDown);
  const handleTriggerUpRef = useRef(handleTriggerUp);
  useEffect(() => {
    handleTriggerDownRef.current = handleTriggerDown;
    handleTriggerUpRef.current = handleTriggerUp;
  });

  // Global Keyboard event listener (Bound ONCE on mount with [] dependencies!)
  useEffect(() => {
    const isInputElement = (el: EventTarget | null) => {
      if (!el || !(el instanceof HTMLElement)) return false;
      const tag = el.tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isInputElement(e.target)) return; // Allow typing spaces in inputs!

      // If timer is running, ANY key stops it
      if (phaseRef.current === 'RUNNING') {
        e.preventDefault();
        handleTriggerDownRef.current();
        return;
      }

      // Otherwise, only Spacebar triggers arming
      if (e.code === 'Space') {
        e.preventDefault(); // Prevent page scroll
        if (e.repeat) return; // Ignore key repeat while held!
        handleTriggerDownRef.current();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (isInputElement(e.target)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleTriggerUpRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
      if (inspectionIntervalRef.current) clearInterval(inspectionIntervalRef.current);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []); // Bound ONCE on mount!

  return {
    phase,
    displayTime,
    inspectionSecondsLeft,
    inspectionPenalty,
    timerDigitsDomRef,
    handleTriggerDown,
    handleTriggerUp,
    resetToIdle: () => {
      clearInspection();
      cancelHold();
      updatePhase('IDLE');
      setDisplayTime('00:00.00');
      if (timerDigitsDomRef.current) timerDigitsDomRef.current.innerText = '00:00.00';
    }
  };
}
