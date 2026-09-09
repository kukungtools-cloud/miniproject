import { motion, AnimatePresence } from 'framer-motion';
import type { ExecutionStep } from '../types/sql';
import { HelpCircle, Cpu, AlertTriangle } from 'lucide-react';

interface ExplanationCardProps {
  currentStep: ExecutionStep;
}

export const ExplanationCard: React.FC<ExplanationCardProps> = ({ currentStep }) => {
  return (
    <div className="w-full h-full rounded-xl glass-card border border-white/10 shadow-lg p-2.5 backdrop-blur-xl flex flex-col justify-between min-h-0">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col justify-between h-full gap-1.5"
        >
          {/* Card Title & Clause Badge */}
          <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-1.5 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                Step {currentStep.id}/7
              </span>
              <h2 className="text-[13.5px] sm:text-[14.5px] font-bold text-slate-100 truncate">
                {currentStep.label}: <span className="text-emerald-400 font-normal">{currentStep.subtitle}</span>
              </h2>
            </div>

            <div className="px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-[11.5px] font-mono text-cyan-300 shadow-inner shrink-0">
              {currentStep.clause}
            </div>
          </div>

          {/* Core Description */}
          <p className="text-[12.5px] sm:text-[13px] text-slate-300 leading-snug font-sans shrink-0 py-0.5">
            {currentStep.description}
          </p>

          {/* Under The Hood Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 flex-1 min-h-0 pt-0.5">
            {/* Why this order */}
            <div className="p-2 rounded-lg bg-slate-900/60 border border-white/[0.06] flex flex-col gap-1 justify-start">
              <div className="flex items-center gap-1 text-[11.5px] font-bold text-amber-300 font-mono shrink-0">
                <HelpCircle className="w-3 h-3" />
                <span>Kenapa Urutan Ini?</span>
              </div>
              <p className="text-[11.5px] text-slate-400 leading-snug">
                {currentStep.explanation.whyOrder}
              </p>
            </div>

            {/* Engine action */}
            <div className="p-2 rounded-lg bg-slate-900/60 border border-white/[0.06] flex flex-col gap-1 justify-start">
              <div className="flex items-center gap-1 text-[11.5px] font-bold text-blue-300 font-mono shrink-0">
                <Cpu className="w-3 h-3" />
                <span>Aksi Query Engine</span>
              </div>
              <p className="text-[11.5px] text-slate-400 leading-snug">
                {currentStep.explanation.engineAction}
              </p>
            </div>

            {/* Pitfall avoided */}
            <div className="p-2 rounded-lg bg-slate-900/60 border border-white/[0.06] flex flex-col gap-1 justify-start">
              <div className="flex items-center gap-1 text-[11.5px] font-bold text-rose-300 font-mono shrink-0">
                <AlertTriangle className="w-3 h-3" />
                <span>Jebakan SQL Terhindar</span>
              </div>
              <p className="text-[11.5px] text-slate-400 leading-snug">
                {currentStep.explanation.pitfallAvoided}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
