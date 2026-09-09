import { useState, useEffect, useCallback, useRef } from 'react';
import { STEPS_PIPELINE } from '../data/stepsPipeline';
import type { PlaybackSpeed, TableRow, AudioSoundType, ExecutionStep } from '../types/sql';
import confetti from 'canvas-confetti';

interface UseSqlPlayerProps {
  pipeline?: ExecutionStep[];
  onPlaySound?: (type: AudioSoundType) => void;
}

export function useSqlPlayer({ pipeline, onPlaySound }: UseSqlPlayerProps = {}) {
  const activePipeline = pipeline && pipeline.length > 0 ? pipeline : STEPS_PIPELINE;

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('step');
      if (p !== null) {
        const parsed = parseInt(p, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed < activePipeline.length) {
          return parsed;
        }
      }
    }
    return 0;
  });
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [subPhase, setSubPhase] = useState<'evaluating' | 'committed'>('committed');
  const [currentRows, setCurrentRows] = useState<TableRow[]>(() => {
    const p = typeof window !== 'undefined' ? parseInt(new URLSearchParams(window.location.search).get('step') || '0', 10) : 0;
    const validIdx = !isNaN(p) && p >= 0 && p < activePipeline.length ? p : 0;
    return activePipeline[validIdx].getRows().resultRows;
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subPhaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const safeIdx = Math.min(currentStepIndex, activePipeline.length - 1);
  const currentStep = activePipeline[safeIdx] || activePipeline[0];

  // Base timings in ms
  const baseStepDuration = 3400;
  const stepDuration = baseStepDuration / speed;
  const evalDuration = 1000 / speed;

  const loadStep = useCallback((stepIdx: number, playInitialAudio = true) => {
    const targetIdx = Math.min(Math.max(0, stepIdx), activePipeline.length - 1);
    const step = activePipeline[targetIdx];

    if (subPhaseTimerRef.current) {
      clearTimeout(subPhaseTimerRef.current);
      subPhaseTimerRef.current = null;
    }

    // Step 1: FROM (instant committed, simple scan sound)
    if (step.stepKey === 'FROM') {
      setSubPhase('committed');
      setCurrentRows(step.getRows().resultRows);
      if (playInitialAudio) onPlaySound?.('scan');
      return;
    }

    // Step 5: SELECT (column projection, quick transition)
    if (step.stepKey === 'SELECT') {
      setSubPhase('evaluating');
      setCurrentRows(step.getRows().evaluatingRows);
      if (playInitialAudio) onPlaySound?.('scan');

      subPhaseTimerRef.current = setTimeout(() => {
        setSubPhase('committed');
        setCurrentRows(step.getRows().resultRows);
      }, evalDuration * 0.5);
      return;
    }

    // Step 6: ORDER BY (FLIP reordering with sort arpeggio)
    if (step.stepKey === 'ORDER_BY') {
      setSubPhase('evaluating');
      setCurrentRows(step.getRows().evaluatingRows);
      if (playInitialAudio) onPlaySound?.('scan');

      subPhaseTimerRef.current = setTimeout(() => {
        setSubPhase('committed');
        setCurrentRows(step.getRows().resultRows);
        onPlaySound?.('sort');
      }, evalDuration * 0.4);
      return;
    }

    // Steps with visual elimination / merge: WHERE, GROUP_BY, HAVING, LIMIT
    setSubPhase('evaluating');
    setCurrentRows(step.getRows().evaluatingRows);
    if (playInitialAudio) onPlaySound?.('scan');

    subPhaseTimerRef.current = setTimeout(() => {
      setSubPhase('committed');
      setCurrentRows(step.getRows().resultRows);

      // Trigger action audio EXACTLY when rows filter, drop, merge, or slice!
      if (step.stepKey === 'WHERE' || step.stepKey === 'HAVING') {
        onPlaySound?.('filter');
      } else if (step.stepKey === 'GROUP_BY') {
        onPlaySound?.('merge');
      } else if (step.stepKey === 'LIMIT') {
        onPlaySound?.('filter');
        setTimeout(() => {
          onPlaySound?.('success');
          try {
            confetti({
              particleCount: 60,
              spread: 60,
              origin: { y: 0.6 },
              colors: ['#3B82F6', '#10B981', '#F59E0B', '#6366F1'],
            });
          } catch {
            // ignore
          }
        }, 220 / speed);
      }
    }, evalDuration);
  }, [evalDuration, speed, onPlaySound, activePipeline]);

  const goToStep = useCallback((index: number) => {
    if (index < 0 || index >= activePipeline.length) return;
    setCurrentStepIndex(index);
    loadStep(index, true);
  }, [loadStep, activePipeline.length]);

  const nextStep = useCallback(() => {
    if (currentStepIndex < activePipeline.length - 1) {
      goToStep(currentStepIndex + 1);
    } else {
      setIsPlaying(false);
    }
  }, [currentStepIndex, goToStep, activePipeline.length]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      goToStep(currentStepIndex - 1);
    }
  }, [currentStepIndex, goToStep]);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => {
      if (!prev && currentStepIndex === activePipeline.length - 1) {
        goToStep(0);
        return true;
      }
      return !prev;
    });
  }, [currentStepIndex, goToStep, activePipeline.length]);

  const reset = useCallback(() => {
    setIsPlaying(false);
    goToStep(0);
  }, [goToStep]);

  // Initial load without auto-playing audio or when pipeline changes
  useEffect(() => {
    loadStep(0, false);
    setCurrentStepIndex(0);
    return () => {
      if (subPhaseTimerRef.current) clearTimeout(subPhaseTimerRef.current);
    };
  }, [pipeline]);

  // Auto-play timer loop
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    timerRef.current = setTimeout(() => {
      if (currentStepIndex < activePipeline.length - 1) {
        goToStep(currentStepIndex + 1);
      } else {
        setIsPlaying(false);
      }
    }, stepDuration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStepIndex, stepDuration, goToStep, activePipeline.length]);

  return {
    currentStepIndex,
    currentStep,
    currentRows,
    currentColumns: currentStep.columns,
    subPhase,
    isPlaying,
    speed,
    setSpeed,
    goToStep,
    nextStep,
    prevStep,
    togglePlay,
    reset,
    totalSteps: activePipeline.length,
    isFirstStep: currentStepIndex === 0,
    isLastStep: currentStepIndex === activePipeline.length - 1,
  };
}
