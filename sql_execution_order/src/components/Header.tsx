import { motion } from 'framer-motion';
import {
  Database,
  Volume2,
  VolumeX,
  BookOpen,
  RotateCcw,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Zap,
  Code2,
  X,
} from 'lucide-react';
import type { ExecutionStep, PlaybackSpeed } from '../types/sql';

interface HeaderProps {
  currentStep?: ExecutionStep;
  currentStepIndex: number;
  totalSteps?: number;
  isPlaying: boolean;
  speed: PlaybackSpeed;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenCheatSheet: () => void;
  onReset: () => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSetSpeed: (speed: PlaybackSpeed) => void;
  isEditingSql?: boolean;
  onToggleEditSql?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentStepIndex,
  totalSteps = 7,
  isPlaying,
  speed,
  isMuted,
  onToggleMute,
  onOpenCheatSheet,
  onReset,
  onTogglePlay,
  onNext,
  onPrev,
  onSetSpeed,
  isEditingSql = false,
  onToggleEditSql,
}) => {
  return (
    <header className="w-full h-12 sm:h-13 px-2.5 sm:px-4 border-b border-white/[0.08] bg-slate-950/85 backdrop-blur-xl flex items-center justify-between gap-2 shrink-0 z-30 select-none">
      {/* Left: Brand Logo & Title */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-500 to-emerald-400 p-0.5 shadow-md shadow-blue-500/20 shrink-0">
          <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
            <Database className="w-3.5 h-3.5 text-blue-400" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs sm:text-sm text-white tracking-tight hidden xs:inline">
            SQL Execution Order
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 hidden md:inline-block">
            Engine Visualizer
          </span>
        </div>
      </div>

      {/* Center: Playback Controls & Speed Selector */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Playback Buttons Group */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onReset}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 transition-colors shadow-sm"
            title="Reset ke Langkah 1 (R)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onPrev}
            disabled={currentStepIndex === 0}
            className={`p-1.5 rounded-lg border transition-all ${
              currentStepIndex === 0
                ? 'bg-slate-950/40 border-white/[0.04] text-slate-600 cursor-not-allowed'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-white/10 shadow-sm'
            }`}
            title="Step Sebelumnya (←)"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onTogglePlay}
            className={`px-2.5 sm:px-3.5 py-1 rounded-lg font-bold text-xs font-mono tracking-wider flex items-center gap-1.5 shadow-md transition-all ${
              isPlaying
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/20 ring-1 ring-amber-400/40'
                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/25 ring-1 ring-blue-400/30'
            }`}
            title="Toggle Auto Play (Spasi)"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span className="text-[11px] sm:text-[12px] font-bold">PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                <span className="text-[11px] sm:text-[12px] font-bold">AUTO PLAY</span>
              </>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNext}
            disabled={currentStepIndex === totalSteps - 1}
            className={`p-1.5 rounded-lg border transition-all ${
              currentStepIndex === totalSteps - 1
                ? 'bg-slate-950/40 border-white/[0.04] text-slate-600 cursor-not-allowed'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-white/10 shadow-sm'
            }`}
            title="Step Selanjutnya (→)"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </motion.button>
        </div>

        {/* Speed Selector Group */}
        <div className="flex items-center gap-0.5 sm:gap-1 p-0.5 rounded-lg bg-slate-900 border border-white/10 shadow-inner">
          <span className="text-[10.5px] sm:text-[11px] font-mono text-slate-400 px-1 items-center gap-0.5 font-medium hidden sm:flex">
            <Zap className="w-3 h-3 text-amber-400" />
            Speed:
          </span>
          {([0.5, 1, 2] as PlaybackSpeed[]).map((s) => (
            <button
              key={s}
              onClick={() => onSetSpeed(s)}
              className={`px-1.5 py-0.5 rounded text-[10.5px] sm:text-[11px] font-mono font-bold transition-all ${
                speed === s
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Right: Actions (Custom SQL, Cheat Sheet, Audio SFX) */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {onToggleEditSql && (
          <button
            onClick={onToggleEditSql}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all border ${
              isEditingSql
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30 shadow-[0_0_8px_rgba(244,63,94,0.25)]'
                : 'bg-blue-600/20 text-blue-300 border-blue-500/40 hover:bg-blue-600/30 hover:text-white'
            }`}
            title={isEditingSql ? 'Tutup Edit SQL' : 'Kustomisasi Query SQL'}
          >
            {isEditingSql ? (
              <>
                <X className="w-3.5 h-3.5" />
                <span>Close</span>
              </>
            ) : (
              <>
                <Code2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Custom SQL</span>
              </>
            )}
          </button>
        )}

        <button
          onClick={onOpenCheatSheet}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 text-[11px] font-medium transition-all"
          title="Lihat Komparasi Urutan Tulis vs Eksekusi"
        >
          <BookOpen className="w-3 h-3 text-blue-400" />
          <span className="hidden md:inline">Written vs Engine</span>
        </button>

        <button
          onClick={onToggleMute}
          className={`p-1.5 rounded-lg border transition-all ${
            isMuted
              ? 'bg-slate-900 text-slate-500 border-white/[0.05]'
              : 'bg-slate-900 hover:bg-slate-800 text-emerald-400 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
          }`}
          title={isMuted ? 'Aktifkan Efek Suara' : 'Bisukan Suara'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </header>
  );
};
