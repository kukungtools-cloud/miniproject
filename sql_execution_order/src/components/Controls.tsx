import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sliders, Command, Volume2, VolumeX } from 'lucide-react';
import type { PlaybackSpeed } from '../types/sql';
import { STEPS_PIPELINE } from '../data/stepsPipeline';

interface ControlsProps {
  isPlaying?: boolean;
  currentStepIndex: number;
  speed?: PlaybackSpeed;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onReset: () => void;
  onSelectStep: (idx: number) => void;
  onSetSpeed?: (speed: PlaybackSpeed) => void;
}

export const Controls: React.FC<ControlsProps> = ({
  currentStepIndex,
  isMuted = false,
  onToggleMute,
  onTogglePlay,
  onNext,
  onPrev,
  onReset,
  onSelectStep,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        onTogglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        onNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        onPrev();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        onReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTogglePlay, onNext, onPrev, onReset]);

  return (
    <div className="w-full h-full rounded-xl glass-card border border-white/10 shadow-lg p-2.5 backdrop-blur-xl flex flex-col justify-between gap-1.5 shrink-0 select-none">
      {/* Top Header Row: Title & SFX Toggle */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-1.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <span className="text-[13.5px] sm:text-[14px] font-bold text-slate-100 font-mono tracking-tight">
            ENGINE CONTROLS
          </span>
          <span className="text-[11.5px] font-mono text-slate-400">
            Step {currentStepIndex + 1}/7
          </span>
        </div>

        {/* Audio SFX Toggle */}
        {onToggleMute && (
          <button
            onClick={onToggleMute}
            className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold flex items-center gap-1 border transition-all ${
              isMuted
                ? 'bg-slate-900 text-slate-500 border-white/[0.05] hover:text-slate-300'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
            }`}
            title={isMuted ? 'Aktifkan Audio SFX' : 'Bisukan Audio SFX'}
          >
            {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            <span>{isMuted ? 'MUTED' : 'SFX ON'}</span>
          </button>
        )}
      </div>

      {/* Middle: Stepper Scrubber Progress Bar */}
      <div className="flex items-center justify-between gap-1.5 px-1 py-1 shrink-0">
        {STEPS_PIPELINE.map((step, idx) => {
          const isActive = idx === currentStepIndex;
          const isDone = idx < currentStepIndex;

          return (
            <button
              key={step.id}
              onClick={() => onSelectStep(idx)}
              className="flex-1 flex flex-col items-center gap-1.5 focus:outline-none group py-1 rounded hover:bg-white/[0.02] transition-colors"
              title={`Jump ke Step ${idx + 1}: ${step.stepKey}`}
            >
              <div className="w-full h-2 rounded-full overflow-hidden bg-slate-800 relative">
                <motion.div
                  className={`h-full w-full transition-colors ${
                    isActive
                      ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.9)]'
                      : isDone
                      ? 'bg-emerald-500'
                      : 'bg-transparent group-hover:bg-slate-700'
                  }`}
                  layout
                />
              </div>
              <span className={`text-[10px] sm:text-[10.5px] font-mono font-bold transition-colors ${
                isActive
                  ? 'text-blue-400 font-bold scale-105'
                  : isDone
                  ? 'text-emerald-400'
                  : 'text-slate-400 group-hover:text-slate-200'
              }`}>
                {step.stepKey}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom: Keyboard Shortcut Hint */}
      <div className="flex items-center justify-between gap-2 px-1 pt-1 border-t border-white/[0.06] shrink-0 font-mono text-[10.5px] sm:text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Command className="w-3 h-3 text-blue-400" />
          <span className="font-semibold text-slate-300">Shortcuts:</span>
        </div>
        <div className="flex items-center gap-2">
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/10 text-slate-300 text-[10px]">Space</kbd> Play</span>
          <span>•</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/10 text-slate-300 text-[10px]">←</kbd> <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/10 text-slate-300 text-[10px]">→</kbd> Step</span>
          <span>•</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/10 text-slate-300 text-[10px]">R</kbd> Reset</span>
        </div>
      </div>
    </div>
  );
};
