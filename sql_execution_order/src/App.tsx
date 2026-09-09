import { useState, useMemo } from 'react';
import { useSqlAudio } from './hooks/useSqlAudio';
import { useSqlPlayer } from './hooks/useSqlPlayer';
import { Header } from './components/Header';
import { DataTable } from './components/DataTable';
import { QueryEditor } from './components/QueryEditor';
import { ExecutionPlan } from './components/ExecutionPlan';
import { Controls } from './components/Controls';
import { ExplanationCard } from './components/ExplanationCard';
import { WrittenVsExecutionModal } from './components/WrittenVsExecutionModal';
import { Table, Code2, ListOrdered } from 'lucide-react';
import { DEFAULT_SQL_QUERY, compileSqlToPipeline } from './utils/sqlEngine';
import { STEPS_PIPELINE } from './data/stepsPipeline';

export function App() {
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [mobileTab, setMobileTab] = useState<'table' | 'code' | 'pipeline'>('table');
  const [sqlQuery, setSqlQuery] = useState<string>(DEFAULT_SQL_QUERY);
  const [isEditingSql, setIsEditingSql] = useState<boolean>(false);

  // Dynamic In-Memory SQL compilation
  const parseResult = useMemo(() => compileSqlToPipeline(sqlQuery), [sqlQuery]);
  const activePipeline = parseResult.pipeline && parseResult.pipeline.length > 0 ? parseResult.pipeline : STEPS_PIPELINE;
  const activeLines = parseResult.lines;

  // Web Audio API engine
  const { isMuted, toggleMute, playSound } = useSqlAudio();

  // State Machine Player with Dynamic Pipeline
  const {
    currentStepIndex,
    currentStep,
    currentRows,
    currentColumns,
    subPhase,
    isPlaying,
    speed,
    setSpeed,
    goToStep,
    nextStep,
    prevStep,
    togglePlay,
    reset,
  } = useSqlPlayer({
    pipeline: activePipeline,
    onPlaySound: playSound,
  });

  const handleSaveCustomSql = (newSql: string) => {
    setSqlQuery(newSql);
    setIsEditingSql(false);
    reset(); // Resets player to Step 1 & pauses so user can review and click Auto Play when ready
  };

  const handleToggleEditSql = () => {
    setIsEditingSql((prev) => {
      const next = !prev;
      if (next) {
        setMobileTab('code');
      }
      return next;
    });
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-[#080C14] text-slate-100 flex flex-col bg-grid-mesh relative select-none">
      {/* Background Accent Glows */}
      <div className="fixed top-[-10%] left-[15%] w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[15%] w-[400px] h-[400px] rounded-full bg-emerald-600/10 blur-[100px] pointer-events-none" />

      {/* Top Header Bar */}
      <Header
        currentStep={currentStep}
        currentStepIndex={currentStepIndex}
        totalSteps={activePipeline.length}
        isPlaying={isPlaying}
        speed={speed}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onOpenCheatSheet={() => setShowCheatSheet(true)}
        onReset={reset}
        onTogglePlay={togglePlay}
        onNext={nextStep}
        onPrev={prevStep}
        onSetSpeed={setSpeed}
        isEditingSql={isEditingSql}
        onToggleEditSql={handleToggleEditSql}
      />

      {/* Mobile Tab Switcher (< 1024px) for Zero-Scroll Fit */}
      <div className="lg:hidden px-3 pt-2 pb-1 flex items-center justify-between gap-1.5 shrink-0 bg-slate-950/40 border-b border-white/[0.05]">
        <button
          onClick={() => setMobileTab('table')}
          className={`flex-1 py-1 px-2 rounded-lg text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'table'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Table className="w-3.5 h-3.5" />
          <span>Data Table</span>
        </button>

        <button
          onClick={() => setMobileTab('code')}
          className={`flex-1 py-1 px-2 rounded-lg text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'code'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>SQL Query</span>
        </button>

        <button
          onClick={() => setMobileTab('pipeline')}
          className={`flex-1 py-1 px-2 rounded-lg text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'pipeline'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200'
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" />
          <span>Pipeline</span>
        </button>
      </div>

      {/* Main Working Stage: Strictly Flex Fill & Zero-Scroll with Minimized Margins */}
      <main className="flex-1 min-h-0 w-full px-1.5 sm:px-2.5 py-1.5 flex flex-col gap-1.5 sm:gap-2 overflow-hidden">
        {/* Desktop View (>= 1024px): Exact 2-Row Architecture */}
        <div className="hidden lg:flex flex-col gap-1.5 sm:gap-2 h-full w-full min-h-0 overflow-hidden">
          
          {/* BARIS 1: Box 1 (20%), Box 2 (55%), Box 3 (25%) */}
          <div className="flex-1 min-h-0 grid grid-cols-[20fr_55fr_25fr] gap-1.5 sm:gap-2 items-stretch w-full">
            {/* Box 1: Execution Pipeline (20%) */}
            <div className="h-full min-h-0 min-w-0 flex flex-col">
              <ExecutionPlan
                currentStepIndex={currentStepIndex}
                onSelectStep={goToStep}
                pipeline={activePipeline}
              />
            </div>

            {/* Box 2: Working Dataset Memory (55%) */}
            <div className="h-full min-h-0 min-w-0 flex flex-col">
              <DataTable
                data={currentRows}
                columns={currentColumns}
                activeStepKey={currentStep.stepKey}
                subPhase={subPhase}
                stepNumber={currentStep.id}
              />
            </div>

            {/* Box 3: Query SQL (25%) */}
            <div className="h-full min-h-0 min-w-0 flex flex-col">
              <QueryEditor
                currentStep={currentStep}
                rawSql={sqlQuery}
                lines={activeLines}
                onUpdateQuery={handleSaveCustomSql}
                onResetQuery={() => {
                  setSqlQuery(DEFAULT_SQL_QUERY);
                  reset();
                }}
                parseError={parseResult.error}
                isEditing={isEditingSql}
                onCloseEdit={() => setIsEditingSql(false)}
              />
            </div>
          </div>

          {/* BARIS 2: Box 4 (60%), Box 5 (40%) - Elevated height so Box 4 description is completely visible */}
          <div className="h-[185px] xl:h-[195px] shrink-0 grid grid-cols-10 gap-1.5 sm:gap-2 items-stretch w-full">
            {/* Box 4: Kotak Keterangan (60%) */}
            <div className="col-span-6 h-full min-h-0 flex flex-col">
              <ExplanationCard currentStep={currentStep} />
            </div>

            {/* Box 5: Kotak Pengaturan Auto Play & etc (40%) */}
            <div className="col-span-4 h-full min-h-0 flex flex-col">
              <Controls
                isPlaying={isPlaying}
                currentStepIndex={currentStepIndex}
                speed={speed}
                isMuted={isMuted}
                onToggleMute={toggleMute}
                onTogglePlay={togglePlay}
                onNext={nextStep}
                onPrev={prevStep}
                onReset={reset}
                onSelectStep={goToStep}
                onSetSpeed={setSpeed}
              />
            </div>
          </div>

        </div>

        {/* Mobile View (< 1024px): Strictly 1 Screen Zero-Scroll Tab Switching */}
        <div className="lg:hidden h-full w-full flex flex-col justify-between gap-1.5 min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {mobileTab === 'table' && (
              <DataTable
                data={currentRows}
                columns={currentColumns}
                activeStepKey={currentStep.stepKey}
                subPhase={subPhase}
                stepNumber={currentStep.id}
              />
            )}
            {mobileTab === 'code' && (
              <div className="h-full flex flex-col min-h-0">
                <QueryEditor
                  currentStep={currentStep}
                  rawSql={sqlQuery}
                  lines={activeLines}
                  onUpdateQuery={handleSaveCustomSql}
                  onResetQuery={() => {
                    setSqlQuery(DEFAULT_SQL_QUERY);
                    reset();
                  }}
                  parseError={parseResult.error}
                  isEditing={isEditingSql}
                  onCloseEdit={() => setIsEditingSql(false)}
                />
              </div>
            )}
            {mobileTab === 'pipeline' && (
              <div className="h-full flex flex-col min-h-0">
                <ExecutionPlan
                  currentStepIndex={currentStepIndex}
                  onSelectStep={goToStep}
                  pipeline={activePipeline}
                />
              </div>
            )}
          </div>

          {/* Mobile Explanation Strip */}
          <div className="shrink-0 max-h-[140px] overflow-hidden">
            <ExplanationCard currentStep={currentStep} />
          </div>

          {/* Mobile Controls */}
          <div className="shrink-0 h-[125px]">
            <Controls
              isPlaying={isPlaying}
              currentStepIndex={currentStepIndex}
              speed={speed}
              isMuted={isMuted}
              onToggleMute={toggleMute}
              onTogglePlay={togglePlay}
              onNext={nextStep}
              onPrev={prevStep}
              onReset={reset}
              onSelectStep={goToStep}
              onSetSpeed={setSpeed}
            />
          </div>
        </div>
      </main>

      {/* Educational Written vs Execution Modal */}
      <WrittenVsExecutionModal
        isOpen={showCheatSheet}
        onClose={() => setShowCheatSheet(false)}
      />
    </div>
  );
}

export default App;
