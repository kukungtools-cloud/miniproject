import { motion } from 'framer-motion';
import { STEPS_PIPELINE } from '../data/stepsPipeline';
import type { ExecutionStep } from '../types/sql';
import { CheckCircle2, ChevronRight, Activity } from 'lucide-react';

interface ExecutionPlanProps {
  currentStepIndex: number;
  onSelectStep: (index: number) => void;
  pipeline?: ExecutionStep[];
}

export const ExecutionPlan: React.FC<ExecutionPlanProps> = ({
  currentStepIndex,
  onSelectStep,
  pipeline,
}) => {
  const steps = pipeline && pipeline.length > 0 ? pipeline : STEPS_PIPELINE;

  return (
    <div className="w-full h-full rounded-xl glass-card border border-white/10 shadow-lg p-2.5 flex flex-col backdrop-blur-xl min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-white/[0.08] shrink-0">
        <div className="flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h3 className="text-[14px] sm:text-[15px] font-bold text-slate-100 uppercase tracking-wider font-mono">
            Execution Pipeline
          </h3>
        </div>
        <span className="text-[12.5px] sm:text-[13px] font-mono text-slate-400 font-medium">
          Step {currentStepIndex + 1}/{steps.length}
        </span>
      </div>

      {/* Stepper Pipeline List: Even distribution across full height */}
      <div className="flex-1 min-h-0 flex flex-col justify-between gap-1 overflow-y-auto">
        {steps.map((step: ExecutionStep, idx: number) => {
          const isActive = idx === currentStepIndex;
          const isCompleted = idx < currentStepIndex;

          return (
            <motion.button
              key={step.id}
              onClick={() => onSelectStep(idx)}
              whileHover={{ scale: 1.008, x: 2 }}
              whileTap={{ scale: 0.99 }}
              className={`w-full flex items-center justify-between py-1 xl:py-1.5 px-2.5 rounded-lg text-left transition-all border ${
                isActive
                  ? 'bg-blue-600/20 border-blue-500/60 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
                  : isCompleted
                  ? 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10'
                  : 'bg-slate-900/40 border-white/[0.04] opacity-70 hover:opacity-100 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Step Number Circle */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[12px] sm:text-[13px] font-mono font-bold transition-all ${
                    isActive
                      ? 'bg-blue-500 text-white ring-2 ring-blue-400/40 shadow-sm'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : step.id}
                </div>

                {/* Step Titles & Subtitle */}
                <div className="min-w-0 flex flex-col">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`text-[13.5px] xl:text-[14.5px] font-mono font-bold tracking-tight shrink-0 ${
                      isActive ? 'text-blue-300' : isCompleted ? 'text-emerald-300' : 'text-slate-200'
                    }`}>
                      {step.stepKey}
                    </span>
                    <span className="text-[11.5px] sm:text-[12px] font-mono text-slate-400 truncate">
                      • {step.clause}
                    </span>
                  </div>
                  <span className="text-[11.5px] sm:text-[12px] text-slate-300 truncate">
                    {step.subtitle}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="shrink-0 flex items-center ml-2">
                {isActive ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-500 text-white shadow-sm animate-pulse">
                    RUNNING
                  </span>
                ) : isCompleted ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                    DONE
                  </span>
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
